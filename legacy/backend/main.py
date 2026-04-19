"""
Music Trend Search Engine - FastAPI Backend
Security-hardened: rate limiting, security headers, path traversal
protection, request timeouts, sanitized error responses.
"""

import asyncio
import logging
import os
import re
import time
from typing import Optional

import anthropic
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, field_validator
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from agents import AGENTS, get_agents_list

# ── Logging (never log sensitive values) ──────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger("music-trend-search")

# ── Rate Limiter ───────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)

# ── App ────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Music Trend Search Engine",
    version="1.0.0",
    # Disable interactive API docs in production to reduce attack surface
    docs_url=None,
    redoc_url=None,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ── CORS ───────────────────────────────────────────────────────────────────
# Defaults to same-origin only (no CORS). Set ALLOWED_ORIGINS env var to
# allow specific origins, e.g. "https://yourdomain.com,https://app.yourdomain.com"
_raw_origins = os.getenv("ALLOWED_ORIGINS", "").strip()
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,   # empty = same-origin only
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)

# ── Security Headers ───────────────────────────────────────────────────────
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        # Don't cache API responses (may contain user data)
        if request.url.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── Constants ──────────────────────────────────────────────────────────────
FRONTEND_DIR = os.path.realpath(os.path.join(os.path.dirname(__file__), "..", "frontend"))
AGENT_TIMEOUT = 45.0  # seconds per agent call
# Anthropic API keys follow a known format — reject obviously wrong values early
_API_KEY_RE = re.compile(r"^sk-ant-[A-Za-z0-9\-_]{20,}$")


# ── Input Sanitization ─────────────────────────────────────────────────────
def sanitize_query(raw: str) -> str:
    """Strip control characters and normalize whitespace."""
    cleaned = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", raw)
    return re.sub(r"\s+", " ", cleaned).strip()


# ── Path Traversal Protection ──────────────────────────────────────────────
def safe_static_path(requested: str) -> Optional[str]:
    """
    Resolve the requested path against FRONTEND_DIR.
    Returns the absolute path only if it resolves *inside* FRONTEND_DIR,
    preventing directory traversal attacks (e.g. /../.env).
    """
    candidate = os.path.realpath(os.path.join(FRONTEND_DIR, requested.lstrip("/")))
    if candidate == FRONTEND_DIR or candidate.startswith(FRONTEND_DIR + os.sep):
        return candidate
    log.warning("Path traversal attempt blocked: %s", requested)
    return None


# ── Request / Response Models ──────────────────────────────────────────────
class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300)
    agent_ids: list[str] = Field(..., min_length=1, max_length=5)
    api_key: Optional[str] = Field(None, max_length=200)

    @field_validator("api_key")
    @classmethod
    def validate_api_key_format(cls, v: Optional[str]) -> Optional[str]:
        if v and not _API_KEY_RE.match(v):
            raise ValueError("Invalid API key format.")
        return v

    @field_validator("agent_ids")
    @classmethod
    def deduplicate_agents(cls, v: list[str]) -> list[str]:
        return list(dict.fromkeys(v))  # preserve order, remove duplicates


class AgentResult(BaseModel):
    agent_id: str
    agent_name: str
    agent_icon: str
    agent_color: str
    content: str
    duration_ms: int


class SearchResponse(BaseModel):
    query: str
    results: list[AgentResult]
    total_duration_ms: int


# ── Agent Runner ───────────────────────────────────────────────────────────
async def run_agent(
    client: anthropic.AsyncAnthropic,
    agent_id: str,
    query: str,
) -> AgentResult:
    """Run a single agent with a hard timeout."""
    agent = AGENTS[agent_id]
    start = time.monotonic()

    message = await asyncio.wait_for(
        client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=600,
            system=agent.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": (
                        "Analyze this music trend search query and provide your expert insights:\n\n"
                        f"**Query:** {query}"
                    ),
                }
            ],
        ),
        timeout=AGENT_TIMEOUT,
    )

    duration_ms = int((time.monotonic() - start) * 1000)
    content = message.content[0].text if message.content else "No response generated."

    return AgentResult(
        agent_id=agent.id,
        agent_name=agent.name,
        agent_icon=agent.icon,
        agent_color=agent.color,
        content=content,
        duration_ms=duration_ms,
    )


# ── API Routes ─────────────────────────────────────────────────────────────
@app.get("/api/agents")
async def list_agents():
    return {"agents": get_agents_list()}


@app.post("/api/search", response_model=SearchResponse)
@limiter.limit("10/minute")
async def search(request: Request, req: SearchRequest):
    # Validate agent IDs against server-side allowlist (not user input)
    invalid = [a for a in req.agent_ids if a not in AGENTS]
    if invalid:
        raise HTTPException(status_code=400, detail="One or more unknown agent IDs.")

    # Resolve API key — never include it in logs or error responses
    api_key = req.api_key or os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="No API key provided. Add it in settings or set ANTHROPIC_API_KEY on the server.",
        )

    clean_query = sanitize_query(req.query)
    if len(clean_query) < 2:
        raise HTTPException(status_code=400, detail="Query is too short.")

    client = anthropic.AsyncAnthropic(api_key=api_key)
    start = time.monotonic()

    tasks = [run_agent(client, agent_id, clean_query) for agent_id in req.agent_ids]
    raw_results = await asyncio.gather(*tasks, return_exceptions=True)

    total_ms = int((time.monotonic() - start) * 1000)

    results = []
    for agent_id, result in zip(req.agent_ids, raw_results):
        if isinstance(result, Exception):
            agent = AGENTS[agent_id]
            # Log the error type server-side; never send internal details to the client
            log.error("Agent %s failed: %s", agent_id, type(result).__name__)
            results.append(
                AgentResult(
                    agent_id=agent.id,
                    agent_name=agent.name,
                    agent_icon=agent.icon,
                    agent_color=agent.color,
                    content="This agent encountered an error. Please try again.",
                    duration_ms=0,
                )
            )
        else:
            results.append(result)

    return SearchResponse(
        query=clean_query,
        results=results,
        total_duration_ms=total_ms,
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


# ── Static File Serving ────────────────────────────────────────────────────
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/{path:path}")
async def serve_static(path: str):
    safe = safe_static_path(path)
    if safe and os.path.isfile(safe):
        return FileResponse(safe)
    # SPA fallback — only after confirming path stays inside FRONTEND_DIR
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

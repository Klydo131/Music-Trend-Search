"""
Music Trend Search Engine - FastAPI Backend
"""

import asyncio
import os
import time
from typing import Optional

import anthropic
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from agents import AGENTS, get_agents_list

app = FastAPI(title="Music Trend Search Engine", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve frontend static files
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), "..", "frontend")


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300)
    agent_ids: list[str] = Field(..., min_length=1, max_length=5)
    api_key: Optional[str] = Field(None)


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


async def run_agent(
    client: anthropic.AsyncAnthropic,
    agent_id: str,
    query: str,
) -> AgentResult:
    """Run a single agent and return its result."""
    agent = AGENTS[agent_id]
    start = time.monotonic()

    message = await client.messages.create(
        model="claude-haiku-4-5-20251001",  # Lite & fast — perfect for MVP
        max_tokens=600,
        system=agent.system_prompt,
        messages=[
            {
                "role": "user",
                "content": f"Analyze this music trend search query and provide your expert insights:\n\n**Query:** {query}",
            }
        ],
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


@app.get("/api/agents")
async def list_agents():
    """Return available agents."""
    return {"agents": get_agents_list()}


@app.post("/api/search", response_model=SearchResponse)
async def search(req: SearchRequest):
    """Run selected agents in parallel and return results."""
    # Validate agent IDs
    invalid = [a for a in req.agent_ids if a not in AGENTS]
    if invalid:
        raise HTTPException(status_code=400, detail=f"Unknown agent IDs: {invalid}")

    # Resolve API key: request body > environment variable
    api_key = req.api_key or os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=400,
            detail="No API key provided. Pass api_key in the request or set ANTHROPIC_API_KEY env var.",
        )

    client = anthropic.AsyncAnthropic(api_key=api_key)

    start = time.monotonic()

    # Run all selected agents concurrently
    tasks = [run_agent(client, agent_id, req.query) for agent_id in req.agent_ids]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    total_ms = int((time.monotonic() - start) * 1000)

    # Handle any per-agent errors gracefully
    clean_results = []
    for agent_id, result in zip(req.agent_ids, results):
        if isinstance(result, Exception):
            agent = AGENTS[agent_id]
            clean_results.append(
                AgentResult(
                    agent_id=agent.id,
                    agent_name=agent.name,
                    agent_icon=agent.icon,
                    agent_color=agent.color,
                    content=f"Agent encountered an error: {str(result)}",
                    duration_ms=0,
                )
            )
        else:
            clean_results.append(result)

    return SearchResponse(
        query=req.query,
        results=clean_results,
        total_duration_ms=total_ms,
    )


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


# Serve frontend
@app.get("/")
async def serve_index():
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))


@app.get("/{path:path}")
async def serve_static(path: str):
    file_path = os.path.join(FRONTEND_DIR, path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    return FileResponse(os.path.join(FRONTEND_DIR, "index.html"))

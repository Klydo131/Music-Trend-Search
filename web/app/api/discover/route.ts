/**
 * /api/discover — run selected trend agents against a query.
 *
 * Zero-cost rule: no Anthropic SDK dependency. Calls the Messages API
 * directly via fetch. Users BYOK via Settings panel (stored in
 * sessionStorage only — never persisted server-side); a server-side
 * ANTHROPIC_API_KEY env var is the fallback for self-hosted operators.
 *
 * Private-first: request bodies are not logged. Errors returned to the
 * client are human, never internal.
 */

import { NextResponse } from "next/server";
import { AGENTS } from "@/lib/agents";

export const runtime = "nodejs";

const API_KEY_RE = /^sk-ant-[A-Za-z0-9\-_]{20,}$/;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 600;
const AGENT_TIMEOUT_MS = 45_000;

type DiscoverRequest = {
  query?: unknown;
  agentIds?: unknown;
  apiKey?: unknown;
};

type AgentResult = {
  agentId: string;
  agentName: string;
  agentIcon: string;
  agentColor: string;
  content: string;
  durationMs: number;
};

function sanitizeQuery(raw: string): string {
  // Strip control characters, collapse whitespace.
  return raw
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function friendly(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

async function runAgent(
  apiKey: string,
  agentId: string,
  query: string,
): Promise<AgentResult> {
  const agent = AGENTS[agentId];
  const start = Date.now();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AGENT_TIMEOUT_MS);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: agent.systemPrompt,
        messages: [
          {
            role: "user",
            content: `Analyze this music trend search query and provide your expert insights:\n\n**Query:** ${query}`,
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      // Never leak upstream error bodies to the client.
      throw new Error(`upstream_${res.status}`);
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content?.find((c) => c.type === "text")?.text?.trim() ||
      "No response generated.";

    return {
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      agentColor: agent.color,
      content: text,
      durationMs: Date.now() - start,
    };
  } finally {
    clearTimeout(timer);
  }
}

export async function POST(req: Request) {
  let body: DiscoverRequest;
  try {
    body = (await req.json()) as DiscoverRequest;
  } catch {
    return friendly(400, "That request didn't look right. Try again.");
  }

  const rawQuery = typeof body.query === "string" ? body.query : "";
  const query = sanitizeQuery(rawQuery);
  if (query.length < 2 || query.length > 300) {
    return friendly(
      400,
      "Give the agents a little more to work with — between 2 and 300 characters.",
    );
  }

  if (
    !Array.isArray(body.agentIds) ||
    body.agentIds.length === 0 ||
    body.agentIds.length > 5
  ) {
    return friendly(400, "Pick between 1 and 5 agents to run.");
  }
  const agentIds = Array.from(
    new Set(body.agentIds.filter((v): v is string => typeof v === "string")),
  );
  const invalid = agentIds.find((id) => !(id in AGENTS));
  if (invalid || agentIds.length === 0) {
    return friendly(400, "One of those agents isn't on the roster.");
  }

  const rawKey =
    (typeof body.apiKey === "string" && body.apiKey.trim()) ||
    process.env.ANTHROPIC_API_KEY ||
    "";
  if (!rawKey) {
    return friendly(
      400,
      "Add your Anthropic API key in Discover settings to run the agents.",
    );
  }
  if (!API_KEY_RE.test(rawKey)) {
    return friendly(400, "That API key doesn't look right — double-check it.");
  }

  const start = Date.now();
  const settled = await Promise.allSettled(
    agentIds.map((id) => runAgent(rawKey, id, query)),
  );
  const totalMs = Date.now() - start;

  const results: AgentResult[] = settled.map((r, i) => {
    if (r.status === "fulfilled") return r.value;
    const agent = AGENTS[agentIds[i]];
    return {
      agentId: agent.id,
      agentName: agent.name,
      agentIcon: agent.icon,
      agentColor: agent.color,
      content:
        "This agent couldn't finish this time. Try again, or pick different agents.",
      durationMs: 0,
    };
  });

  return NextResponse.json({
    query,
    results,
    totalDurationMs: totalMs,
  });
}

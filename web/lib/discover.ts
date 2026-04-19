/**
 * Client helpers for the Discover panel: API-key session storage +
 * fetch wrapper + tiny markdown renderer.
 *
 * The API key lives in sessionStorage and is sent only to our own
 * /api/discover route (same origin) — never persisted to localStorage
 * or cookies.
 */

import type { AgentMeta } from "@/lib/agents";

const KEY_STORAGE = "loopline_discover_key";

export function loadApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY_STORAGE) || "";
  } catch {
    return "";
  }
}

export function saveApiKey(key: string): void {
  if (typeof window === "undefined") return;
  try {
    if (key.trim()) sessionStorage.setItem(KEY_STORAGE, key.trim());
    else sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* private-mode browsers — fail silent */
  }
}

export function clearApiKey(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

export type DiscoverResult = {
  agentId: string;
  agentName: string;
  agentIcon: string;
  agentColor: string;
  content: string;
  durationMs: number;
};

export type DiscoverResponse = {
  query: string;
  results: DiscoverResult[];
  totalDurationMs: number;
};

export async function runDiscover(
  query: string,
  agentIds: string[],
  apiKey: string,
): Promise<DiscoverResponse> {
  const res = await fetch("/api/discover", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, agentIds, apiKey: apiKey || undefined }),
  });
  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(
      data.error || "The agents couldn't be reached. Try again in a moment.",
    );
  }
  return (await res.json()) as DiscoverResponse;
}

/** Validate a hex color from server-known agent metadata. */
export function safeAgentColor(meta: AgentMeta): string {
  return /^#[0-9a-fA-F]{3,8}$/.test(meta.color) ? meta.color : "#6F4AB7";
}

/**
 * Escape text for safe interpolation into HTML we build ourselves.
 * Used before running a minimal markdown pass.
 */
function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Very small markdown → HTML converter (bold, italic, headers, bullets,
 * paragraphs). Good enough for agent responses; no external deps.
 */
export function renderAgentMarkdown(raw: string): string {
  const escaped = esc(raw);

  const withInline = escaped
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/(^|\s)\*(?!\s)(.+?)(?<!\s)\*(?=\s|$)/g, "$1<em>$2</em>")
    .replace(/(^|\s)_(?!\s)(.+?)(?<!\s)_(?=\s|$)/g, "$1<em>$2</em>");

  const lines = withInline.split("\n");
  const out: string[] = [];
  let inList = false;
  let buf: string[] = [];

  const flushPara = () => {
    if (buf.length) {
      out.push(`<p>${buf.join(" ")}</p>`);
      buf = [];
    }
  };
  const closeList = () => {
    if (inList) {
      out.push("</ul>");
      inList = false;
    }
  };

  for (const line of lines) {
    const t = line.trim();
    const h3 = t.match(/^###\s+(.+)$/);
    const h2 = t.match(/^##\s+(.+)$/);
    const h1 = t.match(/^#\s+(.+)$/);
    const li = t.match(/^[-*]\s+(.+)$/);
    if (h3) {
      flushPara();
      closeList();
      out.push(`<h4 class="agent-h">${h3[1]}</h4>`);
    } else if (h2) {
      flushPara();
      closeList();
      out.push(`<h3 class="agent-h">${h2[1]}</h3>`);
    } else if (h1) {
      flushPara();
      closeList();
      out.push(`<h3 class="agent-h">${h1[1]}</h3>`);
    } else if (li) {
      flushPara();
      if (!inList) {
        out.push('<ul class="agent-ul">');
        inList = true;
      }
      out.push(`<li>${li[1]}</li>`);
    } else if (t === "") {
      flushPara();
      closeList();
    } else {
      if (inList) closeList();
      buf.push(t);
    }
  }
  flushPara();
  closeList();
  return out.join("");
}

export function youtubeSearchUrl(q: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

export function spotifySearchUrl(q: string): string {
  return `https://open.spotify.com/search/${encodeURIComponent(q)}`;
}

/**
 * /api/lyrics — AI-generated lyrics fallback.
 *
 * Only used when LRCLIB doesn't have the track. Calls Claude Haiku with
 * a best-guess-lyrics prompt and returns plain-text lines. Timing is
 * synthesized client-side (3 s per line) since Claude can't know real
 * timings.
 *
 * Zero-cost: no SDK, direct fetch. Private-first: no logging of
 * requests, human-friendly errors, BYOK via sessionStorage on the
 * client.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const API_KEY_RE = /^sk-ant-[A-Za-z0-9\-_]{20,}$/;
const MODEL = "claude-haiku-4-5-20251001";
const MAX_TOKENS = 1200;
const TIMEOUT_MS = 45_000;

type LyricsRequest = {
  artist?: unknown;
  title?: unknown;
  query?: unknown;
  apiKey?: unknown;
};

function friendly(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

function clean(s: string, max: number): string {
  return s
    .replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export async function POST(req: Request) {
  let body: LyricsRequest;
  try {
    body = (await req.json()) as LyricsRequest;
  } catch {
    return friendly(400, "That request didn't look right. Try again.");
  }

  const artist = typeof body.artist === "string" ? clean(body.artist, 200) : "";
  const title = typeof body.title === "string" ? clean(body.title, 200) : "";
  const query = typeof body.query === "string" ? clean(body.query, 400) : "";

  if (!artist && !title && !query) {
    return friendly(
      400,
      "We need a song name to ask Claude. Try pasting a YouTube link or an MP3 with the song in the filename.",
    );
  }

  const rawKey =
    (typeof body.apiKey === "string" && body.apiKey.trim()) ||
    process.env.ANTHROPIC_API_KEY ||
    "";
  if (!rawKey) {
    return friendly(
      400,
      "Add your Anthropic API key in Discover settings and we'll ask Claude for the lyrics.",
    );
  }
  if (!API_KEY_RE.test(rawKey)) {
    return friendly(400, "That API key doesn't look right — double-check it.");
  }

  const songHint =
    artist && title
      ? `Artist: ${artist}\nSong title: ${title}`
      : `Track: ${query || title || artist}`;

  const system = `You are a music lyrics assistant. When asked about a specific song you know, return the lyrics you recall.

RULES:
- Output ONLY the lyrics, one line per output line. No timestamps, no markdown, no commentary, no "verse 1" headers, no song title.
- Blank lines between sections are fine.
- If you don't know this specific song, respond with exactly: UNKNOWN
- Never fabricate lyrics for a song you don't know. Accuracy matters more than length.
- If the lyrics are copyrighted and you recall them, it is still fine to return them here — this is a karaoke study aid for a single listener.`;

  const user = `Please provide the lyrics for this song:\n\n${songHint}\n\nReturn only the lyric lines, or UNKNOWN if you don't recognize this specific track.`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": rawKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: "user", content: user }],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      return friendly(
        502,
        "Claude couldn't be reached right now. Paste lyrics manually below and they'll still scroll.",
      );
    }

    const data = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text =
      data.content?.find((c) => c.type === "text")?.text?.trim() || "";

    if (!text || /^unknown\.?$/i.test(text.trim())) {
      return NextResponse.json({
        lines: [],
        plain: "",
        known: false,
        source: "claude" as const,
      });
    }

    const lines = text
      .split("\n")
      .map((l) => l.replace(/^[\[\(][^\]\)]*[\]\)]\s*/g, "").trim())
      .filter(Boolean);

    return NextResponse.json({
      lines,
      plain: lines.join("\n"),
      known: true,
      source: "claude" as const,
    });
  } catch {
    return friendly(
      502,
      "Claude took too long. Paste lyrics manually below — they'll still scroll with the song.",
    );
  } finally {
    clearTimeout(timer);
  }
}

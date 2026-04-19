"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Source } from "@/lib/safeUrl";
import {
  activeLineIndex,
  fetchLyrics,
  fetchLyricsFromAi,
  parseLrc,
  parseTrackLabel,
  type LyricLine,
  type LyricsResult,
} from "@/lib/lyrics";
import { loadApiKey } from "@/lib/discover";

type Props = {
  source: Source;
  currentTime: number;
  label?: string;
  author?: string;
};

type Status = "idle" | "loading" | "none" | "ready";

export default function LyricsKaraoke({
  source,
  currentTime,
  label,
  author,
}: Props) {
  const [data, setData] = useState<LyricsResult | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [manual, setManual] = useState("");
  const [manualLines, setManualLines] = useState<LyricLine[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHasKey(!!loadApiKey());
  }, [source]);

  const parsed = useMemo(() => {
    if (source.kind === "mp3") {
      return parseTrackLabel(source.file.name);
    }
    if (label) {
      return parseTrackLabel(label, author);
    }
    return { query: "" };
  }, [source, label, author]);

  useEffect(() => {
    const { artist, title, query } = parsed;
    if (!query) {
      setStatus("idle");
      setData(null);
      return;
    }
    const controller = new AbortController();
    setStatus("loading");
    setData(null);
    setAiError(null);
    fetchLyrics({ artist, title, query, signal: controller.signal }).then(
      (result) => {
        if (controller.signal.aborted) return;
        if (!result) {
          setStatus("none");
        } else {
          setData(result);
          setStatus("ready");
        }
      },
    );
    return () => controller.abort();
  }, [parsed]);

  useEffect(() => {
    const text = manual.trim();
    if (!text) {
      setManualLines(null);
      return;
    }
    if (/\[\d{1,2}:\d{2}/.test(text)) {
      setManualLines(parseLrc(text));
    } else {
      const lines = text
        .split("\n")
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t, i) => ({ time: i * 3, text: t }));
      setManualLines(lines);
    }
  }, [manual]);

  async function askClaude() {
    const key = loadApiKey();
    if (!key) {
      setAiError(
        "Add your Anthropic API key in the Discover panel settings, then try again.",
      );
      return;
    }
    const { artist, title, query } = parsed;
    if (!query && !artist && !title) {
      setAiError(
        "We need a song name first. Paste a YouTube link or rename the MP3 to 'Artist - Title'.",
      );
      return;
    }
    setAiLoading(true);
    setAiError(null);
    const result = await fetchLyricsFromAi({
      artist,
      title,
      query,
      apiKey: key,
    });
    setAiLoading(false);
    if (!result) {
      setAiError(
        "Claude didn't recognize this track. Paste lyrics below and they'll scroll along.",
      );
      return;
    }
    setData(result);
    setStatus("ready");
  }

  const activeLines: LyricLine[] =
    manualLines && manualLines.length > 0 ? manualLines : data?.lines || [];
  const activeIdx = activeLineIndex(activeLines, currentTime);

  useEffect(() => {
    if (!containerRef.current || activeIdx < 0) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-line="${activeIdx}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  const sourceLabel =
    manualLines && manualLines.length > 0
      ? "Your paste"
      : data?.source === "claude"
      ? "Claude's best guess"
      : data
      ? `${data.synced ? "Synced" : "Plain"} · LRCLIB`
      : null;

  return (
    <section className="card p-4 md:p-5">
      <header className="flex items-center justify-between mb-3 gap-2 flex-wrap">
        <h2 className="font-display text-lg font-bold text-plum">Karaoke</h2>
        <div className="flex items-center gap-2">
          {parsed.artist && parsed.title && (
            <span
              className="chip"
              title={`${parsed.artist} — ${parsed.title}`}
            >
              {parsed.artist} · {parsed.title}
            </span>
          )}
          {sourceLabel && <span className="chip">{sourceLabel}</span>}
        </div>
      </header>

      {status === "loading" && !manualLines && (
        <p className="text-sm text-plum/60 mb-3">Searching LRCLIB for lyrics…</p>
      )}

      {status === "idle" && !manualLines && (
        <p className="text-sm text-plum/70 mb-3">
          Paste a YouTube link or drop an MP3 with the song name in the
          filename and we'll try to fetch synced lyrics automatically.
        </p>
      )}

      {status === "none" && !manualLines && !data && (
        <div className="mb-3 space-y-2">
          <p className="text-sm text-plum/70">
            LRCLIB doesn't have this one.{" "}
            {hasKey
              ? "Ask Claude for a best guess, or paste your own below."
              : "Paste your own below — or add an Anthropic API key in the Discover panel and Claude can take a guess."}
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <button
              type="button"
              className="btn-primary text-sm py-2 px-3"
              onClick={askClaude}
              disabled={aiLoading}
            >
              {aiLoading ? "Asking Claude…" : "Ask Claude for lyrics"}
            </button>
            {!hasKey && (
              <span className="text-xs text-plum/60">
                (needs your Anthropic key in Discover settings)
              </span>
            )}
          </div>
          {aiError && <p className="text-sm text-plum/70">{aiError}</p>}
        </div>
      )}

      {data?.source === "claude" && !manualLines && (
        <p className="text-xs text-plum/60 mb-2 italic">
          Heads-up: Claude-generated lyrics can be off. Paste the real ones
          below if anything looks wrong.
        </p>
      )}

      {activeLines.length > 0 && (
        <div
          ref={containerRef}
          className="max-h-72 overflow-y-auto pr-2 space-y-1 mb-3"
          aria-live="polite"
        >
          {activeLines.map((line, i) => (
            <p
              key={i}
              data-line={i}
              className={`transition text-base md:text-lg py-1 px-2 rounded-lg ${
                i === activeIdx
                  ? "text-plum font-bold bg-peach/60 scale-[1.02]"
                  : i < activeIdx
                  ? "text-plum/40"
                  : "text-plum/80"
              }`}
            >
              {line.text || "…"}
            </p>
          ))}
        </div>
      )}

      <div className="border-t border-plum/10 pt-3">
        <label className="block text-xs font-bold text-plum/70 mb-1">
          {manualLines ? "Edit your lyrics" : "Or paste your own lyrics"}
        </label>
        <textarea
          className="input min-h-[96px] font-mono text-xs"
          placeholder={`Paste plain lines or [00:12.00] timestamped LRC.\nYour paste stays on this device.`}
          value={manual}
          onChange={(e) => setManual(e.target.value)}
        />
        <p className="text-[11px] text-plum/60 mt-1">
          LRC timestamps (`[mm:ss.xx]`) sync to the song; plain lines step
          every 3 seconds.
        </p>
      </div>
    </section>
  );
}

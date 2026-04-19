"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Source } from "@/lib/safeUrl";
import {
  activeLineIndex,
  fetchLyrics,
  parseLrc,
  parseTrackLabel,
  type LyricLine,
  type LyricsResult,
} from "@/lib/lyrics";

type Props = {
  source: Source;
  currentTime: number;
  label?: string;
  author?: string;
};

export default function LyricsKaraoke({
  source,
  currentTime,
  label,
  author,
}: Props) {
  const [data, setData] = useState<LyricsResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "none" | "ready">(
    "idle",
  );
  const [manual, setManual] = useState("");
  const [manualLines, setManualLines] = useState<LyricLine[] | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Pull a reasonable {artist, title, query} out of whatever metadata we have.
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

  // Manual paste — support LRC format with [mm:ss] timestamps, or plain
  // lines spaced 3s apart as a fallback (same behavior as LRCLIB plain).
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

  // Active source for rendering: manual paste wins if the user typed
  // something, otherwise LRCLIB result.
  const activeLines: LyricLine[] =
    manualLines && manualLines.length > 0
      ? manualLines
      : data?.lines || [];
  const activeIdx = activeLineIndex(activeLines, currentTime);

  useEffect(() => {
    if (!containerRef.current || activeIdx < 0) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-line="${activeIdx}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  const showManualBox =
    status === "idle" || status === "none" || !!manualLines;

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
          {data && (
            <span className="chip">
              {data.synced ? "Synced" : "Plain"} · LRCLIB
            </span>
          )}
          {manualLines && manualLines.length > 0 && (
            <span className="chip">Your paste</span>
          )}
        </div>
      </header>

      {status === "loading" && !manualLines && (
        <p className="text-sm text-plum/60 mb-3">
          Searching LRCLIB for lyrics…
        </p>
      )}

      {status === "idle" && !manualLines && (
        <p className="text-sm text-plum/70 mb-3">
          We need a song name to find lyrics. Paste your own below and they'll
          scroll along while the track plays — `[mm:ss]` timestamps are
          supported if you want them synced.
        </p>
      )}

      {status === "none" && !manualLines && (
        <p className="text-sm text-plum/70 mb-3">
          LRCLIB doesn't have this one. Paste lyrics below — plain text or
          `[mm:ss]`-timestamped — and they'll show up while the song plays.
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

      {showManualBox && (
        <details open={status !== "ready"}>
          <summary className="cursor-pointer text-xs font-bold text-plum/70 mb-2">
            {manualLines ? "Edit your lyrics" : "Paste your own lyrics"}
          </summary>
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            placeholder={`[00:12.00] First line\n[00:17.50] Second line\n\n…or just plain text, one line each.`}
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          <p className="text-[11px] text-plum/60 mt-1">
            Your paste stays on this device. LRC timestamps (`[mm:ss.xx]`)
            sync to the song; plain lines step every 3 seconds.
          </p>
        </details>
      )}
    </section>
  );
}

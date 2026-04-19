"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Source } from "@/lib/safeUrl";
import { activeLineIndex, fetchLyrics, type LyricsResult } from "@/lib/lyrics";

type Props = {
  source: Source;
  currentTime: number;
  label?: string;
};

export default function LyricsKaraoke({ source, currentTime, label }: Props) {
  const [data, setData] = useState<LyricsResult | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "none" | "ready">("idle");
  const [manual, setManual] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Build a search query from the source
  const query = useMemo(() => {
    if (source.kind === "mp3") {
      return source.file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
    }
    return label || "";
  }, [source, label]);

  useEffect(() => {
    if (!query) return;
    const controller = new AbortController();
    setStatus("loading");
    setData(null);
    fetchLyrics({ query, signal: controller.signal }).then((result) => {
      if (controller.signal.aborted) return;
      if (!result) {
        setStatus("none");
      } else {
        setData(result);
        setStatus("ready");
      }
    });
    return () => controller.abort();
  }, [query]);

  const activeIdx = data ? activeLineIndex(data.lines, currentTime) : -1;

  // Auto-scroll to active line
  useEffect(() => {
    if (!containerRef.current || activeIdx < 0) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-line="${activeIdx}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [activeIdx]);

  return (
    <section className="card p-4 md:p-5">
      <header className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-bold text-plum">Karaoke</h2>
        {data && (
          <span className="chip">
            {data.synced ? "Synced lyrics" : "Plain lyrics"} · LRCLIB
          </span>
        )}
      </header>

      {status === "loading" && (
        <p className="text-sm text-plum/60">Searching LRCLIB for lyrics…</p>
      )}

      {status === "none" && (
        <div className="text-sm text-plum/70 space-y-2">
          <p>
            We couldn't find lyrics for this one. You can paste your own below —
            they'll show up while the song plays.
          </p>
          <textarea
            className="input min-h-[120px] font-mono text-xs"
            placeholder="Paste lyrics here, one line per line..."
            value={manual}
            onChange={(e) => setManual(e.target.value)}
          />
          {manual.trim() && (
            <pre className="whitespace-pre-wrap text-sm text-ink p-3 bg-white/70 rounded-xl max-h-72 overflow-auto">
              {manual}
            </pre>
          )}
        </div>
      )}

      {status === "ready" && data && (
        <div
          ref={containerRef}
          className="max-h-72 overflow-y-auto pr-2 space-y-1"
          aria-live="polite"
        >
          {data.lines.map((line, i) => (
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
    </section>
  );
}

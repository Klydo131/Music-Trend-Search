"use client";

/**
 * Discover — in-app music trend search.
 *
 * Ports the old FastAPI/vanilla-JS trend-search app into Loopline:
 * pick 1–5 agents, ask a question, get parallel Claude analyses.
 * BYOK (session-only) keeps us on the zero-cost / private-first rails.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { getAgentsList, type AgentMeta } from "@/lib/agents";
import {
  loadApiKey,
  saveApiKey,
  clearApiKey,
  runDiscover,
  renderAgentMarkdown,
  safeAgentColor,
  youtubeSearchUrl,
  spotifySearchUrl,
  type DiscoverResult,
} from "@/lib/discover";

export default function Discover() {
  const agents = useMemo<AgentMeta[]>(() => getAgentsList(), []);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(agents.map((a) => a.id)),
  );
  const [query, setQuery] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<DiscoverResult[] | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [totalMs, setTotalMs] = useState(0);

  useEffect(() => {
    setApiKey(loadApiKey());
  }, []);

  const toggleAgent = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const onSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      if (loading) return;
      if (!query.trim()) return;
      if (selected.size === 0) {
        setError("Pick at least one agent first.");
        return;
      }
      setLoading(true);
      setResults(null);
      try {
        const data = await runDiscover(
          query.trim(),
          Array.from(selected),
          apiKey,
        );
        setResults(data.results);
        setLastQuery(data.query);
        setTotalMs(data.totalDurationMs);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went sideways. Try again.",
        );
      } finally {
        setLoading(false);
      }
    },
    [apiKey, loading, query, selected],
  );

  const selectAll = () => setSelected(new Set(agents.map((a) => a.id)));
  const selectNone = () => setSelected(new Set());

  const onSaveKey = () => {
    saveApiKey(apiKey);
    setShowSettings(false);
  };

  const onForgetKey = () => {
    clearApiKey();
    setApiKey("");
  };

  return (
    <section className="card p-5 md:p-6" aria-label="Discover music trends">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="display text-2xl md:text-3xl font-bold text-plum">
            Discover
          </h2>
          <p className="text-sm text-plum/70">
            Ask 5 trend agents what's hot, rising, or shifting in music.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost text-sm"
          onClick={() => setShowSettings((s) => !s)}
          aria-expanded={showSettings}
          aria-controls="discover-settings"
        >
          {apiKey ? "Key set" : "Add API key"}
        </button>
      </div>

      {showSettings && (
        <div
          id="discover-settings"
          className="mb-4 p-3 rounded-xl bg-white/60 border border-plum/10"
        >
          <label className="block text-xs font-bold text-plum/80 mb-1">
            Anthropic API key (session only)
          </label>
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="password"
              className="input flex-1"
              placeholder="sk-ant-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              aria-label="Anthropic API key"
            />
            <button type="button" className="btn-primary" onClick={onSaveKey}>
              Save
            </button>
            {apiKey && (
              <button
                type="button"
                className="btn-ghost"
                onClick={onForgetKey}
              >
                Forget
              </button>
            )}
          </div>
          <p className="text-[11px] text-plum/60 mt-1">
            Stored in browser session memory only. Cleared when you close the
            tab. Never sent anywhere except Anthropic.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            className="input flex-1"
            placeholder="e.g. rising Afrobeats artists, viral indie pop 2026, phonk evolution…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={300}
            aria-label="Trend search query"
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Running…" : "Ask the agents"}
          </button>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex flex-wrap gap-2">
            {agents.map((a) => {
              const on = selected.has(a.id);
              const color = safeAgentColor(a);
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => toggleAgent(a.id)}
                  className="rounded-full px-3 py-1.5 text-xs font-semibold border transition"
                  title={a.tagline}
                  aria-pressed={on}
                  style={
                    on
                      ? {
                          background: color,
                          color: "#fff",
                          borderColor: color,
                        }
                      : {
                          background: "rgba(255,255,255,0.8)",
                          color: "var(--plum)",
                          borderColor: "rgba(111,74,183,0.25)",
                        }
                  }
                >
                  <span className="mr-1">{a.icon}</span>
                  {a.name}
                </button>
              );
            })}
          </div>
          <div className="flex gap-3 text-xs">
            <button
              type="button"
              onClick={selectAll}
              className="text-grape hover:underline font-semibold"
            >
              All
            </button>
            <span className="text-plum/30">·</span>
            <button
              type="button"
              onClick={selectNone}
              className="text-plum/60 hover:underline font-semibold"
            >
              None
            </button>
          </div>
        </div>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-4 p-3 rounded-xl bg-peach/60 border border-apricot text-plum text-sm"
        >
          {error}
        </div>
      )}

      {loading && (
        <div className="mt-4 grid md:grid-cols-2 gap-3">
          {Array.from(selected).map((id) => {
            const a = agents.find((x) => x.id === id);
            if (!a) return null;
            return (
              <div
                key={id}
                className="rounded-2xl p-4 bg-white/50 border border-plum/10 animate-pulse"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span>{a.icon}</span>
                  <span className="font-bold text-plum text-sm">{a.name}</span>
                </div>
                <div className="h-3 rounded bg-plum/10 mb-2 w-11/12" />
                <div className="h-3 rounded bg-plum/10 mb-2 w-10/12" />
                <div className="h-3 rounded bg-plum/10 w-8/12" />
              </div>
            );
          })}
        </div>
      )}

      {results && !loading && (
        <div className="mt-4">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-bold text-plum/80">
              Results for <span className="text-plum">&ldquo;{lastQuery}&rdquo;</span>
            </h3>
            <span className="text-xs text-plum/60">
              {results.length} agent{results.length !== 1 ? "s" : ""} ·{" "}
              {(totalMs / 1000).toFixed(1)}s
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-3">
            {results.map((r) => (
              <article
                key={r.agentId}
                className="rounded-2xl p-4 bg-white/70 border border-plum/10 relative overflow-hidden"
              >
                <span
                  aria-hidden
                  className="absolute left-0 top-0 bottom-0 w-1"
                  style={{ background: r.agentColor }}
                />
                <header className="flex items-center gap-2 mb-2 pl-1">
                  <span aria-hidden>{r.agentIcon}</span>
                  <span className="font-bold text-plum text-sm">
                    {r.agentName}
                  </span>
                  <span className="ml-auto text-[11px] text-plum/60">
                    {(r.durationMs / 1000).toFixed(1)}s
                  </span>
                </header>
                <div
                  className="agent-body text-sm text-plum/90 pl-1"
                  // Server-side agent output; we render our own tiny markdown
                  // after HTML-escaping the raw text inside renderAgentMarkdown.
                  dangerouslySetInnerHTML={{
                    __html: renderAgentMarkdown(r.content),
                  }}
                />
                <div className="mt-3 flex flex-wrap gap-2 pl-1">
                  <a
                    href={youtubeSearchUrl(lastQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip hover:bg-grape/20"
                  >
                    Find on YouTube
                  </a>
                  <a
                    href={spotifySearchUrl(lastQuery)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="chip hover:bg-grape/20"
                  >
                    Find on Spotify
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

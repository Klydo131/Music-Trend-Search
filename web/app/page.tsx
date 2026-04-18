"use client";

import { useCallback, useState } from "react";
import UrlInput from "@/components/UrlInput";
import Player from "@/components/Player";
import FriendlyError from "@/components/FriendlyError";
import FeedbackWidget from "@/components/FeedbackWidget";
import Playlist from "@/components/Playlist";
import type { Source } from "@/lib/safeUrl";
import { addToPlaylist, type PlaylistItem } from "@/lib/playlist";

export default function Home() {
  const [source, setSource] = useState<Source | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [listKey, setListKey] = useState(0);

  const handleLoad = useCallback((s: Source) => {
    setError(null);
    setSource(s);
  }, []);

  const handleError = useCallback((msg: string) => {
    setError(msg);
  }, []);

  const saveCurrent = useCallback(() => {
    if (!source) return;
    if (source.kind === "mp3") {
      setError("We can't save MP3s across sessions yet — the file lives on your device only. Coming in Phase 1 with accounts.");
      return;
    }
    if (source.kind === "youtube") {
      addToPlaylist({
        kind: "youtube",
        sourceId: source.id,
        title: `YouTube · ${source.id}`,
        url: source.url,
      });
    } else if (source.kind === "spotify") {
      addToPlaylist({
        kind: "spotify",
        sourceId: source.id,
        sourceKindOf: source.kindOf,
        title: `Spotify ${source.kindOf} · ${source.id}`,
        url: source.url,
      });
    }
    setListKey((k) => k + 1);
  }, [source]);

  const playFromList = useCallback((item: PlaylistItem) => {
    if (item.kind === "youtube") {
      setSource({ kind: "youtube", id: item.sourceId, url: item.url });
    } else if (item.kind === "spotify") {
      setSource({
        kind: "spotify",
        kindOf: (item.sourceKindOf as "track") || "track",
        id: item.sourceId,
        url: item.url,
      });
    }
    setError(null);
  }, []);

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
      <header className="text-center mb-8 md:mb-12">
        <h1 className="display text-4xl md:text-6xl font-black text-plum mb-2">
          Loopline
        </h1>
        <p className="text-plum/70 text-lg">
          Your cozy music player. Paste a link, drop a song, sing along.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <UrlInput onLoad={handleLoad} onError={handleError} />

        {error && <FriendlyError message={error} onDismiss={() => setError(null)} />}

        {source ? (
          <>
            <Player
              source={source}
              onError={handleError}
              label={
                source.kind === "mp3"
                  ? source.file.name.replace(/\.[^.]+$/, "")
                  : undefined
              }
            />
            <div className="flex flex-wrap gap-2 items-center">
              <button type="button" className="btn-ghost" onClick={saveCurrent}>
                Save to playlist
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => {
                  setSource(null);
                  setError(null);
                }}
              >
                Clear
              </button>
            </div>
          </>
        ) : (
          <div className="card p-6 md:p-8 text-center">
            <p className="text-plum/70 mb-2 font-semibold">Nothing playing yet.</p>
            <p className="text-sm text-plum/60">
              Drop an MP3 above, or paste a YouTube / Spotify link to start.
            </p>
          </div>
        )}

        <Playlist onPlay={playFromList} refreshKey={listKey} />

        <footer className="text-center text-xs text-plum/50 mt-8">
          <p>
            Loopline · prototype · zero-cost, private-first · your files stay on your
            device
          </p>
        </footer>
      </div>

      <FeedbackWidget />
    </main>
  );
}

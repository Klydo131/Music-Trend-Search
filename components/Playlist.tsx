"use client";

import { useEffect, useState } from "react";
import {
  readPlaylist,
  removeFromPlaylist,
  type PlaylistItem,
} from "@/lib/playlist";

type Props = {
  onPlay: (item: PlaylistItem) => void;
  refreshKey?: number;
};

export default function Playlist({ onPlay, refreshKey }: Props) {
  const [items, setItems] = useState<PlaylistItem[]>([]);

  useEffect(() => {
    setItems(readPlaylist());
  }, [refreshKey]);

  const remove = (id: string) => {
    removeFromPlaylist(id);
    setItems(readPlaylist());
  };

  if (items.length === 0) {
    return (
      <div className="card p-4 md:p-5 text-sm text-plum/70">
        <h2 className="font-display text-lg font-bold text-plum mb-1">Playlist</h2>
        <p>Your saved songs will live here. Hit "Save" on a track to start.</p>
      </div>
    );
  }

  return (
    <div className="card p-4 md:p-5">
      <h2 className="font-display text-lg font-bold text-plum mb-3">
        Playlist <span className="text-sm font-normal text-plum/60">({items.length})</span>
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 p-2 rounded-xl bg-white/60 hover:bg-white transition"
          >
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style={{
                background: item.kind === "youtube" ? "#FFD6A5" : "#C7F0D2",
                color: "var(--ink)",
              }}
              aria-hidden
            >
              {item.kind === "youtube" ? "▶" : "♪"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-ink truncate">{item.title}</p>
              <p className="text-xs text-plum/60 capitalize">{item.kind}</p>
            </div>
            <button
              type="button"
              className="btn-ghost !px-3 !py-1 text-sm"
              onClick={() => onPlay(item)}
            >
              Play
            </button>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="text-plum/50 hover:text-plum text-lg"
              aria-label={`Remove ${item.title}`}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Local-first playlist store. Everything lives in browser localStorage.
 * Phase 1 will sync this to Supabase for authed users.
 */

export type PlaylistItem = {
  id: string;                   // uuid-ish
  addedAt: number;
  kind: "youtube" | "spotify";  // MP3s can't be persisted — the File is ephemeral
  sourceId: string;             // yt video id or spotify id
  sourceKindOf?: string;        // spotify track/album/...
  title: string;
  url: string;
};

const KEY = "loopline.playlist.v1";

export function readPlaylist(): PlaylistItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePlaylist(items: PlaylistItem[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToPlaylist(item: Omit<PlaylistItem, "id" | "addedAt">): PlaylistItem {
  const full: PlaylistItem = {
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    addedAt: Date.now(),
  };
  const existing = readPlaylist();
  // de-dup by (kind, sourceId)
  const deduped = existing.filter(
    (e) => !(e.kind === full.kind && e.sourceId === full.sourceId),
  );
  const next = [full, ...deduped].slice(0, 200);
  writePlaylist(next);
  return full;
}

export function removeFromPlaylist(id: string): void {
  writePlaylist(readPlaylist().filter((i) => i.id !== id));
}

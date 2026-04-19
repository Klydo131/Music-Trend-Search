/**
 * URL safety + source detection for pasted links.
 *
 * Zero-cost rule: we only allow big, well-known music hosts. Anything else
 * is rejected with a friendly reason the user can understand.
 */

export type Source =
  | { kind: "youtube"; id: string; url: string }
  | { kind: "spotify"; kindOf: "track" | "album" | "playlist" | "episode" | "show"; id: string; url: string }
  | { kind: "mp3"; file: File }
  | { kind: "unknown" };

const YT_HOSTS = new Set(["www.youtube.com", "youtube.com", "m.youtube.com", "youtu.be", "music.youtube.com"]);
const SP_HOSTS = new Set(["open.spotify.com", "spotify.com"]);

// 11-char YouTube ID
const YT_ID = /^[a-zA-Z0-9_-]{11}$/;
// 22-char Spotify ID (base62)
const SP_ID = /^[a-zA-Z0-9]{22}$/;

export function detectSource(raw: string): Source {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "unknown" };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { kind: "unknown" };
  }

  const host = url.hostname.toLowerCase();

  if (YT_HOSTS.has(host)) {
    const id = extractYouTubeId(url);
    if (id && YT_ID.test(id)) {
      return { kind: "youtube", id, url: trimmed };
    }
    return { kind: "unknown" };
  }

  if (SP_HOSTS.has(host)) {
    const parts = url.pathname.split("/").filter(Boolean);
    // Spotify paths: /track/<id>, /album/<id>, etc. May be prefixed by "intl-xx"
    const typeIdx = parts.findIndex((p) =>
      ["track", "album", "playlist", "episode", "show"].includes(p),
    );
    if (typeIdx >= 0 && parts[typeIdx + 1] && SP_ID.test(parts[typeIdx + 1])) {
      return {
        kind: "spotify",
        kindOf: parts[typeIdx] as "track" | "album" | "playlist" | "episode" | "show",
        id: parts[typeIdx + 1],
        url: trimmed,
      };
    }
    return { kind: "unknown" };
  }

  return { kind: "unknown" };
}

function extractYouTubeId(url: URL): string | null {
  // youtu.be/<id>
  if (url.hostname === "youtu.be") {
    return url.pathname.slice(1).split("/")[0] || null;
  }
  // /watch?v=<id>
  const v = url.searchParams.get("v");
  if (v) return v;
  // /shorts/<id>, /embed/<id>, /live/<id>
  const m = url.pathname.match(/\/(?:shorts|embed|live)\/([^/?#]+)/);
  return m ? m[1] : null;
}

export function humanizeSourceError(raw: string): string {
  if (!raw.trim()) return "Paste a link or drop an MP3 to get started.";
  try {
    const host = new URL(raw).hostname;
    return `We don't support "${host}" yet. Try a YouTube or Spotify link — those are free and safe.`;
  } catch {
    return "That doesn't look like a valid link. Double-check it, or drop an MP3 file.";
  }
}

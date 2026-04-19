/**
 * LRCLIB client — free, open-source synced-lyrics API.
 * Docs: https://lrclib.net/docs
 *
 * We fetch either by (artist, title) or by a free-form search. Returns
 * parsed LRC lines with timestamps.
 */

export type LyricLine = { time: number; text: string };

export type LyricsResult = {
  lines: LyricLine[];
  plain: string;
  synced: boolean;
  source: "lrclib";
};

const LRCLIB_BASE = "https://lrclib.net/api";

export async function fetchLyrics(opts: {
  artist?: string;
  title?: string;
  query?: string;
  signal?: AbortSignal;
}): Promise<LyricsResult | null> {
  try {
    let url: string;
    if (opts.artist && opts.title) {
      const params = new URLSearchParams({
        artist_name: opts.artist,
        track_name: opts.title,
      });
      url = `${LRCLIB_BASE}/get?${params}`;
    } else if (opts.query) {
      const params = new URLSearchParams({ q: opts.query });
      url = `${LRCLIB_BASE}/search?${params}`;
    } else {
      return null;
    }

    const res = await fetch(url, { signal: opts.signal });
    if (!res.ok) return null;
    const data = await res.json();

    // /search returns an array; /get returns one object
    const entry = Array.isArray(data) ? data[0] : data;
    if (!entry) return null;

    const syncedText: string | null = entry.syncedLyrics ?? null;
    const plain: string = entry.plainLyrics ?? "";

    if (syncedText) {
      return {
        lines: parseLrc(syncedText),
        plain,
        synced: true,
        source: "lrclib",
      };
    }
    if (plain) {
      const lines = plain
        .split("\n")
        .map((t, i) => ({ time: i * 3, text: t }))
        .filter((l) => l.text.trim());
      return { lines, plain, synced: false, source: "lrclib" };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Parse LRC format:
 *   [mm:ss.xx] lyric line
 */
export function parseLrc(lrc: string): LyricLine[] {
  const out: LyricLine[] = [];
  const re = /\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g;
  for (const raw of lrc.split("\n")) {
    const text = raw.replace(re, "").trim();
    if (!text) continue;
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(raw)) !== null) {
      const min = parseInt(m[1], 10);
      const sec = parseInt(m[2], 10);
      const ms = m[3] ? parseInt(m[3].padEnd(3, "0"), 10) : 0;
      out.push({ time: min * 60 + sec + ms / 1000, text });
    }
  }
  out.sort((a, b) => a.time - b.time);
  return out;
}

/**
 * Best-effort extraction of {artist, title} from a messy string like
 * a YouTube title ("Artist - Title (Official Video)") or an MP3 filename
 * ("01 - Artist - Title.mp3"). Strips common noise tags so LRCLIB's
 * /get endpoint has a fair shot.
 */
export function parseTrackLabel(
  raw: string,
  ytAuthor?: string,
): { artist?: string; title?: string; query: string } {
  // Drop file extension + leading track numbers like "01 " or "01. "
  let s = raw
    .replace(/\.[^.]+$/, "")
    .replace(/^\s*\d+[.\-\s]+/, "")
    .replace(/[_]+/g, " ")
    .trim();

  // Strip bracket/paren noise: (Official Video), [Lyrics], (Audio), etc.
  s = s
    .replace(
      /[\(\[\{][^\)\]\}]*\b(official|video|audio|lyric[s]?|hd|hq|4k|mv|m\/v|remaster(ed)?|live|explicit|clean|visualizer|ft|feat|featuring)\b[^\)\]\}]*[\)\]\}]/gi,
      "",
    )
    .replace(/\s*\|\s*.*$/, "")
    .replace(/\s+/g, " ")
    .trim();

  // Try "Artist - Title" split (em-dash, en-dash, or hyphen with spaces)
  const splitMatch = s.match(/^(.+?)\s[-–—]\s(.+)$/);
  if (splitMatch) {
    const [, artist, title] = splitMatch;
    return {
      artist: artist.trim(),
      title: title.trim(),
      query: `${artist.trim()} ${title.trim()}`,
    };
  }

  // YouTube uploader channel often = the artist (e.g. "TaylorSwiftVEVO")
  if (ytAuthor) {
    const artist = ytAuthor.replace(/VEVO$|Official$|Music$/i, "").trim();
    if (artist && s) {
      return { artist, title: s, query: `${artist} ${s}` };
    }
  }

  return { query: s };
}

/** Find the active line index for a given time. */
export function activeLineIndex(lines: LyricLine[], t: number): number {
  if (lines.length === 0) return -1;
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= t) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans;
}

# Loopline — Web App

Cozy music player built with Next.js 15 + TypeScript + Tailwind.

## Quick start

```bash
pnpm install          # or npm / yarn
pnpm dev              # http://localhost:3000
```

Then:

- Drop an MP3 onto the page → instant playback
- Paste a YouTube link → full playback (IFrame API)
- Paste a Spotify link → 30-second preview + "Play on YouTube" fallback
- Pick a skin (tape / CD / VHS) and a color preset
- Lyrics auto-load from [LRCLIB](https://lrclib.net) when we can find a match

## Environment

Create `.env.local` (optional — the app runs without it):

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Without these, feedback is queued in `localStorage` and synced once the
Supabase vars land.

## Deploy

Push to a branch connected to Vercel; the free hobby plan is enough for
Phase 0. Set the two `NEXT_PUBLIC_SUPABASE_*` env vars in Vercel when you
wire up the Supabase project.

## What's here

| Path                               | Purpose                                   |
|------------------------------------|-------------------------------------------|
| `app/page.tsx`                     | Landing + player + playlist               |
| `components/Player.tsx`            | Audio engine (MP3 / YouTube / Spotify)    |
| `components/skins/*`               | Tape, CD, VHS visual shells               |
| `components/SkinPicker.tsx`        | Skin + color preset controls              |
| `components/LyricsKaraoke.tsx`     | Synced lyrics view                        |
| `components/FunLoader.tsx`         | Entertaining loading state                |
| `components/FriendlyError.tsx`     | Human error banner                        |
| `components/Playlist.tsx`          | Local playlist UI                         |
| `components/FeedbackWidget.tsx`    | 1–5 star + comment                        |
| `lib/safeUrl.ts`                   | URL allowlist + source detection          |
| `lib/youtube.ts`                   | Lazy-loader for YT IFrame API             |
| `lib/lyrics.ts`                    | LRCLIB client + LRC parser                |
| `lib/playlist.ts`                  | localStorage playlist CRUD                |
| `lib/feedback.ts`                  | Supabase REST + offline queue             |

See the repo-root `CLAUDE.md` for vision + principles and `docs/PROGRESS.md`
for the live checklist.

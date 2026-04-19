# Loopline (formerly Music Trend Search)

**Loopline** is a cozy, zero-cost music player with an in-app trend radar.
Paste a YouTube or Spotify link (or drop an MP3), sing along to synced
lyrics, and ask 5 specialized AI agents what's rising, viral, or shifting
in music — all in one Next.js app.

- **Next.js 15 app at the repo root** — Vercel auto-detects on deploy.
- **`app/api/discover/route.ts`** → the trend-search engine, a Next.js
  API route that calls Claude directly. The 5 agents live in
  [`lib/agents.ts`](lib/agents.ts).
- **`legacy/`** → the original FastAPI + vanilla-JS trend-search app.
  Kept for reference only; functionally superseded by the API route.

For the full vision, principles, and cross-session context, read
[`CLAUDE.md`](CLAUDE.md) and [`docs/PROGRESS.md`](docs/PROGRESS.md).

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
```

Then, on the page:

1. **Play** — paste a YouTube / Spotify link, or drop an MP3.
2. **Sing** — lyrics auto-fetch from LRCLIB.
3. **Discover** — scroll to the Discover card, click *Add API key*,
   paste your `sk-ant-...` (session-only, never persisted), pick 1–5
   agents, and ask the trend agents anything.

## Deploy to Vercel

The app lives at the repo root, so Vercel auto-detects the Next.js
framework on import — no Root Directory or `vercel.json` tweak needed.
Optional env vars in Vercel Project Settings → Environment Variables:

| Var                                | Purpose                                   |
|------------------------------------|-------------------------------------------|
| `ANTHROPIC_API_KEY`                | Server-side fallback for Discover (BYOK still works without) |
| `NEXT_PUBLIC_SUPABASE_URL`         | Feedback widget (optional)                |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`    | Feedback widget (optional)                |

## Discover agent roster

| Agent | Focus |
|-------|-------|
| 📊 **Chart Tracker** | Billboard, Spotify & streaming chart analysis |
| 📱 **Viral Scout** | TikTok, Reels & social virality tracking |
| 🎵 **Genre Pulse** | Genre evolution, micro-trends & emerging sounds |
| 🔍 **Artist Radar** | Rising artists & breakout talent discovery |
| 🌍 **Culture Lens** | Music & culture intersection, mood & context analysis |

## Discover API (same-origin)

### `POST /api/discover`

```json
{
  "query": "hip-hop trends 2026",
  "agentIds": ["chart_tracker", "viral_scout", "genre_pulse"],
  "apiKey": "sk-ant-..."
}
```

`apiKey` is optional if `ANTHROPIC_API_KEY` is set server-side. The route
validates the key format, calls Claude in parallel (one request per
agent, 45s timeout each), and returns an array of `{agentId, agentName,
agentIcon, agentColor, content, durationMs}`. Error responses are plain
English — no stack traces, no upstream HTTP codes.

## Model

Uses **Claude Haiku 4.5** (`claude-haiku-4-5-20251001`) — fastest, most
cost-efficient model. Swap to Sonnet 4.6 or Opus 4.7 in
[`app/api/discover/route.ts`](app/api/discover/route.ts) for deeper
analysis.

## What's here

| Path                               | Purpose                                   |
|------------------------------------|-------------------------------------------|
| `app/page.tsx`                     | Landing + player + playlist + Discover    |
| `app/api/discover/route.ts`        | Parallel Claude call per selected agent   |
| `components/Player.tsx`            | Audio engine (MP3 / YouTube / Spotify)    |
| `components/Discover.tsx`          | Agent chips + trend search UI             |
| `components/skins/*`               | Tape, CD, VHS visual shells               |
| `components/SkinPicker.tsx`        | Skin + color preset controls              |
| `components/LyricsKaraoke.tsx`     | Synced lyrics view                        |
| `components/FunLoader.tsx`         | Entertaining loading state                |
| `components/FriendlyError.tsx`     | Human error banner                        |
| `components/Playlist.tsx`          | Local playlist UI                         |
| `components/FeedbackWidget.tsx`    | 1–5 star + comment                        |
| `lib/agents.ts`                    | 5 trend agent definitions                 |
| `lib/discover.ts`                  | Discover client helpers + markdown        |
| `lib/safeUrl.ts`                   | URL allowlist + source detection          |
| `lib/youtube.ts`                   | Lazy-loader for YT IFrame API             |
| `lib/lyrics.ts`                    | LRCLIB client + LRC parser                |
| `lib/playlist.ts`                  | localStorage playlist CRUD                |
| `lib/feedback.ts`                  | Supabase REST + offline queue             |
| `legacy/`                          | Original FastAPI + vanilla-JS app         |

## Legacy FastAPI app

The original FastAPI + vanilla-JS trend-search engine still boots from
`legacy/` via `./legacy/run.sh` for reference. Not deployed.

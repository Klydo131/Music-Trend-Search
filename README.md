# Loopline (formerly Music Trend Search)

**Loopline** is a cozy, zero-cost music player with an in-app trend radar.
Paste a YouTube or Spotify link (or drop an MP3), sing along to synced
lyrics, and ask 5 specialized AI agents what's rising, viral, or shifting
in music — all in one Next.js app.

- **`web/`** → the live app (Next.js 15 + Tailwind + Supabase + Vercel).
  Start here: [`web/README.md`](web/README.md).
- **`web/app/api/discover/route.ts`** → the trend-search engine, now a
  Next.js API route that calls Claude directly. The 5 agents live in
  [`web/lib/agents.ts`](web/lib/agents.ts).
- **`backend/` + `frontend/`** → the original FastAPI + vanilla-JS
  trend-search app. Kept for reference; scheduled for archival once the
  Next.js route has taken a full release cycle.

For the full vision, principles, and cross-session context, read
[`CLAUDE.md`](CLAUDE.md) and [`docs/PROGRESS.md`](docs/PROGRESS.md).

---

## Loopline (the merged app)

Run everything out of `web/`:

```bash
cd web
pnpm install   # or npm install
pnpm dev       # http://localhost:3000
```

Then, on the page:

1. **Play** — paste a YouTube / Spotify link, or drop an MP3.
2. **Sing** — lyrics auto-fetch from LRCLIB.
3. **Discover** — scroll to the Discover card, click *Add API key*,
   paste your `sk-ant-...` (session-only, never persisted), pick 1–5
   agents, and ask the trend agents anything.

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
[`web/app/api/discover/route.ts`](web/app/api/discover/route.ts) for
deeper analysis.

## Legacy FastAPI app

The original FastAPI + vanilla-JS trend-search engine still boots from
the repo root via `./run.sh` for reference. It is functionally
superseded by the Next.js route above.

# Loopline — Project Constitution (for any LLM coding session)

> **Read this first, always.** If you're an AI coding assistant starting a
> new session on this repo, this file + `docs/PROGRESS.md` give you the full
> context so the user doesn't have to re-explain their vision every time they
> hit a token limit.

---

## Who it's for

A passion project by **@klydo131**. Loopline is a cozy, customizable web
music player for music lovers and creators — casual karaoke today, pro
rehearsal tomorrow.

## Vision (owner's words)

> "I want to create a music player first for music lovers and music creators
> to enjoy online and offline — listen, create, and have dynamic music playing
> (professional performance or just casual karaoke)."

## Mission

Become the #1 music platform in music & entertainment.

---

## Non-negotiable principles

1. **Zero cost.** Every dependency, host, data source, and AI call must have
   a free tier. No paid services on the MVP, ever. If a feature requires
   money, defer it or find a free alternative.
2. **Private-first.** User files and playlists stay in the browser by default.
   Nothing leaves the device until the user explicitly opts in.
3. **Light & fast.** No heavy frameworks. No wait > 5s. Loading screens must
   entertain (tips, mini-interactions, visualizers).
4. **Friendly errors only.** Never show stack traces, HTTP codes, or server
   internals to the user. Every error must read like a human wrote it and
   tell the user what to try.
5. **Customizable.** Users can change almost everything about their player
   (skin, color, layout). Default to at least 5 color presets + 3 skins.
6. **Security by default.** No suspicious URL sources (allowlist only). RLS
   on every Supabase table. CSP + security headers on every response.
7. **Cross-session memory.** This file + `docs/PROGRESS.md` must stay up to
   date so any future LLM session can pick up work without re-briefing.

---

## Stack (current)

| Layer       | Tech                         | Why                                |
|-------------|------------------------------|------------------------------------|
| Frontend    | Next.js 15 + TypeScript      | Vercel free tier, great DX         |
| Styling     | Tailwind + CSS variables     | Fast, light, themeable             |
| Playback    | `<audio>` / YT IFrame API / Spotify oEmbed | All free, all ToS-compliant |
| Lyrics      | LRCLIB (free, open)          | No API key needed                  |
| DB / Auth   | Supabase (free tier)         | 500MB DB, magic-link auth          |
| AI / Agents | Anthropic (user's own key)   | Repurposing existing FastAPI agents for Phase 1 discovery sidebar |
| Hosting     | Vercel (web), HF Spaces (api)| All free                           |

**Deferred until later phases:**
- Rust (Phase 2 — WASM pitch detection)
- Full Spotify streaming (requires Premium + OAuth — not free)
- PWA / offline (Phase 2)
- Real-time security agents (GitHub Actions crons in Phase 3)

---

## Repo layout

```
Music-Trend-Search/
├── CLAUDE.md               ← you are here
├── docs/
│   └── PROGRESS.md         ← running log of what shipped & what's next
├── web/                    ← Next.js app (the player)
│   ├── app/                ← routes
│   ├── components/         ← React components
│   │   └── skins/          ← tape / CD / VHS visuals
│   ├── lib/                ← safeUrl, lyrics (LRCLIB), playlist, feedback
│   └── public/
├── backend/                ← existing FastAPI + 5 Anthropic trend agents
│                             (Phase 1: repurpose as music discovery)
├── frontend/               ← legacy vanilla-JS search UI (to archive later)
├── supabase/
│   └── migrations/         ← SQL migrations (0001_feedback.sql etc.)
└── .github/workflows/      ← Phase 3 security crons (Dependabot, CVE scan)
```

---

## Conventions

- **Branch**: develop on `claude/music-player-mvp-ch3Yx` (per harness config).
- **Commits**: imperative mood, scope-prefixed (`feat(player): ...`, `fix(lyrics): ...`).
- **Errors**: always user-facing, always kind. Log server-side if needed but
  never leak details.
- **Design tokens**: cream `#FFF7E0`, peach `#FFD6A5`, grape `#6F4AB7`,
  plum `#3D2466`, ink `#2A1B3D`.
- **Color presets** (5): Cream, Peach, Grape, Mint, Sky.
- **Skins** (3): Tape, CD, VHS (more coming).
- **Don't** add new paid dependencies. **Don't** break the zero-cost rule.

---

## Running locally

```bash
cd web
pnpm install      # or npm install
pnpm dev          # http://localhost:3000
```

The old FastAPI/trend-search app still boots from the repo root via
`./run.sh` for Phase 1 planning. Ignore it for the player MVP.

---

## Phase checklist (updated as we ship)

See `docs/PROGRESS.md` for the live status.

## Decisions log

- **Spotify**: oEmbed 30s preview + auto-generated YouTube search for full
  playback. No paid SDK.
- **Old trend-search agents**: kept in `backend/`, to be repurposed as an
  in-app "Discover" sidebar in Phase 1.
- **Memory**: dev-side (this file + PROGRESS.md) ships today; user-facing
  assistant-with-memory deferred to Phase 1+.
- **MVP scope**: no features cut from Phase 0 — ship lyrics, skins, Spotify,
  YouTube, MP3, feedback all together.

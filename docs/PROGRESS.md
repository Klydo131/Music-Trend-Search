# Loopline — Progress Log

A running log of what has shipped, what's in flight, and what comes next.
**Any new LLM session should update this file at the end of a work block.**

---

## Phase 0 — Prototype (in progress)

### Shipped
- [x] Next.js 15 + TS + Tailwind scaffold under `web/`
- [x] Theme: cream / peach / grape / plum / ink + soft radial gradient bg
- [x] `lib/safeUrl.ts` — YouTube + Spotify URL detection with hostname allowlist
- [x] `components/UrlInput.tsx` — paste OR drag-drop MP3, friendly rejection
- [x] `components/Player.tsx` — unified engine for MP3 + YouTube + Spotify
- [x] Skins: `TapeSkin`, `CdSkin`, `VhsSkin` + `SkinPicker` with 5 color presets
- [x] `lib/youtube.ts` — lazy-loads YT IFrame API
- [x] `lib/lyrics.ts` + `LyricsKaraoke.tsx` — LRCLIB sync'd lyrics with
      auto-scroll + manual paste fallback
- [x] `FunLoader` — tap-the-beat micro-interaction for <5s waits
- [x] `FriendlyError` — human error banner
- [x] `lib/playlist.ts` + `Playlist.tsx` — localStorage playlist
- [x] `lib/feedback.ts` + `FeedbackWidget.tsx` — 1–5 stars, Supabase REST
      with local queue fallback
- [x] `supabase/migrations/0001_feedback.sql` — RLS-protected feedback table
- [x] `CLAUDE.md` + this file — cross-session memory

### Still to do before calling Phase 0 done
- [ ] `pnpm install` + `pnpm build` sanity check (needs the user's machine;
      sandbox may not have network)
- [ ] Manual browser test: YouTube playback, MP3 drag, Spotify embed,
      lyrics fetch, playlist persistence, feedback submit (queued if no
      Supabase env)
- [ ] Deploy to Vercel (user action)
- [ ] Archive the legacy `frontend/` vanilla-JS app under `legacy/`

### Deliberate Phase-0 non-goals
- No auth
- No server-side playlist (localStorage only)
- No Rust
- No AI calls
- No offline / PWA
- No pro-rehearsal UI (casual karaoke only)
- No user-facing assistant memory

---

## Phase 1 — Accounts & Discovery

- [ ] Supabase magic-link auth
- [ ] Playlists + favorites synced per user
- [ ] Repurpose `backend/agents.py` (Chart Tracker, Viral Scout, Genre Pulse,
      Artist Radar, Culture Lens) as in-app Discover sidebar that returns
      playable YouTube/Spotify tracks
- [ ] Ratings per track (not just app-level)
- [ ] Public discovery feed (read-only)
- [ ] Deploy FastAPI agents to Hugging Face Spaces (free)

---

## Phase 2 — Pro Mode & Offline

- [ ] Pro rehearsal UI (notes, study-guide layout, loop sections, slow down)
- [ ] Rust + WASM pitch detection (crepe-tiny or basic-pitch)
- [ ] Whisper.cpp WASM for lyric transcription of uploaded MP3s
- [ ] PWA manifest + service worker for offline playback

---

## Phase 3 — Security Automation

- [ ] GitHub Actions: `dependency-audit`, `cve-feed-scan`, `lighthouse-cron`
- [ ] RLS audit script
- [ ] Moderation pipeline on user-submitted content (free HF toxic-bert)

---

## Known issues / parking lot

- YouTube IFrame audio-only trick: we render the iframe with `opacity: 0`
  but it still reserves layout. Revisit when we add an actual video mode.
- LRCLIB misses many tracks; the manual paste fallback handles it but
  phase 2 Whisper will do the job for uploaded MP3s.
- Spotify embed is stuck at 30s preview by design.

---

## How to update this file

At the end of any coding session:

1. Move items from "Still to do" → "Shipped" if done.
2. Add new discoveries to "Known issues / parking lot".
3. Keep the bulleted lists short; dump long context into CLAUDE.md or PRs.

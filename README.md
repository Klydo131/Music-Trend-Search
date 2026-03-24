# 🎧 Music Trend Search Engine

A lightweight, AI-powered music trend search engine. Pick the agents you want, enter a query, and get parallel expert analysis in seconds.

## Features

- **5 specialized AI agents** — each with a unique analytical lens on music
- **Parallel execution** — all selected agents run concurrently for fast results
- **Agent selector UI** — choose which agents to activate per search
- **Lite stack** — FastAPI + vanilla JS, no heavy frameworks
- **Flexible API key** — set server-side via env var or enter per-session in the UI

## Agents

| Agent | Focus |
|-------|-------|
| 📊 **Chart Tracker** | Billboard, Spotify & streaming chart analysis |
| 📱 **Viral Scout** | TikTok, Reels & social virality tracking |
| 🎵 **Genre Pulse** | Genre evolution, micro-trends & emerging sounds |
| 🔍 **Artist Radar** | Rising artists & breakout talent discovery |
| 🌍 **Culture Lens** | Music & culture intersection, mood & context analysis |

## Quick Start

### Prerequisites
- Python 3.10+
- An [Anthropic API key](https://console.anthropic.com/)

### Run

```bash
# 1. Clone and enter the repo
git clone https://github.com/klydo131/music-trend-search.git
cd music-trend-search

# 2. Set your API key (optional — can also be entered in the UI)
cp .env.example .env
# Edit .env and add: ANTHROPIC_API_KEY=sk-ant-...

# 3. Start
./run.sh
```

Open **http://localhost:8000** in your browser.

### Manual Setup

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Usage

1. Open the app in your browser
2. *(Optional)* Click ⚙️ to enter your Anthropic API key
3. Select which agents you want to activate (all selected by default)
4. Type your music trend query, e.g.:
   - `hip-hop trends 2025`
   - `viral pop sounds this year`
   - `rising indie artists`
   - `bedroom pop genre evolution`
5. Hit **Search** — agents run in parallel, results appear as cards

## Tech Stack

```
backend/
  main.py          FastAPI app + search endpoint
  agents.py        Agent definitions & system prompts
  requirements.txt Python dependencies

frontend/
  index.html       Single-page UI
  style.css        Dark theme styles
  app.js           Vanilla JS (no frameworks)
```

## API

### `GET /api/agents`
Returns available agents list.

### `POST /api/search`
```json
{
  "query": "hip-hop trends 2025",
  "agent_ids": ["chart_tracker", "viral_scout", "genre_pulse"],
  "api_key": "sk-ant-..."
}
```

Returns per-agent analysis results with timing data.

## Model

Uses **Claude Haiku** (`claude-haiku-4-5-20251001`) — the fastest, most cost-efficient Claude model, ideal for this lightweight use case. Swap to Sonnet or Opus in `backend/main.py` for deeper analysis.

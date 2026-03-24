# Contributing to Music Trend Search

Thank you for your interest in contributing! This project welcomes bug reports,
feature ideas, new agents, and pull requests.

## Getting Started

```bash
git clone https://github.com/klydo131/music-trend-search.git
cd music-trend-search
cp .env.example .env      # add your ANTHROPIC_API_KEY
./run.sh                  # starts backend on http://localhost:8000
```

## Project Structure

```
backend/
  main.py       FastAPI app, security middleware, search endpoint
  agents.py     Agent definitions (system prompts, metadata)
  requirements.txt

frontend/
  index.html    Single-page UI
  style.css     Dark theme
  app.js        Vanilla JS — no framework dependencies
```

## Adding a New Agent

All agents live in `backend/agents.py`. To add one:

1. Add a new `Agent(...)` entry to the `AGENTS` dict with a unique `id`
2. Write a focused `system_prompt` that gives the agent a clear specialty
3. Give it an `icon` (emoji), a short `tagline`, and a `color` (hex)

That's it — the agent will appear automatically in the UI.

**Agent writing tips:**
- Be specific about what the agent focuses on vs. what it ignores
- Include a consistent "Verdict" summary instruction at the end of the prompt
- Keep the scope narrow — narrow agents produce more useful outputs than generic ones

## Submitting a Pull Request

1. Fork the repo and create a branch: `git checkout -b feat/your-feature`
2. Make your changes and test locally
3. Run a quick syntax check: `python3 -m py_compile backend/*.py`
4. Open a PR with a clear description of what changed and why

## Security Issues

Please do **not** open public issues for security vulnerabilities.
See [SECURITY.md](SECURITY.md) for the responsible disclosure process.

## Code Style

- Python: follow PEP 8, keep functions small
- JavaScript: vanilla ES2020+, no frameworks, no bundlers
- CSS: custom properties for theming, mobile-first
- Keep it **lite** — avoid adding heavy dependencies

## License

By contributing, you agree that your contributions will be licensed under
the [MIT License](LICENSE).

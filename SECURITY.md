# Security Policy

## Supported Versions

| Version | Supported |
|---------|-----------|
| 1.x     | ✅ Active  |

## Threat Model

This project is a lightweight, self-hosted tool. Users supply their own Anthropic
API key. The key threat surfaces are:

| Threat | Mitigation |
|--------|------------|
| Directory traversal on static files | `os.path.realpath` + prefix check in `safe_static_path()` |
| API abuse / key drain | Rate limiting: 10 requests/minute per IP via `slowapi` |
| XSS via agent response content | HTML entities escaped before markdown parsing |
| XSS via agent metadata | DOM `textContent` / CSS color allowlist in `renderAgents()` |
| Clickjacking | `X-Frame-Options: DENY` + `frame-ancestors 'none'` CSP |
| MIME sniffing | `X-Content-Type-Options: nosniff` |
| Error detail leakage | Exception type logged server-side; generic message sent to client |
| Secret commits | `.gitignore` excludes `.env`; `.env.example` ships instead |
| Overly broad CORS | Same-origin by default; configure via `ALLOWED_ORIGINS` env var |
| Indefinite request hangs | 45-second timeout on all Anthropic API calls |

## Reporting a Vulnerability

If you discover a security vulnerability, please **do not open a public GitHub issue**.

Instead, report it privately by opening a
[GitHub Security Advisory](https://github.com/klydo131/music-trend-search/security/advisories/new)
on this repository.

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce
- Any suggested fix (optional)

You will receive a response within 72 hours. We will coordinate a fix and disclosure timeline together.

## Out of Scope

- Vulnerabilities in third-party dependencies (report to their maintainers)
- Issues requiring physical access to the server
- Social engineering attacks
- Theoretical vulnerabilities without a proof of concept

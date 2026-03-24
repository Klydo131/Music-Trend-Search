#!/usr/bin/env bash
# Music Trend Search Engine — Quick Start Script
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"

echo "🎧 Music Trend Search Engine"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Load .env if present
if [ -f "$SCRIPT_DIR/.env" ]; then
  echo "📦 Loading .env"
  export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Check Python
if ! command -v python3 &>/dev/null; then
  echo "❌ python3 not found. Please install Python 3.10+."
  exit 1
fi

# Create venv if needed
if [ ! -d "$BACKEND_DIR/.venv" ]; then
  echo "🐍 Creating virtual environment..."
  python3 -m venv "$BACKEND_DIR/.venv"
fi

# Activate venv
source "$BACKEND_DIR/.venv/bin/activate"

# Install deps
echo "📦 Installing dependencies..."
pip install -q -r "$BACKEND_DIR/requirements.txt"

echo ""
echo "✅ Starting server at http://localhost:8000"
echo "   Press Ctrl+C to stop."
echo ""

cd "$BACKEND_DIR"
uvicorn main:app --host 0.0.0.0 --port 8000 --reload

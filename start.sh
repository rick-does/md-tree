#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "==> .mdTree"
echo ""

# Check for Node.js / npm
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed."
  echo ""
  echo "Please install the LTS version from: https://nodejs.org"
  echo "Then run this script again."
  exit 1
fi
if ! command -v npm &>/dev/null; then
  echo "ERROR: npm was not found. Please reinstall Node.js from: https://nodejs.org"
  echo "Then run this script again."
  exit 1
fi

# Check for Python
if ! command -v python3 &>/dev/null; then
  echo "ERROR: Python 3 is not installed."
  echo ""
  echo "Please install Python 3.12 or later from: https://www.python.org/downloads"
  echo "Then run this script again."
  exit 1
fi

# Build frontend
echo "==> Building frontend..."
cd "$ROOT/frontend"
if [ ! -d "node_modules" ]; then
  echo "    Installing npm packages..."
  npm install
fi
node node_modules/vite/bin/vite.js build

# Start backend (serves API + built frontend)
echo ""
echo "==> Starting server on http://localhost:8002"
echo "    API docs: http://localhost:8002/docs"
echo "    NOTE: If the browser shows a blank/spinning page, open the VS Code"
echo "          Ports panel, stop forwarding port 8002, then re-add it."
echo "    Press Ctrl+C to stop."
echo ""
cd "$ROOT/backend"
if [ ! -d ".venv" ]; then
  echo "    Creating virtualenv..."
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
source .venv/bin/activate

# Free port 8002 if something is already using it
lsof -ti:8002 | xargs kill -9 2>/dev/null || true

uvicorn main:app --reload --host 0.0.0.0 --port 8002

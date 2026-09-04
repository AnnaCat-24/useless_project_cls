#!/usr/bin/env bash
# Cinematic Life Score – start both servers
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo "  🎬  CINEMATIC LIFE SCORE"
echo "  ========================"
echo ""

# Backend
echo "  → Starting FastAPI backend on http://localhost:8000"
cd "$ROOT/backend"
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "  Backend PID: $BACKEND_PID"

sleep 2

# Frontend
echo "  → Starting React frontend on http://localhost:5173"
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!
echo "  Frontend PID: $FRONTEND_PID"

echo ""
echo "  ✓ App running at http://localhost:5173"
echo "  Press Ctrl+C to stop both servers."
echo ""

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo 'Stopped.'" EXIT INT TERM
wait

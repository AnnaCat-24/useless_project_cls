# 🎬 Cinematic Life Score

> Your life is a movie. Your keyboard is the soundtrack.

Monitors keyboard and mouse behavior in real time, converts it into a **Drama Score (0–100)**, and dynamically layers a cinematic soundtrack using the Web Audio API.

```
Keyboard + Mouse → Feature Extraction → Drama Score → Music Engine → Cinematic Soundtrack
```

## Quick Start

```bash
# 1. Install Python deps (one time)
pip install fastapi uvicorn scikit-learn numpy pydantic
# or with --break-system-packages on Debian/Ubuntu without a venv:
python3 -m pip install --break-system-packages fastapi uvicorn scikit-learn numpy pydantic

# 2. Install frontend deps (one time)
cd frontend && npm install && cd ..

# 3. Start everything
./start.sh
```

Then open **http://localhost:5173**

---

## Manual Start (two terminals)

**Terminal 1 – Backend**
```bash
cd backend
python3 -m uvicorn main:app --port 8000 --reload
```

**Terminal 2 – Frontend**
```bash
cd frontend
npm run dev
```

---

## Drama Levels

| Score | Level     | Scene text                   |
|-------|-----------|------------------------------|
| 0–20  | CALM      | "Another Ordinary Day"       |
| 20–40 | FOCUSED   | "The Work Begins"            |
| 40–60 | TENSE     | "Something Is Happening"     |
| 60–80 | INTENSE   | "The Deadline Approaches"    |
| 80–100| CINEMATIC | "The Decision Must Be Made"  |

## Features

- **5-layer generative soundtrack** — Piano, Strings, Percussion, Brass, Climax (Web Audio API synthesis, no audio files needed)
- **ML scoring** — GradientBoosting model trained on synthetic behavioral data; local heuristic fallback if backend is offline
- **Calibration** — 25-second baseline capture; scores measure deviation from *your* normal
- **Demo Mode** — automated CALM → CINEMATIC → completion arc for presentations
- **Complete The Scene** — cinematic climax sequence ending in silence + "MISSION ACCOMPLISHED"
- **Optional webcam** — MediaPipe FaceMesh for anonymous head/face movement features (opt-in, no data stored)

## Privacy

- Typed text is never captured or stored
- Camera is opt-in and processed locally
- No login, no database, no external APIs

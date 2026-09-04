"""
Cinematic Life Score – FastAPI Backend
======================================
Endpoints:
  GET  /health  → liveness check
  POST /score   → drama score from behavioral features
  POST /calibrate → store baseline (in-memory, per-session)
"""

from __future__ import annotations

import threading
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from model import load_model, predict_score, apply_baseline

# ── Global model bundle (loaded once at startup) ─────────────────────────────
_bundle: dict | None = None
_lock = threading.Lock()


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _bundle
    print("Loading / training drama model…")
    _bundle = load_model()
    print("Model ready.")
    yield


app = FastAPI(title="Cinematic Life Score API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Schemas ───────────────────────────────────────────────────────────────────

class Features(BaseModel):
    typing_speed:      float = Field(0, ge=0, le=300)
    keypress_rate:     float = Field(0, ge=0, le=50)
    backspace_rate:    float = Field(0, ge=0, le=20)
    pause_score:       float = Field(0, ge=0, le=1)
    typing_accel:      float = Field(0, ge=-2, le=2)
    mouse_velocity:    float = Field(0, ge=0, le=5000)
    mouse_accel:       float = Field(0, ge=-2000, le=2000)
    click_rate:        float = Field(0, ge=0, le=20)
    movement_activity: float = Field(0, ge=0, le=1)
    idle_time:         float = Field(5, ge=0, le=60)
    # Optional webcam features
    head_movement:     Optional[float] = Field(None)
    mouth_open:        Optional[float] = Field(None)


class Baseline(BaseModel):
    mean: float = Field(0, ge=0, le=1)
    std:  float = Field(0.05, ge=0, le=1)
    samples: int = Field(0, ge=0)


class ScoreRequest(BaseModel):
    features: Features
    baseline: Optional[Baseline] = None


class ScoreResponse(BaseModel):
    score: float
    level: str
    backend: str = "ml"


# ── Helpers ───────────────────────────────────────────────────────────────────

LEVELS = [
    (0,  20,  "CALM"),
    (20, 40,  "FOCUSED"),
    (40, 60,  "TENSE"),
    (60, 80,  "INTENSE"),
    (80, 101, "CINEMATIC"),
]


def score_to_level(score: float) -> str:
    for lo, hi, label in LEVELS:
        if lo <= score < hi:
            return label
    return "CINEMATIC"


def blend_webcam(base_score: float, features: Features) -> float:
    """
    Blend camera-based emotion signals into the drama score.
    Camera contributes up to 20 points on top of the ML base score.
    - head_movement: rapid head movement = agitation / intensity
    - mouth_open: open mouth = surprise / reaction
    """
    if features.head_movement is None and features.mouth_open is None:
        return base_score  # no camera data, return unchanged

    norm_head  = min((features.head_movement or 0) / 8.0,  1.0)
    norm_mouth = min((features.mouth_open    or 0) / 4.0,  1.0)
    cam_score  = norm_head * 0.65 + norm_mouth * 0.35  # 0–1

    # Weighted blend: 80% ML score + 20% camera
    blended = base_score * 0.80 + cam_score * 100 * 0.20
    return float(np.clip(blended, 0, 100))


# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "model_loaded": _bundle is not None}


@app.post("/score", response_model=ScoreResponse)
def score(req: ScoreRequest):
    features_dict = req.features.model_dump()
    baseline_dict = req.baseline.model_dump() if req.baseline else None

    raw = predict_score(features_dict, _bundle)
    adjusted = apply_baseline(raw, baseline_dict)
    final = blend_webcam(adjusted, req.features)

    return ScoreResponse(
        score=round(final, 2),
        level=score_to_level(final),
        backend="ml",
    )


@app.get("/")
def root():
    return {"app": "Cinematic Life Score", "version": "1.0.0"}

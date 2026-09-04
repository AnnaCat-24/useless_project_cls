"""
Drama Score ML Model
====================
A lightweight GradientBoosting model trained on synthetic behavioral data.
Maps 10 input features → drama score 0–100.

Because we have no real labeled data, we construct a plausible training set
by defining score = f(weighted activity signals), add realistic noise, and
train the model on that distribution. The result is a smooth, calibrated
regressor that behaves sensibly for any real input.
"""

import numpy as np
from sklearn.ensemble import GradientBoostingRegressor
from sklearn.preprocessing import MinMaxScaler
import pickle
import os

FEATURE_NAMES = [
    "typing_speed",      # WPM 0–200
    "keypress_rate",     # keys/sec 0–20
    "backspace_rate",    # backspaces/sec 0–5
    "pause_score",       # 0=typing, 1=paused
    "typing_accel",      # acceleration -1 to +1
    "mouse_velocity",    # px/sec 0–2000
    "mouse_accel",       # signed px/sec²
    "click_rate",        # clicks/sec 0–5
    "movement_activity", # 0–1
    "idle_time",         # seconds 0–10
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "drama_model.pkl")


def _generate_training_data(n_samples: int = 4000):
    """Generate synthetic (features, score) pairs spanning all drama levels."""
    rng = np.random.default_rng(42)

    # Sample features uniformly across their realistic ranges
    typing_speed      = rng.uniform(0, 180, n_samples)
    keypress_rate     = rng.uniform(0, 15, n_samples)
    backspace_rate    = rng.uniform(0, 3, n_samples)
    pause_score       = rng.uniform(0, 1, n_samples)
    typing_accel      = rng.uniform(-0.5, 1.0, n_samples)
    mouse_velocity    = rng.uniform(0, 1800, n_samples)
    mouse_accel       = rng.uniform(-500, 500, n_samples)
    click_rate        = rng.uniform(0, 4, n_samples)
    movement_activity = rng.uniform(0, 1, n_samples)
    idle_time         = rng.uniform(0, 10, n_samples)

    # Ground-truth score formula (interpretable, physics-grounded)
    activity = (
        (typing_speed / 180)      * 0.25 +
        (keypress_rate / 15)      * 0.20 +
        (backspace_rate / 3)      * 0.08 +
        (1 - pause_score)         * 0.07 +
        np.clip(typing_accel, 0, 1) * 0.05 +
        (mouse_velocity / 1800)   * 0.15 +
        (click_rate / 4)          * 0.10 +
        movement_activity         * 0.06 +
        (1 - idle_time / 10)      * 0.04
    )
    # Squash to [0, 100] with slight nonlinearity to fill all bands
    score = np.clip(activity ** 0.75 * 100, 0, 100)
    # Add realistic noise (±8 points)
    score += rng.normal(0, 8, n_samples)
    score = np.clip(score, 0, 100)

    X = np.column_stack([
        typing_speed, keypress_rate, backspace_rate, pause_score,
        typing_accel, mouse_velocity, mouse_accel, click_rate,
        movement_activity, idle_time,
    ])
    return X, score


def train_model():
    print("Training drama score model…")
    X, y = _generate_training_data(5000)

    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(X)

    model = GradientBoostingRegressor(
        n_estimators=120,
        max_depth=4,
        learning_rate=0.08,
        subsample=0.85,
        random_state=42,
    )
    model.fit(X_scaled, y)

    bundle = {"model": model, "scaler": scaler}
    with open(MODEL_PATH, "wb") as f:
        pickle.dump(bundle, f)

    print(f"Model trained and saved to {MODEL_PATH}")
    return bundle


def load_model():
    if os.path.exists(MODEL_PATH):
        with open(MODEL_PATH, "rb") as f:
            return pickle.load(f)
    return train_model()


def predict_score(features: dict, bundle: dict) -> float:
    """Predict drama score (0–100) from a feature dict."""
    vec = np.array([[
        features.get("typing_speed", 0),
        features.get("keypress_rate", 0),
        features.get("backspace_rate", 0),
        features.get("pause_score", 0),
        features.get("typing_accel", 0),
        features.get("mouse_velocity", 0),
        features.get("mouse_accel", 0),
        features.get("click_rate", 0),
        features.get("movement_activity", 0),
        features.get("idle_time", 5),
    ]])
    X_scaled = bundle["scaler"].transform(vec)
    score = bundle["model"].predict(X_scaled)[0]
    return float(np.clip(score, 0, 100))


def apply_baseline(raw_score: float, baseline: dict | None) -> float:
    """
    Shift the raw score based on deviation from calibrated baseline.
    baseline = {"mean": float, "std": float}
    """
    if not baseline or baseline.get("mean", 0) == 0:
        return raw_score

    mean = baseline["mean"] * 100  # baseline stores 0–1 scalar, convert to score scale
    std  = max(baseline.get("std", 0.05) * 100, 3.0)

    # Map raw score relative to baseline
    deviation_sigma = (raw_score - mean) / std
    # Center at 50 + 15 * sigma, clamp to 0–100
    adjusted = 50 + deviation_sigma * 15
    return float(np.clip(adjusted, 0, 100))

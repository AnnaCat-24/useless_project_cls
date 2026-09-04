/**
 * useDramaScore – converts behavioral features into a 0–100 drama score.
 * Tries the ML backend; falls back to a local heuristic if unavailable.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

const SMOOTH_ALPHA = 0.35; // exponential smoothing — higher = more reactive
const BACKEND_URL = '/api/score';

export const DRAMA_LEVELS = [
  { min: 0,  max: 20,  label: 'CALM',      text: 'ANOTHER ORDINARY DAY',    color: '#4a9eff' },
  { min: 20, max: 40,  label: 'FOCUSED',   text: 'THE WORK BEGINS',          color: '#7bc67e' },
  { min: 40, max: 60,  label: 'TENSE',     text: 'SOMETHING IS HAPPENING',   color: '#f0c040' },
  { min: 60, max: 80,  label: 'INTENSE',   text: 'THE DEADLINE APPROACHES',  color: '#f07030' },
  { min: 80, max: 101, label: 'CINEMATIC', text: 'THE DECISION MUST BE MADE',color: '#e84070' },
];

export function getDramaLevel(score) {
  return DRAMA_LEVELS.find(l => score >= l.min && score < l.max) || DRAMA_LEVELS[0];
}

export function useDramaScore({ baseline }) {
  const [score, setScore] = useState(0);
  const [backendAvailable, setBackendAvailable] = useState(null);
  const smoothedRef = useRef(0);
  const probeRef = useRef(false);

  // Probe backend once on mount
  useEffect(() => {
    if (probeRef.current) return;
    probeRef.current = true;
    fetch('/api/health', { signal: AbortSignal.timeout(2000) })
      .then(r => r.ok ? setBackendAvailable(true) : setBackendAvailable(false))
      .catch(() => setBackendAvailable(false));
  }, []);

  const computeLocal = useCallback((features, baseline) => {
    const {
      typing_speed, keypress_rate, backspace_rate,
      mouse_velocity, click_rate, movement_activity,
      idle_time, pause_score, typing_accel, rhythm_score,
      // Camera features (optional — only present when webcam is on)
      head_movement, mouth_open, head_tilt,
    } = features;

    // ── Typing path (drives up to ~70 on its own) ─────────────────
    const normTyping    = Math.min(typing_speed / 60, 1);
    const normKeyRate   = Math.min(keypress_rate / 4, 1);
    const normBackspace = Math.min(backspace_rate / 1.5, 1);
    const normRhythm    = rhythm_score || 0;
    const normAccel     = typing_accel || 0;
    const normPause     = 1 - pause_score;

    const typingScore = (
      normTyping    * 0.35 +
      normKeyRate   * 0.25 +
      normBackspace * 0.10 +
      normRhythm    * 0.15 +
      normAccel     * 0.05 +
      normPause     * 0.10
    );

    // ── Mouse path (amplifies typing) ─────────────────────────────
    const normMouseVel = Math.min(mouse_velocity / 400, 1);
    const normClicks   = Math.min(click_rate / 2, 1);
    const normMovement = movement_activity;
    const normActive   = 1 - Math.min(idle_time / 6, 1);

    const mouseScore = (
      normMouseVel * 0.50 +
      normClicks   * 0.20 +
      normMovement * 0.20 +
      normActive   * 0.10
    );

    // ── Camera / emotion path (bonus boost when webcam is on) ──────
    // head_movement: fast head movement = agitation/intensity
    // mouth_open: open mouth = surprise/reaction/talking
    // head_tilt: leaning in = engagement
    let cameraScore = 0;
    let hasCameraData = false;
    if (head_movement != null) {
      hasCameraData = true;
      const normHeadMove = Math.min(head_movement / 8, 1);   // 8 = very active
      const normMouth    = Math.min((mouth_open || 0) / 4, 1); // 4 = wide open
      const normTilt     = Math.min((head_tilt || 0) * 5, 1);  // normalise tilt
      cameraScore = normHeadMove * 0.55 + normMouth * 0.30 + normTilt * 0.15;
    }

    // Weighted blend — camera adds up to 20 bonus points on top
    let raw;
    if (hasCameraData) {
      raw = typingScore * 0.60 + mouseScore * 0.20 + cameraScore * 0.20;
    } else {
      raw = typingScore * 0.70 + mouseScore * 0.30;
    }

    // Apply baseline deviation if calibrated
    if (baseline && baseline.mean > 0) {
      const deviation = (raw - baseline.mean) / Math.max(baseline.std, 0.05);
      raw = 0.5 + deviation * 0.25;
    }

    return Math.max(0, Math.min(100, raw * 100));
  }, []);

  const processFeatures = useCallback(async (features) => {
    let rawScore;

    if (backendAvailable === true) {
      try {
        const res = await fetch(BACKEND_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ features, baseline }),
          signal: AbortSignal.timeout(1000),
        });
        if (res.ok) {
          const data = await res.json();
          rawScore = data.score;
        } else {
          rawScore = computeLocal(features, baseline);
        }
      } catch {
        rawScore = computeLocal(features, baseline);
      }
    } else {
      rawScore = computeLocal(features, baseline);
    }

    // Exponential smoothing
    smoothedRef.current = smoothedRef.current + SMOOTH_ALPHA * (rawScore - smoothedRef.current);
    setScore(Math.round(smoothedRef.current));
  }, [backendAvailable, baseline, computeLocal]);

  const forceScore = useCallback((value) => {
    smoothedRef.current = value;
    setScore(Math.round(value));
  }, []);

  return { score, processFeatures, forceScore, backendAvailable };
}

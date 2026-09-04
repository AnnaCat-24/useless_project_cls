/**
 * useTelemetry – keyboard and mouse behavioral tracking.
 * IMPORTANT: Never captures actual key values, only timing/rate metadata.
 */
import { useEffect, useRef, useCallback } from 'react';

const WINDOW_MS = 3000;       // tighter 3-second rolling window — reacts faster
const UPDATE_INTERVAL_MS = 500; // emit every 500ms

export function useTelemetry({ onFeatures, enabled = true }) {
  const keyTimes = useRef([]);
  const backspaceTimes = useRef([]);
  const mouseMoves = useRef([]);
  const clickTimes = useRef([]);
  const lastKeyTime = useRef(0);
  const timerRef = useRef(null);

  const now = () => performance.now();

  const prune = (arr) => {
    const cutoff = now() - WINDOW_MS;
    while (arr.length > 0 && arr[0] < cutoff) arr.shift();
  };
  const pruneObjs = (arr) => {
    const cutoff = now() - WINDOW_MS;
    while (arr.length > 0 && arr[0].t < cutoff) arr.shift();
  };

  const onKeyDown = useCallback((e) => {
    const t = now();
    keyTimes.current.push(t);
    if (e.key === 'Backspace') backspaceTimes.current.push(t);
    lastKeyTime.current = t;
  }, []);

  const onMouseMove = useCallback((e) => {
    mouseMoves.current.push({ t: now(), x: e.clientX, y: e.clientY });
  }, []);

  const onClick = useCallback(() => {
    clickTimes.current.push(now());
  }, []);

  const computeFeatures = useCallback(() => {
    const t = now();
    const winSec = WINDOW_MS / 1000;

    prune(keyTimes.current);
    prune(backspaceTimes.current);
    prune(clickTimes.current);
    pruneObjs(mouseMoves.current);

    // ── Typing features ──────────────────────────────────────────
    const keyCount = keyTimes.current.length;
    const keystrokesPerSec = keyCount / winSec;
    const wpm = Math.round(keystrokesPerSec * 60 / 5);
    const backspaceRate = backspaceTimes.current.length / winSec;

    // Pause: seconds since last keypress (capped at window)
    const timeSinceLastKey = lastKeyTime.current > 0
      ? Math.min((t - lastKeyTime.current) / 1000, winSec)
      : winSec;
    const pauseScore = timeSinceLastKey / winSec; // 0 = just typed, 1 = silent

    // Typing rhythm — inter-key interval variance (low = steady, high = erratic)
    let rhythmScore = 0;
    if (keyTimes.current.length >= 3) {
      const intervals = [];
      for (let i = 1; i < keyTimes.current.length; i++) {
        intervals.push(keyTimes.current[i] - keyTimes.current[i - 1]);
      }
      const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const variance = intervals.reduce((a, b) => a + (b - mean) ** 2, 0) / intervals.length;
      // High variance = erratic/intense typing; normalize to 0–1
      rhythmScore = Math.min(Math.sqrt(variance) / 200, 1);
    }

    // Typing acceleration (are you speeding up?)
    const half = Math.floor(keyTimes.current.length / 2);
    const firstHalfRate = half > 0 ? half / (winSec / 2) : 0;
    const secondHalfRate = (keyTimes.current.length - half) / (winSec / 2);
    const typingAccel = Math.max(secondHalfRate - firstHalfRate, 0) / 5;

    // ── Mouse features ───────────────────────────────────────────
    const moves = mouseMoves.current;
    let totalDist = 0;
    let totalTime = 0;
    for (let i = 1; i < moves.length; i++) {
      const dx = moves[i].x - moves[i - 1].x;
      const dy = moves[i].y - moves[i - 1].y;
      totalDist += Math.sqrt(dx * dx + dy * dy);
      totalTime += (moves[i].t - moves[i - 1].t) / 1000;
    }
    const mouseVelocity = totalTime > 0 ? totalDist / totalTime : 0;

    let mouseAccel = 0;
    if (moves.length >= 4) {
      const mid = Math.floor(moves.length / 2);
      const v1 = _segVelocity(moves.slice(0, mid));
      const v2 = _segVelocity(moves.slice(mid));
      mouseAccel = v2 - v1;
    }

    const clickRate = clickTimes.current.length / winSec;

    // Activity: how many move samples in the window (50 = fully active)
    const movementActivity = Math.min(moves.length / 30, 1);

    const timeSinceLastMove = moves.length > 0
      ? (t - moves[moves.length - 1].t) / 1000
      : 10;
    const idleTime = Math.min(timeSinceLastMove, 10);

    return {
      typing_speed:      Math.min(wpm, 200),
      keypress_rate:     Math.min(keystrokesPerSec, 20),
      backspace_rate:    Math.min(backspaceRate, 5),
      pause_score:       pauseScore,
      typing_accel:      Math.min(typingAccel, 1),
      rhythm_score:      rhythmScore,          // new
      mouse_velocity:    Math.min(mouseVelocity, 2000),
      mouse_accel:       mouseAccel,
      click_rate:        Math.min(clickRate, 5),
      movement_activity: movementActivity,
      idle_time:         idleTime,
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    timerRef.current = setInterval(() => {
      if (onFeatures) onFeatures(computeFeatures());
    }, UPDATE_INTERVAL_MS);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      clearInterval(timerRef.current);
    };
  }, [enabled, onKeyDown, onMouseMove, onClick, computeFeatures, onFeatures]);

  return { computeFeatures };
}

function _segVelocity(moves) {
  if (moves.length < 2) return 0;
  let dist = 0, time = 0;
  for (let i = 1; i < moves.length; i++) {
    const dx = moves[i].x - moves[i - 1].x;
    const dy = moves[i].y - moves[i - 1].y;
    dist += Math.sqrt(dx * dx + dy * dy);
    time += (moves[i].t - moves[i - 1].t) / 1000;
  }
  return time > 0 ? dist / time : 0;
}

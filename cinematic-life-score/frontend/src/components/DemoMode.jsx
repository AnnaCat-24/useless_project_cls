/**
 * DemoMode – automatically drives the drama score through all levels.
 * CALM → FOCUSED → TENSE → INTENSE → CINEMATIC → COMPLETION
 */
import { useEffect, useRef } from 'react';

const DEMO_SEQUENCE = [
  { score: 5,  durationMs: 3000,  label: 'CALM' },
  { score: 30, durationMs: 3500,  label: 'FOCUSED' },
  { score: 50, durationMs: 3500,  label: 'TENSE' },
  { score: 72, durationMs: 3500,  label: 'INTENSE' },
  { score: 90, durationMs: 4000,  label: 'CINEMATIC' },
  // Completion is triggered by parent via onComplete
];

const RAMP_INTERVAL_MS = 80;

export default function DemoMode({ onScore, onComplete, active }) {
  const timerRef = useRef(null);
  const currentScoreRef = useRef(0);
  const abortRef = useRef(false);

  useEffect(() => {
    if (!active) return;
    abortRef.current = false;

    const runSequence = async () => {
      for (const step of DEMO_SEQUENCE) {
        if (abortRef.current) break;
        await rampTo(step.score);
        await wait(step.durationMs);
      }
      if (!abortRef.current) {
        // Trigger completion
        await rampTo(99);
        await wait(500);
        if (!abortRef.current && onComplete) onComplete();
      }
    };

    runSequence();

    return () => {
      abortRef.current = true;
      clearTimeout(timerRef.current);
    };
  }, [active]);

  const rampTo = (target) => new Promise((resolve) => {
    const step = () => {
      if (abortRef.current) { resolve(); return; }
      const current = currentScoreRef.current;
      const diff = target - current;
      if (Math.abs(diff) < 0.5) {
        currentScoreRef.current = target;
        onScore(target);
        resolve();
        return;
      }
      const next = current + diff * 0.1;
      currentScoreRef.current = next;
      onScore(next);
      timerRef.current = setTimeout(step, RAMP_INTERVAL_MS);
    };
    step();
  });

  const wait = (ms) => new Promise((resolve) => {
    timerRef.current = setTimeout(resolve, ms);
  });

  return null; // renders nothing, just drives score
}

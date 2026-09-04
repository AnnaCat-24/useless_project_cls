/**
 * useCalibration – collects 25 seconds of baseline behavioral data
 * and computes mean/std so the drama score can measure deviation.
 */
import { useState, useRef, useCallback } from 'react';

const CALIBRATION_DURATION_MS = 25000;
const SAMPLE_INTERVAL_MS = 750;

export function useCalibration() {
  const [phase, setPhase] = useState('idle'); // idle | running | done
  const [progress, setProgress] = useState(0); // 0–100
  const [baseline, setBaseline] = useState(null);
  const samplesRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(0);

  // Convert raw features to a single activity scalar for baselining
  const featureToScalar = (features) => {
    const { typing_speed, keypress_rate, mouse_velocity, movement_activity, idle_time } = features;
    return (
      Math.min(typing_speed / 120, 1) * 0.3 +
      Math.min(keypress_rate / 8, 1) * 0.2 +
      Math.min(mouse_velocity / 800, 1) * 0.3 +
      movement_activity * 0.1 +
      (1 - Math.min(idle_time / 8, 1)) * 0.1
    );
  };

  const start = useCallback((computeFeatures) => {
    if (phase === 'running') return;
    setPhase('running');
    setProgress(0);
    samplesRef.current = [];
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min((elapsed / CALIBRATION_DURATION_MS) * 100, 100);
      setProgress(pct);

      const features = computeFeatures();
      samplesRef.current.push(featureToScalar(features));

      if (elapsed >= CALIBRATION_DURATION_MS) {
        clearInterval(timerRef.current);
        const samples = samplesRef.current;
        const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
        const variance = samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
        const std = Math.sqrt(variance);
        setBaseline({ mean, std, samples: samples.length });
        setPhase('done');
        setProgress(100);
      }
    }, SAMPLE_INTERVAL_MS);
  }, [phase]);

  const reset = useCallback(() => {
    clearInterval(timerRef.current);
    setPhase('idle');
    setProgress(0);
    setBaseline(null);
    samplesRef.current = [];
  }, []);

  return { phase, progress, baseline, start, reset };
}

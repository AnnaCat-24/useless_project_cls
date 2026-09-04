import { useState, useCallback, useEffect, useRef } from 'react';
import { useTelemetry } from './hooks/useTelemetry';
import { useDramaScore, getDramaLevel } from './hooks/useDramaScore';
import { useCalibration } from './hooks/useCalibration';
import { useWebcam } from './hooks/useWebcam';
import { musicEngine } from './engine/musicEngine';
import DramaMeter from './components/DramaMeter';
import LayerDisplay from './components/LayerDisplay';
import CalibrationModal from './components/CalibrationModal';
import DemoMode from './components/DemoMode';
import TypingArea from './components/TypingArea';
import CameraView from './components/CameraView';
import LiveDebug from './components/LiveDebug';
import SessionSummary from './components/SessionSummary';
import './App.css';

export default function App() {
  const [isPlaying, setIsPlaying]         = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [webcamEnabled, setWebcamEnabled] = useState(false);
  const [isDemoMode, setIsDemoMode]       = useState(false);
  const [layerGains, setLayerGains]       = useState({ piano:0, strings:0, percussion:0, brass:0, climax:0 });
  const [currentFeatures, setCurrentFeatures] = useState(null);
  const [climaxState, setClimaxState]     = useState('idle'); // idle|building|resolving|complete
  const [particles, setParticles]         = useState([]);

  // Session result — shown after STOP or COMPLETE THE SCENE
  const [sessionResult, setSessionResult] = useState(null);
  // { peakScore, peakLevel, features, trigger: 'stop'|'complete' }

  const peakScoreRef    = useRef(0);
  const peakFeaturesRef = useRef(null);

  const calibration = useCalibration();
  const { score, processFeatures, forceScore, backendAvailable } = useDramaScore({
    baseline: calibration.baseline,
  });

  const dramLevel = getDramaLevel(score);

  // Always keep refs current — no stale closures
  const currentFeaturesRef = useRef(null);
  useEffect(() => { currentFeaturesRef.current = currentFeatures; }, [currentFeatures]);

  // Track peak score live
  useEffect(() => {
    if (isPlaying && score > peakScoreRef.current) {
      peakScoreRef.current = score;
      peakFeaturesRef.current = currentFeaturesRef.current;
    }
  }, [score, isPlaying]);

  // Particles above 60
  useEffect(() => {
    if (score > 60 && isPlaying && climaxState === 'idle') {
      const t = setInterval(() => {
        setParticles(p => [
          ...p.slice(-30),
          { id: Date.now(), x: Math.random() * 100, delay: Math.random() * 0.5 },
        ]);
      }, 280);
      return () => clearInterval(t);
    }
  }, [score, isPlaying, climaxState]);

  const { computeFeatures } = useTelemetry({
    onFeatures: useCallback((f) => {
      if (!isDemoMode) { setCurrentFeatures(f); processFeatures(f); }
    }, [isDemoMode, processFeatures]),
    enabled: isPlaying && !isDemoMode,
  });

  useEffect(() => { musicEngine.onLayerChange = (g) => setLayerGains(g); }, []);

  useEffect(() => {
    if (isPlaying && climaxState === 'idle') musicEngine.setScore(score);
  }, [score, isPlaying, climaxState]);

  // ── Actions ──────────────────────────────────────────────────────────────

  const handleStart = async () => {
    peakScoreRef.current    = 0;
    peakFeaturesRef.current = null;
    setSessionResult(null);
    await musicEngine.start();
    setIsPlaying(true);
  };

  const handleStop = () => {
    musicEngine.stop();
    setIsPlaying(false);
    setIsDemoMode(false);
    // Show session summary with whatever peak was reached
    setSessionResult({
      peakScore:   peakScoreRef.current,
      peakLevel:   getDramaLevel(peakScoreRef.current),
      features:    peakFeaturesRef.current,
      trigger:     'stop',
    });
    forceScore(0);
  };

  const handleCompleteScene = async () => {
    if (score < 50) return;
    const locked = Math.max(peakScoreRef.current, score);
    setClimaxState('building');
    musicEngine.setScore(99);
    forceScore(99);
    await new Promise(r => setTimeout(r, 300));
    musicEngine.triggerClimax(() => {
      setClimaxState('complete');
      forceScore(0);
      setSessionResult({
        peakScore:  locked,
        peakLevel:  getDramaLevel(locked),
        features:   peakFeaturesRef.current,
        trigger:    'complete',
      });
    });
    setClimaxState('resolving');
  };

  const handleDismissResult = () => {
    setSessionResult(null);
    setClimaxState('idle');
  };

  const handleDemoMode = async () => {
    if (!isPlaying) await handleStart();
    setIsDemoMode(true);
  };

  const handleDemoScore = useCallback((s) => {
    forceScore(s); musicEngine.setScore(s);
  }, [forceScore]);

  const handleDemoComplete = useCallback(async () => {
    setClimaxState('building');
    musicEngine.setScore(99);
    forceScore(99);
    await new Promise(r => setTimeout(r, 300));
    musicEngine.triggerClimax(() => {
      setClimaxState('complete');
      forceScore(0);
      setSessionResult({ peakScore: 99, peakLevel: getDramaLevel(99), features: null, trigger: 'complete' });
      setTimeout(() => setIsDemoMode(false), 8000);
    });
    setClimaxState('resolving');
  }, [forceScore]);

  const { status: webcamStatus, stream: webcamStream, faceFeatures } = useWebcam({
    enabled: webcamEnabled && isPlaying,
    onFeatures: useCallback((wf) => {
      if (!isDemoMode) {
        const merged = currentFeaturesRef.current ? { ...currentFeaturesRef.current, ...wf } : wf;
        setCurrentFeatures(merged);
        processFeatures(merged);
      }
    }, [isDemoMode, processFeatures]),
  });

  const canComplete = score >= 50 && isPlaying && climaxState === 'idle';

  return (
    <div className={`app ${dramLevel.label.toLowerCase()} ${climaxState !== 'idle' ? 'climax-active' : ''}`}>
      <div className="film-grain" />

      {particles.map(p => (
        <div key={p.id} className="particle" style={{ left:`${p.x}%`, animationDelay:`${p.delay}s` }} />
      ))}

      {isDemoMode && <div className="demo-banner">◉ DEMO MODE — SIMULATED DATA</div>}
      {backendAvailable === false && isPlaying && <div className="backend-status">ML OFFLINE · LOCAL MODE</div>}

      <main className="main-container">

        {/* ── Header ── */}
        <header className="app-header">
          <div className="title-ornament">— — —</div>
          <h1 className="app-title">CINEMATIC LIFE SCORE</h1>
          <div className="title-ornament">— — —</div>
        </header>

        {/* ── LEFT COLUMN ── */}
        <div className="body-columns">
        <div className="col-left">
          <section className="drama-section">
            <p className="drama-label">DRAMA LEVEL</p>
            <DramaMeter score={score} level={dramLevel} climaxState={climaxState} />
            <p className="scene-text">"{dramLevel.text}"</p>
          </section>

          <LayerDisplay gains={layerGains} playing={isPlaying} score={score} />

          {/* Controls */}
          <div className="controls">
            {!isPlaying ? (
              <button className="btn btn-primary" onClick={handleStart}>▶ START SOUNDTRACK</button>
            ) : (
              <button className="btn btn-secondary" onClick={handleStop}>■ STOP</button>
            )}

            <button
              className={`btn btn-complete ${canComplete ? 'btn-complete--active' : ''}`}
              onClick={handleCompleteScene}
              disabled={!canComplete}
            >
              🎬 COMPLETE THE SCENE
            </button>

            <div className="btn-row">
              <button className="btn btn-outline" onClick={() => setShowCalibration(true)} disabled={!isPlaying || isDemoMode}>
                ◎ CALIBRATE
              </button>
              <button
                className={`btn btn-outline ${webcamEnabled ? 'btn-outline--active' : ''}`}
                onClick={() => setWebcamEnabled(v => !v)}
                disabled={!isPlaying}
              >
                {webcamEnabled ? '📷 CAMERA ON' : '📷 ENABLE CAMERA'}
              </button>
            </div>

            <button className="btn btn-demo" onClick={isDemoMode ? handleStop : handleDemoMode}>
              {isDemoMode ? '✕ EXIT DEMO' : '▷ DEMO MODE'}
            </button>
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="col-right">
          <TypingArea disabled={!isPlaying || isDemoMode} />

          {webcamEnabled && (
            <CameraView stream={webcamStream} status={webcamStatus} faceFeatures={faceFeatures} />
          )}

          <LiveDebug
            features={currentFeatures}
            faceFeatures={webcamEnabled ? faceFeatures : null}
            visible={isPlaying && !isDemoMode}
          />
        </div>{/* col-right */}
        </div>{/* body-columns */}

      </main>

      {/* ── Session summary — shown after STOP or COMPLETE ── */}
      {sessionResult && (
        <SessionSummary
          result={sessionResult}
          onDismiss={handleDismissResult}
          onRestart={() => { handleDismissResult(); handleStart(); }}
        />
      )}

      {showCalibration && (
        <CalibrationModal calibration={calibration} computeFeatures={computeFeatures} onClose={() => setShowCalibration(false)} />
      )}

      {isDemoMode && (
        <DemoMode onScore={handleDemoScore} onComplete={handleDemoComplete} active={isDemoMode} />
      )}
    </div>
  );
}

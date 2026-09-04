import './CalibrationModal.css';

export default function CalibrationModal({ calibration, computeFeatures, onClose }) {
  const { phase, progress, baseline, start, reset } = calibration;

  const handleStart = () => start(computeFeatures);

  const handleClose = () => {
    if (phase === 'running') return; // don't allow close mid-calibration
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2 className="modal-title">CALIBRATION</h2>
        <p className="modal-subtitle">
          Work normally for 25 seconds. The app will learn your baseline behavior
          and measure drama as deviation from it.
        </p>

        {phase === 'idle' && (
          <>
            <p className="modal-hint">Type, move your mouse — just work normally.</p>
            <button className="btn btn-primary" onClick={handleStart}>
              ▶ BEGIN CALIBRATION
            </button>
          </>
        )}

        {phase === 'running' && (
          <div className="calibration-progress">
            <div className="cal-bar-wrap">
              <div className="cal-bar" style={{ width: `${progress}%` }} />
            </div>
            <p className="cal-progress-text">{Math.round(progress)}%</p>
            <p className="cal-hint">Keep working normally…</p>
          </div>
        )}

        {phase === 'done' && (
          <div className="calibration-done">
            <div className="cal-check">✓</div>
            <p className="cal-done-text">Calibration complete</p>
            <p className="cal-baseline">
              Baseline activity: {(baseline.mean * 100).toFixed(1)}%
              &nbsp;·&nbsp; Samples: {baseline.samples}
            </p>
            <div className="modal-btn-row">
              <button className="btn btn-outline" onClick={reset}>Recalibrate</button>
              <button className="btn btn-primary" onClick={handleClose}>Close</button>
            </div>
          </div>
        )}

        {phase !== 'running' && (
          <button className="modal-close" onClick={handleClose}>✕</button>
        )}
      </div>
    </div>
  );
}

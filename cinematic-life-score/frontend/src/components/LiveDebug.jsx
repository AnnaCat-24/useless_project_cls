import './LiveDebug.css';

const KEYBOARD_BARS = [
  { key: 'typing_speed',      label: 'WPM',        max: 120, unit: ' wpm', color: '#4a9eff' },
  { key: 'keypress_rate',     label: 'KEY RATE',   max: 10,  unit: '/s',   color: '#7bc67e' },
  { key: 'backspace_rate',    label: 'BACKSPACE',  max: 3,   unit: '/s',   color: '#f0c040' },
  { key: 'mouse_velocity',    label: 'MOUSE VEL',  max: 800, unit: ' px/s',color: '#f07030' },
  { key: 'movement_activity', label: 'ACTIVITY',   max: 1,   unit: '',     color: '#e84070', pct: true },
  { key: 'idle_time',         label: 'IDLE',       max: 8,   unit: 's',    color: '#9b8fc7', invert: true },
];

const CAMERA_BARS = [
  { key: 'head_movement', label: 'HEAD MOVE', max: 8,  unit: '',  color: '#c084fc' },
  { key: 'mouth_open',    label: 'MOUTH',     max: 4,  unit: '',  color: '#f472b6' },
  { key: 'head_tilt',     label: 'HEAD TILT', max: 0.2,unit: '',  color: '#fb923c' },
];

export default function LiveDebug({ features, faceFeatures, visible }) {
  if (!visible || !features) return null;
  const hasCam = faceFeatures != null;

  return (
    <div className="live-debug">
      <div className="debug-title">◈ LIVE DETECTION</div>

      <div className="debug-section-label">⌨ KEYBOARD + MOUSE</div>
      {KEYBOARD_BARS.map(({ key, label, max, unit, color, invert, pct }) => {
        const raw = features[key] ?? 0;
        const fraction = invert ? (max - raw) / max : raw / max;
        const barPct = Math.min(fraction * 100, 100);
        const display = pct
          ? (raw * 100).toFixed(0) + '%'
          : key === 'typing_speed'
          ? Math.round(raw)
          : raw.toFixed(1);
        return (
          <div key={key} className="debug-row">
            <span className="debug-label">{label}</span>
            <div className="debug-bar-wrap">
              <div className="debug-bar" style={{ width: `${barPct}%`, background: color }} />
            </div>
            <span className="debug-value" style={{ color }}>{display}{unit}</span>
          </div>
        );
      })}

      {hasCam && (
        <>
          <div className="debug-section-label debug-section-label--cam">📷 CAMERA · EMOTION</div>
          {CAMERA_BARS.map(({ key, label, max, unit, color }) => {
            const raw = faceFeatures[key] ?? 0;
            const barPct = Math.min((raw / max) * 100, 100);
            return (
              <div key={key} className="debug-row">
                <span className="debug-label">{label}</span>
                <div className="debug-bar-wrap">
                  <div className="debug-bar" style={{ width: `${barPct}%`, background: color }} />
                </div>
                <span className="debug-value" style={{ color }}>{raw.toFixed(2)}{unit}</span>
              </div>
            );
          })}
          <div className="debug-cam-note">
            Camera contributes 20% to drama score
          </div>
        </>
      )}
    </div>
  );
}

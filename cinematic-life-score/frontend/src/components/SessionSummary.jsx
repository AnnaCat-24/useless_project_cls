import './SessionSummary.css';

const LEVEL_GRADIENTS = {
  CALM:      ['#4a9eff', '#7bc6ff'],
  FOCUSED:   ['#7bc67e', '#a8edaa'],
  TENSE:     ['#f0c040', '#ffe080'],
  INTENSE:   ['#f07030', '#ff9a60'],
  CINEMATIC: ['#e84070', '#ff80a0'],
};

const FEATURE_ROWS = [
  { key: 'typing_speed',      label: 'Typing Speed',    fmt: v => `${Math.round(v)} WPM`,             max: 120 },
  { key: 'keypress_rate',     label: 'Key Rate',        fmt: v => `${v.toFixed(1)} /s`,               max: 10  },
  { key: 'backspace_rate',    label: 'Corrections',     fmt: v => `${v.toFixed(1)} /s`,               max: 3   },
  { key: 'mouse_velocity',    label: 'Mouse Velocity',  fmt: v => `${Math.round(v)} px/s`,            max: 800 },
  { key: 'movement_activity', label: 'Mouse Activity',  fmt: v => `${Math.round(v * 100)}%`,          max: 1   },
  { key: 'rhythm_score',      label: 'Typing Rhythm',   fmt: v => v > 0.6 ? 'Erratic' : v > 0.3 ? 'Varied' : 'Steady', max: 1 },
  { key: 'idle_time',         label: 'Idle Time',       fmt: v => `${v.toFixed(1)}s`,                 max: 10, invert: true },
];

const COMPLETION_MESSAGES = {
  CALM:      'A quiet moment in the story.',
  FOCUSED:   'Steady. Deliberate. The work was done.',
  TENSE:     'The pressure built. You held it together.',
  INTENSE:   'The deadline was real. You felt every second.',
  CINEMATIC: 'The decision was made. History recorded.',
};

export default function SessionSummary({ result, onDismiss, onRestart }) {
  const { peakScore, peakLevel, features, trigger } = result;
  const [c1, c2] = LEVEL_GRADIENTS[peakLevel.label] || ['#fff', '#aaa'];
  const gradient = `linear-gradient(135deg, ${c1}, ${c2})`;
  const isComplete = trigger === 'complete';

  return (
    <div className="summary-overlay" onClick={onDismiss}>
      <div className="summary-panel" onClick={e => e.stopPropagation()}>

        {/* Top — title */}
        <div className="summary-header">
          {isComplete ? (
            <p className="summary-supertitle">MISSION ACCOMPLISHED</p>
          ) : (
            <p className="summary-supertitle">SESSION COMPLETE</p>
          )}
          <p className="summary-tagline">
            "{COMPLETION_MESSAGES[peakLevel.label]}"
          </p>
        </div>

        {/* Centre — big score */}
        <div className="summary-score-block">
          <p className="summary-score-label">PEAK DRAMA SCORE</p>
          <div className="summary-score-ring" style={{ '--level-color': peakLevel.color }}>
            <span className="summary-score-number" style={{ color: peakLevel.color }}>
              {peakScore}
            </span>
          </div>
          <p className="summary-level-badge" style={{ color: peakLevel.color }}>
            {peakLevel.label}
          </p>
          {/* Score bar */}
          <div className="summary-bar-wrap">
            <div
              className="summary-bar-fill"
              style={{ width: `${peakScore}%`, background: gradient }}
            />
          </div>
          <div className="summary-bar-ticks">
            {['0','25','50','75','100'].map(t => (
              <span key={t}>{t}</span>
            ))}
          </div>
        </div>

        {/* Bottom — feature breakdown */}
        {features && (
          <div className="summary-metrics">
            <p className="summary-metrics-title">HOW YOU GOT THERE</p>
            <div className="summary-metrics-grid">
              {FEATURE_ROWS.map(({ key, label, fmt, max, invert }) => {
                const raw = features[key] ?? 0;
                const pct = Math.min(
                  invert ? ((max - raw) / max) * 100 : (raw / max) * 100,
                  100
                );
                return (
                  <div key={key} className="summary-metric-row">
                    <span className="sm-label">{label}</span>
                    <div className="sm-bar-wrap">
                      <div
                        className="sm-bar-fill"
                        style={{ width: `${pct}%`, background: gradient }}
                      />
                    </div>
                    <span className="sm-value" style={{ color: peakLevel.color }}>
                      {fmt(raw)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="summary-actions">
          <button className="summary-btn summary-btn--restart" onClick={onRestart}>
            ↺ NEW SESSION
          </button>
          <button className="summary-btn summary-btn--close" onClick={onDismiss}>
            ✕ CLOSE
          </button>
        </div>

      </div>
    </div>
  );
}

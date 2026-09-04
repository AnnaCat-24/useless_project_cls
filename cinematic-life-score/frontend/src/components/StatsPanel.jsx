import './StatsPanel.css';

export default function StatsPanel({ features, baseline }) {
  const { typing_speed, mouse_velocity, movement_activity } = features || {};

  const wpm = Math.round(typing_speed || 0);
  const mouseLevel = mouseLevel_(mouse_velocity || 0);
  const deviation = baseline
    ? computeDeviation(features, baseline)
    : null;

  return (
    <div className="stats-panel">
      <div className="stat">
        <span className="stat-label">Typing</span>
        <span className="stat-value">{wpm} WPM</span>
      </div>
      <div className="stat-divider">·</div>
      <div className="stat">
        <span className="stat-label">Mouse</span>
        <span className="stat-value">{mouseLevel}</span>
      </div>
      {deviation !== null && (
        <>
          <div className="stat-divider">·</div>
          <div className="stat">
            <span className="stat-label">Deviation</span>
            <span className={`stat-value ${deviation > 30 ? 'stat-value--hot' : ''}`}>
              {deviation > 0 ? '+' : ''}{deviation}%
            </span>
          </div>
        </>
      )}
    </div>
  );
}

function mouseLevel_(velocity) {
  if (velocity < 50) return 'Idle';
  if (velocity < 200) return 'Low';
  if (velocity < 500) return 'Medium';
  if (velocity < 900) return 'High';
  return 'Frantic';
}

function computeDeviation(features, baseline) {
  if (!baseline || baseline.mean === 0) return null;
  const { typing_speed, keypress_rate, mouse_velocity, movement_activity, idle_time } = features;
  const current = (
    Math.min(typing_speed / 120, 1) * 0.3 +
    Math.min(keypress_rate / 8, 1) * 0.2 +
    Math.min(mouse_velocity / 800, 1) * 0.3 +
    movement_activity * 0.1 +
    (1 - Math.min(idle_time / 8, 1)) * 0.1
  );
  const pct = Math.round(((current - baseline.mean) / Math.max(baseline.mean, 0.01)) * 100);
  return pct;
}

import { getDramaLevel } from '../hooks/useDramaScore';
import './MissionComplete.css';

export default function MissionComplete({ score, onDismiss }) {
  const level = getDramaLevel(score);

  // Gradient colour matching the drama level
  const gradient = {
    CALM:      'linear-gradient(90deg, #4a9eff, #7bc6ff)',
    FOCUSED:   'linear-gradient(90deg, #7bc67e, #a8edaa)',
    TENSE:     'linear-gradient(90deg, #f0c040, #ffe080)',
    INTENSE:   'linear-gradient(90deg, #f07030, #ff9a60)',
    CINEMATIC: 'linear-gradient(90deg, #e84070, #ff80a0)',
  }[level.label] || 'linear-gradient(90deg, #fff, #aaa)';

  return (
    <div className="mission-complete" onClick={onDismiss} role="dialog" aria-modal="true">
      <div className="mission-inner" onClick={e => e.stopPropagation()}>
        <p className="mission-title">MISSION ACCOMPLISHED</p>

        <div className="mission-score-card">
          <span className="mission-score-label">PEAK DRAMA SCORE</span>

          <span
            className="mission-score-number"
            style={{ color: level.color }}
          >
            {score}
          </span>

          <span
            className="mission-score-level"
            style={{ color: level.color }}
          >
            {level.label}
          </span>

          <div className="mission-score-bar">
            <div
              className="mission-score-bar-fill"
              style={{
                width: `${score}%`,
                background: gradient,
              }}
            />
          </div>

          <p className="mission-scene-text">"{level.text}"</p>
        </div>

        <button className="mission-dismiss" onClick={onDismiss}>
          ✕ CLOSE
        </button>
      </div>
    </div>
  );
}

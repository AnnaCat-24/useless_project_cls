import './LayerDisplay.css';

const LAYERS = [
  { key: 'piano',      emoji: '🎹', label: 'Piano',  threshold: 0  },
  { key: 'strings',    emoji: '🎻', label: 'Strings', threshold: 20 },
  { key: 'percussion', emoji: '🥁', label: 'Drums',  threshold: 40 },
  { key: 'brass',      emoji: '🎺', label: 'Brass',  threshold: 60 },
  { key: 'climax',     emoji: '💥', label: 'Climax', threshold: 80 },
];

export default function LayerDisplay({ gains, playing, score }) {
  return (
    <div className="layer-display">
      {LAYERS.map(({ key, emoji, label, threshold }) => {
        const gain = gains[key] || 0;
        const active = playing && score >= threshold;
        const intensity = Math.round(gain * 100);

        return (
          <div key={key} className={`layer-item ${active ? 'layer-item--active' : ''}`}>
            <div
              className="layer-emoji"
              style={{
                opacity: active ? 0.4 + gain * 0.6 : 0.25,
                transform: active && gain > 0.3
                  ? `scale(${1 + gain * 0.25})`
                  : 'scale(1)',
                filter: active ? `drop-shadow(0 0 ${gain * 12}px currentColor)` : 'none',
              }}
            >
              {emoji}
            </div>
            <div className="layer-bar-wrap">
              <div
                className="layer-bar"
                style={{ height: `${intensity}%`, opacity: active ? 1 : 0.2 }}
              />
            </div>
            <span className="layer-label">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

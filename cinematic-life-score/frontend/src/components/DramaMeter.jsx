import { useEffect, useRef } from 'react';
import './DramaMeter.css';

export default function DramaMeter({ score, level, climaxState }) {
  const canvasRef = useRef(null);
  const scoreRef = useRef(score);
  const frameRef = useRef(null);
  const displayScoreRef = useRef(score);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    const H = canvas.height = canvas.offsetHeight * window.devicePixelRatio;

    const draw = () => {
      // Smooth display
      displayScoreRef.current += (scoreRef.current - displayScoreRef.current) * 0.08;
      const s = displayScoreRef.current;
      const pct = s / 100;

      ctx.clearRect(0, 0, W, H);

      // Background track
      const trackY = H * 0.62;
      const trackH = H * 0.08;
      const trackPad = W * 0.04;
      const trackW = W - trackPad * 2;

      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      roundRect(ctx, trackPad, trackY, trackW, trackH, trackH / 2);
      ctx.fill();

      // Filled portion
      if (pct > 0) {
        const grad = ctx.createLinearGradient(trackPad, 0, trackPad + trackW * pct, 0);
        grad.addColorStop(0, '#4a9eff');
        grad.addColorStop(0.25, '#7bc67e');
        grad.addColorStop(0.5, '#f0c040');
        grad.addColorStop(0.75, '#f07030');
        grad.addColorStop(1, '#e84070');
        ctx.fillStyle = grad;
        roundRect(ctx, trackPad, trackY, trackW * pct, trackH, trackH / 2);
        ctx.fill();

        // Glow
        ctx.shadowBlur = 12;
        ctx.shadowColor = level.color;
        roundRect(ctx, trackPad, trackY, trackW * pct, trackH, trackH / 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Score number
      const fontSize = H * 0.38;
      ctx.font = `900 ${fontSize}px 'Cinzel', serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      // Glow behind number when high
      if (s > 60) {
        ctx.shadowBlur = 30 + (s - 60) * 0.8;
        ctx.shadowColor = level.color;
      }

      const numGrad = ctx.createLinearGradient(0, H * 0.1, 0, H * 0.55);
      numGrad.addColorStop(0, '#ffffff');
      numGrad.addColorStop(1, level.color);
      ctx.fillStyle = numGrad;
      ctx.fillText(Math.round(s), W / 2, H * 0.32);
      ctx.shadowBlur = 0;

      // Level badge
      const badgeFont = H * 0.09;
      ctx.font = `600 ${badgeFont}px 'Cinzel', serif`;
      ctx.fillStyle = level.color;
      ctx.letterSpacing = '4px';
      ctx.fillText(level.label, W / 2, H * 0.55);

      // Tick marks
      ctx.strokeStyle = 'rgba(255,255,255,0.15)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 10; i++) {
        const x = trackPad + (trackW / 10) * i;
        const tickH = i % 5 === 0 ? trackH * 1.8 : trackH * 1.2;
        ctx.beginPath();
        ctx.moveTo(x, trackY - (tickH - trackH) / 2);
        ctx.lineTo(x, trackY + trackH + (tickH - trackH) / 2);
        ctx.stroke();
      }

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [level]);

  return (
    <div className={`drama-meter ${climaxState !== 'idle' ? 'drama-meter--climax' : ''}`}>
      <canvas ref={canvasRef} className="drama-canvas" />
    </div>
  );
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

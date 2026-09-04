import { useEffect, useRef } from 'react';
import './CameraView.css';

export default function CameraView({ stream, status, faceFeatures }) {
  const videoRef = useRef(null);

  // Attach the stream to the video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  if (status === 'off' || status === 'error') return null;

  return (
    <div className="camera-view">
      <div className="camera-header">
        <span className={`camera-dot ${status === 'active' ? 'camera-dot--active' : 'camera-dot--loading'}`} />
        <span className="camera-label">
          {status === 'loading' ? 'INITIALISING CAMERA…' : 'LIVE · ANONYMOUS ANALYSIS'}
        </span>
      </div>

      <div className="camera-frame">
        {/* Actual video feed */}
        <video
          ref={videoRef}
          className="camera-video"
          autoPlay
          playsInline
          muted
          aria-label="Live camera feed for anonymous face movement analysis"
        />

        {/* Overlay grid for cinematic effect */}
        <div className="camera-overlay">
          <div className="camera-corner camera-corner--tl" />
          <div className="camera-corner camera-corner--tr" />
          <div className="camera-corner camera-corner--bl" />
          <div className="camera-corner camera-corner--br" />
          {status === 'active' && <div className="camera-scan-line" />}
        </div>

        {status === 'loading' && (
          <div className="camera-loading">
            <div className="camera-spinner" />
          </div>
        )}
      </div>

      {/* Live face feature readout */}
      {status === 'active' && faceFeatures && (
        <div className="camera-stats">
          <div className="cam-stat">
            <span className="cam-stat-label">Head Move</span>
            <span className="cam-stat-bar">
              <span
                className="cam-stat-fill"
                style={{ width: `${Math.min((faceFeatures.head_movement || 0) / 10 * 100, 100)}%` }}
              />
            </span>
          </div>
          <div className="cam-stat">
            <span className="cam-stat-label">Mouth</span>
            <span className="cam-stat-bar">
              <span
                className="cam-stat-fill"
                style={{ width: `${Math.min((faceFeatures.mouth_open || 0) / 5 * 100, 100)}%` }}
              />
            </span>
          </div>
        </div>
      )}

      <p className="camera-privacy">
        🔒 Processed locally · No data sent or stored
      </p>
    </div>
  );
}

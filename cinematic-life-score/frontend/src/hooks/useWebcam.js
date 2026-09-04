/**
 * useWebcam – opt-in anonymous webcam feature extraction.
 * Loads MediaPipe FaceMesh from CDN at runtime (never bundled).
 * No images stored. Falls back gracefully if camera unavailable.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

// Load a script from CDN and return a promise that resolves when ready
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

const CDN = 'https://cdn.jsdelivr.net/npm';

async function loadMediaPipe() {
  await loadScript(`${CDN}/@mediapipe/camera_utils/camera_utils.js`);
  await loadScript(`${CDN}/@mediapipe/face_mesh/face_mesh.js`);
  // Both attach to window
  if (!window.FaceMesh || !window.Camera) throw new Error('MediaPipe globals not found');
  return { FaceMesh: window.FaceMesh, Camera: window.Camera };
}

export function useWebcam({ enabled, onFeatures }) {
  const [status, setStatus] = useState('off'); // off | loading | active | error
  const [stream, setStream] = useState(null);
  const [faceFeatures, setFaceFeatures] = useState(null);
  const faceMeshRef = useRef(null);
  const cameraRef = useRef(null);
  const streamRef = useRef(null);
  const prevLandmarksRef = useRef(null);

  const stop = useCallback(() => {
    setStatus('off');
    setStream(null);
    setFaceFeatures(null);
    try { cameraRef.current?.stop(); } catch {}
    try { faceMeshRef.current?.close(); } catch {}
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    prevLandmarksRef.current = null;
  }, []);

  const start = useCallback(async () => {
    setStatus('loading');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 240, facingMode: 'user' }
      });
      streamRef.current = stream;
      setStream(stream);

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.playsInline = true;
      await video.play();

      const { FaceMesh, Camera } = await loadMediaPipe();

      const faceMesh = new FaceMesh({
        locateFile: (file) => `${CDN}/@mediapipe/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      faceMesh.onResults((results) => {
        if (!results.multiFaceLandmarks?.length) return;
        const landmarks = results.multiFaceLandmarks[0];
        const features = extractFaceFeatures(landmarks, prevLandmarksRef.current);
        prevLandmarksRef.current = landmarks;
        setFaceFeatures(features);
        if (onFeatures) onFeatures(features);
      });
      faceMeshRef.current = faceMesh;

      const camera = new Camera(video, {
        onFrame: async () => { await faceMesh.send({ image: video }); },
        width: 320, height: 240,
      });
      cameraRef.current = camera;
      camera.start();
      setStatus('active');
    } catch (err) {
      console.warn('Webcam failed:', err.message);
      setStatus('error');
    }
  }, [onFeatures]);

  useEffect(() => {
    if (enabled && status === 'off') start();
    if (!enabled && (status === 'active' || status === 'loading')) stop();
  }, [enabled]); // eslint-disable-line

  useEffect(() => () => stop(), []); // eslint-disable-line

  return { status, stream, faceFeatures, start, stop };
}

function extractFaceFeatures(landmarks, prev) {
  const nose = landmarks[1];
  const chin = landmarks[152];

  let headMovement = 0;
  if (prev) {
    const prevNose = prev[1];
    const dx = nose.x - prevNose.x;
    const dy = nose.y - prevNose.y;
    headMovement = Math.sqrt(dx * dx + dy * dy) * 1000;
  }

  const headTilt = Math.abs(nose.y - chin.y);
  const upperLip = landmarks[13];
  const lowerLip = landmarks[14];
  const mouthOpen = Math.abs(upperLip.y - lowerLip.y) * 100;

  return { head_movement: headMovement, head_tilt: headTilt, mouth_open: mouthOpen };
}

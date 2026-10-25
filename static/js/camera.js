/**
 * SignBridge - Camera and ISL Recognition Controller (Upgraded)
 * High-definition frame extraction, temporal gesture smoothing,
 * glowing skeletal overlays, and confidence disambiguation.
 */

const CameraController = (function() {
  let videoElement = null;
  let canvasElement = null;
  let canvasCtx = null;
  let stream = null;
  let isRunning = false;
  let isPaused = false;
  let processInterval = null;
  let lastPrediction = null;
  let currentFacingMode = 'user';
  let isProcessingFrame = false;

  // Temporal smoothing queue (last 4 predictions)
  const predictionHistory = [];
  const HISTORY_MAX = 4;

  // Hand Landmark Connections for 21 MediaPipe Landmarks
  const HAND_CONNECTIONS = [
    [0, 1], [1, 2], [2, 3], [3, 4],        // Thumb
    [0, 5], [5, 6], [6, 7], [7, 8],        // Index
    [5, 9], [9, 10], [10, 11], [11, 12],   // Middle
    [9, 13], [13, 14], [14, 15], [15, 16], // Ring
    [13, 17], [17, 18], [18, 19], [19, 20],// Pinky
    [0, 17]                                // Palm base
  ];

  function init(videoElId, canvasElId) {
    videoElement = document.getElementById(videoElId);
    canvasElement = document.getElementById(canvasElId);
    if (canvasElement) {
      canvasCtx = canvasElement.getContext('2d');
    }
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      showCameraError("WebRTC camera access is not supported in this browser. Please use the tactile palette below.");
      return false;
    }

    try {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: currentFacingMode,
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      });

      if (videoElement) {
        videoElement.srcObject = stream;
        await videoElement.play();
      }

      isRunning = true;
      isPaused = false;
      updateIndicator("LIVE CAMERA", true);

      // Frame interval (every 320ms for smooth, responsive detection)
      if (processInterval) clearInterval(processInterval);
      processInterval = setInterval(processCurrentFrame, 320);

      const statusEl = document.getElementById('cameraStatusText');
      if (statusEl) statusEl.textContent = 'Camera active. Show hand clearly inside guide box.';

      return true;
    } catch (err) {
      console.error("Camera startup error:", err);
      let errorMsg = "Camera access denied or webcam not found.";
      if (err.name === 'NotAllowedError') {
        errorMsg = "Camera permission was denied. You can use SignBridge via the 1-tap tactile palette!";
      } else if (err.name === 'NotFoundError') {
        errorMsg = "No webcam detected on this device. Tactile sign mode is active.";
      }
      showCameraError(errorMsg);
      return false;
    }
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
    if (processInterval) {
      clearInterval(processInterval);
      processInterval = null;
    }
    if (canvasCtx && canvasElement) {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    }
    isRunning = false;
    updateIndicator("CAMERA OFF", false);
    const statusEl = document.getElementById('cameraStatusText');
    if (statusEl) statusEl.textContent = 'Camera is paused. Tap "Start Camera" or use tactile buttons.';
  }

  function toggleCamera() {
    if (isRunning) {
      stopCamera();
    } else {
      startCamera();
    }
  }

  function switchCameraFacing() {
    currentFacingMode = (currentFacingMode === 'user') ? 'environment' : 'user';
    if (isRunning) {
      startCamera();
    }
  }

  function updateIndicator(text, isLive) {
    const ind = document.getElementById('camIndicator');
    if (ind) {
      ind.textContent = text;
      ind.className = isLive ? 'cam-indicator live' : 'cam-indicator';
    }
  }

  function showCameraError(msg) {
    updateIndicator("CAM DISABLED", false);
    const fallbackBanner = document.getElementById('cameraFallbackBanner');
    if (fallbackBanner) {
      fallbackBanner.style.display = 'block';
      const msgEl = fallbackBanner.querySelector('.fallback-msg');
      if (msgEl) msgEl.textContent = msg;
    }
    const statusEl = document.getElementById('cameraStatusText');
    if (statusEl) statusEl.textContent = msg;
  }

  async function processCurrentFrame() {
    if (!isRunning || isPaused || isProcessingFrame || !videoElement || videoElement.readyState < 2) {
      return;
    }

    isProcessingFrame = true;

    try {
      // Sync canvas dimensions
      if (canvasElement.width !== videoElement.videoWidth && videoElement.videoWidth > 0) {
        canvasElement.width = videoElement.videoWidth;
        canvasElement.height = videoElement.videoHeight;
      }

      // Draw high-quality snapshot (640x480) for sharp hand landmark fidelity
      const offscreen = document.createElement('canvas');
      offscreen.width = 640;
      offscreen.height = 480;
      const offCtx = offscreen.getContext('2d');
      offCtx.drawImage(videoElement, 0, 0, 640, 480);
      const dataUrl = offscreen.toDataURL('image/jpeg', 0.82);

      const resp = await fetch('/api/recognize_frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: dataUrl })
      });

      if (!resp.ok) {
        throw new Error("Recognition API error: " + resp.status);
      }

      const res = await resp.json();
      if (res.status === 'success' && res.result) {
        handleRecognitionResult(res.result);
      }
    } catch (err) {
      // Non-fatal frame capture drop
    } finally {
      isProcessingFrame = false;
    }
  }

  function handleRecognitionResult(result) {
    lastPrediction = result;

    // Draw hand landmark skeleton overlay on canvas
    drawLandmarkSkeleton(result.landmarks || []);

    const signLabel = document.getElementById('detectedSignText');
    const confVal = document.getElementById('confidenceVal');
    const confFill = document.getElementById('confidenceFill');
    const confBanner = document.getElementById('confirmationBanner');

    if (!signLabel || !confVal || !confFill) return;

    if (!result.detected || !result.sign || result.sign === 'UNKNOWN') {
      predictionHistory.length = 0; // reset history
      signLabel.textContent = "Position hand in guide box...";
      confVal.textContent = "0%";
      confVal.className = "confidence-val conf-low";
      confFill.style.width = "0%";
      if (confBanner) confBanner.classList.remove('active');
      return;
    }

    // Temporal smoothing
    predictionHistory.push(result.sign);
    if (predictionHistory.length > HISTORY_MAX) {
      predictionHistory.shift();
    }

    // Count occurrences of current sign in recent history
    const matchCount = predictionHistory.filter(s => s === result.sign).length;
    let smoothedConfidence = result.confidence || 0.80;
    if (matchCount >= 3) {
      smoothedConfidence = Math.min(0.98, smoothedConfidence + 0.08);
    }

    const pct = Math.round(smoothedConfidence * 100);
    const hindi = result.hindi ? ` / ${result.hindi}` : '';
    signLabel.textContent = `${result.label}${hindi}`;
    confVal.textContent = `${pct}% - ${result.confidence_level}`;
    confFill.style.width = `${pct}%`;

    // Visual classification feedback
    if (smoothedConfidence >= 0.78 || matchCount >= 3) {
      confVal.className = "confidence-val conf-high";
      if (confBanner) confBanner.classList.remove('active');

      // Trigger custom event for high confidence recognition
      document.dispatchEvent(new CustomEvent('isl:detected', {
        detail: {
          sign: result.sign,
          label: result.label,
          confidence: smoothedConfidence,
          autoAccepted: true
        }
      }));
    } else if (smoothedConfidence >= 0.50 || result.needs_confirmation) {
      confVal.className = "confidence-val conf-mod";
      if (confBanner) {
        confBanner.classList.add('active');
        const nameEl = document.getElementById('confSignName');
        const scoreEl = document.getElementById('confScore');
        if (nameEl) nameEl.textContent = result.label;
        if (scoreEl) scoreEl.textContent = `${pct}%`;
      }
    } else {
      confVal.className = "confidence-val conf-low";
      if (confBanner) confBanner.classList.remove('active');
    }
  }

  function drawLandmarkSkeleton(landmarksList) {
    if (!canvasCtx || !canvasElement) return;

    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    const w = canvasElement.width;
    const h = canvasElement.height;

    // Draw visual guide box in center
    canvasCtx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
    canvasCtx.lineWidth = 2;
    canvasCtx.setLineDash([6, 6]);
    canvasCtx.strokeRect(w * 0.15, h * 0.10, w * 0.70, h * 0.80);
    canvasCtx.setLineDash([]); // reset

    if (!landmarksList || landmarksList.length === 0) return;

    landmarksList.forEach((hand, hIdx) => {
      const boneColor = (hIdx === 0) ? '#38bdf8' : '#c084fc';
      const jointGlow = (hIdx === 0) ? 'rgba(56, 189, 248, 0.6)' : 'rgba(192, 132, 252, 0.6)';

      // Draw bones with glowing shadow
      canvasCtx.shadowColor = boneColor;
      canvasCtx.shadowBlur = 8;
      canvasCtx.strokeStyle = boneColor;
      canvasCtx.lineWidth = 4;
      canvasCtx.lineCap = 'round';
      canvasCtx.lineJoin = 'round';

      HAND_CONNECTIONS.forEach(([startIdx, endIdx]) => {
        const p1 = hand[startIdx];
        const p2 = hand[endIdx];
        if (p1 && p2) {
          canvasCtx.beginPath();
          canvasCtx.moveTo(p1.x * w, p1.y * h);
          canvasCtx.lineTo(p2.x * w, p2.y * h);
          canvasCtx.stroke();
        }
      });

      canvasCtx.shadowBlur = 0; // reset

      // Draw landmark joints
      hand.forEach((lm, idx) => {
        const isTip = (idx === 4 || idx === 8 || idx === 12 || idx === 16 || idx === 20);
        const r = isTip ? 6 : 3.5;

        canvasCtx.beginPath();
        canvasCtx.arc(lm.x * w, lm.y * h, r, 0, 2 * Math.PI);
        canvasCtx.fillStyle = isTip ? '#22c55e' : '#facc15';
        canvasCtx.fill();
        canvasCtx.strokeStyle = '#ffffff';
        canvasCtx.lineWidth = 1.5;
        canvasCtx.stroke();
      });
    });
  }

  return {
    init: init,
    startCamera: startCamera,
    stopCamera: stopCamera,
    toggleCamera: toggleCamera,
    switchCameraFacing: switchCameraFacing,
    getLastPrediction: () => lastPrediction
  };
})();

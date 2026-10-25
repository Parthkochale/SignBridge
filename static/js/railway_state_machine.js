/**
 * SignBridge - Railway Multi-Gesture Station Selection State Machine
 * Implements the 7-state gesture segmentation machine with live token accumulator,
 * neutral-state return detection, decimal branch delimiter support,
 * and dual Mode A (Camera Vision) / Mode B (Guided Demo / Manual Fallback).
 */

const RailwayStateMachine = (function() {
  // 7 Explicit States
  const STATES = {
    WAITING_FOR_INPUT: 'WAITING_FOR_INPUT',
    COLLECTING_NUMBER: 'COLLECTING_NUMBER',
    WAITING_FOR_DECIMAL_DELIMITER: 'WAITING_FOR_DECIMAL_DELIMITER',
    RESOLVING_SELECTION: 'RESOLVING_SELECTION',
    WAITING_FOR_CONFIRMATION: 'WAITING_FOR_CONFIRMATION',
    SELECTION_COMPLETE: 'SELECTION_COMPLETE',
    INVALID_SELECTION: 'INVALID_SELECTION'
  };

  let currentState = STATES.WAITING_FOR_INPUT;
  let accumulator = []; // array of token strings: e.g. ["10", "7", ".", "1"]
  let stationsDataset = [];
  let resolvedStation = null;
  let targetField = 'FROM_STATION'; // 'FROM_STATION' or 'TO_STATION'
  let onResolvedCallback = null;
  let lastGestureTime = 0;
  let isHandNeutral = true;
  let lastAcceptedSign = null;
  let interactionMode = 'MODE_B'; // 'MODE_A' (Camera) or 'MODE_B' (Guided Demo)

  function init(stationsList, callback) {
    stationsDataset = stationsList || [];
    onResolvedCallback = callback || null;
    reset();
  }

  function setStations(stationsList) {
    stationsDataset = stationsList || [];
  }

  function setTargetField(field, callback) {
    targetField = field;
    if (callback) onResolvedCallback = callback;
    reset();
  }

  function setInteractionMode(mode) {
    interactionMode = mode;
    renderHUD();
  }

  function reset() {
    currentState = STATES.WAITING_FOR_INPUT;
    accumulator = [];
    resolvedStation = null;
    isHandNeutral = true;
    lastAcceptedSign = null;
    renderHUD();
  }

  function getBufferString() {
    if (accumulator.length === 0) return "";
    
    // Group adjacent number tokens before the dot delimiter
    let result = "";
    let inDecimal = false;

    for (let i = 0; i < accumulator.length; i++) {
      const tok = accumulator[i];
      if (tok === '.') {
        inDecimal = true;
        result += '.';
      } else {
        if (!inDecimal) {
          // If we had a 10 and then a 7, combine or append: 10 + 7 = 17
          if (tok === '10') {
            result = (result === "" || result === "0") ? "10" : (parseInt(result, 10) + 10).toString();
          } else {
            if (result === "10" && ['1','2','3','4','5','6','7','8','9'].includes(tok)) {
              result = (10 + parseInt(tok, 10)).toString(); // e.g. 10 + 7 = 17
            } else if (result === "" || result === "0") {
              result = tok;
            } else {
              result += tok;
            }
          }
        } else {
          // In decimal part, append directly: e.g. .1
          result += tok;
        }
      }
    }
    return result;
  }

  /**
   * Process incoming camera gesture or manual token
   */
  function processGesture(signKey, isManual = false) {
    const now = Date.now();

    // In camera mode, enforce neutral hand return (gesture segmentation)
    if (!isManual) {
      interactionMode = 'MODE_A';
      if (!isHandNeutral && signKey === lastAcceptedSign && (now - lastGestureTime < 1200)) {
        return; // debounce same sign until hand is lowered
      }
    } else {
      interactionMode = 'MODE_B';
    }

    lastGestureTime = now;
    lastAcceptedSign = signKey;
    isHandNeutral = false;

    // Handle Affirmation / Decision signs when waiting for confirmation
    if (currentState === STATES.WAITING_FOR_CONFIRMATION) {
      if (signKey === 'YES' || signKey === 'OK' || signKey === 'CONFIRM') {
        currentState = STATES.SELECTION_COMPLETE;
        renderHUD();
        if (onResolvedCallback && resolvedStation) {
          onResolvedCallback(resolvedStation, targetField);
        }
        return;
      } else if (signKey === 'NO' || signKey === 'CANCEL') {
        reset();
        return;
      }
    }

    // Number tokens
    let token = null;
    if (signKey === 'NUMBER_10' || signKey === '10') token = '10';
    else if (signKey === 'NUMBER_1' || signKey === '1') token = '1';
    else if (signKey === 'NUMBER_2' || signKey === '2') token = '2';
    else if (signKey === 'NUMBER_3' || signKey === '3') token = '3';
    else if (signKey === 'NUMBER_4' || signKey === '4') token = '4';
    else if (signKey === 'NUMBER_5' || signKey === '5') token = '5';
    else if (signKey === 'NUMBER_6' || signKey === '6') token = '6';
    else if (signKey === 'NUMBER_7' || signKey === '7') token = '7';
    else if (signKey === 'NUMBER_8' || signKey === '8') token = '8';
    else if (signKey === 'NUMBER_9' || signKey === '9') token = '9';
    else if (signKey === 'DELIMITER_DOT' || signKey === '.' || signKey === 'CLOSED_FIST') token = '.';

    if (!token) return;

    // State transitions based on token
    if (token === '.') {
      if (accumulator.length > 0 && !accumulator.includes('.')) {
        accumulator.push('.');
        currentState = STATES.WAITING_FOR_DECIMAL_DELIMITER;
      }
    } else {
      accumulator.push(token);
      currentState = STATES.COLLECTING_NUMBER;
    }

    // Resolve station candidate against dataset
    evaluateAccumulator();
  }

  function handleNeutralHand() {
    isHandNeutral = true;
  }

  function backspace() {
    if (accumulator.length > 0) {
      accumulator.pop();
      if (accumulator.length === 0) {
        currentState = STATES.WAITING_FOR_INPUT;
        resolvedStation = null;
      } else {
        evaluateAccumulator();
      }
      renderHUD();
    }
  }

  function evaluateAccumulator() {
    const codeStr = getBufferString();
    if (!codeStr) {
      resolvedStation = null;
      currentState = STATES.WAITING_FOR_INPUT;
      renderHUD();
      return;
    }

    // Look for match in stationsDataset
    const matched = stationsDataset.find(s => 
      s.num_code === codeStr || 
      (s.numeric_val && s.numeric_val.toString() === codeStr)
    );

    if (matched) {
      resolvedStation = matched;
      currentState = STATES.WAITING_FOR_CONFIRMATION;
    } else {
      // Partial match or invalid
      const hasPrefixMatches = stationsDataset.some(s => 
        s.num_code && s.num_code.startsWith(codeStr)
      );
      if (hasPrefixMatches) {
        currentState = accumulator.includes('.') ? 
          STATES.WAITING_FOR_DECIMAL_DELIMITER : STATES.COLLECTING_NUMBER;
        resolvedStation = null;
      } else {
        currentState = STATES.INVALID_SELECTION;
        resolvedStation = null;
      }
    }

    renderHUD();
  }

  function confirmSelection() {
    if (resolvedStation) {
      currentState = STATES.SELECTION_COMPLETE;
      renderHUD();
      if (onResolvedCallback) {
        onResolvedCallback(resolvedStation, targetField);
      }
    }
  }

  function renderHUD() {
    const hudContainer = document.getElementById('railwayStateMachineHUD');
    if (!hudContainer) return;

    const bufferCode = getBufferString();
    const isOrigin = targetField === 'FROM_STATION';
    const fieldLabel = isOrigin ? 'Origin Station (From)' : 'Destination Station (To)';

    // Mode Badge HTML
    const modeBadge = interactionMode === 'MODE_A'
      ? `<span class="badge-mode mode-vision" title="MediaPipe Camera Detection Active">📷 Mode A: Camera Vision Active</span>`
      : `<span class="badge-mode mode-demo" title="Guided Demo / Manual Touch Buttons">🖐️ Mode B: Guided Demo Mode</span>`;

    // State Badge HTML
    let stateBadgeClass = "state-collecting";
    let stateLabel = "Collecting Digits";
    if (currentState === STATES.WAITING_FOR_INPUT) {
      stateBadgeClass = "state-waiting";
      stateLabel = "Ready for Sign";
    } else if (currentState === STATES.WAITING_FOR_CONFIRMATION) {
      stateBadgeClass = "state-resolved";
      stateLabel = "Station Resolved — Confirm";
    } else if (currentState === STATES.SELECTION_COMPLETE) {
      stateBadgeClass = "state-complete";
      stateLabel = "Confirmed ✓";
    } else if (currentState === STATES.INVALID_SELECTION) {
      stateBadgeClass = "state-invalid";
      stateLabel = "Code Not Found";
    }

    // Accumulator Tokens Pills
    const tokenPills = accumulator.map((tok, idx) => {
      const isDot = tok === '.';
      return `<span class="accum-token ${isDot ? 'token-dot' : 'token-num'}">${isDot ? '● Delimiter (.)' : tok}</span>`;
    }).join(' <span class="accum-plus">+</span> ');

    // Matched Station Card
    let previewHtml = '';
    if (resolvedStation) {
      previewHtml = `
        <div class="resolved-station-card animate-pop">
          <div class="station-card-top">
            <span class="station-icon">🚉</span>
            <div>
              <div class="station-card-title">${resolvedStation.name}</div>
              <div class="station-card-line">${resolvedStation.line || 'Mumbai Suburban'} • Zone: ${resolvedStation.zone || 'Central'}</div>
            </div>
            <span class="station-code-pill">Code ${resolvedStation.num_code}</span>
          </div>
          <div class="station-amenities">
            ♿ ${resolvedStation.accessible_amenities || 'Accessible Platform, Tactile Path'}
          </div>
          <div class="resolved-actions">
            <button class="btn-confirm-station" onclick="RailwayStateMachine.confirmSelection()">
              ✓ Confirm ${resolvedStation.name} (Sign YES / Tap)
            </button>
            <button class="btn-clear-station" onclick="RailwayStateMachine.reset()">
              ↺ Clear / Re-enter
            </button>
          </div>
        </div>
      `;
    } else if (currentState === STATES.INVALID_SELECTION) {
      previewHtml = `
        <div class="invalid-code-box">
          <span>⚠️ Code <strong>"${bufferCode}"</strong> not recognized.</span>
          <button class="btn-small-reset" onclick="RailwayStateMachine.reset()">Reset</button>
        </div>
      `;
    } else {
      previewHtml = `
        <div class="buffer-hint-box">
          <div style="font-weight:700; color:var(--text-primary); font-size:0.85rem;">
            ${bufferCode ? `Current Code: <span style="font-family:monospace; font-size:1.1rem; color:var(--accent-primary); font-weight:800;">${bufferCode}</span>` : 'Awaiting gesture sequence...'}
          </div>
          <div style="font-size:0.75rem; color:var(--text-secondary); margin-top:3px;">
            Example: Sign <strong>10</strong> + <strong>7</strong> + <strong>Closed-fist (.)</strong> + <strong>1</strong> for Airoli (17.1).
          </div>
        </div>
      `;
    }

    hudContainer.innerHTML = `
      <div class="railway-sm-wrapper">
        <div class="sm-header-row">
          <div class="sm-title">
            <span class="sm-indicator-dot"></span>
            <strong>Multi-Gesture Station Selector</strong>
            <span class="field-target-badge">${fieldLabel}</span>
          </div>
          <div class="sm-badges-group">
            ${modeBadge}
            <span class="badge-state ${stateBadgeClass}">${stateLabel}</span>
          </div>
        </div>

        <!-- Token Accumulator Stream -->
        <div class="accumulator-bar">
          <div class="accum-label">Gesture Accumulator Buffer:</div>
          <div class="accum-stream">
            ${tokenPills || '<span class="accum-empty">No gestures signed yet</span>'}
          </div>
          <div class="accum-controls">
            <button class="btn-accum-ctrl" onclick="RailwayStateMachine.backspace()" title="Delete last gesture">⌫ Del</button>
            <button class="btn-accum-ctrl" onclick="RailwayStateMachine.reset()" title="Reset buffer">↺ Clear</button>
          </div>
        </div>

        <!-- Station Resolved Preview -->
        ${previewHtml}

        <!-- Mode B Interactive Tactile Demo Keyboard (evaluator can test without camera) -->
        <div class="sm-guided-palette">
          <div class="palette-header">
            <span>🖐️ Guided Demo & Manual Sign Simulation (Mode B):</span>
            <span style="font-size:0.75rem; color:var(--text-muted);">Click buttons to simulate camera signs</span>
          </div>
          <div class="palette-tokens-grid">
            <button class="token-btn token-major" onclick="RailwayStateMachine.processGesture('10', true)">
              <span class="tb-icon">🙌</span><strong>10</strong> (Ten)
            </button>
            <button class="token-btn" onclick="RailwayStateMachine.processGesture('7', true)">
              <span class="tb-icon">✌️</span><strong>7</strong> (Seven)
            </button>
            <button class="token-btn token-delimiter" onclick="RailwayStateMachine.processGesture('.', true)">
              <span class="tb-icon">✊</span><strong>. (Delimiter)</strong>
            </button>
            <button class="token-btn" onclick="RailwayStateMachine.processGesture('1', true)">
              <span class="tb-icon">☝️</span><strong>1</strong> (One)
            </button>
            <button class="token-btn" onclick="RailwayStateMachine.processGesture('16', true)" title="16: Thane">
              <strong>16</strong> (Thane)
            </button>
            <button class="token-btn" onclick="RailwayStateMachine.processGesture('18', true)" title="18: Dombivli">
              <strong>18</strong> (Dombivli)
            </button>
            <button class="token-btn" onclick="RailwayStateMachine.processGesture('19', true)" title="19: Kalyan">
              <strong>19</strong> (Kalyan)
            </button>
            <button class="token-btn token-shortcut" onclick="RailwayStateMachine.simulateSequence(['10','7','.','1'])" title="Quick Demo Airoli (17.1)">
              ⚡ Demo "17.1" (Airoli)
            </button>
            <button class="token-btn token-shortcut" onclick="RailwayStateMachine.simulateSequence(['1'])" title="Quick Demo CSMT (1)">
              ⚡ Demo "1" (CSMT)
            </button>
          </div>
        </div>
      </div>
    `;
  }

  // Quick sequential simulation for evaluator demonstration
  function simulateSequence(tokens) {
    reset();
    interactionMode = 'MODE_B';
    let delay = 0;
    tokens.forEach((tok, i) => {
      setTimeout(() => {
        processGesture(tok, true);
      }, delay);
      delay += 350;
    });
  }

  return {
    init,
    setStations,
    setTargetField,
    setInteractionMode,
    processGesture,
    handleNeutralHand,
    backspace,
    reset,
    confirmSelection,
    simulateSequence,
    getCurrentState: () => currentState,
    getBufferString
  };
})();

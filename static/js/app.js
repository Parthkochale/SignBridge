/**
 * SignBridge - Main Application Coordinator (Final Master Build)
 * Integrates:
 * - 5 Public Services: Railway, Hospital, Police, Bank, Government Office
 * - Dedicated Railway Multi-Gesture Selection State Machine
 * - Scalable ISL Dictionary with instant search and ISLRTC citations
 * - Real-time Dual-Device Synchronization via Room Codes
 * - Web Speech API Speech-to-Text and TTS Voice Announcements
 * - Accessible high-contrast display, large touch targets, tactile keyboard fallback
 */

const SignBridgeApp = (function() {
  let currentSessionId = null;
  let currentService = 'railway';
  let currentState = {};
  let currentStage = 'MAIN_MENU';
  let isHighContrast = false;
  let fontScale = 'normal';
  let isTTSVoiceEnabled = true;
  let speechRecognizer = null;
  let isRecordingSpeech = false;
  let syncInterval = null;
  let lastProcessedSign = null;
  let lastSignTime = 0;
  let lastMessageCount = 0;
  let currentTactileCategory = 'railway';
  let servicesList = [];
  let railwayOptions = null;
  let dictionaryEntries = [];
  let dictionaryCategories = [];

  // Curated Public Service ISL Signs Dataset (for tactile 1-tap palette)
  const ALL_SIGNS = [
    // Railway & Travel
    { key: 'TICKET', icon: '🎫', name: 'Ticket', hindi: 'टिकट', category: 'railway', sub: 'Book / Reserve' },
    { key: 'TRAIN', icon: '🚆', name: 'Train', hindi: 'रेलगाड़ी', category: 'railway', sub: 'Inquiry' },
    { key: 'PLATFORM', icon: '🚉', name: 'Platform', hindi: 'प्लेटफ़ॉर्म', category: 'railway', sub: 'Track #' },
    { key: 'SEAT', icon: '💺', name: 'Seat / Berth', hindi: 'सीट / बर्थ', category: 'railway', sub: 'Lower Berth' },
    { key: 'WHEELCHAIR', icon: '♿', name: 'Wheelchair', hindi: 'व्हीलचेयर', category: 'railway', sub: 'Assistance' },
    { key: 'TIME', icon: '⌚', name: 'Time', hindi: 'समय', category: 'railway', sub: 'Schedule' },
    { key: 'CANCEL_TICKET', icon: '❌', name: 'Cancel', hindi: 'रद्द', category: 'railway', sub: 'Refund' },
    { key: 'WHERE', icon: '❓', name: 'Where', hindi: 'कहाँ', category: 'railway', sub: 'Counter #' },

    // Basics & Conversation
    { key: 'NAMASTE', icon: '🙏', name: 'Namaste', hindi: 'नमस्ते', category: 'basics', sub: 'Greeting' },
    { key: 'YES', icon: '👍', name: 'Yes', hindi: 'हाँ', category: 'basics', sub: 'Confirm' },
    { key: 'NO', icon: '✋', name: 'No', hindi: 'नहीं', category: 'basics', sub: 'Cancel' },
    { key: 'OK', icon: '👌', name: 'OK', hindi: 'ठीक है', category: 'basics', sub: 'Approve' },
    { key: 'WAIT', icon: '⏳', name: 'Wait', hindi: 'रुकिए', category: 'basics', sub: 'Hold On' },
    { key: 'STOP', icon: '🛑', name: 'Stop', hindi: 'रुको', category: 'basics', sub: 'Halt' },
    { key: 'HELP', icon: '🤝', name: 'Help', hindi: 'मदद', category: 'basics', sub: 'Support' },
    { key: 'THANK_YOU', icon: '💐', name: 'Thank You', hindi: 'धन्यवाद', category: 'basics', sub: 'Gratitude' },
    { key: 'PLEASE', icon: '🤲', name: 'Please', hindi: 'कृपया', category: 'basics', sub: 'Request' },
    { key: 'SORRY', icon: '🙇', name: 'Sorry', hindi: 'क्षमा', category: 'basics', sub: 'Apology' },

    // Health & Needs
    { key: 'DOCTOR_EMERGENCY', icon: '🏥', name: 'Doctor', hindi: 'डॉक्टर', category: 'health', sub: 'Medical' },
    { key: 'DEAF_ISL', icon: '🧏', name: 'Deaf ISL', hindi: 'बधिर संकेत', category: 'health', sub: 'Visual Aid' },
    { key: 'MEDICINE', icon: '💊', name: 'Medicine', hindi: 'दवा', category: 'health', sub: 'Pharmacy' },
    { key: 'PAIN', icon: '🤕', name: 'Pain', hindi: 'दर्द', category: 'health', sub: 'Triage' },
    { key: 'WATER', icon: '💧', name: 'Water', hindi: 'पानी', category: 'health', sub: 'Drink' },
    { key: 'FOOD', icon: '🍱', name: 'Food', hindi: 'भोजन', category: 'health', sub: 'Meal' },

    // Numbers & Finance
    { key: 'NUMBER_1', icon: '☝️', name: '1 (One)', hindi: '१ एक', category: 'numbers', sub: 'Station / Qty 1' },
    { key: 'NUMBER_2', icon: '✌️', name: '2 (Two)', hindi: '२ दो', category: 'numbers', sub: 'Qty 2' },
    { key: 'NUMBER_3', icon: '🤟', name: '3 (Three)', hindi: '३ तीन', category: 'numbers', sub: 'Qty 3' },
    { key: 'NUMBER_4', icon: '🖖', name: '4 (Four)', hindi: '४ चार', category: 'numbers', sub: 'Qty 4' },
    { key: 'NUMBER_5', icon: '🖐️', name: '5 (Five)', hindi: '५ पाँच', category: 'numbers', sub: 'Qty 5' },
    { key: 'NUMBER_6', icon: '🤙', name: '6 (Six)', hindi: '६ छह', category: 'numbers', sub: '5 + 1 Hand' },
    { key: 'NUMBER_7', icon: '✌️', name: '7 (Seven)', hindi: '७ सात', category: 'numbers', sub: '5 + 2 Hands' },
    { key: 'NUMBER_8', icon: '🤟', name: '8 (Eight)', hindi: '८ आठ', category: 'numbers', sub: '5 + 3 Hands' },
    { key: 'NUMBER_9', icon: '🖖', name: '9 (Nine)', hindi: '९ नौ', category: 'numbers', sub: '5 + 4 Hands' },
    { key: 'NUMBER_10', icon: '🙌', name: '10 (Ten)', hindi: '१० दस', category: 'numbers', sub: 'Both Palms' },
    { key: 'DELIMITER_DOT', icon: '✊', name: '. (Delimiter)', hindi: 'दशमलव (.)', category: 'numbers', sub: 'Branch Code' },
    { key: 'MONEY', icon: '💵', name: 'Fare / Cash', hindi: 'किराया', category: 'numbers', sub: 'Rupees' },
    { key: 'PAY_UPI', icon: '📱', name: 'UPI Pay', hindi: 'ऑनलाइन', category: 'numbers', sub: 'QR Scan' },
    { key: 'RECEIPT', icon: '🧾', name: 'Receipt', hindi: 'पर्ची', category: 'numbers', sub: 'Print' }
  ];

  const els = {};

  async function init() {
    cacheDOMElements();
    setupAccessibility();
    setupSpeechIO();
    setupKeyboardShortcuts();

    const urlParams = new URLSearchParams(window.location.search);
    const sessionParam = urlParams.get('session');
    const viewParam = urlParams.get('view');
    const serviceParam = urlParams.get('service');

    if (viewParam) setViewMode(viewParam);
    if (serviceParam) currentService = serviceParam;

    await loadOrCreateSession(sessionParam || null);
    await loadServicesList();
    await loadRailwayOptions();
    await loadDictionaryData();

    CameraController.init('cameraVideo', 'cameraCanvas');
    document.addEventListener('isl:detected', onSignDetected);

    // Fast 1000ms polling for real-time dual-device synchronization
    if (syncInterval) clearInterval(syncInterval);
    syncInterval = setInterval(syncSessionState, 1000);

    bindUIEvents();
    renderTactilePalette(currentTactileCategory);
  }

  function cacheDOMElements() {
    els.sessionBadge = document.getElementById('sessionBadge');
    els.roomCodeText = document.getElementById('roomCodeText');
    els.chatTranscript = document.getElementById('chatTranscript');
    els.stepperContainer = document.getElementById('stepperContainer');
    els.workflowFormArea = document.getElementById('workflowFormArea');
    els.servicesRibbon = document.getElementById('servicesRibbon');
    els.currentServiceTitle = document.getElementById('currentServiceTitle');
    els.btnStartCam = document.getElementById('btnStartCam');
    els.btnToggleCam = document.getElementById('btnToggleCam');
    els.btnMic = document.getElementById('btnMic');
    els.speechInput = document.getElementById('speechInput');
    els.btnSendOfficer = document.getElementById('btnSendOfficer');
    els.historyModal = document.getElementById('historyModal');
    els.roomModal = document.getElementById('roomModal');
    els.dictionaryModal = document.getElementById('dictionaryModal');
    els.ticketModal = document.getElementById('ticketModal');
    els.modalRoomCode = document.getElementById('modalRoomCode');
    els.inputJoinRoomCode = document.getElementById('inputJoinRoomCode');
    els.joinRoomError = document.getElementById('joinRoomError');
    els.syncIndicator = document.getElementById('syncIndicator');
    els.heroDictSearchInput = document.getElementById('heroDictSearchInput');
  }

  async function loadOrCreateSession(requestedId) {
    try {
      let resp;
      if (requestedId) {
        resp = await fetch(`/api/sessions/${requestedId}`);
        if (resp.ok) {
          const data = await resp.json();
          applySessionData(data);
          return;
        }
      }

      resp = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: currentService, session_id: requestedId })
      });
      const data = await resp.json();
      applySessionData(data);
    } catch (e) {
      console.error("Failed to load session:", e);
    }
  }

  function applySessionData(data) {
    currentSessionId = data.session_id;
    currentService = data.service_type || 'railway';
    currentState = data.state || {};
    currentStage = data.stage || 'MAIN_MENU';
    lastMessageCount = (data.messages || []).length;

    if (els.roomCodeText) {
      els.roomCodeText.textContent = `Room: ${currentSessionId}`;
    }
    if (els.modalRoomCode) {
      els.modalRoomCode.textContent = currentSessionId;
    }

    if (data.service_info && els.currentServiceTitle) {
      els.currentServiceTitle.textContent = data.service_info.name;
    }

    updateServiceTabsUI(currentService);
    renderStepper(currentService, currentState);
    renderTranscript(data.messages || []);
    renderWorkflowForm(currentService, currentState);
  }

  async function syncSessionState() {
    if (!currentSessionId) return;

    try {
      const resp = await fetch(`/api/sessions/${currentSessionId}`);
      if (!resp.ok) return;

      const data = await resp.json();
      if (data.status === 'success') {
        const serverMsgCount = data.message_count || (data.messages || []).length;
        const stateChanged = JSON.stringify(currentState) !== JSON.stringify(data.state);

        if (serverMsgCount !== lastMessageCount || stateChanged) {
          currentState = data.state || {};
          currentStage = data.stage || 'MAIN_MENU';
          lastMessageCount = serverMsgCount;

          if (data.service_type && data.service_type !== currentService) {
            currentService = data.service_type;
            updateServiceTabsUI(currentService);
            if (data.service_info && els.currentServiceTitle) {
              els.currentServiceTitle.textContent = data.service_info.name;
            }
          }

          renderStepper(currentService, currentState);
          renderTranscript(data.messages || []);
          renderWorkflowForm(currentService, currentState);

          if (els.syncIndicator) {
            els.syncIndicator.textContent = "🟢 Synced (" + new Date().toLocaleTimeString() + ")";
          }
        }
      }
    } catch (err) {
      if (els.syncIndicator) {
        els.syncIndicator.textContent = "🟡 Reconnecting...";
      }
    }
  }

  async function loadServicesList() {
    try {
      const resp = await fetch('/api/services');
      const data = await resp.json();
      if (data.status === 'success') {
        servicesList = data.services;
        renderServicesRibbon(servicesList);
      }
    } catch (e) {
      console.error("Error loading services:", e);
    }
  }

  async function loadRailwayOptions() {
    try {
      const resp = await fetch('/api/railway/options');
      const data = await resp.json();
      if (data.status === 'success') {
        railwayOptions = data;
        const allStations = data.all_stations || data.stations || [];
        if (typeof RailwayStateMachine !== 'undefined') {
          RailwayStateMachine.init(allStations, onStationResolved);
        }
      }
    } catch (e) {
      console.error("Error loading railway options:", e);
    }
  }

  async function loadDictionaryData() {
    try {
      const respCats = await fetch('/api/dictionary/categories');
      const dataCats = await respCats.json();
      if (dataCats.status === 'success') {
        dictionaryCategories = dataCats.categories || [];
        populateDictionaryCategories(dictionaryCategories);
      }

      const respEntries = await fetch('/api/dictionary');
      const dataEntries = await respEntries.json();
      if (dataEntries.status === 'success') {
        dictionaryEntries = dataEntries.results || [];
      }
    } catch (e) {
      console.error("Error loading dictionary:", e);
    }
  }

  function renderServicesRibbon(services) {
    if (!els.servicesRibbon) return;

    els.servicesRibbon.innerHTML = services.map(svc => `
      <button class="service-tab ${svc.id === currentService ? 'active' : ''}" 
              data-svc="${svc.id}"
              onclick="SignBridgeApp.switchService('${svc.id}')"
              title="${svc.tagline}">
        <span class="tab-icon">${svc.icon}</span>
        <span class="tab-name">${svc.short_name}</span>
      </button>
    `).join('');
  }

  function updateServiceTabsUI(serviceId) {
    document.querySelectorAll('.service-tab').forEach(tab => {
      if (tab.getAttribute('data-svc') === serviceId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  async function switchService(serviceId) {
    currentService = serviceId;
    updateServiceTabsUI(serviceId);

    const svc = servicesList.find(s => s.id === serviceId);
    if (svc && els.currentServiceTitle) {
      els.currentServiceTitle.textContent = svc.name;
    }

    try {
      const resp = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service_type: serviceId })
      });
      const data = await resp.json();
      applySessionData(data);
    } catch (e) {
      console.error("Error switching service:", e);
    }
  }

  function renderStepper(service, state) {
    if (!els.stepperContainer) return;

    const railwaySteps = [
      { id: 'MAIN_MENU', label: '1. Intent & Menu' },
      { id: 'FROM_STATION', label: '2. Origin Station' },
      { id: 'TO_STATION', label: '3. Destination' },
      { id: 'PASSENGER_COUNT', label: '4. Passengers' },
      { id: 'TICKET_TYPE', label: '5. Class & Quota' },
      { id: 'REVIEW', label: '6. Review Booking' },
      { id: 'PAYMENT', label: '7. Demo Payment' },
      { id: 'SUMMARY_CONFIRMED', label: '8. Ticket Slip' }
    ];

    const generalSteps = [
      { id: 'MAIN', label: '1. Counter Reception' },
      { id: 'INTERACTION', label: '2. Guided Form' },
      { id: 'COMPLETE', label: '3. Record / Memo' }
    ];

    const steps = (service === 'railway') ? railwaySteps : generalSteps;
    const activeField = state.current_field || state.active_task || 'MAIN_MENU';

    let currentIdx = steps.findIndex(s => s.id === activeField);
    if (currentIdx === -1) {
      if (activeField === 'JOURNEY_TYPE') currentIdx = 3;
      else currentIdx = 0;
    }

    let html = `<ul class="stepper-list" role="list">`;
    steps.forEach((st, idx) => {
      let isCompleted = idx < currentIdx;
      let isActive = idx === currentIdx;

      html += `
        <li class="step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}" role="listitem">
          <span class="step-number">${isCompleted ? '✓' : idx + 1}</span>
          <span>${st.label}</span>
          ${idx < steps.length - 1 ? '<span class="step-arrow">→</span>' : ''}
        </li>
      `;
    });
    html += `</ul>`;
    els.stepperContainer.innerHTML = html;
  }

  function renderTranscript(messages) {
    if (!els.chatTranscript) return;

    els.chatTranscript.innerHTML = messages.map(msg => {
      let senderClass = 'bubble-system';
      let senderName = 'System Notice';
      if (msg.sender === 'citizen') {
        senderClass = 'bubble-citizen';
        senderName = '🧏‍♂️ Citizen (ISL / Tactile)';
      } else if (msg.sender === 'officer') {
        senderClass = 'bubble-officer';
        senderName = '👔 Counter Officer';
      }

      let signBadgeHtml = '';
      if (msg.sign_detected) {
        signBadgeHtml = `<span style="background:rgba(255,255,255,0.22); padding:2px 8px; border-radius:4px; font-size:0.75rem; margin-left:6px; font-weight:bold;">Sign: ${msg.sign_detected}</span>`;
      }

      let verifiedSignCard = '';
      if (msg.clip_id) {
        verifiedSignCard = ISLViewer.renderVerifiedCard(msg.clip_id);
      } else if (msg.sender === 'officer' && !msg.clip_id) {
        verifiedSignCard = ISLViewer.renderFallbackCard("Officer spoke custom reply. Text displayed clearly.");
      }

      return `
        <div class="chat-bubble ${senderClass}" role="article">
          <div class="msg-header">
            <span>${senderName} ${signBadgeHtml}</span>
            <span>${(msg.timestamp || '').split(' ')[1] || ''}</span>
          </div>
          <div>${msg.text}</div>
          ${verifiedSignCard}
        </div>
      `;
    }).join('');

    els.chatTranscript.scrollTop = els.chatTranscript.scrollHeight;
  }

  function renderWorkflowForm(service, state) {
    if (!els.workflowFormArea) return;

    if (service === 'railway') {
      renderRailwayForm(state);
    } else if (service === 'hospital') {
      renderHospitalForm(state);
    } else if (service === 'police') {
      renderPoliceForm(state);
    } else if (service === 'bank') {
      renderBankForm(state);
    } else if (service === 'govt_office') {
      renderGovtForm(state);
    }
  }

  // =========================================================================
  // 1. RAILWAY COUNTER DEMO (SHOWSTOPPER)
  // =========================================================================
  function renderRailwayForm(state) {
    const task = state.active_task || 'MAIN_MENU';
    const field = state.current_field || 'MENU_OPTION';
    const booking = state.booking || {};

    let html = '';

    // Step 1: Initial Namaste / Welcome Greeting
    if (task === 'MAIN_MENU' && field === 'MENU_OPTION') {
      html = `
        <div class="railway-flow-card">
          <div style="background:#e0f2fe; border:1px solid #7dd3fc; border-radius:10px; padding:1rem; margin-bottom:1rem; display:flex; align-items:center; gap:0.75rem;">
            <span style="font-size:2.2rem;">🙏</span>
            <div>
              <strong style="color:#0369a1; font-size:1.05rem;">Namaste! Welcome to Railway Assistance Desk.</strong>
              <div style="font-size:0.85rem; color:#0c4a6e; margin-top:2px;">
                Sign <strong>Namaste</strong> in the camera or tap the button below to initiate counter dialogue.
              </div>
            </div>
            <button class="btn-primary" style="margin-left:auto; white-space:nowrap;" onclick="SignBridgeApp.sendAction('NAMASTE_GREETING', {})">
              🙏 Sign / Tap Namaste
            </button>
          </div>

          <div style="font-weight:800; margin-bottom:0.75rem; color:var(--text-primary); font-size:1.05rem;">
            Choose a Counter Service Option (Sign 1, 2, or 3):
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.75rem;">
            <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('CONFIRM_PREDICTION', {number: 1})">
              <span class="choice-num-badge">1</span>
              <span class="choice-icon">🎫</span>
              <div class="choice-text">
                <strong>Ticket Booking</strong>
                <div class="choice-sub">Suburban & PRS Tickets with 75% Divyangjan Concession</div>
              </div>
            </button>

            <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('CONFIRM_PREDICTION', {number: 2})">
              <span class="choice-num-badge">2</span>
              <span class="choice-icon">🚆</span>
              <div class="choice-text">
                <strong>Train Enquiry</strong>
                <div class="choice-sub">Timings, running status & Divyangjan coach positions</div>
              </div>
            </button>

            <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('CONFIRM_PREDICTION', {number: 3})">
              <span class="choice-num-badge">3</span>
              <span class="choice-icon">🚉</span>
              <div class="choice-text">
                <strong>Platform Enquiry</strong>
                <div class="choice-sub">Platform allocations, ramps & accessible elevators</div>
              </div>
            </button>
          </div>
        </div>
      `;
    }

    // Step 2: Ticket Booking Flow
    else if (task === 'TICKET_BOOKING') {
      if (field === 'FROM_STATION') {
        html = `
          <div class="railway-flow-card">
            <div class="step-guide-banner">
              <span class="step-pill">Step 1 of 5</span>
              <strong>Select Origin Station (From)</strong>
              <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back</button>
            </div>

            <!-- Mount point for Multi-Gesture State Machine HUD -->
            <div id="railwayStateMachineHUD"></div>

            <div style="margin-top:0.75rem;">
              <div style="font-size:0.8rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; margin-bottom:0.4rem;">
                Popular Mumbai Suburban Stations (1-Tap Selection):
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('1', 'FROM_STATION')">CSMT (Code 1)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('8', 'FROM_STATION')">Dadar (Code 8)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('16', 'FROM_STATION')">Thane (Code 16)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('18', 'FROM_STATION')">Dombivli (Code 18)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('19', 'FROM_STATION')">Kalyan (Code 19)</button>
                <button class="reply-pill" style="border-color:#c2410c; color:#c2410c;" onclick="SignBridgeApp.selectDirectStation('17.1', 'FROM_STATION')">⚡ Airoli (Code 17.1)</button>
              </div>
            </div>
          </div>
        `;
      } else if (field === 'TO_STATION') {
        const fromStn = booking.from || 'Origin';
        html = `
          <div class="railway-flow-card">
            <div class="step-guide-banner">
              <span class="step-pill">Step 2 of 5</span>
              <strong>Select Destination Station (To)</strong>
              <span style="font-size:0.82rem; color:var(--text-muted); margin-left:0.5rem;">[Origin: <strong>${fromStn}</strong>]</span>
              <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back</button>
            </div>

            <!-- Validation Note -->
            <div style="background:#fef3c7; border:1px solid #f59e0b; border-radius:6px; padding:0.5rem 0.75rem; font-size:0.8rem; color:#92400e; margin-bottom:0.75rem;">
              ⚠️ <strong>Validation Rule:</strong> Destination cannot be the same as origin (<strong>${fromStn}</strong>).
            </div>

            <!-- Mount point for Multi-Gesture State Machine HUD -->
            <div id="railwayStateMachineHUD"></div>

            <div style="margin-top:0.75rem;">
              <div style="font-size:0.8rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase; margin-bottom:0.4rem;">
                Popular Destination Stations:
              </div>
              <div style="display:flex; flex-wrap:wrap; gap:0.4rem;">
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('1', 'TO_STATION')">CSMT (Code 1)</button>
                <button class="reply-pill" style="border-color:#c2410c; color:#c2410c;" onclick="SignBridgeApp.selectDirectStation('17.1', 'TO_STATION')">⚡ Airoli (Code 17.1)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('16', 'TO_STATION')">Thane (Code 16)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('18', 'TO_STATION')">Dombivli (Code 18)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('19', 'TO_STATION')">Kalyan (Code 19)</button>
                <button class="reply-pill" onclick="SignBridgeApp.selectDirectStation('20', 'TO_STATION')">Titwala (Code 20)</button>
              </div>
            </div>
          </div>
        `;
      } else if (field === 'PASSENGER_COUNT') {
        html = `
          <div class="railway-flow-card">
            <div class="step-guide-banner">
              <span class="step-pill">Step 3 of 5</span>
              <strong>Select Number of Passengers (Sign 1 to 4)</strong>
              <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back</button>
            </div>

            <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:0.75rem; margin-top:0.75rem;">
              <button class="num-selector-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'passenger_count', value:1})">
                <span class="ns-icon">☝️</span>
                <span class="ns-num">1</span>
                <span class="ns-sub">1 Passenger</span>
              </button>
              <button class="num-selector-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'passenger_count', value:2})">
                <span class="ns-icon">✌️</span>
                <span class="ns-num">2</span>
                <span class="ns-sub">2 Passengers</span>
              </button>
              <button class="num-selector-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'passenger_count', value:3})">
                <span class="ns-icon">🤟</span>
                <span class="ns-num">3</span>
                <span class="ns-sub">3 Passengers</span>
              </button>
              <button class="num-selector-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'passenger_count', value:4})">
                <span class="ns-icon">🖖</span>
                <span class="ns-num">4</span>
                <span class="ns-sub">4 Passengers</span>
              </button>
            </div>
          </div>
        `;
      } else if (field === 'JOURNEY_TYPE') {
        html = `
          <div class="railway-flow-card">
            <div class="step-guide-banner">
              <span class="step-pill">Journey Type</span>
              <strong>Select Single or Return Journey</strong>
              <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back</button>
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:0.75rem;">
              <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'journey_type', value:'Single Journey'})">
                <span class="choice-num-badge">1</span>
                <span class="choice-icon">➡️</span>
                <div class="choice-text">
                  <strong>Single Journey</strong>
                  <div class="choice-sub">One-way travel ticket (1x Fare)</div>
                </div>
              </button>

              <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'journey_type', value:'Return Journey'})">
                <span class="choice-num-badge">2</span>
                <span class="choice-icon">🔁</span>
                <div class="choice-text">
                  <strong>Return Journey</strong>
                  <div class="choice-sub">Valid for return on the same day (2x Fare)</div>
                </div>
              </button>
            </div>
          </div>
        `;
      } else if (field === 'TICKET_TYPE') {
        const count = booking.passenger_count || 1;
        const mult = booking.journey_type === 'Return Journey' ? 2 : 1;

        html = `
          <div class="railway-flow-card">
            <div class="step-guide-banner">
              <span class="step-pill">Step 4 of 5</span>
              <strong>Select Ticket Class & Concession</strong>
              <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back</button>
            </div>

            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:0.75rem; margin-top:0.75rem;">
              <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'ticket_type', value:{label:'Second Class Ordinary', base_fare:15}})">
                <span class="choice-num-badge">1</span>
                <div class="choice-text">
                  <strong>Second Class (II Ord)</strong>
                  <div class="choice-sub">Total: ₹${15 * count * mult} (${count} Pax)</div>
                </div>
              </button>

              <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'ticket_type', value:{label:'First Class', base_fare:105}})">
                <span class="choice-num-badge">2</span>
                <div class="choice-text">
                  <strong>First Class (FC)</strong>
                  <div class="choice-sub">Total: ₹${105 * count * mult} (${count} Pax)</div>
                </div>
              </button>

              <button class="menu-choice-btn" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'ticket_type', value:{label:'AC Local Train', base_fare:65}})">
                <span class="choice-num-badge">3</span>
                <div class="choice-text">
                  <strong>AC Local Train</strong>
                  <div class="choice-sub">Total: ₹${65 * count * mult} (${count} Pax)</div>
                </div>
              </button>

              <button class="menu-choice-btn" style="border-color:#16a34a; background:#f0fdf4;" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'ticket_type', value:{label:'Divyangjan Accessible Concession (75% Off)', base_fare:5}})">
                <span class="choice-num-badge" style="background:#16a34a;">4</span>
                <div class="choice-text">
                  <strong style="color:#15803d;">Divyangjan Concession</strong>
                  <div class="choice-sub">75% Concession • Total: ₹${5 * count * mult}</div>
                </div>
              </button>
            </div>
          </div>
        `;
      } else if (field === 'REVIEW') {
        html = `
          <div class="railway-flow-card">
            <div class="step-guide-banner">
              <span class="step-pill">Step 5 of 5</span>
              <strong>Review Demo Booking Details</strong>
              <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back</button>
            </div>

            <div style="background:#f8fafc; border:1px solid #cbd5e1; border-radius:10px; padding:1.25rem; margin:0.75rem 0;">
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.9rem;">
                <div>
                  <span style="color:var(--text-muted); font-size:0.78rem; text-transform:uppercase; font-weight:700;">Origin (From):</span>
                  <div style="font-weight:800; font-size:1.05rem; color:#0f2744;">${booking.from || 'Not Set'}</div>
                  <button class="btn-link" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'edit_field', value:'FROM_STATION'})">✏️ Edit Origin</button>
                </div>
                <div>
                  <span style="color:var(--text-muted); font-size:0.78rem; text-transform:uppercase; font-weight:700;">Destination (To):</span>
                  <div style="font-weight:800; font-size:1.05rem; color:#0f2744;">${booking.to || 'Not Set'}</div>
                  <button class="btn-link" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'edit_field', value:'TO_STATION'})">✏️ Edit Destination</button>
                </div>
                <div>
                  <span style="color:var(--text-muted); font-size:0.78rem; text-transform:uppercase; font-weight:700;">Passengers & Journey:</span>
                  <div style="font-weight:700;">${booking.passenger_count || 1} Person(s) • ${booking.journey_type || 'Single Journey'}</div>
                  <button class="btn-link" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'edit_field', value:'PASSENGER_COUNT'})">✏️ Edit Passengers</button>
                </div>
                <div>
                  <span style="color:var(--text-muted); font-size:0.78rem; text-transform:uppercase; font-weight:700;">Ticket Class:</span>
                  <div style="font-weight:700;">${booking.ticket_type || 'Second Class Ordinary'}</div>
                  <button class="btn-link" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'edit_field', value:'TICKET_TYPE'})">✏️ Edit Class</button>
                </div>
              </div>

              <div style="border-top:2px dashed #cbd5e1; margin-top:1rem; padding-top:0.75rem; display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Total Estimated Fare</div>
                  <div style="font-size:1.6rem; font-weight:900; color:#0d9488;">₹${booking.fare || 15}</div>
                </div>
                <div style="display:flex; gap:0.5rem;">
                  <button class="btn-primary" style="padding:0.65rem 1.25rem; font-size:0.95rem;" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'confirm_review', value:true})">
                    ✓ Confirm Booking (Proceed to Demo Payment) →
                  </button>
                </div>
              </div>
            </div>
          </div>
        `;
      } else if (field === 'PAYMENT') {
        html = `
          <div class="railway-flow-card">
            <div class="step-guide-banner">
              <span class="step-pill" style="background:#fee2e2; color:#991b1b;">Demo Payment</span>
              <strong>Simulated Fare Payment Desk</strong>
              <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back</button>
            </div>

            <!-- Prominent Demo Disclaimer -->
            <div style="background:#fef2f2; border:2px solid #ef4444; border-radius:8px; padding:0.75rem; color:#991b1b; font-size:0.85rem; font-weight:700; margin:0.75rem 0;">
              ⚠️ DEMO ONLY — NO PAYMENT PROCESSED. Zero real financial transaction occurs.
            </div>

            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:10px; padding:1.25rem; margin-bottom:1rem;">
              <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #e2e8f0; padding-bottom:0.75rem;">
                <span>Total Demo Amount Due:</span>
                <span style="font-size:1.5rem; font-weight:900; color:#0d9488;">₹${booking.fare || 15}</span>
              </div>

              <div style="margin-top:0.75rem; font-size:0.85rem; font-weight:800; color:var(--text-secondary); text-transform:uppercase;">
                Choose Simulated Demo Payment Method:
              </div>

              <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:0.6rem; margin-top:0.5rem;">
                <button class="menu-choice-btn" onclick="SignBridgeApp.completeDemoPayment('Cash at Counter Window')">
                  <span class="choice-icon">💵</span>
                  <div class="choice-text">
                    <strong>Cash at Window</strong>
                    <div class="choice-sub">Simulate cash handover</div>
                  </div>
                </button>

                <button class="menu-choice-btn" onclick="SignBridgeApp.completeDemoPayment('Demo UPI QR Code')">
                  <span class="choice-icon">📱</span>
                  <div class="choice-text">
                    <strong>UPI QR Demo</strong>
                    <div class="choice-sub">Simulate UPI scan</div>
                  </div>
                </button>

                <button class="menu-choice-btn" onclick="SignBridgeApp.completeDemoPayment('Divyangjan Concession Pass')">
                  <span class="choice-icon">♿</span>
                  <div class="choice-text">
                    <strong>Concession Pass</strong>
                    <div class="choice-sub">Disability card waiver</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        `;
      } else if (field === 'SUMMARY_CONFIRMED') {
        const pnr = state.demo_pnr || 'DEMO-782-9912';
        html = `
          <div class="railway-flow-card">
            <div class="railway-ticket-slip animate-pop" id="ticketSlipDisplay">
              <div class="ticket-header-strip">
                <div>
                  <div style="font-size:1.15rem; font-weight:900; color:#92400e; letter-spacing:-0.01em;">
                    INDIAN RAILWAYS — PASSENGER RESERVATION DEMO SLIP
                  </div>
                  <div style="font-size:0.75rem; color:#78350f; font-weight:700;">
                    MUMBAI SUBURBAN ACCESSIBILITY DEMONSTRATION
                  </div>
                </div>
                <div class="ticket-pnr-banner">PNR: ${pnr}</div>
              </div>

              <div class="ticket-route-display">
                <div>
                  <div style="font-size:0.75rem; color:#92400e; text-transform:uppercase;">Origin</div>
                  <div class="ticket-station-name">${booking.from || 'CSMT'}</div>
                </div>
                <div class="ticket-arrow">➔</div>
                <div>
                  <div style="font-size:0.75rem; color:#92400e; text-transform:uppercase;">Destination</div>
                  <div class="ticket-station-name">${booking.to || 'Airoli'}</div>
                </div>
              </div>

              <div class="ticket-details-grid">
                <div><strong>Class:</strong> ${booking.ticket_type || 'Second Class Ordinary'}</div>
                <div><strong>Journey:</strong> ${booking.journey_type || 'Single Journey'}</div>
                <div><strong>Passengers:</strong> ${booking.passenger_count || 1} Person(s)</div>
                <div><strong>Total Fare:</strong> ₹${booking.fare || 15} (Demo Paid)</div>
                <div><strong>Issued At:</strong> SignBridge Self-Service Kiosk</div>
                <div><strong>Accessibility:</strong> Divyangjan Assist Registered</div>
              </div>

              <div class="ticket-demo-disclaimer">
                PROTOTYPE DEMONSTRATION SLIP ONLY • NOT VALID FOR ACTUAL TRAVEL
              </div>
            </div>

            <div style="display:flex; gap:0.5rem; margin-top:1rem;">
              <button class="btn-primary" onclick="SignBridgeApp.printTicketSlip()">
                🖨️ Print Ticket Slip
              </button>
              <button class="btn-ctrl" onclick="SignBridgeApp.sendAction('DIRECT_TOUCH_SELECT', {field:'reset_booking', value:true})">
                🚆 Book Another Ticket / Main Menu
              </button>
            </div>
          </div>
        `;
      }
    }

    // Step 3: Train Enquiry Screen
    else if (task === 'TRAIN_ENQUIRY') {
      html = `
        <div class="railway-flow-card">
          <div class="step-guide-banner">
            <span class="step-pill">Train Enquiry</span>
            <strong>Mumbai Suburban & Express Train Status</strong>
            <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back to Menu</button>
          </div>

          <div style="font-size:0.8rem; color:var(--text-muted); margin-bottom:0.75rem;">
            Notice: Static sample schedule data for college hackathon demonstration.
          </div>

          <div style="display:flex; flex-direction:column; gap:0.6rem;">
            <div class="enquiry-item-card" onclick="SignBridgeApp.sendAction('CONFIRM_PREDICTION', {number:1})">
              <div style="display:flex; justify-content:space-between; font-weight:800;">
                <span>12138 Punjab Mail (Express)</span>
                <span style="color:#059669;">Departs 19:35</span>
              </div>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">Route: CSMT → Kalyan → New Delhi • Platform 3</div>
              <div style="font-size:0.75rem; color:#0284c7; margin-top:2px;">♿ Divyangjan Coach adjacent to guard brake van</div>
            </div>

            <div class="enquiry-item-card" onclick="SignBridgeApp.sendAction('CONFIRM_PREDICTION', {number:2})">
              <div style="display:flex; justify-content:space-between; font-weight:800;">
                <span>Central Line Fast Local</span>
                <span style="color:#059669;">Every 12 mins</span>
              </div>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">Route: CSMT → Dadar → Kurla → Ghatkopar → Thane → Kalyan • Platform 4</div>
              <div style="font-size:0.75rem; color:#0284c7; margin-top:2px;">♿ Designated Handicapped Compartment: Coaches 4 & 9</div>
            </div>

            <div class="enquiry-item-card" onclick="SignBridgeApp.sendAction('CONFIRM_PREDICTION', {number:3})">
              <div style="display:flex; justify-content:space-between; font-weight:800;">
                <span>22221 Rajdhani Express</span>
                <span style="color:#059669;">Departs 16:00</span>
              </div>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:2px;">Route: CSMT → Kalyan → Jalgaon → Hazrat Nizamuddin • Platform 5</div>
              <div style="font-size:0.75rem; color:#0284c7; margin-top:2px;">♿ Wheelchair Battery Buggy available at Platform 5</div>
            </div>
          </div>
        </div>
      `;
    }

    // Step 4: Platform Enquiry Screen
    else if (task === 'PLATFORM_INFO') {
      html = `
        <div class="railway-flow-card">
          <div class="step-guide-banner">
            <span class="step-pill">Platform Information</span>
            <strong>Platform Allocations & Accessibility Amenities</strong>
            <button class="btn-ctrl" style="margin-left:auto; padding:2px 8px; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('NAVIGATE_BACK', {})">← Back to Menu</button>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; margin-top:0.75rem;">
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.85rem;">
              <strong style="color:#0f2744;">Platform 1 & 2 (Central Slow)</strong>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">Slow locals towards Thane & Kalyan</div>
              <div style="font-size:0.78rem; color:#15803d; margin-top:4px;">✓ Ramp Access at North Concourse</div>
            </div>

            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.85rem;">
              <strong style="color:#0f2744;">Platform 3 & 4 (Central Fast)</strong>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">Fast locals & Outstation trains</div>
              <div style="font-size:0.78rem; color:#15803d; margin-top:4px;">✓ Lift operational at Mid-FOB</div>
            </div>

            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.85rem;">
              <strong style="color:#0f2744;">Platform 5 & 6 (Outstation PRS)</strong>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">Long distance express departures</div>
              <div style="font-size:0.78rem; color:#15803d; margin-top:4px;">✓ Wheelchair Escort Booth #2</div>
            </div>

            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.85rem;">
              <strong style="color:#0f2744;">Trans-Harbour Platforms 9 & 10 (Thane)</strong>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">Trains towards Airoli, Vashi & Panvel</div>
              <div style="font-size:0.78rem; color:#15803d; margin-top:4px;">✓ Tactile paving path to FOB</div>
            </div>
          </div>
        </div>
      `;
    }

    els.workflowFormArea.innerHTML = html;

    // After rendering HTML, if we have a state machine HUD mount point, initialize and render it
    if (typeof RailwayStateMachine !== 'undefined' && document.getElementById('railwayStateMachineHUD')) {
      if (field === 'FROM_STATION') {
        RailwayStateMachine.setTargetField('FROM_STATION', onStationResolved);
      } else if (field === 'TO_STATION') {
        RailwayStateMachine.setTargetField('TO_STATION', onStationResolved);
      }
    }
  }

  function selectDirectStation(code, field) {
    if (typeof RailwayStateMachine !== 'undefined') {
      RailwayStateMachine.processGesture(code, true);
    } else {
      onStationResolved({ num_code: code }, field);
    }
  }

  function onStationResolved(station, targetField) {
    const fieldName = (targetField === 'FROM_STATION') ? 'from' : 'to';
    sendAction('DIRECT_TOUCH_SELECT', {
      field: fieldName,
      value: station.num_code || station.name
    });
  }

  function completeDemoPayment(method) {
    sendAction('DIRECT_TOUCH_SELECT', {
      field: 'confirm_payment',
      value: method
    });
  }

  function printTicketSlip() {
    window.print();
  }

  // =========================================================================
  // 2. HOSPITAL & DOCTOR CONSULTATION DESK
  // =========================================================================
  function renderHospitalForm(state) {
    const subMode = state.sub_mode || 'RECEPTION';
    const notes = state.consultation_notes || [];

    els.workflowFormArea.innerHTML = `
      <div class="railway-flow-card">
        <!-- Sub-mode toggle -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #cbd5e1; padding-bottom:0.6rem; margin-bottom:0.75rem;">
          <div style="display:flex; gap:0.4rem;">
            <button class="btn-ctrl ${subMode === 'RECEPTION' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SWITCH_HOSPITAL_MODE', {sub_mode:'RECEPTION'})">
              🏥 Reception Desk
            </button>
            <button class="btn-ctrl ${subMode === 'DOCTOR_CONSULTATION' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SWITCH_HOSPITAL_MODE', {sub_mode:'DOCTOR_CONSULTATION'})">
              🩺 Doctor Consultation Workspace
            </button>
          </div>
          <button class="btn-ctrl" style="border-color:#ef4444; color:#ef4444; font-size:0.78rem;" onclick="SignBridgeApp.sendAction('REQUEST_INTERPRETER', {})">
            🆘 Request Certified Sign Interpreter
          </button>
        </div>

        ${subMode === 'RECEPTION' ? `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.85rem;">
              <strong>OPD Token & Queue Status</strong>
              <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:3px;">
                Token: <strong style="color:#0d9488;">OPD-104 (General Medicine)</strong>
              </div>
              <div style="font-size:0.8rem; color:#15803d; margin-top:4px;">Priority Divyangjan counter: Room 12 Ground Floor</div>
            </div>

            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.85rem;">
              <strong>Hospital Amenities</strong>
              <div style="font-size:0.82rem; color:var(--text-secondary); margin-top:3px;">
                Wheelchair escort available at Gate #1.<br>
                Free medicine pharmacy at Counter #3.
              </div>
            </div>
          </div>
        ` : `
          <!-- Two-Way Doctor Consultation Workspace -->
          <div>
            <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:8px; padding:0.6rem; font-size:0.82rem; color:#166534; margin-bottom:0.75rem;">
              <strong>Two-Way Communication Active:</strong> Patient can sign or tap ISL medical gestures; Doctor can dictate via Speech-to-Text or type.
            </div>

            <div class="consultation-log" style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem; max-height:180px; overflow-y:auto; margin-bottom:0.75rem;">
              ${notes.length === 0 ? '<div style="color:#94a3b8; font-style:italic; font-size:0.82rem;">No consultation notes recorded yet. Doctor or patient may speak or sign.</div>' : ''}
              ${notes.map(n => `
                <div style="font-size:0.85rem; margin-bottom:0.4rem;">
                  <strong style="color:${n.sender === 'doctor' ? '#0369a1' : '#059669'};">${n.sender === 'doctor' ? '👨‍⚕️ Doctor' : '🧏 Patient'}:</strong>
                  <span>${n.text}</span>
                  <span style="font-size:0.7rem; color:#94a3b8; margin-left:4px;">${n.timestamp}</span>
                </div>
              `).join('')}
            </div>

            <div style="display:flex; gap:0.4rem; margin-bottom:0.6rem;">
              <input type="text" id="consultationMsgInput" class="form-input" placeholder="Patient symptoms or doctor advice..." style="flex:1;">
              <button class="btn-primary" onclick="SignBridgeApp.sendConsultationMsg('patient')">Patient Send</button>
              <button class="btn-ctrl" onclick="SignBridgeApp.sendConsultationMsg('doctor')">Doctor Send</button>
            </div>

            <div style="display:flex; flex-wrap:wrap; gap:0.35rem;">
              <button class="reply-pill" onclick="SignBridgeApp.sendConsultationQuick('Patient indicates fever and headache since 2 days.')">🤒 Fever / Headache</button>
              <button class="reply-pill" onclick="SignBridgeApp.sendConsultationQuick('Doctor prescribes blood test and paracetamol.')">💊 Prescribe Medicine</button>
              <button class="reply-pill" onclick="SignBridgeApp.sendConsultationQuick('Patient asks where is the pharmacy counter.')">❓ Where Pharmacy</button>
            </div>
          </div>
        `}
      </div>
    `;
  }

  function sendConsultationMsg(sender) {
    const input = document.getElementById('consultationMsgInput');
    if (!input || !input.value.trim()) return;
    sendAction('ADD_CONSULTATION_MESSAGE', { sender: sender, text: input.value.trim() });
    input.value = '';
  }

  function sendConsultationQuick(text) {
    sendAction('ADD_CONSULTATION_MESSAGE', { sender: 'patient', text: text });
  }

  // =========================================================================
  // 3. POLICE STATION FACILITATION DESK
  // =========================================================================
  function renderPoliceForm(state) {
    const cat = state.category || 'Lost Property Memo';
    const draft = state.draft_statement || '';
    const confirmed = state.statement_confirmed;
    const memoRef = state.memo_ref;

    els.workflowFormArea.innerHTML = `
      <div class="railway-flow-card">
        <div class="step-guide-banner" style="background:#eff6ff; color:#1e40af;">
          <span class="step-pill" style="background:#bfdbfe; color:#1e3a8a;">Police Desk</span>
          <strong>Citizen Complaint & Communication Assistance</strong>
          <button class="btn-ctrl" style="margin-left:auto; border-color:#ef4444; color:#ef4444; font-size:0.75rem;" onclick="SignBridgeApp.sendAction('REQUEST_INTERPRETER', {})">
            🆘 Legal Interpreter Escalation
          </button>
        </div>

        <div style="margin-top:0.75rem;">
          <label class="form-label">Complaint / Inconvenience Category:</label>
          <div style="display:flex; flex-wrap:wrap; gap:0.4rem; margin-bottom:0.75rem;">
            <button class="reply-pill ${cat === 'Lost Property Memo' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('UPDATE_COMPLAINT_CATEGORY', {category:'Lost Property Memo'})">📱 Lost Property (Mobile / Bag)</button>
            <button class="reply-pill ${cat === 'Cyber Fraud / UPI' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('UPDATE_COMPLAINT_CATEGORY', {category:'Cyber Fraud / UPI'})">💳 Cyber / UPI Fraud</button>
            <button class="reply-pill ${cat === 'Public Harassment' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('UPDATE_COMPLAINT_CATEGORY', {category:'Public Harassment'})">🛡️ Harassment / Threat</button>
            <button class="reply-pill ${cat === 'General Verification' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('UPDATE_COMPLAINT_CATEGORY', {category:'General Verification'})">📜 Tenant / ID Verification</button>
          </div>

          <label class="form-label">Draft Citizen Statement (Editable for Review):</label>
          <textarea id="policeStatementInput" class="form-input" style="height:80px; width:100%; margin-bottom:0.5rem;" placeholder="Type or dictate details of the incident...">${draft || 'Lost black backpack containing college ID and mobile phone near Platform 4 at 16:30 hours.'}</textarea>

          <div style="display:flex; justify-content:space-between; align-items:center;">
            <button class="btn-ctrl" onclick="SignBridgeApp.updatePoliceDraft()">💾 Update Statement Text</button>
            ${!confirmed ? `
              <button class="btn-primary" onclick="SignBridgeApp.sendAction('CONFIRM_STATEMENT', {})">
                ✓ Explicit Citizen Review & Confirmation
              </button>
            ` : `
              <div style="color:#059669; font-weight:800; font-size:0.95rem;">
                ✓ Confirmed! Ref Memo: <span style="font-family:monospace; background:#ecfdf5; padding:2px 8px; border-radius:4px;">${memoRef}</span>
              </div>
            `}
          </div>

          <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:0.5rem; color:#991b1b; font-size:0.75rem; margin-top:0.75rem;">
            Legal Safeguard Notice: SignBridge drafts communication memos for officer facilitation. Official First Information Reports (FIRs) under Bharatiya Nagarik Suraksha Sanhita (BNSS) require sworn deposition.
          </div>
        </div>
      </div>
    `;
  }

  function updatePoliceDraft() {
    const val = document.getElementById('policeStatementInput')?.value || '';
    sendAction('UPDATE_STATEMENT_TEXT', { statement: val });
  }

  // =========================================================================
  // 4. BANK BRANCH CUSTOMER DESK
  // =========================================================================
  function renderBankForm(state) {
    const tab = state.active_tab || 'ACCOUNT_OPENING';

    els.workflowFormArea.innerHTML = `
      <div class="railway-flow-card">
        <div style="display:flex; gap:0.4rem; border-bottom:1px solid #cbd5e1; padding-bottom:0.6rem; margin-bottom:0.75rem;">
          <button class="btn-ctrl ${tab === 'ACCOUNT_OPENING' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SWITCH_BANK_TAB', {tab:'ACCOUNT_OPENING'})">
            🏦 Account Opening
          </button>
          <button class="btn-ctrl ${tab === 'COUNTER_SERVICES' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SWITCH_BANK_TAB', {tab:'COUNTER_SERVICES'})">
            💳 Counter Services
          </button>
          <button class="btn-ctrl ${tab === 'OFFICIAL_LINKS' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SWITCH_BANK_TAB', {tab:'OFFICIAL_LINKS'})">
            🔗 Verified Official Portals
          </button>
        </div>

        ${tab === 'ACCOUNT_OPENING' ? `
          <div>
            <div style="font-weight:800; color:#0f2744; margin-bottom:0.4rem;">Savings Bank Account Required Documents:</div>
            <ul style="font-size:0.85rem; line-height:1.7; margin-left:1.25rem; color:var(--text-secondary);">
              <li>✓ Aadhaar Card (Demographic verification)</li>
              <li>✓ PAN Card or Form 60</li>
              <li>✓ 2 Passport Sized Photographs</li>
              <li>✓ Swavlamban UDID Disability Card (For Divyangjan Special Zero-Balance Account)</li>
            </ul>
            <div style="background:#f0fdfa; border:1px solid #99f6e4; border-radius:6px; padding:0.6rem; font-size:0.8rem; color:#115e59; margin-top:0.75rem;">
              Divyangjan Advantage: Priority window #1 with accessible lower counter coping and audio-visual token bell.
            </div>
          </div>
        ` : tab === 'COUNTER_SERVICES' ? `
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.6rem;">
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem;">
              <strong>Passbook Printing</strong>
              <div style="font-size:0.8rem; color:var(--text-secondary);">Self-service barcode machine located at branch entrance.</div>
            </div>
            <div style="background:#ffffff; border:1px solid #cbd5e1; border-radius:8px; padding:0.75rem;">
              <strong>Pension Life Certificate (Jeevan Pramaan)</strong>
              <div style="font-size:0.8rem; color:var(--text-secondary);">Digital biometric verification window open 10:00 to 14:00.</div>
            </div>
          </div>
        ` : `
          <div>
            <div style="font-weight:800; margin-bottom:0.4rem;">Official RBI & SBI Portals (Verified Links):</div>
            <div style="display:flex; flex-direction:column; gap:0.5rem; font-size:0.85rem;">
              <a href="https://rbi.org.in" target="_blank" rel="noopener" style="color:#0284c7; font-weight:700;">🌐 Reserve Bank of India — Financial Inclusion Portal (rbi.org.in) ↗</a>
              <a href="https://bank.sbi" target="_blank" rel="noopener" style="color:#0284c7; font-weight:700;">🌐 State Bank of India — Official Accessible Banking (bank.sbi) ↗</a>
            </div>
          </div>
        `}

        <div style="background:#fef2f2; border:1px solid #fecaca; border-radius:6px; padding:0.5rem; color:#991b1b; font-size:0.75rem; margin-top:0.75rem;">
          Financial Safety Rule: SignBridge NEVER asks for, stores, or processes PIN numbers, passwords, OTPs, or CVVs. Real financial transactions are conducted strictly at official bank counters.
        </div>
      </div>
    `;
  }

  // =========================================================================
  // 5. GOVERNMENT SEVA KENDRA DESK
  // =========================================================================
  function renderGovtForm(state) {
    const scheme = state.active_scheme || 'AADHAAR_UPDATE';

    els.workflowFormArea.innerHTML = `
      <div class="railway-flow-card">
        <div style="display:flex; gap:0.4rem; border-bottom:1px solid #cbd5e1; padding-bottom:0.6rem; margin-bottom:0.75rem; flex-wrap:wrap;">
          <button class="btn-ctrl ${scheme === 'AADHAAR_UPDATE' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SELECT_GOVT_SCHEME', {scheme:'AADHAAR_UPDATE'})">
            🪪 Aadhaar Update
          </button>
          <button class="btn-ctrl ${scheme === 'UDID_DISABILITY' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SELECT_GOVT_SCHEME', {scheme:'UDID_DISABILITY'})">
            ♿ Swavlamban UDID
          </button>
          <button class="btn-ctrl ${scheme === 'RATION_CARD' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SELECT_GOVT_SCHEME', {scheme:'RATION_CARD'})">
            🍚 Ration Card
          </button>
          <button class="btn-ctrl ${scheme === 'PENSION' ? 'active' : ''}" onclick="SignBridgeApp.sendAction('SELECT_GOVT_SCHEME', {scheme:'PENSION'})">
            👵 Divyangjan Pension
          </button>
        </div>

        ${scheme === 'AADHAAR_UPDATE' ? `
          <div>
            <strong style="color:#0f2744;">Aadhaar Demographic & Biometric Update Process:</strong>
            <ul style="font-size:0.85rem; line-height:1.7; margin-left:1.25rem; color:var(--text-secondary); margin-top:4px;">
              <li>1. Collect Form 1 from the Seva Kendra token desk.</li>
              <li>2. Attach original Proof of Identity (UDID / Voter ID / Passport).</li>
              <li>3. Biometric iris & fingerprint scan at Counter 2.</li>
              <li>4. Collect update acknowledgment slip with URN.</li>
            </ul>
            <a href="https://uidai.gov.in" target="_blank" rel="noopener" style="font-size:0.82rem; color:#0284c7; font-weight:700; display:inline-block; margin-top:0.5rem;">Official UIDAI Portal: https://uidai.gov.in ↗</a>
          </div>
        ` : scheme === 'UDID_DISABILITY' ? `
          <div>
            <strong style="color:#0f2744;">Swavlamban UDID (Unique Disability Identity Card):</strong>
            <ul style="font-size:0.85rem; line-height:1.7; margin-left:1.25rem; color:var(--text-secondary); margin-top:4px;">
              <li>✓ Issued by Department of Empowerment of Persons with Disabilities.</li>
              <li>✓ Universal pan-India validity across Indian Railways, state transports, and schemes.</li>
              <li>✓ Medical assessment board appointment issued online.</li>
            </ul>
            <a href="https://swavlambancard.gov.in" target="_blank" rel="noopener" style="font-size:0.82rem; color:#0284c7; font-weight:700; display:inline-block; margin-top:0.5rem;">Official UDID Portal: https://swavlambancard.gov.in ↗</a>
          </div>
        ` : `
          <div>
            <strong style="color:#0f2744;">Public Welfare Verification:</strong>
            <div style="font-size:0.85rem; color:var(--text-secondary); margin-top:4px;">
              Guidance verified against Ministry of Social Justice and Empowerment guidelines. Direct citizen facilitation desk.
            </div>
          </div>
        `}
      </div>
    `;
  }

  // =========================================================================
  // SCALABLE ISL DICTIONARY INTEGRATION
  // =========================================================================
  function populateDictionaryCategories(categories) {
    const select = document.getElementById('dictCategorySelect');
    if (!select) return;

    select.innerHTML = `<option value="">All Categories (${categories.length})</option>` +
      categories.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  function openDictionaryModal() {
    if (els.dictionaryModal) {
      els.dictionaryModal.classList.add('open');
      renderDictionaryCards(dictionaryEntries);
    }
  }

  function handleDictionarySearch() {
    const query = (document.getElementById('dictSearchInput')?.value || '').toLowerCase().trim();
    const category = document.getElementById('dictCategorySelect')?.value || '';

    let filtered = dictionaryEntries.filter(entry => {
      const matchCat = !category || entry.category === category;
      const matchQuery = !query || 
        (entry.gloss && entry.gloss.toLowerCase().includes(query)) ||
        (entry.english_meaning && entry.english_meaning.toLowerCase().includes(query)) ||
        (entry.hindi_label && entry.hindi_label.toLowerCase().includes(query)) ||
        (entry.tags && entry.tags.some(t => t.toLowerCase().includes(query)));
      return matchCat && matchQuery;
    });

    renderDictionaryCards(filtered);
  }

  function searchFromHeroInput() {
    const val = (els.heroDictSearchInput?.value || '').trim();
    if (!val) {
      openDictionaryModal();
      return;
    }
    openDictionaryModal();
    const input = document.getElementById('dictSearchInput');
    if (input) {
      input.value = val;
      handleDictionarySearch();
    }
  }

  function quickSearchDict(term) {
    openDictionaryModal();
    const input = document.getElementById('dictSearchInput');
    if (input) {
      input.value = term;
      handleDictionarySearch();
    }
  }

  function renderDictionaryCards(entries) {
    const grid = document.getElementById('dictCardsGrid');
    const meta = document.getElementById('dictResultsMeta');
    if (!grid) return;

    if (meta) {
      meta.textContent = `Showing ${entries.length} verified Indian Sign Language entries:`;
    }

    if (entries.length === 0) {
      grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:2rem; color:var(--text-muted);">No dictionary signs found matching your query.</div>`;
      return;
    }

    grid.innerHTML = entries.map(entry => `
      <div class="dict-card">
        <div class="dict-card-top">
          <span class="dict-gloss">${entry.gloss}</span>
          <span class="dict-badge-verified">✓ ${entry.verification_status || 'VERIFIED'}</span>
        </div>
        <div class="dict-hindi">${entry.hindi_label || ''}</div>
        <div class="dict-meaning">${entry.english_meaning || ''}</div>
        <div style="font-size:0.75rem; color:var(--text-muted); margin-bottom:0.4rem;">
          Category: <strong>${entry.category || 'General'}</strong>
        </div>
        <div class="dict-islrtc-cite">
          📚 ${entry.islrtc_reference || 'ISLRTC Official Lexicon'}
        </div>
      </div>
    `).join('');
  }

  // =========================================================================
  // CAMERA DETECTION DISPATCHER
  // =========================================================================
  function onSignDetected(e) {
    const detail = e.detail;
    const now = Date.now();

    // Debounce rapid repeats
    if (detail.sign === lastProcessedSign && (now - lastSignTime < 1800)) {
      return;
    }
    lastProcessedSign = detail.sign;
    lastSignTime = now;

    // If Railway and waiting for station code, feed to Multi-Gesture State Machine
    if (currentService === 'railway' && 
        currentState.active_task === 'TICKET_BOOKING' && 
        ['FROM_STATION', 'TO_STATION'].includes(currentState.current_field)) {
      if (typeof RailwayStateMachine !== 'undefined') {
        RailwayStateMachine.processGesture(detail.sign, false);
      }
    }

    // If Namaste signed on main menu, initiate greeting
    if (detail.sign === 'NAMASTE' && currentService === 'railway' && currentState.active_task === 'MAIN_MENU') {
      sendAction('NAMASTE_GREETING', {});
    }

    // Update gauge text
    const detEl = document.getElementById('detectedSignText');
    if (detEl) detEl.textContent = `${detail.label} (${detail.sign})`;

    // Check if ambiguous (confidence between 50% and 75%)
    if (detail.confidence >= 0.50 && detail.confidence < 0.78) {
      const banner = document.getElementById('confirmationBanner');
      if (banner) {
        document.getElementById('confSignName').textContent = detail.label;
        document.getElementById('confScore').textContent = Math.round(detail.confidence * 100) + '%';
        banner.classList.add('active');
      }
    }
  }

  async function sendAction(actionType, payload) {
    if (!currentSessionId) return;

    try {
      const resp = await fetch(`/api/sessions/${currentSessionId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType, payload: payload })
      });
      const data = await resp.json();
      if (data.status === 'success') {
        currentState = data.state || {};
        currentStage = data.stage || 'MAIN_MENU';
        lastMessageCount = (data.messages || []).length;
        renderTranscript(data.messages || []);
        renderStepper(currentService, currentState);
        renderWorkflowForm(currentService, currentState);

        if (data.bot_reply) {
          speakText(data.bot_reply);
        }
      }
    } catch (err) {
      console.error("Action error:", err);
    }
  }

  function sendOfficerMessage(text) {
    if (!text || !text.trim()) return;
    sendAction('OFFICER_MESSAGE', { text: text.trim() });
    if (els.speechInput) els.speechInput.value = '';
    speakText(text);
  }

  function filterTactileCategory(cat, tabEl) {
    currentTactileCategory = cat;
    document.querySelectorAll('.tactile-tab-btn').forEach(b => b.classList.remove('active'));
    if (tabEl) tabEl.classList.add('active');
    renderTactilePalette(cat);
  }

  function renderTactilePalette(category) {
    const container = document.getElementById('tactileChipsGrid');
    if (!container) return;

    const filtered = ALL_SIGNS.filter(s => s.category === category);

    container.innerHTML = filtered.map(s => `
      <button class="tactile-chip" 
              onclick="SignBridgeApp.sendTactileSign('${s.key}', '${s.name}')"
              title="Tactile Sign: ${s.name} (${s.hindi})">
        <span style="font-size:1.35rem;">${s.icon}</span>
        <span>${s.name}</span>
        <span class="chip-sub">${s.hindi}</span>
      </button>
    `).join('');
  }

  function sendTactileSign(key, label) {
    // If selecting station in Railway, pass token to state machine
    if (currentService === 'railway' && 
        currentState.active_task === 'TICKET_BOOKING' && 
        ['FROM_STATION', 'TO_STATION'].includes(currentState.current_field)) {
      if (typeof RailwayStateMachine !== 'undefined') {
        RailwayStateMachine.processGesture(key, true);
        return;
      }
    }

    sendAction('CONFIRM_PREDICTION', { sign: key, number: key.replace('NUMBER_', ''), label: label });
  }

  function bindUIEvents() {
    if (els.btnStartCam) {
      els.btnStartCam.addEventListener('click', () => {
        CameraController.startCamera();
      });
    }

    if (els.btnToggleCam) {
      els.btnToggleCam.addEventListener('click', () => {
        CameraController.toggleCamera();
      });
    }

    if (els.btnSendOfficer && els.speechInput) {
      els.btnSendOfficer.addEventListener('click', () => {
        sendOfficerMessage(els.speechInput.value);
      });

      els.speechInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          sendOfficerMessage(els.speechInput.value);
        }
      });
    }

    // Confirmation banner buttons
    const btnConfYes = document.getElementById('btnConfYes');
    const btnConfRepeat = document.getElementById('btnConfRepeat');
    const btnConfCancel = document.getElementById('btnConfCancel');

    if (btnConfYes) {
      btnConfYes.addEventListener('click', () => {
        const last = CameraController.getLastPrediction();
        if (last && last.sign) {
          sendAction('CONFIRM_PREDICTION', { sign: last.sign, label: last.label });
        }
        document.getElementById('confirmationBanner').classList.remove('active');
      });
    }

    if (btnConfRepeat) {
      btnConfRepeat.addEventListener('click', () => {
        document.getElementById('confirmationBanner').classList.remove('active');
      });
    }

    if (btnConfCancel) {
      btnConfCancel.addEventListener('click', () => {
        document.getElementById('confirmationBanner').classList.remove('active');
      });
    }

    if (els.inputJoinRoomCode) {
      els.inputJoinRoomCode.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          joinRoomByCode();
        }
      });
    }
  }

  // =========================================================================
  // SPEECH RECOGNITION & SYNTHESIS
  // =========================================================================
  function setupSpeechIO() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      speechRecognizer = new SpeechRecognition();
      speechRecognizer.continuous = false;
      speechRecognizer.interimResults = false;
      speechRecognizer.lang = 'en-IN';

      speechRecognizer.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (els.speechInput) {
          els.speechInput.value = transcript;
        }
        sendOfficerMessage(transcript);
        stopSpeechRecording();
      };

      speechRecognizer.onerror = () => {
        stopSpeechRecording();
      };

      speechRecognizer.onend = () => {
        stopSpeechRecording();
      };
    }

    if (els.btnMic) {
      els.btnMic.addEventListener('click', toggleSpeechRecording);
    }
  }

  function toggleSpeechRecording() {
    if (!speechRecognizer) {
      alert("Web Speech API is not supported in this browser. Please type officer responses in the text box.");
      return;
    }
    if (isRecordingSpeech) {
      speechRecognizer.stop();
      stopSpeechRecording();
    } else {
      speechRecognizer.start();
      isRecordingSpeech = true;
      if (els.btnMic) {
        els.btnMic.style.background = '#dc2626';
        els.btnMic.innerHTML = '<span>🔴</span><span>Listening...</span>';
      }
    }
  }

  function stopSpeechRecording() {
    isRecordingSpeech = false;
    if (els.btnMic) {
      els.btnMic.style.background = '#1e293b';
      els.btnMic.innerHTML = '<span>🎙️</span><span>Speak (Mic)</span>';
    }
  }

  function speakText(text) {
    if (!isTTSVoiceEnabled || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-IN';
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS speak failed:", e);
    }
  }

  // =========================================================================
  // ACCESSIBILITY & VIEW MODES
  // =========================================================================
  function setupAccessibility() {
    const btnHighContrast = document.getElementById('btnHighContrast');
    const btnFontSize = document.getElementById('btnFontSize');
    const btnVoiceToggle = document.getElementById('btnVoiceToggle');

    if (btnHighContrast) {
      btnHighContrast.addEventListener('click', () => {
        isHighContrast = !isHighContrast;
        document.body.classList.toggle('high-contrast', isHighContrast);
        btnHighContrast.textContent = isHighContrast ? '👁️ Contrast ON' : '👁️ Contrast';
      });
    }

    if (btnFontSize) {
      btnFontSize.addEventListener('click', () => {
        if (fontScale === 'normal') {
          fontScale = 'large';
          document.body.classList.add('font-large');
          document.body.classList.remove('font-xlarge');
          btnFontSize.textContent = 'A++ Text';
        } else if (fontScale === 'large') {
          fontScale = 'xlarge';
          document.body.classList.remove('font-large');
          document.body.classList.add('font-xlarge');
          btnFontSize.textContent = 'A Text';
        } else {
          fontScale = 'normal';
          document.body.classList.remove('font-large', 'font-xlarge');
          btnFontSize.textContent = 'A+ Text';
        }
      });
    }

    if (btnVoiceToggle) {
      btnVoiceToggle.addEventListener('click', () => {
        isTTSVoiceEnabled = !isTTSVoiceEnabled;
        btnVoiceToggle.textContent = isTTSVoiceEnabled ? '🔊 Audio ON' : '🔇 Audio OFF';
      });
    }
  }

  function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      if (e.key >= '1' && e.key <= '4') {
        const num = parseInt(e.key, 10);
        sendAction('CONFIRM_PREDICTION', { number: num });
      } else if (e.key === 'y' || e.key === 'Y') {
        sendAction('CONFIRM_PREDICTION', { sign: 'YES' });
      } else if (e.key === 'n' || e.key === 'N') {
        sendAction('NAVIGATE_BACK', {});
      }
    });
  }

  function setViewMode(mode) {
    document.body.classList.remove('mode-kiosk', 'mode-citizen', 'mode-officer');
    document.body.classList.add(`mode-${mode}`);

    document.querySelectorAll('.view-btn').forEach(b => {
      if (b.getAttribute('data-mode') === mode) {
        b.classList.add('active');
      } else {
        b.classList.remove('active');
      }
    });
  }

  // =========================================================================
  // DUAL-DEVICE ROOM MODAL & PAIRING
  // =========================================================================
  function openRoomModal() {
    if (els.modalRoomCode) {
      els.modalRoomCode.textContent = currentSessionId || 'SB-INIT';
    }
    if (els.inputJoinRoomCode) {
      els.inputJoinRoomCode.value = '';
    }
    if (els.joinRoomError) {
      els.joinRoomError.style.display = 'none';
    }
    if (els.roomModal) {
      els.roomModal.classList.add('open');
    }
  }

  function copyRoomLink() {
    const fullUrl = `${window.location.origin}${window.location.pathname}?session=${currentSessionId}`;
    navigator.clipboard?.writeText(fullUrl);
    alert(`Link copied to clipboard!\n\nOpen on 2nd device:\n${fullUrl}`);
  }

  async function joinRoomByCode() {
    const code = (els.inputJoinRoomCode?.value || '').trim().toUpperCase();
    if (!code) return;

    try {
      const resp = await fetch('/api/sessions/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_code: code })
      });
      const data = await resp.json();
      if (data.status === 'success') {
        applySessionData(data);
        closeModal('roomModal');
      } else {
        if (els.joinRoomError) {
          els.joinRoomError.textContent = data.message || "Room code not found.";
          els.joinRoomError.style.display = 'block';
        }
      }
    } catch (e) {
      if (els.joinRoomError) {
        els.joinRoomError.textContent = "Error connecting to room.";
        els.joinRoomError.style.display = 'block';
      }
    }
  }

  async function openHistoryModal() {
    if (!els.historyModal) return;
    els.historyModal.classList.add('open');

    try {
      const resp = await fetch('/api/history');
      const data = await resp.json();
      if (data.status === 'success') {
        const tbody = document.getElementById('historyTableBody');
        if (tbody) {
          const records = data.records || [];
          if (records.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color:var(--text-muted);">No saved service records yet.</td></tr>`;
          } else {
            tbody.innerHTML = records.map(r => `
              <tr>
                <td><strong>${r.reference_no}</strong></td>
                <td>${r.service_type}</td>
                <td>${r.title}</td>
                <td>${r.created_at}</td>
              </tr>
            `).join('');
          }
        }
      }
    } catch (e) {
      console.error("Failed to load history:", e);
    }
  }

  function closeModal(modalId) {
    const m = document.getElementById(modalId);
    if (m) m.classList.remove('open');
  }

  // Auto-init on page load
  window.addEventListener('DOMContentLoaded', init);

  return {
    init,
    switchService,
    sendAction,
    sendOfficerMessage,
    sendTactileSign,
    selectDirectStation,
    completeDemoPayment,
    printTicketSlip,
    sendConsultationMsg,
    sendConsultationQuick,
    updatePoliceDraft,
    filterTactileCategory,
    setViewMode,
    openRoomModal,
    copyRoomLink,
    joinRoomByCode,
    openHistoryModal,
    openDictionaryModal,
    handleDictionarySearch,
    searchFromHeroInput,
    quickSearchDict,
    closeModal
  };
})();

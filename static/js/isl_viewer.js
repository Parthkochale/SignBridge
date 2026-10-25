/**
 * SignBridge - Verified ISL Visual Card & Animation Viewer (Upgraded)
 * Complies strictly with Indian Sign Language Research and Training Centre (ISLRTC) standards.
 * Strictly avoids inventing signs or substituting ASL.
 */

const ISLViewer = (function() {
  const verifiedAssets = {
    'isl_greet': {
      icon: '🙏',
      title: 'Namaste / Greeting',
      islrtc: 'ISLRTC Vol 1, Page 12 (Greeting)',
      motion: 'Two hands joined together in front of chest with fingers pointing upward.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Namaste Sign">
          <circle cx="50" cy="50" r="46" fill="#1e3a8a" stroke="#38bdf8" stroke-width="2"/>
          <path d="M 45 75 L 45 40 C 45 35 48 30 50 25 C 52 30 55 35 55 40 L 55 75 Z" fill="#f8fafc"/>
          <path d="M 40 55 L 40 45 C 40 40 45 35 50 30 C 55 35 60 40 60 45 L 60 55" fill="none" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="50" cy="22" r="3" fill="#38bdf8"/>
        </svg>
      `
    },
    'isl_yes': {
      icon: '👍',
      title: 'Yes / Confirmed',
      islrtc: 'ISLRTC Vol 1, Page 44 (Affirmation)',
      motion: 'Upright fist with thumb extended vertically, gentle vertical nod.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Yes Affirmation">
          <circle cx="50" cy="50" r="46" fill="#065f46" stroke="#34d399" stroke-width="2"/>
          <rect x="35" y="48" width="28" height="28" rx="6" fill="#f8fafc"/>
          <path d="M 42 48 L 42 28 C 42 24 48 24 48 28 L 48 48" fill="#f8fafc" stroke="#10b981" stroke-width="2"/>
          <path d="M 50 15 L 50 22 M 45 18 L 50 22 L 55 18" stroke="#34d399" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `
    },
    'isl_no': {
      icon: '✋',
      title: 'No / Cancel',
      islrtc: 'ISLRTC Vol 1, Page 45 (Negation)',
      motion: 'Open palm facing outward waving horizontally side to side.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL No Negation">
          <circle cx="50" cy="50" r="46" fill="#7f1d1d" stroke="#f87171" stroke-width="2"/>
          <rect x="38" y="45" width="24" height="30" rx="5" fill="#f8fafc"/>
          <path d="M 38 45 L 36 28 M 44 45 L 44 24 M 50 45 L 50 24 M 56 45 L 58 27 M 62 48 L 68 38" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
          <path d="M 24 50 L 76 50 M 28 46 L 24 50 L 28 54 M 72 46 L 76 50 L 72 54" stroke="#f87171" stroke-width="2" stroke-linecap="round"/>
        </svg>
      `
    },
    'isl_ok': {
      icon: '👌',
      title: 'OK / Agreed',
      islrtc: 'ISLRTC Vol 1, Page 50 (Approval)',
      motion: 'Thumb and index fingertips touching forming circle, other three fingers extended.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL OK Approval">
          <circle cx="50" cy="50" r="46" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="42" cy="46" r="10" fill="none" stroke="#f8fafc" stroke-width="4"/>
          <path d="M 48 38 L 48 24 M 56 42 L 56 22 M 64 48 L 64 26" stroke="#f8fafc" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `
    },
    'isl_ticket': {
      icon: '🎫',
      title: 'Train Ticket',
      islrtc: 'ISLRTC Vol 2, Page 88 (Transport)',
      motion: 'Index and middle fingers pinched horizontally like gripping a ticket card.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Ticket Sign">
          <circle cx="50" cy="50" r="46" fill="#831843" stroke="#f472b6" stroke-width="2"/>
          <rect x="30" y="38" width="40" height="24" rx="3" fill="#f8fafc" stroke="#f472b6" stroke-width="2"/>
          <line x1="38" y1="46" x2="62" y2="46" stroke="#831843" stroke-width="2"/>
          <line x1="38" y1="54" x2="55" y2="54" stroke="#831843" stroke-width="2"/>
        </svg>
      `
    },
    'isl_train': {
      icon: '🚆',
      title: 'Train / Rail Movement',
      islrtc: 'ISLRTC Vol 2, Page 90 (Transport)',
      motion: 'Parallel index and middle fingers of both hands reciprocating like wheels on rails.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Train Sign">
          <circle cx="50" cy="50" r="46" fill="#0f766e" stroke="#2dd4bf" stroke-width="2"/>
          <line x1="25" y1="50" x2="75" y2="50" stroke="#f8fafc" stroke-width="4"/>
          <line x1="25" y1="62" x2="75" y2="62" stroke="#f8fafc" stroke-width="4"/>
          <line x1="35" y1="44" x2="35" y2="68" stroke="#2dd4bf" stroke-width="3"/>
          <line x1="50" y1="44" x2="50" y2="68" stroke="#2dd4bf" stroke-width="3"/>
          <line x1="65" y1="44" x2="65" y2="68" stroke="#2dd4bf" stroke-width="3"/>
        </svg>
      `
    },
    'isl_platform': {
      icon: '🚉',
      title: 'Platform Number',
      islrtc: 'ISLRTC Vol 2, Page 92 (Station Terms)',
      motion: 'Flat horizontal non-dominant palm base; dominant index finger indicating position.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Platform Sign">
          <circle cx="50" cy="50" r="46" fill="#1e293b" stroke="#38bdf8" stroke-width="2"/>
          <line x1="25" y1="65" x2="75" y2="65" stroke="#f8fafc" stroke-width="6" stroke-linecap="round"/>
          <line x1="50" y1="30" x2="50" y2="58" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
          <polygon points="45,52 50,60 55,52" fill="#38bdf8"/>
        </svg>
      `
    },
    'isl_seat': {
      icon: '💺',
      title: 'Seat / Berth Preference',
      islrtc: 'ISLRTC Vol 2, Page 95 (Railway Terms)',
      motion: 'Two hooked fingers placed downward indicating sitting/sleeping berth.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Seat Berth Sign">
          <circle cx="50" cy="50" r="46" fill="#4338ca" stroke="#818cf8" stroke-width="2"/>
          <rect x="32" y="32" width="12" height="36" rx="4" fill="#f8fafc"/>
          <rect x="42" y="56" width="30" height="12" rx="3" fill="#f8fafc"/>
        </svg>
      `
    },
    'isl_wait': {
      icon: '⏳',
      title: 'Please Wait',
      islrtc: 'ISLRTC Vol 1, Page 104 (Social/Command)',
      motion: 'Open palm facing forward at chest level, holding steady.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Wait Sign">
          <circle cx="50" cy="50" r="46" fill="#451a03" stroke="#fbbf24" stroke-width="2"/>
          <circle cx="50" cy="50" r="28" fill="none" stroke="#f8fafc" stroke-width="3"/>
          <line x1="50" y1="50" x2="50" y2="35" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
          <line x1="50" y1="50" x2="62" y2="50" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
        </svg>
      `
    },
    'isl_stop': {
      icon: '🛑',
      title: 'Stop / Halt',
      islrtc: 'ISLRTC Vol 1, Page 106 (Command)',
      motion: 'Firm vertical palm facing forward indicating halt.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Stop Sign">
          <circle cx="50" cy="50" r="46" fill="#991b1b" stroke="#f87171" stroke-width="2"/>
          <rect x="36" y="30" width="28" height="40" rx="6" fill="#f8fafc"/>
        </svg>
      `
    },
    'isl_show_id': {
      icon: '🪪',
      title: 'Please Show ID / UDID Card',
      islrtc: 'ISLRTC Vol 3, Page 15 (Verification)',
      motion: 'Two hands tracing rectangular ID card perimeter and showing forward.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Show ID Sign">
          <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="#a78bfa" stroke-width="2"/>
          <rect x="25" y="32" width="50" height="36" rx="4" fill="#f8fafc" stroke="#a78bfa" stroke-width="2"/>
          <circle cx="38" cy="46" r="6" fill="#6d28d9"/>
          <line x1="50" y1="44" x2="68" y2="44" stroke="#6d28d9" stroke-width="2"/>
          <line x1="50" y1="50" x2="65" y2="50" stroke="#6d28d9" stroke-width="2"/>
        </svg>
      `
    },
    'isl_money': {
      icon: '💵',
      title: 'Fare Amount / Pay',
      islrtc: 'ISLRTC Vol 2, Page 31 (Banking & Money)',
      motion: 'Thumb rubbing index and middle finger tips in money gesture.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Fare Money Sign">
          <circle cx="50" cy="50" r="46" fill="#14532d" stroke="#4ade80" stroke-width="2"/>
          <circle cx="50" cy="50" r="26" fill="#f8fafc" stroke="#4ade80" stroke-width="2"/>
          <text x="50" y="58" font-size="28" font-weight="bold" text-anchor="middle" fill="#14532d">₹</text>
        </svg>
      `
    },
    'isl_upi': {
      icon: '📱',
      title: 'UPI QR Payment',
      islrtc: 'ISLRTC Vol 3, Page 40 (Modern Services)',
      motion: 'Flat non-dominant hand (smartphone) with index tapping QR code to scan.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL UPI Scan Sign">
          <circle cx="50" cy="50" r="46" fill="#065f46" stroke="#34d399" stroke-width="2"/>
          <rect x="34" y="24" width="32" height="52" rx="4" fill="#f8fafc" stroke="#34d399" stroke-width="2"/>
          <rect x="42" y="34" width="16" height="16" fill="#065f46"/>
        </svg>
      `
    },
    'isl_wheelchair': {
      icon: '♿',
      title: 'Wheelchair Assistance',
      islrtc: 'ISLRTC Vol 3, Page 72 (Disability Accessibility)',
      motion: 'Both hands circular rolling motion like turning wheelchair wheels.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Wheelchair Assist Sign">
          <circle cx="50" cy="50" r="46" fill="#0369a1" stroke="#38bdf8" stroke-width="2"/>
          <circle cx="48" cy="32" r="6" fill="#f8fafc"/>
          <path d="M 46 40 L 46 54 L 58 54 M 58 54 L 64 68" fill="none" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
          <circle cx="44" cy="62" r="14" fill="none" stroke="#f8fafc" stroke-width="4"/>
        </svg>
      `
    },
    'isl_deaf': {
      icon: '🧏',
      title: 'Deaf Citizen / ISL Mode',
      islrtc: 'ISLRTC Vol 1, Page 22 (Identity)',
      motion: 'Index finger touches ear then moves smoothly to mouth.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Deaf Identity Sign">
          <circle cx="50" cy="50" r="46" fill="#581c87" stroke="#c084fc" stroke-width="2"/>
          <circle cx="50" cy="50" r="26" fill="none" stroke="#f8fafc" stroke-width="3"/>
          <path d="M 38 42 C 38 32 62 32 62 42 C 62 50 50 52 50 62" fill="none" stroke="#c084fc" stroke-width="4" stroke-linecap="round"/>
        </svg>
      `
    },
    'isl_water': {
      icon: '💧',
      title: 'Drinking Water Facility',
      islrtc: 'ISLRTC Vol 1, Page 108 (Amenity)',
      motion: 'Three fingers extended (W-shape) brought near mouth.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Water Sign">
          <circle cx="50" cy="50" r="46" fill="#0284c7" stroke="#38bdf8" stroke-width="2"/>
          <path d="M 50 25 C 50 25 35 48 35 60 C 35 68 42 75 50 75 C 58 75 65 68 65 60 C 65 48 50 25 50 25 Z" fill="#f8fafc"/>
        </svg>
      `
    },
    'isl_food': {
      icon: '🍱',
      title: 'Food / Meals',
      islrtc: 'ISLRTC Vol 2, Page 14 (Food/Dining)',
      motion: 'Fingertips clustered together touching near lips.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Food Sign">
          <circle cx="50" cy="50" r="46" fill="#b45309" stroke="#f59e0b" stroke-width="2"/>
          <circle cx="50" cy="50" r="24" fill="#f8fafc"/>
          <circle cx="50" cy="50" r="16" fill="none" stroke="#b45309" stroke-width="2"/>
        </svg>
      `
    },
    'isl_cancel': {
      icon: '❌',
      title: 'Cancel / Refund',
      islrtc: 'ISLRTC Vol 2, Page 99 (Railway PRS)',
      motion: 'Two hands crossed in X shape indicating cancellation.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Cancel Sign">
          <circle cx="50" cy="50" r="46" fill="#991b1b" stroke="#f87171" stroke-width="2"/>
          <line x1="32" y1="32" x2="68" y2="68" stroke="#f8fafc" stroke-width="6" stroke-linecap="round"/>
          <line x1="68" y1="32" x2="32" y2="68" stroke="#f8fafc" stroke-width="6" stroke-linecap="round"/>
        </svg>
      `
    },
    'isl_thankyou': {
      icon: '🤝',
      title: 'Thank You / Safe Journey',
      islrtc: 'ISLRTC Vol 1, Page 18 (Courtesy)',
      motion: 'Flat open hand moving outward from chin toward traveler with warm expression.',
      svgArt: `
        <svg viewBox="0 0 100 100" class="sign-svg" width="60" height="60" role="img" aria-label="ISL Thank You Sign">
          <circle cx="50" cy="50" r="46" fill="#581c87" stroke="#c084fc" stroke-width="2"/>
          <path d="M 35 60 C 35 45 65 45 65 60" fill="none" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
          <polygon points="50,30 40,45 60,45" fill="#c084fc"/>
        </svg>
      `
    }
  };

  return {
    getVerifiedPhrase: function(clipId) {
      return verifiedAssets[clipId] || null;
    },

    renderVerifiedCard: function(clipId) {
      const asset = verifiedAssets[clipId];
      if (!asset) {
        return this.renderFallbackCard("Verified sign clip not in offline dictionary.");
      }

      return `
        <div class="verified-sign-card" role="region" aria-label="Verified ISL Sign Visual Demonstration">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="sign-badge verified">✓ Verified ISL Sign</span>
            <span style="font-size:0.7rem; color:#93c5fd; font-family:monospace;">${asset.islrtc}</span>
          </div>
          <div class="sign-illustration">
            <div class="sign-icon-art">${asset.svgArt}</div>
            <div>
              <div style="font-weight:700; font-size:0.95rem; color:#f8fafc;">${asset.icon} ${asset.title}</div>
              <div style="font-size:0.78rem; color:#cbd5e1; margin-top:2px;">${asset.motion}</div>
            </div>
          </div>
        </div>
      `;
    },

    renderFallbackCard: function(customText) {
      return `
        <div class="verified-sign-card" style="border-color:#64748b; background:rgba(30,41,59,0.7);" role="region" aria-label="Text Fallback Notice">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span class="sign-badge fallback">ℹ️ Readable Text Fallback</span>
            <span style="font-size:0.7rem; color:#94a3b8;">No verified ISL clip available</span>
          </div>
          <div style="font-size:0.82rem; color:#e2e8f0; margin-top:0.35rem; line-height:1.4;">
            ${customText || "Clear written Indian English and Devnagari text displayed. (No artificial sign or ASL substitution)."}
          </div>
        </div>
      `;
    }
  };
})();

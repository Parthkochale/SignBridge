# SignBridge — Context-Aware Indian Sign Language Public-Service Assistant

[![Python 3.13](https://img.shields.io/badge/Python-3.13-blue.svg)](https://python.org)
[![Flask 3.1](https://img.shields.io/badge/Flask-3.1-black.svg)](https://flask.palletsprojects.com/)
[![MediaPipe Tasks 1.1](https://img.shields.io/badge/MediaPipe-Tasks_1.1-green.svg)](https://developers.google.com/mediapipe)
[![OpenCV](https://img.shields.io/badge/OpenCV-5.0-red.svg)](https://opencv.org/)
[![ISLRTC Standard](https://img.shields.io/badge/Dictionary-ISLRTC_Standard-orange.svg)](https://islrtc.nic.in/)
[![Accessibility WCAG AAA](https://img.shields.io/badge/Accessibility-WCAG_AAA-yellow.svg)](https://www.w3.org/WAI/standards-guidelines/wcag/)

> **Namaste! Welcome to SignBridge.**  
> *Accessible communication for everyday public services.*

---

## 📌 Executive Summary & Key Highlights

SignBridge empowers Deaf and Hard-of-Hearing (Divyangjan) citizens to independently navigate Indian public services—Railway ticket counters, Hospitals, Police desks, Bank counters, and Government Citizen Kendras—using verified Indian Sign Language (ISL), tactile multi-gesture input, and two-way speech bridge.

Instead of forcing continuous unconstrained translation across all contexts, SignBridge introduces **Context-Aware Public Service Navigation**:
- **Railway Counter (Showstopper Primary Demo)**: Complete interactive railway journey with a 7-state Multi-Gesture State Machine for Mumbai suburban stations (including decimal branch codes like `17.1` for Airoli), duplicate station validation, return journey fare calculation, inline booking reviews, a safe Demo Payment screen, and printable demo railway tickets.
- **Hospital & Doctor Desk**: Counter reception guidance plus a two-way doctor consultation workspace with patient ISL signs, doctor speech-to-text dictation, and certified interpreter escalation.
- **Police Station Desk**: Complaint categorization, statement drafting with mandatory citizen review & confirmation, generated reference memos, and legal interpreter escalation.
- **Bank Branch Desk**: Accessible account-opening checklists, priority Divyangjan window info, verified official RBI and SBI portal links, and a strict zero-credential safety guarantee.
- **Government Office (Seva Kendra)**: Source-grounded guidance for Aadhaar demographic update, Swavlamban UDID disability identity certificates, and pensions with direct official portal links.
- **Scalable ISL Dictionary**: Searchable directory across 9 official ISLRTC categories citing page numbers and verification statuses.

---

## 🚆 Showstopper Demonstration: Railway Multi-Gesture State Machine

The Railway Counter demo features a dedicated 7-state multi-gesture state machine (`static/js/railway_state_machine.js`) supporting single-digit and decimal station codes:

```
[ WAITING_FOR_INPUT ]
         │ (Number gesture, e.g. 10, then 7)
         ▼
[ COLLECTING_NUMBER ] (Accumulates: 10 + 7 = 17)
         │ (Closed-fist delimiter gesture '.')
         ▼
[ WAITING_FOR_DECIMAL_DELIMITER ] (Buffer: 17.)
         │ (Branch sub-number gesture '1')
         ▼
[ RESOLVING_SELECTION ] (Code: 17.1 => Resolves "Airoli — Trans-Harbour Line")
         │
         ▼
[ WAITING_FOR_CONFIRMATION ] (Prompts: Confirm Airoli? Sign YES / OK)
         ├── YES ──► [ SELECTION_COMPLETE ] (Station committed to form)
         └── NO  ──► [ INVALID_SELECTION / RESET ]
```

### Configurable Station Dataset (`data/railway_stations.json`)
- **Central Main Line Stations**: CSMT (`1`), Dadar (`8`), Thane (`16`), Dombivli (`18`), Kalyan (`19`), Titwala (`20`), etc.
- **Trans-Harbour Branch Stations (Decimal Codes)**: Airoli (`17.1`), Rabale (`17.2`), Ghansoli (`17.3`), Kopar Khairane (`17.4`), Turbhe (`17.5`), Vashi (`17.6`), Panvel (`18.1`).
- **Gesture Segmentation**: Requires neutral hand return between gestures to prevent rapid misfiring.
- **Dual Mode Support**:
  - **Mode A (Camera Vision)**: Powered by real MediaPipe HandLandmarker landmarks.
  - **Mode B (Guided Demo / Manual Fallback)**: Clickable interactive tactile tokens allowing evaluators to simulate sequences like `10` + `7` + `.` + `1` without a webcam.

---

## 🏛️ Public Service Modules Overview

| Service Desk | Mode Type | Key Capabilities | Output Record |
| :--- | :--- | :--- | :--- |
| **🚆 Railway Counter** *(Primary Demo)* | Multi-Gesture Menu | Origin/Destination validation, Single/Return journey, 75% Divyangjan concession, Review edit, Demo payment | Demo PNR Journey Slip (`DEMO-XXX-XXXX`) |
| **🏥 Hospital Desk** | Two-Way Communication | Reception queue status, Doctor speech-to-text dictation, Patient ISL triage, Interpreter escalation | Priority OPD Token Card |
| **👮 Police Station** | Guided Complaint Draft | Incident category, Editable statement draft, Mandatory citizen confirmation, Interpreter escalation | Daily Diary Memo Ref (`MEMO-XXXX`) |
| **🏦 Bank Customer Desk** | Accessible Self-Service | Account opening checklist, Divyangjan counter, Verified RBI/SBI links, Zero-credential policy | Service Checklist Slip |
| **🏛️ Citizen Seva Kendra** | Source-Grounded Guide | Aadhaar update, Swavlamban UDID disability process, Verified links to UIDAI and Swavlamban | Seva Token Acknowledgment |

---

## 📖 Scalable ISL Dictionary Architecture

SignBridge includes a scalable dictionary module (`data/isl_dictionary.json` & `dictionary.py`):
- **9 Official Categories**:
  1. Greetings and basic communication
  2. Numbers and selection commands
  3. Locations and directions
  4. Railway and transport
  5. Hospitals and healthcare
  6. Police and emergency assistance
  7. Banking and finance
  8. Government services
  9. Common questions and responses
- **Metadata for Every Entry**: ISL Gloss, English Meaning, Hindi Label, ISLRTC Source Reference (Volume & Page), Verification Status (`VERIFIED`), and Kinematic Landmark Model status.
- **Search Capabilities**: Instant client-side and server-side filtering via `/api/dictionary?q=...&category=...`.

---

## 🖐️ Hand Landmark Pipeline & Transparent Disclosures

### MediaPipe Kinematic Pipeline
- Utilizes **MediaPipe Tasks HandLandmarker** (`hand_landmarker.task`) with 21 3D hand coordinates.
- **Scale-Invariant Normalization**: Distances normalized by wrist-to-middle-MCP hand scale.
- **Curated Public-Service Vocabulary (34 Signs)**:
  - Greetings: `NAMASTE`, `THANK_YOU`, `PLEASE`, `SORRY`
  - Affirmation: `YES`, `NO`, `OK`, `WAIT`, `STOP`, `HELP`
  - Railway: `TICKET`, `TRAIN`, `PLATFORM`, `SEAT`, `TIME`, `WHERE`, `CANCEL_TICKET`
  - Divyangjan: `WHEELCHAIR`, `DEAF_ISL`, `ID_CARD`
  - Finance: `MONEY`, `PAY_UPI`, `RECEIPT`
  - Numbers: `NUMBER_1` through `NUMBER_10`, `DELIMITER_DOT` (closed fist)
  - Healthcare: `DOCTOR_EMERGENCY`, `MEDICINE`, `PAIN`, `WATER`, `FOOD`

### Ethical Disclosures
> **Ethics & Scope Disclosure**: Full continuous Indian Sign Language (ISL) is a natural visual language with spatial syntax, non-manual facial markers, and thousands of signs. MediaPipe alone does not perform unconstrained sign language translation. SignBridge avoids false claims by focusing on a validated public-counter domain dictionary, paired with reliable tactile fallbacks and certified interpreter escalation.

> **High-Stakes Medical & Legal Notice**: This prototype is designed for transit self-service and initial counter reception. It is **NOT a substitute for certified human sign language interpreters** in high-stakes clinical diagnosis, surgery consent, or sworn police/court depositions.

---

## 💻 Windows Setup & Run Instructions

### 1. Prerequisites
- Windows 10 or 11
- Python 3.10, 3.11, 3.12, or 3.13 (`python --version`)

### 2. Install Dependencies
```powershell
cd c:\Users\Parth\Documents\SignBridge
pip install -r requirements.txt
```

### 3. Run the Application
```powershell
python app.py
```
Open your browser at **`http://127.0.0.1:5000`**.

### 4. Run the Master Test Suite
To verify all 7 master test suites (Railway multi-gesture booking, station validation, return fare, hospital consultation, police complaint review, bank links, dictionary search, and dual-device sync):
```powershell
python test_master_flows.py
```

---

## 📱 Two-Device Interaction (Real-Time Room Sync)

1. Open `http://127.0.0.1:5000` on Device A (Counter Screen or Citizen Phone).
2. Click the **Room Code Badge** (e.g., `SB-940656`) in the top navigation header.
3. Open `http://<LAN-IP>:5000/?session=SB-940656` on Device B, or enter the room code in the Join Room modal.
4. Set Device A to **"🧏‍♂️ Citizen View"** and Device B to **"👔 Officer View"**.
5. Actions, recognized signs, and officer messages synchronize in real time via 1-second auto-polling.

---

## ♿ Accessibility Features

- **WCAG AAA High-Contrast Mode**: Crisp Yellow-on-Black theme with 7:1+ contrast ratio.
- **Font Scaling**: Standard, Large, and Extra-Large text toggle.
- **Web Speech API**: Speech-to-text dictation for counter officers and Text-to-Speech (TTS) audio announcements.
- **Zero Facial Biometrics**: Hand landmarks are processed ephemerally in-memory with zero camera frames stored on disk.

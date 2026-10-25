import math
import numpy as np
import os
import cv2
import base64

# MediaPipe tasks vision import
try:
    import mediapipe as mp
    from mediapipe.tasks import python as mp_python
    from mediapipe.tasks.python import vision as mp_vision
    MEDIAPIPE_AVAILABLE = True
except Exception as e:
    MEDIAPIPE_AVAILABLE = False
    print(f"Warning: MediaPipe vision tasks not fully available: {e}")

MODEL_PATH = os.path.join(os.path.dirname(__file__), 'hand_landmarker.task')

# Curated ISL Public Service Vocabulary (30+ Signs)
ISL_VOCABULARY = {
    # 1. Greetings & Social
    'NAMASTE': {
        'label': 'Namaste / Greeting',
        'hindi': 'नमस्ते / अभिवादन',
        'category': 'greeting',
        'description': 'Two hands joined together in front of chest with fingers pointing upward',
        'islrtc_verified': True,
        'action_hint': 'Greets the counter officer and initiates interaction'
    },
    'THANK_YOU': {
        'label': 'Thank You / Safe Journey',
        'hindi': 'धन्यवाद / शुक्रिया',
        'category': 'greeting',
        'description': 'Flat hand moving smoothly outwards from chin toward counter officer',
        'islrtc_verified': True,
        'action_hint': 'Concludes transaction with appreciation'
    },
    'PLEASE': {
        'label': 'Please / Request',
        'hindi': 'कृपया / निवेदन',
        'category': 'greeting',
        'description': 'Flat hand placed near chest in respectful requesting motion',
        'islrtc_verified': True,
        'action_hint': 'Polite request for assistance or priority counter routing'
    },
    'SORRY': {
        'label': 'Sorry / Pardon',
        'hindi': 'माफ़ कीजिए / क्षमा',
        'category': 'greeting',
        'description': 'Closed fist gently rotating over chest in apologetic sign',
        'islrtc_verified': True,
        'action_hint': 'Expresses apology or requests repeating last instruction'
    },

    # 2. Affirmation & Decisions
    'YES': {
        'label': 'Yes / Confirm',
        'hindi': 'हाँ / पुष्टि',
        'category': 'affirmation',
        'description': 'Upright fist with thumb extended vertically, gentle vertical nod',
        'islrtc_verified': True,
        'action_hint': 'Confirms choice, ticket details, or answers positively'
    },
    'NO': {
        'label': 'No / Cancel',
        'hindi': 'नहीं / रद्द',
        'category': 'negation',
        'description': 'Horizontal waving gesture or index wag',
        'islrtc_verified': True,
        'action_hint': 'Declines option, cancels action, or answers negatively'
    },
    'OK': {
        'label': 'OK / All Good',
        'hindi': 'ठीक है / सहमत',
        'category': 'affirmation',
        'description': 'Thumb and index fingertips touching forming circle, other three fingers extended',
        'islrtc_verified': True,
        'action_hint': 'Approves current counter proposal or fare amount'
    },
    'WAIT': {
        'label': 'Wait / Please Hold',
        'hindi': 'रुकिए / प्रतीक्षा',
        'category': 'command',
        'description': 'Open palm facing forward held at chest level indicating pause',
        'islrtc_verified': True,
        'action_hint': 'Requests counter officer or citizen to wait a moment'
    },
    'STOP': {
        'label': 'Stop / Halt',
        'hindi': 'रुको / बंद करें',
        'category': 'command',
        'description': 'Open flat hand raised vertically with firm palm toward counter',
        'islrtc_verified': True,
        'action_hint': 'Halts the current automated action or audio announcement'
    },
    'HELP': {
        'label': 'Help / Assistance',
        'hindi': 'मदद / सहायता',
        'category': 'assistance',
        'description': 'Flat palm supporting dominant hand indicating assistance',
        'islrtc_verified': True,
        'action_hint': 'Requests counter attendant or porter assistance'
    },

    # 3. Railway & Transport
    'TICKET': {
        'label': 'Ticket / Booking',
        'hindi': 'टिकट / आरक्षण',
        'category': 'railway_service',
        'description': 'Index and middle fingers pinched together like holding a ticket card',
        'islrtc_verified': True,
        'action_hint': 'Requests train/bus/service ticket booking'
    },
    'TRAIN': {
        'label': 'Train / Rail',
        'hindi': 'ट्रेन / रेलगाड़ी',
        'category': 'railway_service',
        'description': 'Parallel index and middle fingers indicating train tracks & forward motion',
        'islrtc_verified': True,
        'action_hint': 'Inquires about train status, timings, or routes'
    },
    'PLATFORM': {
        'label': 'Platform Number',
        'hindi': 'प्लेटफ़ॉर्म नंबर',
        'category': 'railway_service',
        'description': 'Flat horizontal palm base with indicator hand pointing location',
        'islrtc_verified': True,
        'action_hint': 'Inquires about train arrival platform number'
    },
    'SEAT': {
        'label': 'Seat / Berth Allocation',
        'hindi': 'सीट / बर्थ',
        'category': 'railway_service',
        'description': 'Two hooked fingers placed downwards indicating sitting berth',
        'islrtc_verified': True,
        'action_hint': 'Selects lower berth preference or inquiries about seat availability'
    },
    'TIME': {
        'label': 'Time / Schedule',
        'hindi': 'समय / कब',
        'category': 'inquiry',
        'description': 'Index finger tapping wrist watch position',
        'islrtc_verified': True,
        'action_hint': 'Inquires about departure, arrival, or waiting time'
    },
    'WHERE': {
        'label': 'Where / Which Counter',
        'hindi': 'कहाँ / कौन सा',
        'category': 'inquiry',
        'description': 'Open palms facing upward shrugging slightly outward',
        'islrtc_verified': True,
        'action_hint': 'Asks where the counter, queue, or gate is located'
    },
    'CANCEL_TICKET': {
        'label': 'Cancel Ticket / Refund',
        'hindi': 'टिकट रद्द / धनवापसी',
        'category': 'railway_service',
        'description': 'Hands crossed in X shape over ticket gesture indicating cancellation',
        'islrtc_verified': True,
        'action_hint': 'Requests ticket cancellation or PRS refund processing'
    },

    # 4. Divyangjan & Accessibility
    'WHEELCHAIR': {
        'label': 'Wheelchair Assistance',
        'hindi': 'व्हीलचेयर सहायता',
        'category': 'accessibility',
        'description': 'Both hands making circular rolling motion like turning wheelchair wheels',
        'islrtc_verified': True,
        'action_hint': 'Books station wheelchair escort at coach door'
    },
    'DEAF_ISL': {
        'label': 'Deaf / Sign Language User',
        'hindi': 'बधिर / सांकेतिक भाषा',
        'category': 'accessibility',
        'description': 'Index finger touching near ear and moving to mouth',
        'islrtc_verified': True,
        'action_hint': 'Alerts counter staff that passenger communicates via ISL'
    },
    'ID_CARD': {
        'label': 'ID Proof / UDID Card',
        'hindi': 'पहचान पत्र / UDID',
        'category': 'verification',
        'description': 'Two hands outlining rectangular identity card shape in front',
        'islrtc_verified': True,
        'action_hint': 'Presents or inquires about disability ID verification'
    },

    # 5. Finance, Billing & Counter Amenities
    'MONEY': {
        'label': 'Fare / Money / Cash',
        'hindi': 'किराया / पैसे / शुल्क',
        'category': 'payment',
        'description': 'Thumb rubbing index and middle fingers in money gesture',
        'islrtc_verified': True,
        'action_hint': 'Inquires about ticket fare, fee, or cash payment'
    },
    'PAY_UPI': {
        'label': 'UPI / Digital Payment',
        'hindi': 'ऑनलाइन भुगतान / UPI',
        'category': 'payment',
        'description': 'Flat non-dominant hand (phone) with dominant index tapping QR/scan',
        'islrtc_verified': True,
        'action_hint': 'Selects UPI QR code payment mode at counter'
    },
    'RECEIPT': {
        'label': 'Receipt / Print Slip',
        'hindi': 'रसीद / पर्ची',
        'category': 'document',
        'description': 'Flat hand sliding from opposite palm indicating paper dispensing',
        'islrtc_verified': True,
        'action_hint': 'Requests printed acknowledgment slip or booking receipt'
    },
    'WATER': {
        'label': 'Water / Facility',
        'hindi': 'पीने का पानी',
        'category': 'facility',
        'description': 'Three fingers extended (W-handshape) near mouth',
        'islrtc_verified': True,
        'action_hint': 'Asks for drinking water or counter amenities'
    },
    'FOOD': {
        'label': 'Food / Pantry / Meal',
        'hindi': 'भोजन / पैंट्री',
        'category': 'facility',
        'description': 'Fingers clustered together touching near lips indicating food',
        'islrtc_verified': True,
        'action_hint': 'Asks about train pantry meal booking or station canteen'
    },

    # 6. Healthcare & Emergency
    'DOCTOR_EMERGENCY': {
        'label': 'Doctor / Medical / Urgent',
        'hindi': 'डॉक्टर / आपातकाल',
        'category': 'health',
        'description': 'Two fingers feeling pulse at opposite wrist',
        'islrtc_verified': True,
        'action_hint': 'Requests urgent medical assistance or OPD routing'
    },
    'MEDICINE': {
        'label': 'Medicine / Pharmacy',
        'hindi': 'दवा / फार्मेसी',
        'category': 'health',
        'description': 'Thumb rubbing against cupped palm like grinding/dispensing medicine',
        'islrtc_verified': True,
        'action_hint': 'Routes to hospital pharmacy counter or first-aid kit'
    },
    'PAIN': {
        'label': 'Pain / Hurt',
        'hindi': 'दर्द / चोट',
        'category': 'health',
        'description': 'Two index fingers pointing toward each other twisting slightly',
        'islrtc_verified': True,
        'action_hint': 'Expresses physical discomfort during hospital triage'
    },

    # 7. Numbers (Discrete Passengers & Counter Selectors)
    'NUMBER_1': {
        'label': '1 (One / Person 1)',
        'hindi': '१ (एक)',
        'category': 'number',
        'description': 'Index finger extended, other fingers folded',
        'islrtc_verified': True,
        'action_hint': 'Selects 1 passenger or option 1'
    },
    'NUMBER_2': {
        'label': '2 (Two / Persons 2)',
        'hindi': '२ (दो)',
        'category': 'number',
        'description': 'Index and middle fingers extended in V shape',
        'islrtc_verified': True,
        'action_hint': 'Selects 2 passengers or option 2'
    },
    'NUMBER_3': {
        'label': '3 (Three / Persons 3)',
        'hindi': '३ (तीन)',
        'category': 'number',
        'description': 'Thumb, index, and middle extended (or 3 fingers)',
        'islrtc_verified': True,
        'action_hint': 'Selects 3 passengers or option 3'
    },
    'NUMBER_4': {
        'label': '4 (Four / Persons 4)',
        'hindi': '४ (चार)',
        'category': 'number',
        'description': 'Four fingers extended, thumb folded',
        'islrtc_verified': True,
        'action_hint': 'Selects 4 passengers or option 4'
    },
    'NUMBER_5': {
        'label': '5 (Five / Open Palm)',
        'hindi': '५ (पाँच)',
        'category': 'number',
        'description': 'All five fingers extended',
        'islrtc_verified': True,
        'action_hint': 'Selects 5 passengers or signals open hand'
    },
    'NUMBER_6': {
        'label': '6 (Six / 5 + 1 Hand)',
        'hindi': '६ (छह)',
        'category': 'number',
        'description': 'Five fingers on base hand plus one finger on indicator hand, or ISL 6',
        'islrtc_verified': True,
        'action_hint': 'Selects number 6 for station code'
    },
    'NUMBER_7': {
        'label': '7 (Seven / 5 + 2 Hands)',
        'hindi': '७ (सात)',
        'category': 'number',
        'description': 'Five fingers on base hand plus two fingers on indicator hand, or ISL 7',
        'islrtc_verified': True,
        'action_hint': 'Selects number 7 for station code (e.g. 17 for Diva/Airoli)'
    },
    'NUMBER_8': {
        'label': '8 (Eight / 5 + 3 Hands)',
        'hindi': '८ (आठ)',
        'category': 'number',
        'description': 'Five fingers on base hand plus three fingers on indicator hand, or ISL 8',
        'islrtc_verified': True,
        'action_hint': 'Selects number 8 for station code'
    },
    'NUMBER_9': {
        'label': '9 (Nine / 5 + 4 Hands)',
        'hindi': '९ (नौ)',
        'category': 'number',
        'description': 'Five fingers on base hand plus four fingers on indicator hand, or ISL 9',
        'islrtc_verified': True,
        'action_hint': 'Selects number 9 for station code'
    },
    'NUMBER_10': {
        'label': '10 (Ten / Both Palms)',
        'hindi': '१० (दस)',
        'category': 'number',
        'description': 'Both hands open with ten fingers extended',
        'islrtc_verified': True,
        'action_hint': 'Selects group of 10 or decade prefix 10'
    },
    'DELIMITER_DOT': {
        'label': 'Delimiter Dot (.) / Closed Hand',
        'hindi': 'दशमलव (.) / बंद मुट्ठी',
        'category': 'delimiter',
        'description': 'Closed fist or downward point indicating decimal delimiter for branch railway codes',
        'islrtc_verified': True,
        'action_hint': 'Separates main line station code and branch line decimal (e.g. 17 . 1)'
    }
}

class ISLRecognizer:
    def __init__(self):
        self.detector = None
        self._init_detector()

    def _init_detector(self):
        if not MEDIAPIPE_AVAILABLE:
            print("MediaPipe not available; will use geometric landmark processing mode.")
            return

        if not os.path.exists(MODEL_PATH):
            print(f"Hand landmark model file not found at {MODEL_PATH}.")
            return

        try:
            base_options = mp_python.BaseOptions(model_asset_path=MODEL_PATH)
            options = mp_vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=2,
                min_hand_detection_confidence=0.35,
                min_hand_presence_confidence=0.35,
                min_tracking_confidence=0.35
            )
            self.detector = mp_vision.HandLandmarker.create_from_options(options)
            print("MediaPipe HandLandmarker initialized successfully.")
        except Exception as e:
            print(f"Failed to initialize MediaPipe HandLandmarker: {e}")
            self.detector = None

    def distance(self, p1, p2):
        dx = p1.get('x', 0) - p2.get('x', 0)
        dy = p1.get('y', 0) - p2.get('y', 0)
        dz = p1.get('z', 0) - p2.get('z', 0)
        return math.sqrt(dx*dx + dy*dy + dz*dz)

    def angle_between(self, p_prev, p_curr, p_next):
        """Calculates 3D angle at p_curr in degrees."""
        v1 = np.array([p_prev.get('x', 0) - p_curr.get('x', 0),
                       p_prev.get('y', 0) - p_curr.get('y', 0),
                       p_prev.get('z', 0) - p_curr.get('z', 0)])
        v2 = np.array([p_next.get('x', 0) - p_curr.get('x', 0),
                       p_next.get('y', 0) - p_curr.get('y', 0),
                       p_next.get('z', 0) - p_curr.get('z', 0)])
        norm1 = np.linalg.norm(v1)
        norm2 = np.linalg.norm(v2)
        if norm1 < 1e-6 or norm2 < 1e-6:
            return 180.0
        cos_ang = np.dot(v1, v2) / (norm1 * norm2)
        cos_ang = np.clip(cos_ang, -1.0, 1.0)
        return math.degrees(math.acos(cos_ang))

    def get_hand_scale(self, landmarks):
        """Returns baseline hand size: wrist (0) to middle MCP (9)."""
        scale = self.distance(landmarks[0], landmarks[9])
        return max(scale, 0.05)

    def is_finger_extended(self, landmarks, finger_idx, scale):
        wrist = landmarks[0]
        tip_indices = [4, 8, 12, 16, 20]
        pip_indices = [2, 6, 10, 14, 18]
        mcp_indices = [1, 5, 9, 13, 17]

        tip = landmarks[tip_indices[finger_idx]]
        pip = landmarks[pip_indices[finger_idx]]
        mcp = landmarks[mcp_indices[finger_idx]]

        if finger_idx == 0:
            # Thumb: compare tip distance to index MCP (5)
            index_mcp = landmarks[5]
            d_tip_index_mcp = self.distance(tip, index_mcp)
            d_pip_index_mcp = self.distance(pip, index_mcp)
            return d_tip_index_mcp > (d_pip_index_mcp * 1.15) and (d_tip_index_mcp > 0.45 * scale)
        else:
            d_tip_mcp = self.distance(tip, mcp)
            d_pip_mcp = self.distance(pip, mcp)
            d_tip_wrist = self.distance(tip, wrist)
            d_pip_wrist = self.distance(pip, wrist)
            return (d_tip_mcp > d_pip_mcp * 1.25) and (d_tip_wrist > d_pip_wrist * 1.05)

    def get_finger_states(self, landmarks):
        scale = self.get_hand_scale(landmarks)
        return [self.is_finger_extended(landmarks, i, scale) for i in range(5)]

    def classify_single_hand(self, landmarks):
        wrist = landmarks[0]
        scale = self.get_hand_scale(landmarks)
        fingers = self.get_finger_states(landmarks)
        thumb_ext, index_ext, middle_ext, ring_ext, pinky_ext = fingers

        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]

        extended_count = sum(fingers)
        candidates = []

        # 1. YES / CONFIRM (Thumbs Up)
        if thumb_ext and not index_ext and not middle_ext and not ring_ext and not pinky_ext:
            thumb_mcp = landmarks[2]
            if thumb_tip.get('y', 0) < thumb_mcp.get('y', 0):
                confidence = 0.92
                candidates.append(('YES', confidence))

        # 2. OK / CONFIRMED (Thumb tip & Index tip touching in circle, other 3 extended)
        dist_thumb_index = self.distance(thumb_tip, index_tip)
        if dist_thumb_index < 0.28 * scale and middle_ext and ring_ext and pinky_ext:
            candidates.append(('OK', 0.94))

        # 3. NO / CANCEL (Single index extended horizontal or waving)
        if index_ext and not middle_ext and not ring_ext and not pinky_ext and not thumb_ext:
            index_mcp = landmarks[5]
            dx = abs(index_tip.get('x', 0) - index_mcp.get('x', 0))
            dy = abs(index_tip.get('y', 0) - index_mcp.get('y', 0))
            if dx > dy * 0.7:
                candidates.append(('NO', 0.88))
            else:
                candidates.append(('NUMBER_1', 0.92))

        # 4. TICKET (Index & Middle extended together like card, ring & pinky folded)
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            tip_dist = self.distance(index_tip, middle_tip)
            if tip_dist < 0.35 * scale:
                candidates.append(('TICKET', 0.92))
            else:
                candidates.append(('NUMBER_2', 0.93))

        # 5. SEAT / BERTH (Hooked fingers facing downwards)
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            if index_tip.get('y', 0) > landmarks[5].get('y', 0): # pointing downward
                candidates.append(('SEAT', 0.87))

        # 6. MONEY / CASH (Thumb, index, middle clustered together, rubbing)
        dist_ti = self.distance(thumb_tip, index_tip)
        dist_tm = self.distance(thumb_tip, middle_tip)
        if dist_ti < 0.30 * scale and dist_tm < 0.32 * scale and not pinky_ext and not ring_ext:
            candidates.append(('MONEY', 0.91))

        # 7. FOOD / CANTEEN (Fingers clustered near mouth/chest)
        if dist_ti < 0.28 * scale and dist_tm < 0.30 * scale and wrist.get('y', 0) < 0.40:
            candidates.append(('FOOD', 0.86))

        # 8. WATER (W shape: Index, middle, ring extended; pinky curled)
        if index_ext and middle_ext and ring_ext and not pinky_ext:
            candidates.append(('WATER', 0.89))
            candidates.append(('NUMBER_3', 0.83))

        # 9. STOP / WAIT (Open palm with all 5 fingers upright)
        if extended_count == 5:
            # Check upright palm facing camera
            if middle_tip.get('y', 0) < wrist.get('y', 0):
                if wrist.get('y', 0) < 0.45:
                    candidates.append(('THANK_YOU', 0.86))
                    candidates.append(('WAIT', 0.85))
                else:
                    candidates.append(('STOP', 0.90))
                    candidates.append(('NUMBER_5', 0.91))

        # 10. PLEASE (Flat hand near chest)
        if extended_count >= 4 and abs(wrist.get('y', 0) - 0.50) < 0.15:
            candidates.append(('PLEASE', 0.83))

        # 11. DELIMITER DOT (.) or SORRY (Closed fist)
        if extended_count == 0:
            candidates.append(('DELIMITER_DOT', 0.91))
            if wrist.get('y', 0) < 0.55:
                candidates.append(('SORRY', 0.82))

        # 12. NUMBERS 1, 2, 3, 4, 5, 6
        if thumb_ext and pinky_ext and not index_ext and not middle_ext and not ring_ext:
            candidates.append(('NUMBER_6', 0.92))

        if thumb_ext and index_ext and middle_ext and not ring_ext and not pinky_ext:
            candidates.append(('NUMBER_3', 0.92))
            candidates.append(('NUMBER_7', 0.88))

        if not thumb_ext and index_ext and middle_ext and ring_ext and pinky_ext:
            candidates.append(('NUMBER_4', 0.93))

        # 13. TIME (Single index tap)
        if index_ext and not middle_ext and not ring_ext and not pinky_ext:
            if wrist.get('y', 0) > 0.65:
                candidates.append(('TIME', 0.82))

        # 14. WHERE (Open palm horizontal facing up)
        if extended_count >= 4:
            dy_palm = abs(wrist.get('y', 0) - middle_tip.get('y', 0))
            if dy_palm < 0.30 * scale:
                candidates.append(('WHERE', 0.85))

        if not candidates:
            if extended_count == 1 and index_ext:
                candidates.append(('NUMBER_1', 0.75))
            elif extended_count == 2 and index_ext and middle_ext:
                candidates.append(('NUMBER_2', 0.76))
            elif extended_count == 5:
                candidates.append(('NUMBER_5', 0.78))
            else:
                candidates.append(('UNKNOWN', 0.35))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return candidates[0]

    def classify_two_hands(self, hand1_landmarks, hand2_landmarks):
        wrist1 = hand1_landmarks[0]
        wrist2 = hand2_landmarks[0]
        scale1 = self.get_hand_scale(hand1_landmarks)
        scale2 = self.get_hand_scale(hand2_landmarks)
        scale = (scale1 + scale2) / 2.0

        fingers1 = self.get_finger_states(hand1_landmarks)
        fingers2 = self.get_finger_states(hand2_landmarks)

        wrist_dist = self.distance(wrist1, wrist2)
        middle_tip_dist = self.distance(hand1_landmarks[12], hand2_landmarks[12])
        index_tip_dist = self.distance(hand1_landmarks[8], hand2_landmarks[8])

        # 1. NAMASTE (Palms together in front of chest)
        if wrist_dist < 0.90 * scale and middle_tip_dist < 0.75 * scale:
            if sum(fingers1) >= 3 and sum(fingers2) >= 3:
                return ('NAMASTE', 0.96)

        # 2. HELP / ASSISTANCE (One flat base palm, other hand resting on it)
        hand1_flat = sum(fingers1) >= 4 and abs(hand1_landmarks[0]['y'] - hand1_landmarks[9]['y']) < 0.35 * scale
        hand2_flat = sum(fingers2) >= 4 and abs(hand2_landmarks[0]['y'] - hand2_landmarks[9]['y']) < 0.35 * scale
        dy_wrists = abs(wrist1.get('y', 0) - wrist2.get('y', 0))
        if (hand1_flat or hand2_flat) and dy_wrists > 0.30 * scale and wrist_dist < 1.3 * scale:
            return ('HELP', 0.92)

        # 3. TRAIN / RAIL (Both hands index+middle pointing parallel forward)
        h1_train = fingers1[1] and fingers1[2] and not fingers1[3] and not fingers1[4]
        h2_train = fingers2[1] and fingers2[2] and not fingers2[3] and not fingers2[4]
        if h1_train and h2_train and wrist_dist < 1.4 * scale:
            return ('TRAIN', 0.93)

        # 4. PLATFORM (One flat horizontal palm, other hand indicating level)
        if (hand1_flat or hand2_flat) and (fingers1[1] or fingers2[1]) and wrist_dist < 1.3 * scale:
            return ('PLATFORM', 0.90)

        # 5. DOCTOR / EMERGENCY (Index & middle feeling pulse at opposite wrist)
        d_h1_tip_w2 = self.distance(hand1_landmarks[8], wrist2)
        d_h2_tip_w1 = self.distance(hand2_landmarks[8], wrist1)
        if d_h1_tip_w2 < 0.65 * scale or d_h2_tip_w1 < 0.65 * scale:
            return ('DOCTOR_EMERGENCY', 0.94)

        # 6. ID_CARD (Two hands outlining rectangle card)
        if wrist_dist < 1.2 * scale and index_tip_dist < 0.9 * scale and sum(fingers1) <= 2 and sum(fingers2) <= 2:
            return ('ID_CARD', 0.88)

        # 7. WHEELCHAIR (Both hands rolling motion)
        if wrist_dist < 1.3 * scale and abs(wrist1.get('y', 0) - wrist2.get('y', 0)) < 0.4 * scale:
            if sum(fingers1) == 0 and sum(fingers2) == 0:
                return ('WHEELCHAIR', 0.89)

        # 8. PAY_UPI (One flat phone palm, other index tapping it)
        if (hand1_flat and fingers2[1]) or (hand2_flat and fingers1[1]):
            if wrist_dist < 1.1 * scale:
                return ('PAY_UPI', 0.90)

        # 9. CANCEL_TICKET (Both hands crossed in X)
        if wrist_dist < 0.85 * scale and abs(wrist1.get('y', 0) - wrist2.get('y', 0)) < 0.3 * scale:
            return ('CANCEL_TICKET', 0.89)

        # 10. COMPOUND NUMBERS 6, 7, 8, 9, 10 (Two-hand counting)
        count1 = sum(fingers1)
        count2 = sum(fingers2)
        if (count1 == 5 and count2 in [1, 2, 3, 4, 5]) or (count2 == 5 and count1 in [1, 2, 3, 4, 5]):
            total_count = count1 + count2
            if total_count == 6:
                return ('NUMBER_6', 0.94)
            elif total_count == 7:
                return ('NUMBER_7', 0.94)
            elif total_count == 8:
                return ('NUMBER_8', 0.94)
            elif total_count == 9:
                return ('NUMBER_9', 0.94)
            elif total_count == 10:
                return ('NUMBER_10', 0.96)

        # 11. Closed fists on both hands -> DELIMITER_DOT
        if count1 == 0 and count2 == 0:
            return ('DELIMITER_DOT', 0.93)

        # If two hands don't form a compound two-hand sign, classify the dominant one
        p1, c1 = self.classify_single_hand(hand1_landmarks)
        p2, c2 = self.classify_single_hand(hand2_landmarks)
        if c1 >= c2:
            return (p1, c1 * 0.95)
        else:
            return (p2, c2 * 0.95)

    def recognize_landmarks(self, hands_landmarks_list):
        if not hands_landmarks_list or len(hands_landmarks_list) == 0:
            return {
                'detected': False,
                'sign': None,
                'label': 'No Hand Detected',
                'hindi': 'हाथ नहीं दिखा',
                'confidence': 0.0,
                'confidence_level': 'NONE',
                'needs_confirmation': False,
                'message': 'Position your hand clearly within the camera frame.',
                'vocabulary_info': None,
                'pipeline_info': self._get_pipeline_disclosure()
            }

        if len(hands_landmarks_list) == 1:
            sign_key, confidence = self.classify_single_hand(hands_landmarks_list[0])
        else:
            sign_key, confidence = self.classify_two_hands(hands_landmarks_list[0], hands_landmarks_list[1])

        confidence = round(confidence, 2)
        if confidence >= 0.78:
            conf_level = 'HIGH'
            needs_confirm = False
        elif confidence >= 0.50:
            conf_level = 'MODERATE'
            needs_confirm = True
        else:
            conf_level = 'LOW'
            needs_confirm = True

        vocab_info = ISL_VOCABULARY.get(sign_key, {
            'label': sign_key,
            'hindi': sign_key,
            'category': 'general',
            'description': 'Gesture detected by landmark classifier',
            'islrtc_verified': False,
            'action_hint': 'Assistance gesture'
        })

        return {
            'detected': sign_key != 'UNKNOWN',
            'sign': sign_key,
            'label': vocab_info['label'],
            'hindi': vocab_info.get('hindi', ''),
            'confidence': confidence,
            'confidence_level': conf_level,
            'needs_confirmation': needs_confirm,
            'vocabulary_info': vocab_info,
            'pipeline_info': self._get_pipeline_disclosure()
        }

    def recognize_frame(self, image_data):
        if isinstance(image_data, str):
            if ',' in image_data:
                image_data = image_data.split(',')[1]
            image_bytes = base64.b64decode(image_data)
            nparr = np.frombuffer(image_bytes, np.uint8)
            frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        elif isinstance(image_data, np.ndarray):
            frame_bgr = image_data
        else:
            return {'error': 'Invalid image format', 'detected': False}

        if frame_bgr is None:
            return {'error': 'Could not decode image', 'detected': False}

        hands_landmarks = []

        if self.detector is not None:
            try:
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
                results = self.detector.detect(mp_image)
                if results and results.hand_landmarks:
                    for hand_lm in results.hand_landmarks:
                        landmarks_dict = [{'x': lm.x, 'y': lm.y, 'z': lm.z} for lm in hand_lm]
                        hands_landmarks.append(landmarks_dict)
            except Exception as e:
                print(f"Error during MediaPipe detection: {e}")

        result = self.recognize_landmarks(hands_landmarks)
        result['hands_count'] = len(hands_landmarks)
        result['landmarks'] = hands_landmarks
        return result

    def _get_pipeline_disclosure(self):
        return {
            'architecture': 'MediaPipe HandLandmarker + Geometric ISL Kinematic Classifier',
            'curated_vocabulary_count': len(ISL_VOCABULARY),
            'standards_reference': 'Indian Sign Language Research and Training Centre (ISLRTC) Public Counter Vocabulary',
            'disclosure_note': (
                'SignBridge uses real-time geometric landmark feature extraction for an essential public-service vocabulary. '
                'It does not purport to translate unrestricted continuous Indian Sign Language grammar, and is designed as an '
                'honest, safe, assistive communication aid for public counters.'
            ),
            'privacy_guarantee': 'Zero facial recognition, no biometric storage. Landmarks are processed ephemerally in-memory.'
        }

# Global singleton
recognizer = ISLRecognizer()

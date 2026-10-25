import os
import json
import random
import datetime

# Load Mumbai suburban stations dataset
STATIONS_FILE = os.path.join(os.path.dirname(__file__), 'data', 'railway_stations.json')
try:
    with open(STATIONS_FILE, 'r', encoding='utf-8') as f:
        _stations_raw = json.load(f)
        RAILWAY_STATIONS_DATA = _stations_raw.get('stations', [])
except Exception as e:
    RAILWAY_STATIONS_DATA = []

# Verified ISL Counter Phrases Dictionary (citing ISLRTC Standard Lexicon)
VERIFIED_ISL_PHRASES = {
    'GREETING': {
        'id': 'isl_greet',
        'title': 'Namaste / Welcome',
        'sign_gloss': 'NAMASTE',
        'islrtc_ref': 'ISLRTC Vol 1, Page 12 (Greeting)',
        'description': 'Palms joined together at chest level in traditional Indian greeting gesture.',
        'verified': True,
        'animation_type': 'namaste'
    },
    'CONFIRM_YES': {
        'id': 'isl_yes',
        'title': 'Yes / Confirmed',
        'sign_gloss': 'YES',
        'islrtc_ref': 'ISLRTC Vol 1, Page 44 (Affirmation)',
        'description': 'Upright fist with thumb extended, nodding vertically.',
        'verified': True,
        'animation_type': 'thumbs_up'
    },
    'DECLINE_NO': {
        'id': 'isl_no',
        'title': 'No / Cancel',
        'sign_gloss': 'NO',
        'islrtc_ref': 'ISLRTC Vol 1, Page 45 (Negation)',
        'description': 'Flat hand waving horizontally side to side.',
        'verified': True,
        'animation_type': 'wave_no'
    },
    'OK_CONFIRM': {
        'id': 'isl_ok',
        'title': 'OK / Agreed',
        'sign_gloss': 'OK / APPROVE',
        'islrtc_ref': 'ISLRTC Vol 1, Page 50 (Approval)',
        'description': 'Thumb and index fingertips forming circle, other three fingers extended.',
        'verified': True,
        'animation_type': 'ok_sign'
    },
    'TICKET_BOOKING': {
        'id': 'isl_ticket',
        'title': 'Train Ticket',
        'sign_gloss': 'TICKET / TRAIN',
        'islrtc_ref': 'ISLRTC Vol 2, Page 88 (Transport)',
        'description': 'Two fingers pinched like holding a ticket card with horizontal motion.',
        'verified': True,
        'animation_type': 'ticket_card'
    },
    'TRAIN_INFO': {
        'id': 'isl_train',
        'title': 'Train / Rail Movement',
        'sign_gloss': 'TRAIN / RAIL',
        'islrtc_ref': 'ISLRTC Vol 2, Page 90 (Transport)',
        'description': 'Parallel index and middle fingers moving horizontally forward like rails.',
        'verified': True,
        'animation_type': 'train_chug'
    },
    'PLATFORM_INFO': {
        'id': 'isl_platform',
        'title': 'Platform',
        'sign_gloss': 'PLATFORM',
        'islrtc_ref': 'ISLRTC Vol 2, Page 92 (Station Terms)',
        'description': 'Flat non-dominant hand horizontal, dominant index indicating platform position.',
        'verified': True,
        'animation_type': 'platform_point'
    },
    'WAIT_MOMENT': {
        'id': 'isl_wait',
        'title': 'Please Wait A Moment',
        'sign_gloss': 'WAIT',
        'islrtc_ref': 'ISLRTC Vol 1, Page 104 (Social/Command)',
        'description': 'Open palm facing forward at shoulder level, holding steady.',
        'verified': True,
        'animation_type': 'palm_hold'
    },
    'SHOW_ID': {
        'id': 'isl_show_id',
        'title': 'Please Show ID / Disability Card',
        'sign_gloss': 'CARD / SHOW',
        'islrtc_ref': 'ISLRTC Vol 3, Page 15 (Verification)',
        'description': 'Rectangular card outline gesture shown forward toward officer.',
        'verified': True,
        'animation_type': 'card_show'
    },
    'FARE_PAYMENT': {
        'id': 'isl_money',
        'title': 'Fare Amount / Pay',
        'sign_gloss': 'MONEY / RUPEE',
        'islrtc_ref': 'ISLRTC Vol 2, Page 31 (Banking & Money)',
        'description': 'Thumb rubbing index and middle finger tips in money gesture.',
        'verified': True,
        'animation_type': 'money_rub'
    },
    'WHEELCHAIR_ASSIST': {
        'id': 'isl_wheelchair',
        'title': 'Wheelchair Assistance',
        'sign_gloss': 'WHEELCHAIR / ASSIST',
        'islrtc_ref': 'ISLRTC Vol 3, Page 72 (Disability Accessibility)',
        'description': 'Both hands circular rolling motion like turning wheelchair wheels.',
        'verified': True,
        'animation_type': 'wheelchair_roll'
    },
    'DOCTOR_EMERGENCY': {
        'id': 'isl_doctor',
        'title': 'Doctor / Medical Examination',
        'sign_gloss': 'DOCTOR / MEDICAL',
        'islrtc_ref': 'ISLRTC Vol 3, Page 42 (Healthcare)',
        'description': 'Dominant index and middle fingers feeling pulse at opposite wrist.',
        'verified': True,
        'animation_type': 'doctor_pulse'
    },
    'THANK_YOU': {
        'id': 'isl_thankyou',
        'title': 'Thank You / Safe Journey',
        'sign_gloss': 'THANK-YOU',
        'islrtc_ref': 'ISLRTC Vol 1, Page 18 (Courtesy)',
        'description': 'Flat open hand moving smoothly outwards from chin toward conversational partner.',
        'verified': True,
        'animation_type': 'chin_forward'
    }
}

SERVICES = {
    'railway': {
        'id': 'railway',
        'name': 'Railway Station & Ticket Office',
        'short_name': 'Railway Counter',
        'icon': '🚆',
        'mode_type': 'sign_controlled_menu',
        'tagline': 'Sign-controlled self-service menus for ticket booking, train enquiries, and platform info.',
        'disclaimer': 'Prototype demonstration only. SignBridge is an accessibility platform and is not officially integrated with Indian Railways. No real tickets are booked or issued.',
        'features': ['Sign-controlled numbered navigation', 'From/To station selection with validation', 'Passenger count & ticket type', 'Review & demo slip', 'Sample train & platform enquiries']
    },
    'hospital': {
        'id': 'hospital',
        'name': 'Hospital & Doctor Consultation',
        'short_name': 'Hospital Desk',
        'icon': '🏥',
        'mode_type': 'two_way_communication',
        'tagline': 'Two-way communication workspace between patient and reception staff or doctor with verified ISL output.',
        'disclaimer': 'High-Stakes Medical Notice: This prototype aids basic counter reception and doctor dialogue. It is NOT a substitute for qualified human sign language interpreters during clinical examinations, emergency triage, diagnosis, or informed surgical consent.',
        'features': ['Reception guidance & department navigation', 'Two-way doctor consultation workspace', 'Patient ISL camera input with confirmation', 'Doctor speech-to-text dictation', 'Verified ISL gesture cards & readable text fallback', 'Interpreter escalation option']
    },
    'police': {
        'id': 'police',
        'name': 'Police Station Facilitation Desk',
        'short_name': 'Police Desk',
        'icon': '👮',
        'mode_type': 'guided_complaint_assistance',
        'tagline': 'Communication assistance and complaint drafting with explicit user review and confirmation.',
        'disclaimer': 'Legal Notice: This system facilitates communication and drafts review notes. It does NOT automatically file official police First Information Reports (FIRs) or legal depositions under Bharatiya Nagarik Suraksha Sanhita (BNSS). Qualified interpreter escalation is provided.',
        'features': ['Help request & complaint categorization', 'Interactive statement drafting with editable text', 'Mandatory user review before statement confirmation', 'Officer responses with verified sign clips', 'Human interpreter escalation']
    },
    'bank': {
        'id': 'bank',
        'name': 'Bank Branch Customer Desk',
        'short_name': 'Bank Counter',
        'icon': '🏦',
        'mode_type': 'accessible_self_service',
        'tagline': 'Accessible self-service menus, account-opening guidance, document checklists, and verified official portal links.',
        'disclaimer': 'Accessible banking information guide. SignBridge never requests, handles, or stores banking credentials (PIN, passwords, OTP, CVV). Real financial transactions are not performed.',
        'features': ['Account opening guidance (Savings / Current)', 'Required document checklist', 'Counter service categories (Deposit, Passbook, Pension)', 'Verified official links (RBI Financial Inclusion, SBI Portal)', 'Visible destination URLs and safe QR codes']
    },
    'govt_office': {
        'id': 'govt_office',
        'name': 'Government Office / Citizen Seva Kendra',
        'short_name': 'Govt Seva Kendra',
        'icon': '🏛️',
        'mode_type': 'guided_service_navigation',
        'tagline': 'Source-grounded guidance for public services, Aadhaar, UDID disability certificates, and pensions.',
        'disclaimer': 'Public service navigation assistant. Guidance is source-grounded with direct official government portal links (UIDAI, Swavlamban UDID, National Portal of India).',
        'features': ['Aadhaar demographic update guidance', 'UDID disability identity card process', 'Ration card & public food security info', 'Senior citizen & Divyangjan pension checklist', 'Direct links to official government portals']
    }
}

# Mumbai Suburban Railway Options & Helper Lookup
JOURNEY_TYPE_OPTIONS = [
    {"num": 1, "label": "Single Journey", "type": "Single", "multiplier": 1.0},
    {"num": 2, "label": "Return Journey (Same Day)", "type": "Return", "multiplier": 2.0}
]

def find_station_by_input(val):
    if val is None:
        return None
    val_str = str(val).strip()
    # 1. Exact match on num_code (e.g. "17.1", "1", "19", "8")
    for s in RAILWAY_STATIONS_DATA:
        if str(s.get('num_code')) == val_str:
            return s
        if str(s.get('code')).upper() == val_str.upper():
            return s
        if s.get('name').lower() == val_str.lower() or s.get('full_name', '').lower() == val_str.lower():
            return s
    # 2. Check integer code
    try:
        val_float = float(val_str)
        for s in RAILWAY_STATIONS_DATA:
            if s.get('numeric_val') == val_float:
                return s
    except (ValueError, TypeError):
        pass
    # 3. Quick fallback to popular stations
    popular_map = {
        "1": "CSMT", "2": "DR", "3": "TNA", "4": "DI", "5": "KYN",
        "17.1": "AIRL", "17.2": "RABE", "18.1": "PNVL"
    }
    if val_str in popular_map:
        target_code = popular_map[val_str]
        for s in RAILWAY_STATIONS_DATA:
            if s.get('code') == target_code:
                return s
    return None

# Common station list for quick touch buttons & preview
RAILWAY_STATIONS = [
    {"num": 1, "num_code": "1", "code": "CSMT", "name": "CSMT (Mumbai)", "line": "Central Line"},
    {"num": 2, "num_code": "8", "code": "DR",   "name": "Dadar", "line": "Central & Western"},
    {"num": 3, "num_code": "16", "code": "TNA",  "name": "Thane", "line": "Central Line"},
    {"num": 4, "num_code": "18", "code": "DI",   "name": "Dombivli", "line": "Central Line"},
    {"num": 5, "num_code": "19", "code": "KYN",  "name": "Kalyan", "line": "Central Line"},
    {"num": 6, "num_code": "17.1", "code": "AIRL", "name": "Airoli (17.1)", "line": "Trans-Harbour Branch"}
]

RAILWAY_DESTINATIONS = [
    {"num": 1, "num_code": "1", "code": "CSMT", "name": "CSMT (Mumbai)", "line": "Central Line"},
    {"num": 2, "num_code": "17.1", "code": "AIRL", "name": "Airoli (17.1)", "line": "Trans-Harbour Branch"},
    {"num": 3, "num_code": "16", "code": "TNA",  "name": "Thane", "line": "Central Line"},
    {"num": 4, "num_code": "18", "code": "DI",   "name": "Dombivli", "line": "Central Line"},
    {"num": 5, "num_code": "19", "code": "KYN",  "name": "Kalyan", "line": "Central Line"},
    {"num": 6, "num_code": "20", "code": "TLA",  "name": "Titwala", "line": "Central Line"}
]

PASSENGER_COUNT_OPTIONS = [
    {"num": 1, "label": "1 Passenger", "count": 1},
    {"num": 2, "label": "2 Passengers", "count": 2},
    {"num": 3, "label": "3 Passengers", "count": 3},
    {"num": 4, "label": "4 Passengers", "count": 4}
]

TICKET_TYPE_OPTIONS = [
    {"num": 1, "label": "Second Class Ordinary", "base_fare": 15, "type": "II Ord"},
    {"num": 2, "label": "First Class", "base_fare": 105, "type": "FC"},
    {"num": 3, "label": "AC Local Train", "base_fare": 65, "type": "AC Local"},
    {"num": 4, "label": "Divyangjan Accessible Concession (75% Off)", "base_fare": 5, "type": "Divyangjan Concession"}
]

# Sample Static Train Enquiries
SAMPLE_TRAIN_ENQUIRIES = [
    {
        "train_no": "12138",
        "train_name": "Punjab Mail (Express)",
        "route": "CSMT → Kalyan → New Delhi",
        "schedule": "Departs CSMT 19:35 | Kalyan 20:32",
        "running_status": "Static Sample: On-time departure scheduled from CSMT.",
        "platform": "Platform 3 (CSMT)",
        "is_sample": True
    },
    {
        "train_no": "SUB-FAST",
        "train_name": "Central Line Fast Local",
        "route": "CSMT → Thane → Dombivli → Kalyan",
        "schedule": "Every 12 minutes (Peak hours)",
        "running_status": "Static Sample: Normal 5-10 min suburban intervals.",
        "platform": "Platform 4 (CSMT) / Platform 1 (Kalyan)",
        "is_sample": True
    },
    {
        "train_no": "22221",
        "train_name": "CSMT - Nizamuddin Rajdhani Express",
        "route": "CSMT → Kalyan → Jalgaon → Delhi",
        "schedule": "Departs CSMT 16:00 | Kalyan 16:43",
        "running_status": "Static Sample: Scheduled service. Divyangjan Coach D1.",
        "platform": "Platform 5 (CSMT)",
        "is_sample": True
    }
]

class ContextAwareWorkflowEngine:
    def __init__(self):
        pass

    def get_service_info(self, service_type):
        return SERVICES.get(service_type, SERVICES['railway'])

    def get_initial_state(self, service_type):
        base_state = {
            'service_type': service_type,
            'active_task': 'MENU_SELECTION' if service_type == 'railway' else 'WELCOME',
            'current_field': None,
            'pending_selection': None,
            'confirmed_data': {},
            'status': 'IN_PROGRESS',
            'created_at': datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }

        if service_type == 'railway':
            base_state.update({
                'active_task': 'MAIN_MENU',
                'current_field': 'MENU_OPTION',
                'booking': {
                    'from': None,
                    'to': None,
                    'passenger_count': 1,
                    'ticket_type': None,
                    'fare': 0
                },
                'enquiry_result': None
            })
        elif service_type == 'hospital':
            base_state.update({
                'sub_mode': 'RECEPTION', # 'RECEPTION' or 'DOCTOR_CONSULTATION'
                'patient_name': 'Ramesh Verma',
                'department': 'General OPD',
                'consultation_notes': [],
                'interpreter_requested': False
            })
        elif service_type == 'police':
            base_state.update({
                'category': 'Lost Property Memo',
                'draft_statement': '',
                'statement_confirmed': False,
                'interpreter_requested': False
            })
        elif service_type == 'bank':
            base_state.update({
                'active_tab': 'ACCOUNT_OPENING',
                'verified_links': [
                    {'title': 'Reserve Bank of India — Financial Inclusion Portal', 'url': 'https://rbi.org.in'},
                    {'title': 'State Bank of India — Official Digital Account Guidance', 'url': 'https://bank.sbi'}
                ]
            })
        elif service_type == 'govt_office':
            base_state.update({
                'active_scheme': 'AADHAAR_UPDATE',
                'verified_sources': [
                    {'title': 'Unique Identification Authority of India (UIDAI)', 'url': 'https://uidai.gov.in'},
                    {'title': 'Department of Empowerment of Persons with Disabilities (UDID Portal)', 'url': 'https://swavlambancard.gov.in'}
                ]
            })

        return base_state

    def process_railway_action(self, current_state, action_type, payload=None):
        payload = payload or {}
        active_task = current_state.get('active_task', 'MAIN_MENU')
        current_field = current_state.get('current_field', 'MENU_OPTION')
        booking = current_state.get('booking', {})
        bot_reply = ""
        verified_clip = None

        # 0. Namaste Greeting
        if action_type == 'NAMASTE_GREETING' or (action_type == 'CONFIRM_PREDICTION' and payload.get('sign') == 'NAMASTE'):
            current_state['active_task'] = 'MAIN_MENU'
            current_state['current_field'] = 'MENU_OPTION'
            bot_reply = "Namaste! How can I help you today? Please choose an option: 1. Ticket Booking, 2. Train Enquiry, or 3. Platform Information."
            verified_clip = VERIFIED_ISL_PHRASES['GREETING']
            return current_state, bot_reply, verified_clip

        # 1. Prediction Confirmation / Code Entry flow
        if action_type == 'CONFIRM_PREDICTION':
            selected_num = payload.get('number')
            
            if active_task == 'MAIN_MENU':
                try:
                    num_val = int(float(str(selected_num)))
                except (ValueError, TypeError):
                    num_val = None

                if num_val == 1:
                    current_state['active_task'] = 'TICKET_BOOKING'
                    current_state['current_field'] = 'FROM_STATION'
                    bot_reply = "Ticket Booking Mode. Please select your origin station (From) using station code (e.g. 1 for CSMT, 16 for Thane, 17.1 for Airoli) or touch list."
                    verified_clip = VERIFIED_ISL_PHRASES['TICKET_BOOKING']
                elif num_val == 2:
                    current_state['active_task'] = 'TRAIN_ENQUIRY'
                    current_state['current_field'] = 'ENQUIRY_TYPE'
                    bot_reply = "Train Enquiry Mode. Select an inquiry option or sample train."
                    verified_clip = VERIFIED_ISL_PHRASES['TRAIN_INFO']
                elif num_val == 3:
                    current_state['active_task'] = 'PLATFORM_INFO'
                    current_state['current_field'] = 'TRAIN_SELECT'
                    bot_reply = "Platform Information Mode. Showing platform allocations for sample trains."
                    verified_clip = VERIFIED_ISL_PHRASES['PLATFORM_INFO']
                else:
                    bot_reply = f"Option {selected_num} not recognized. Please choose 1, 2, or 3."

            elif active_task == 'TICKET_BOOKING':
                if current_field == 'FROM_STATION':
                    st = find_station_by_input(selected_num)
                    if st:
                        booking['from'] = st['name']
                        booking['from_code'] = st.get('code')
                        booking['from_num'] = st.get('num_code')
                        booking['from_line'] = st.get('line')
                        current_state['current_field'] = 'TO_STATION'
                        bot_reply = f"Origin station set to {st['name']} (Code {st.get('num_code')}). Now select your destination station (To)."
                    else:
                        bot_reply = f"Station code '{selected_num}' not found in Mumbai Suburban network. Please retry with a valid station code."

                elif current_field == 'TO_STATION':
                    st = find_station_by_input(selected_num)
                    if st:
                        # Validation: Origin and Destination cannot be the same
                        from_name = booking.get('from', '')
                        if from_name and (from_name.lower() == st['name'].lower() or booking.get('from_code') == st.get('code')):
                            bot_reply = f"Validation Error: Destination cannot be the same as origin ({st['name']}). Please select a different destination."
                        else:
                            booking['to'] = st['name']
                            booking['to_code'] = st.get('code')
                            booking['to_num'] = st.get('num_code')
                            booking['to_line'] = st.get('line')
                            current_state['current_field'] = 'PASSENGER_COUNT'
                            bot_reply = f"Destination set to {st['name']} (Code {st.get('num_code')}). Now select number of passengers (1 to 4)."
                    else:
                        bot_reply = f"Destination station code '{selected_num}' not found. Please retry."

                elif current_field == 'PASSENGER_COUNT':
                    try:
                        p_cnt = int(float(str(selected_num)))
                    except (ValueError, TypeError):
                        p_cnt = 1
                    if 1 <= p_cnt <= 10:
                        booking['passenger_count'] = p_cnt
                        current_state['current_field'] = 'JOURNEY_TYPE'
                        bot_reply = f"Passenger count set to {p_cnt}. Select journey type: 1. Single Journey or 2. Return Journey."
                    else:
                        bot_reply = "Please enter passenger count between 1 and 4."

                elif current_field == 'JOURNEY_TYPE':
                    try:
                        j_val = int(float(str(selected_num)))
                    except (ValueError, TypeError):
                        j_val = 1
                    booking['journey_type'] = "Return Journey" if j_val == 2 else "Single Journey"
                    current_state['current_field'] = 'TICKET_TYPE'
                    bot_reply = f"Journey type: {booking['journey_type']}. Now select ticket class: 1. Second Class Ordinary, 2. First Class, 3. AC Local, or 4. Divyangjan Concession."

                elif current_field == 'TICKET_TYPE':
                    try:
                        t_num = int(float(str(selected_num)))
                    except (ValueError, TypeError):
                        t_num = 1
                    type_opt = next((t for t in TICKET_TYPE_OPTIONS if t['num'] == t_num), TICKET_TYPE_OPTIONS[0])
                    booking['ticket_type'] = type_opt['label']
                    base_fare = type_opt['base_fare']
                    mult = 2.0 if booking.get('journey_type') == 'Return Journey' else 1.0
                    booking['fare'] = int(base_fare * booking.get('passenger_count', 1) * mult)
                    current_state['current_field'] = 'REVIEW'
                    bot_reply = f"Ticket class: {type_opt['label']}. Total estimated fare: ₹{booking['fare']}. Please review your booking details below."
                    verified_clip = VERIFIED_ISL_PHRASES['FARE_PAYMENT']

                elif current_field == 'REVIEW':
                    # User confirms review -> proceed to safe demo payment screen
                    current_state['current_field'] = 'PAYMENT'
                    demo_pnr = f"DEMO-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                    current_state['demo_pnr'] = demo_pnr
                    bot_reply = f"Booking review confirmed. Generated Demo PNR: {demo_pnr}. Showing safe Demo Payment screen."
                    verified_clip = VERIFIED_ISL_PHRASES['THANK_YOU']

                elif current_field == 'PAYMENT':
                    current_state['current_field'] = 'SUMMARY_CONFIRMED'
                    demo_pnr = current_state.get('demo_pnr') or f"DEMO-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                    current_state['demo_pnr'] = demo_pnr
                    bot_reply = f"Demo transaction completed. PNR: {demo_pnr}. Remember: Prototype only — no real payment processed or ticket issued."
                    verified_clip = VERIFIED_ISL_PHRASES['THANK_YOU']

            elif active_task == 'TRAIN_ENQUIRY':
                try:
                    e_num = int(float(str(selected_num)))
                except (ValueError, TypeError):
                    e_num = 1
                if 1 <= e_num <= len(SAMPLE_TRAIN_ENQUIRIES):
                    selected_enquiry = SAMPLE_TRAIN_ENQUIRIES[e_num - 1]
                    current_state['enquiry_result'] = selected_enquiry
                    bot_reply = f"Train {selected_enquiry['train_name']} ({selected_enquiry['train_no']}): {selected_enquiry['schedule']}. Running status: {selected_enquiry['running_status']}"
                    verified_clip = VERIFIED_ISL_PHRASES['TRAIN_INFO']

            elif active_task == 'PLATFORM_INFO':
                try:
                    e_num = int(float(str(selected_num)))
                except (ValueError, TypeError):
                    e_num = 1
                if 1 <= e_num <= len(SAMPLE_TRAIN_ENQUIRIES):
                    selected_enquiry = SAMPLE_TRAIN_ENQUIRIES[e_num - 1]
                    current_state['enquiry_result'] = selected_enquiry
                    bot_reply = f"Platform info: {selected_enquiry['train_name']} departs from {selected_enquiry['platform']} (Static Demonstration Sample)."
                    verified_clip = VERIFIED_ISL_PHRASES['PLATFORM_INFO']

        # 2. Touch Direct Selection
        elif action_type == 'DIRECT_TOUCH_SELECT':
            field = payload.get('field')
            value = payload.get('value')
            if field == 'menu_option':
                return self.process_railway_action(current_state, 'CONFIRM_PREDICTION', {'number': value})
            elif field == 'from':
                st = find_station_by_input(value)
                if st:
                    booking['from'] = st['name']
                    booking['from_code'] = st.get('code')
                    booking['from_num'] = st.get('num_code')
                    booking['from_line'] = st.get('line')
                else:
                    booking['from'] = str(value)
                current_state['current_field'] = 'TO_STATION'
                bot_reply = f"Origin station set to {booking['from']}. Please select destination."
            elif field == 'to':
                st = find_station_by_input(value)
                to_name = st['name'] if st else str(value)
                from_name = booking.get('from', '')
                if from_name and (from_name.lower() == to_name.lower() or (st and booking.get('from_code') == st.get('code'))):
                    bot_reply = f"Validation Error: Destination cannot be the same as origin ({to_name}). Please select another station."
                else:
                    booking['to'] = to_name
                    if st:
                        booking['to_code'] = st.get('code')
                        booking['to_num'] = st.get('num_code')
                        booking['to_line'] = st.get('line')
                    current_state['current_field'] = 'PASSENGER_COUNT'
                    bot_reply = f"Destination set to {to_name}. Please choose passenger count."
            elif field == 'passenger_count':
                booking['passenger_count'] = int(value)
                current_state['current_field'] = 'JOURNEY_TYPE'
                bot_reply = f"Passengers: {value}. Please choose journey type."
            elif field == 'journey_type':
                booking['journey_type'] = str(value)
                current_state['current_field'] = 'TICKET_TYPE'
                bot_reply = f"Journey type set to {value}. Please choose ticket class."
            elif field == 'ticket_type':
                if isinstance(value, dict):
                    booking['ticket_type'] = value.get('label')
                    base_fare = value.get('base_fare', 15)
                else:
                    booking['ticket_type'] = str(value)
                    base_fare = 15
                mult = 2.0 if booking.get('journey_type') == 'Return Journey' else 1.0
                booking['fare'] = int(base_fare * booking.get('passenger_count', 1) * mult)
                current_state['current_field'] = 'REVIEW'
                bot_reply = f"Ticket type set to {booking['ticket_type']}. Total fare: ₹{booking['fare']}."
            elif field == 'confirm_review':
                current_state['current_field'] = 'PAYMENT'
                demo_pnr = f"DEMO-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                current_state['demo_pnr'] = demo_pnr
                bot_reply = f"Review confirmed. Demo PNR: {demo_pnr}. Showing safe Demo Payment screen."
            elif field == 'confirm_payment':
                current_state['current_field'] = 'SUMMARY_CONFIRMED'
                demo_pnr = current_state.get('demo_pnr') or f"DEMO-{random.randint(100, 999)}-{random.randint(1000, 9999)}"
                current_state['demo_pnr'] = demo_pnr
                bot_reply = f"Demo Payment completed. PNR: {demo_pnr}. (Demo Only — No Real Payment Processed)."
                verified_clip = VERIFIED_ISL_PHRASES['THANK_YOU']
            elif field == 'edit_field':
                current_state['current_field'] = value
                bot_reply = f"Editing {value}. Please select an updated value."
            elif field == 'reset_booking':
                current_state['active_task'] = 'MAIN_MENU'
                current_state['current_field'] = 'MENU_OPTION'
                current_state['booking'] = {'passenger_count': 1, 'fare': 0}
                bot_reply = "Booking reset. Welcome back to Railway Main Menu."

        # 3. Navigational reset / back
        elif action_type == 'NAVIGATE_BACK':
            if active_task in ['TRAIN_ENQUIRY', 'PLATFORM_INFO']:
                current_state['active_task'] = 'MAIN_MENU'
                current_state['current_field'] = 'MENU_OPTION'
                bot_reply = "Returned to Railway main menu."
            elif active_task == 'TICKET_BOOKING':
                if current_field == 'TO_STATION':
                    current_state['current_field'] = 'FROM_STATION'
                elif current_field == 'PASSENGER_COUNT':
                    current_state['current_field'] = 'TO_STATION'
                elif current_field == 'JOURNEY_TYPE':
                    current_state['current_field'] = 'PASSENGER_COUNT'
                elif current_field == 'TICKET_TYPE':
                    current_state['current_field'] = 'JOURNEY_TYPE'
                elif current_field == 'REVIEW':
                    current_state['current_field'] = 'TICKET_TYPE'
                elif current_field == 'PAYMENT':
                    current_state['current_field'] = 'REVIEW'
                else:
                    current_state['active_task'] = 'MAIN_MENU'
                    current_state['current_field'] = 'MENU_OPTION'
                bot_reply = "Navigated to previous step."

        # 3. Navigational reset / back
        elif action_type == 'NAVIGATE_BACK':
            if active_task in ['TRAIN_ENQUIRY', 'PLATFORM_INFO']:
                current_state['active_task'] = 'MAIN_MENU'
                current_state['current_field'] = 'MENU_OPTION'
                bot_reply = "Returned to Railway main menu."
            elif active_task == 'TICKET_BOOKING':
                if current_field == 'TO_STATION':
                    current_state['current_field'] = 'FROM_STATION'
                elif current_field == 'PASSENGER_COUNT':
                    current_state['current_field'] = 'TO_STATION'
                elif current_field == 'TICKET_TYPE':
                    current_state['current_field'] = 'PASSENGER_COUNT'
                elif current_field == 'REVIEW':
                    current_state['current_field'] = 'TICKET_TYPE'
                else:
                    current_state['active_task'] = 'MAIN_MENU'
                    current_state['current_field'] = 'MENU_OPTION'
                bot_reply = "Navigated to previous field."

        current_state['booking'] = booking
        return current_state, bot_reply, verified_clip

    def process_hospital_action(self, current_state, action_type, payload=None):
        payload = payload or {}
        bot_reply = ""
        verified_clip = None

        if action_type == 'SWITCH_HOSPITAL_MODE':
            sub_mode = payload.get('sub_mode', 'RECEPTION')
            current_state['sub_mode'] = sub_mode
            if sub_mode == 'DOCTOR_CONSULTATION':
                bot_reply = "Doctor Consultation Workspace active. Patient can use supported ISL signs or text. Doctor can use speech-to-text dictation."
                verified_clip = VERIFIED_ISL_PHRASES['DOCTOR_EMERGENCY']
            else:
                bot_reply = "Hospital Reception Desk active. Guidance available for OPD tokens, doctor queues, and department routing."

        elif action_type == 'ADD_CONSULTATION_MESSAGE':
            sender = payload.get('sender', 'patient')
            text = payload.get('text', '')
            notes = current_state.get('consultation_notes', [])
            notes.append({
                'sender': sender,
                'text': text,
                'timestamp': datetime.datetime.now().strftime('%H:%M:%S')
            })
            current_state['consultation_notes'] = notes
            bot_reply = f"{'Doctor' if sender == 'doctor' else 'Patient'}: {text}"

        elif action_type == 'REQUEST_INTERPRETER':
            current_state['interpreter_requested'] = True
            bot_reply = "Notice: Qualified Human Sign Language Interpreter escalation request logged. Hospital reception notified."
            verified_clip = VERIFIED_ISL_PHRASES['WAIT_MOMENT']

        return current_state, bot_reply, verified_clip

    def process_police_action(self, current_state, action_type, payload=None):
        payload = payload or {}
        bot_reply = ""
        verified_clip = None

        if action_type == 'UPDATE_COMPLAINT_CATEGORY':
            cat = payload.get('category', 'Lost Property Memo')
            current_state['category'] = cat
            bot_reply = f"Complaint category set to: {cat}. Please draft your statement details."

        elif action_type == 'UPDATE_STATEMENT_TEXT':
            stmt = payload.get('statement', '')
            current_state['draft_statement'] = stmt
            current_state['statement_confirmed'] = False
            bot_reply = "Draft statement updated. Please review carefully before confirming."

        elif action_type == 'CONFIRM_STATEMENT':
            current_state['statement_confirmed'] = True
            ref_id = f"MEMO-{random.randint(1000, 9999)}"
            current_state['memo_ref'] = ref_id
            bot_reply = f"Statement explicitly confirmed by citizen. Generated Memo Ref: {ref_id}. (Not an official FIR)."
            verified_clip = VERIFIED_ISL_PHRASES['CONFIRM_YES']

        elif action_type == 'REQUEST_INTERPRETER':
            current_state['interpreter_requested'] = True
            bot_reply = "Certified Human Court/Police Interpreter assistance requested. Escalation alert recorded."
            verified_clip = VERIFIED_ISL_PHRASES['WAIT_MOMENT']

        return current_state, bot_reply, verified_clip

    def process_bank_action(self, current_state, action_type, payload=None):
        payload = payload or {}
        bot_reply = ""
        verified_clip = None

        if action_type == 'SWITCH_BANK_TAB':
            tab = payload.get('tab', 'ACCOUNT_OPENING')
            current_state['active_tab'] = tab
            bot_reply = f"Banking Desk: Switched to {tab.replace('_', ' ').title()} Guidance."

        return current_state, bot_reply, verified_clip

    def process_govt_action(self, current_state, action_type, payload=None):
        payload = payload or {}
        bot_reply = ""
        verified_clip = None

        if action_type == 'SELECT_GOVT_SCHEME':
            scheme = payload.get('scheme', 'AADHAAR_UPDATE')
            current_state['active_scheme'] = scheme
            bot_reply = f"Government Desk: Showing source-grounded guidance for {scheme.replace('_', ' ').title()}."

        return current_state, bot_reply, verified_clip

    def process_action(self, service_type, current_state, action_type, payload=None):
        if service_type == 'railway':
            return self.process_railway_action(current_state, action_type, payload)
        elif service_type == 'hospital':
            return self.process_hospital_action(current_state, action_type, payload)
        elif service_type == 'police':
            return self.process_police_action(current_state, action_type, payload)
        elif service_type == 'bank':
            return self.process_bank_action(current_state, action_type, payload)
        elif service_type == 'govt_office':
            return self.process_govt_action(current_state, action_type, payload)
        else:
            return current_state, "Action acknowledged.", None

# Global Workflow Engine instance
workflow_engine = ContextAwareWorkflowEngine()

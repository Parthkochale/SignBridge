import os
import json
import uuid
import datetime
from flask import Flask, render_template, request, jsonify, send_from_directory

import database
from dictionary import dictionary_manager
from isl_recognizer import recognizer, ISL_VOCABULARY
from workflows import (
    workflow_engine, SERVICES, VERIFIED_ISL_PHRASES,
    RAILWAY_STATIONS, RAILWAY_DESTINATIONS, PASSENGER_COUNT_OPTIONS,
    TICKET_TYPE_OPTIONS, SAMPLE_TRAIN_ENQUIRIES, RAILWAY_STATIONS_DATA,
    JOURNEY_TYPE_OPTIONS
)

app = Flask(__name__, static_folder='static', template_folder='templates')
app.config['SECRET_KEY'] = 'signbridge-hackathon-2026-secret'

# Initialize SQLite database
database.init_db()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/services', methods=['GET'])
def get_services():
    services_list = list(SERVICES.values())
    return jsonify({
        'status': 'success',
        'services': services_list
    })

@app.route('/api/dictionary', methods=['GET'])
def get_dictionary():
    q = request.args.get('q', '')
    cat = request.args.get('category', '')
    results = dictionary_manager.search(query=q, category=cat)
    return jsonify({
        'status': 'success',
        'metadata': dictionary_manager.get_metadata(),
        'results': results,
        'count': len(results)
    })

@app.route('/api/dictionary/categories', methods=['GET'])
def get_dictionary_categories():
    return jsonify({
        'status': 'success',
        'categories': dictionary_manager.get_categories()
    })

@app.route('/api/dictionary/<entry_id>', methods=['GET'])
def get_dictionary_entry(entry_id):
    entry = dictionary_manager.get_entry_by_id(entry_id)
    if not entry:
        return jsonify({'status': 'error', 'message': 'Dictionary entry not found'}), 404
    return jsonify({
        'status': 'success',
        'entry': entry
    })

@app.route('/api/railway/options', methods=['GET'])
def get_railway_options():
    return jsonify({
        'status': 'success',
        'stations': RAILWAY_STATIONS,
        'all_stations': RAILWAY_STATIONS_DATA,
        'destinations': RAILWAY_DESTINATIONS,
        'passenger_counts': PASSENGER_COUNT_OPTIONS,
        'journey_types': JOURNEY_TYPE_OPTIONS,
        'ticket_types': TICKET_TYPE_OPTIONS,
        'sample_enquiries': SAMPLE_TRAIN_ENQUIRIES
    })

@app.route('/api/verified_phrases', methods=['GET'])
def get_verified_phrases():
    return jsonify({
        'status': 'success',
        'phrases': VERIFIED_ISL_PHRASES,
        'vocabulary': ISL_VOCABULARY
    })

@app.route('/api/sessions/join', methods=['POST'])
def join_session():
    data = request.get_json() or {}
    room_code = (data.get('room_code') or '').strip().upper()
    if not room_code:
        return jsonify({'status': 'error', 'message': 'Please enter a room code (e.g. SB-XXXXXX)'}), 400

    session = database.get_session(room_code)
    if not session:
        return jsonify({'status': 'error', 'message': f'Room "{room_code}" was not found. Please check the code.'}), 404

    messages = database.get_messages(room_code)
    service_info = SERVICES.get(session['service_type'], SERVICES['railway'])

    return jsonify({
        'status': 'success',
        'session_id': room_code,
        'service_type': session['service_type'],
        'service_info': service_info,
        'stage': session['stage'],
        'state': session.get('state_data', {}),
        'messages': messages,
        'message_count': len(messages)
    })

@app.route('/api/sessions', methods=['POST'])
def create_session():
    data = request.get_json() or {}
    service_type = data.get('service_type', 'railway')
    requested_id = data.get('session_id')
    
    if service_type not in SERVICES:
        service_type = 'railway'

    session_id = requested_id or f"SB-{uuid.uuid4().hex[:6].upper()}"
    initial_state = workflow_engine.get_initial_state(service_type)
    
    database.create_session(service_type=service_type, session_id=session_id, initial_state=initial_state)

    # Initial Welcome message
    service_info = SERVICES[service_type]
    if service_type == 'railway':
        welcome_msg = "Namaste! Welcome to SignBridge Railway Assistance. Please select an option: 1. Ticket Booking, 2. Train Enquiry, or 3. Platform Information."
    elif service_type == 'hospital':
        welcome_msg = "Namaste! Welcome to Hospital Reception & Consultation Desk. Select Reception Guidance or Doctor Consultation Workspace."
    elif service_type == 'police':
        welcome_msg = "Namaste! Welcome to Police Facilitation Desk. Select a complaint category to draft your statement with full review."
    elif service_type == 'bank':
        welcome_msg = "Namaste! Welcome to Accessible Banking Self-Service. Select account opening guidance or verified official portal services."
    else:
        welcome_msg = "Namaste! Welcome to Government Seva Kendra. Select a public scheme for verified guidelines and document checklists."

    greet_clip = VERIFIED_ISL_PHRASES['GREETING']
    database.add_message(
        session_id=session_id,
        sender='system',
        text=welcome_msg,
        sign_detected='NAMASTE',
        confidence=1.0,
        clip_id=greet_clip['id'],
        is_verified_clip=1
    )

    return jsonify({
        'status': 'success',
        'session_id': session_id,
        'service_type': service_type,
        'service_info': service_info,
        'state': initial_state,
        'messages': database.get_messages(session_id)
    })

@app.route('/api/sessions/<session_id>', methods=['GET'])
def get_session(session_id):
    session = database.get_session(session_id)
    if not session:
        return jsonify({'status': 'error', 'message': 'Session not found'}), 404
    
    messages = database.get_messages(session_id)
    service_info = SERVICES.get(session['service_type'], SERVICES['railway'])
    
    return jsonify({
        'status': 'success',
        'session_id': session_id,
        'service_type': session['service_type'],
        'service_info': service_info,
        'stage': session['stage'],
        'state': session.get('state_data', {}),
        'messages': messages,
        'message_count': len(messages),
        'updated_at': str(session.get('updated_at', ''))
    })

@app.route('/api/sessions/<session_id>/action', methods=['POST'])
def handle_action(session_id):
    session = database.get_session(session_id)
    if not session:
        return jsonify({'status': 'error', 'message': 'Session not found'}), 404

    data = request.get_json() or {}
    action_type = data.get('action_type')
    payload = data.get('payload', {})
    service_type = session['service_type']
    current_state = session.get('state_data', {})

    # Process action through context-aware workflow engine
    updated_state, bot_reply, verified_clip = workflow_engine.process_action(
        service_type=service_type,
        current_state=current_state,
        action_type=action_type,
        payload=payload
    )

    # Record message log
    if action_type == 'CONFIRM_PREDICTION':
        database.add_message(
            session_id=session_id,
            sender='citizen',
            text=f"Citizen confirmed selection: Option {payload.get('number')}",
            sign_detected=f"NUMBER_{payload.get('number')}",
            confidence=0.95,
            clip_id=None,
            is_verified_clip=0
        )
    elif action_type == 'DIRECT_TOUCH_SELECT':
        field = payload.get('field', '')
        val = payload.get('value', '')
        if isinstance(val, dict):
            val = val.get('label', '')
        database.add_message(
            session_id=session_id,
            sender='citizen',
            text=f"Citizen selected {field}: {val}",
            sign_detected=None,
            confidence=1.0,
            clip_id=None,
            is_verified_clip=0
        )
    elif action_type == 'OFFICER_MESSAGE':
        text = payload.get('text', '')
        database.add_message(
            session_id=session_id,
            sender='officer',
            text=text,
            sign_detected=None,
            confidence=None,
            clip_id=verified_clip['id'] if verified_clip else None,
            is_verified_clip=1 if verified_clip else 0
        )

    if bot_reply and action_type != 'OFFICER_MESSAGE':
        database.add_message(
            session_id=session_id,
            sender='system',
            text=bot_reply,
            sign_detected=None,
            confidence=None,
            clip_id=verified_clip['id'] if verified_clip else None,
            is_verified_clip=1 if verified_clip else 0
        )

    # Save to SQLite service_records if a demo receipt/memo was confirmed
    demo_pnr = updated_state.get('demo_pnr') or updated_state.get('memo_ref')
    if demo_pnr:
        title = f"{SERVICES[service_type]['short_name']} Demo Record"
        database.create_service_record(
            session_id=session_id,
            service_type=service_type,
            reference_no=demo_pnr,
            title=title,
            summary_dict=updated_state
        )

    database.update_session(
        session_id=session_id,
        stage=updated_state.get('active_task', session['stage']),
        state_data=updated_state
    )

    return jsonify({
        'status': 'success',
        'session_id': session_id,
        'stage': updated_state.get('active_task', session['stage']),
        'state': updated_state,
        'bot_reply': bot_reply,
        'verified_clip': verified_clip,
        'messages': database.get_messages(session_id)
    })

@app.route('/api/recognize_frame', methods=['POST'])
def recognize_frame():
    data = request.get_json() or {}
    image_b64 = data.get('image')
    if not image_b64:
        return jsonify({'status': 'error', 'message': 'Missing image data'}), 400

    result = recognizer.recognize_frame(image_b64)
    return jsonify({
        'status': 'success',
        'result': result
    })

@app.route('/api/recognize_landmarks', methods=['POST'])
def recognize_landmarks():
    data = request.get_json() or {}
    landmarks_list = data.get('landmarks', [])

    result = recognizer.recognize_landmarks(landmarks_list)
    return jsonify({
        'status': 'success',
        'result': result
    })

@app.route('/api/history', methods=['GET'])
def get_history():
    sessions = database.get_recent_sessions()
    records = database.get_all_records()
    return jsonify({
        'status': 'success',
        'sessions': sessions,
        'records': records
    })

@app.route('/api/record/<reference_no>', methods=['GET'])
def get_record(reference_no):
    record = database.get_service_record(reference_no)
    if not record:
        return jsonify({'status': 'error', 'message': 'Record not found'}), 404
    return jsonify({
        'status': 'success',
        'record': record
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting SignBridge Public-Service Platform on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)

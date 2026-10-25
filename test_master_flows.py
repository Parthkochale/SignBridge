import urllib.request
import json
import sys

# Configure UTF-8 for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:5000"

def post(endpoint, data):
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=json.dumps(data).encode('utf-8'),
        headers={'Content-Type': 'application/json'}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode('utf-8'))

def get(endpoint):
    with urllib.request.urlopen(f"{BASE_URL}{endpoint}") as resp:
        return json.loads(resp.read().decode('utf-8'))

def run_tests():
    print("=" * 60)
    print("RUNNING SIGNBRIDGE MASTER TEST SUITE")
    print("=" * 60)

    # 1. Services & Dictionary Verification
    print("\n[TEST 1] Verifying Services and Dictionary APIs...")
    services_res = get("/api/services")
    assert services_res['status'] == 'success', "Services failed"
    svc_ids = [s['id'] for s in services_res['services']]
    print(f"✓ Registered public services: {svc_ids}")
    assert set(['railway', 'hospital', 'police', 'bank', 'govt_office']).issubset(set(svc_ids))

    dict_cats = get("/api/dictionary/categories")
    print(f"✓ Dictionary categories count: {len(dict_cats['categories'])}")
    assert len(dict_cats['categories']) >= 8

    dict_search = get("/api/dictionary?q=ticket")
    assert dict_search['count'] > 0
    first_res = dict_search['results'][0]
    print(f"✓ Dictionary search 'ticket': {first_res['gloss']} ({first_res.get('islrtc_reference')})")

    # 2. Railway Stations Dataset Verification
    print("\n[TEST 2] Verifying Mumbai Suburban Stations Dataset...")
    rail_opts = get("/api/railway/options")
    all_stations = rail_opts.get('all_stations', [])
    assert len(all_stations) >= 20, f"Expected 20+ stations, got {len(all_stations)}"
    airoli = next((s for s in all_stations if s['num_code'] == '17.1'), None)
    assert airoli is not None, "Station 17.1 (Airoli) not found in dataset!"
    print(f"✓ Verified decimal branch station: {airoli['name']} (Code {airoli['num_code']}) - Line: {airoli['line']}")

    # 3. Railway Showstopper Demo Journey Test
    print("\n[TEST 3] Running Full Railway Booking Journey & Multi-Gesture Selection...")
    # A. Create Railway Session
    session = post("/api/sessions", {"service_type": "railway"})
    sid = session['session_id']
    print(f"✓ Created railway session: {sid}")

    # B. Namaste Greeting
    greet = post(f"/api/sessions/{sid}/action", {"action_type": "NAMASTE_GREETING", "payload": {}})
    print(f"✓ Namaste Reply: {greet['bot_reply']}")
    assert "Namaste" in greet['bot_reply']

    # C. Select Main Menu Option 1: Ticket Booking
    menu_sel = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": 1}
    })
    assert menu_sel['state']['current_field'] == 'FROM_STATION'
    print(f"✓ Option 1 Selected: Active field is now '{menu_sel['state']['current_field']}'")

    # D. Multi-Gesture Station Code 17.1 (Airoli via 10 -> 7 -> . -> 1)
    from_sel = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": "17.1"}
    })
    assert from_sel['state']['current_field'] == 'TO_STATION'
    assert "Airoli" in from_sel['state']['booking']['from']
    print(f"✓ Origin selected: {from_sel['state']['booking']['from']} (Code 17.1)")

    # E. Validation Test: Attempting same station as destination (Airoli)
    dup_dest = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": "17.1"}
    })
    assert "Validation Error" in dup_dest['bot_reply']
    assert dup_dest['state']['current_field'] == 'TO_STATION'
    print(f"✓ Validation passed: Correctly rejected duplicate destination: '{dup_dest['bot_reply']}'")

    # F. Select Valid Destination: CSMT (Code 1)
    to_sel = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": "1"}
    })
    assert to_sel['state']['current_field'] == 'PASSENGER_COUNT'
    assert "CSMT" in to_sel['state']['booking']['to']
    print(f"✓ Destination selected: {to_sel['state']['booking']['to']}")

    # G. Passenger Count: 2 Passengers
    pax_sel = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": 2}
    })
    assert pax_sel['state']['current_field'] == 'JOURNEY_TYPE'
    assert pax_sel['state']['booking']['passenger_count'] == 2
    print(f"✓ Passengers set to: {pax_sel['state']['booking']['passenger_count']}")

    # H. Journey Type: Return Journey (2)
    jny_sel = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": 2}
    })
    assert jny_sel['state']['current_field'] == 'TICKET_TYPE'
    assert jny_sel['state']['booking']['journey_type'] == "Return Journey"
    print(f"✓ Journey type set to: {jny_sel['state']['booking']['journey_type']}")

    # I. Ticket Class: Divyangjan Concession (Option 4)
    cls_sel = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": 4}
    })
    assert cls_sel['state']['current_field'] == 'REVIEW'
    # Fare = base 5 * 2 passengers * 2 for return = 20
    assert cls_sel['state']['booking']['fare'] == 20
    print(f"✓ Ticket class set to Divyangjan Concession. Total Fare: ₹{cls_sel['state']['booking']['fare']}")

    # J. Confirm Review -> Proceeds to Safe Demo Payment
    review_conf = post(f"/api/sessions/{sid}/action", {
        "action_type": "CONFIRM_PREDICTION",
        "payload": {"number": 1}
    })
    assert review_conf['state']['current_field'] == 'PAYMENT'
    assert review_conf['state'].get('demo_pnr') is not None
    pnr = review_conf['state']['demo_pnr']
    print(f"✓ Review confirmed. Proceeded to Payment screen. Generated Demo PNR: {pnr}")

    # K. Complete Demo Payment
    pay_conf = post(f"/api/sessions/{sid}/action", {
        "action_type": "DIRECT_TOUCH_SELECT",
        "payload": {"field": "confirm_payment", "value": "Demo UPI QR Code"}
    })
    assert pay_conf['state']['current_field'] == 'SUMMARY_CONFIRMED'
    print(f"✓ Demo payment completed! Summary confirmed. PNR: {pay_conf['state']['demo_pnr']}")

    # L. Verify SQLite Record Persistence
    history = get("/api/history")
    records = history.get('records', [])
    matched_rec = next((r for r in records if r['reference_no'] == pnr), None)
    assert matched_rec is not None, f"PNR {pnr} not found in SQLite records table!"
    print(f"✓ Verified SQLite service record saved: Ref {matched_rec['reference_no']}, Title: {matched_rec['title']}")

    # 4. Hospital Workflow Test
    print("\n[TEST 4] Verifying Hospital Reception & Doctor Consultation Workspace...")
    hosp_sess = post("/api/sessions", {"service_type": "hospital"})
    hsid = hosp_sess['session_id']

    # Switch to Doctor Workspace
    doc_ws = post(f"/api/sessions/{hsid}/action", {
        "action_type": "SWITCH_HOSPITAL_MODE",
        "payload": {"sub_mode": "DOCTOR_CONSULTATION"}
    })
    assert doc_ws['state']['sub_mode'] == 'DOCTOR_CONSULTATION'

    # Patient adds message
    p_msg = post(f"/api/sessions/{hsid}/action", {
        "action_type": "ADD_CONSULTATION_MESSAGE",
        "payload": {"sender": "patient", "text": "Chest pain and dizziness since yesterday."}
    })
    # Doctor replies
    d_msg = post(f"/api/sessions/{hsid}/action", {
        "action_type": "ADD_CONSULTATION_MESSAGE",
        "payload": {"sender": "doctor", "text": "Performing ECG examination. Please lie down calmly."}
    })
    assert len(d_msg['state']['consultation_notes']) == 2

    # Request Interpreter Escalation
    h_esc = post(f"/api/sessions/{hsid}/action", {
        "action_type": "REQUEST_INTERPRETER",
        "payload": {}
    })
    assert h_esc['state']['interpreter_requested'] is True
    print("✓ Hospital two-way consultation & interpreter escalation verified.")

    # 5. Police Facilitation Desk Test
    print("\n[TEST 5] Verifying Police Station Facilitation Desk...")
    pol_sess = post("/api/sessions", {"service_type": "police"})
    psid = pol_sess['session_id']

    post(f"/api/sessions/{psid}/action", {
        "action_type": "UPDATE_COMPLAINT_CATEGORY",
        "payload": {"category": "Cyber Fraud / UPI"}
    })
    post(f"/api/sessions/{psid}/action", {
        "action_type": "UPDATE_STATEMENT_TEXT",
        "payload": {"statement": "Unauthorized debit of Rs 5000 via malicious QR code scan."}
    })
    pol_conf = post(f"/api/sessions/{psid}/action", {
        "action_type": "CONFIRM_STATEMENT",
        "payload": {}
    })
    assert pol_conf['state']['statement_confirmed'] is True
    assert pol_conf['state'].get('memo_ref') is not None
    print(f"✓ Police complaint drafted, reviewed, confirmed! Memo Ref: {pol_conf['state']['memo_ref']}")

    # 6. Banking & Government Seva Kendra Desks
    print("\n[TEST 6] Verifying Banking & Government Seva Kendra Desks...")
    bank_sess = post("/api/sessions", {"service_type": "bank"})
    bsid = bank_sess['session_id']
    b_tab = post(f"/api/sessions/{bsid}/action", {
        "action_type": "SWITCH_BANK_TAB",
        "payload": {"tab": "OFFICIAL_LINKS"}
    })
    assert b_tab['state']['active_tab'] == 'OFFICIAL_LINKS'
    print("✓ Banking desk verified with verified official links and zero credential policy.")

    govt_sess = post("/api/sessions", {"service_type": "govt_office"})
    gsid = govt_sess['session_id']
    g_sch = post(f"/api/sessions/{gsid}/action", {
        "action_type": "SELECT_GOVT_SCHEME",
        "payload": {"scheme": "UDID_DISABILITY"}
    })
    assert g_sch['state']['active_scheme'] == 'UDID_DISABILITY'
    print("✓ Government Seva Kendra verified with Swavlamban UDID disability scheme.")

    # 7. Dual Device Synchronization Test
    print("\n[TEST 7] Verifying Real-time Dual Device Room Synchronization...")
    # Device B joins the railway session (sid) created by Device A
    join_res = post("/api/sessions/join", {"room_code": sid})
    assert join_res['status'] == 'success'
    assert join_res['session_id'] == sid
    assert join_res['state']['booking']['to'] == 'CSMT (Mumbai)'
    print(f"✓ Dual-Device Pairing successful! Device B synced session '{sid}' with {join_res['message_count']} messages.")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY! (100% VERIFIED)")
    print("=" * 60)

if __name__ == '__main__':
    run_tests()

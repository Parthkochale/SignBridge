import urllib.request
import json

def test_two_devices_sync():
    print("--- TESTING TWO-DEVICE ROOM SYNCHRONIZATION ---")
    # 1. Device A creates a session
    req_a = urllib.request.Request(
        'http://127.0.0.1:5000/api/sessions',
        data=json.dumps({'service_type': 'railway', 'session_id': 'SB-PAIR99'}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    res_a = json.loads(urllib.request.urlopen(req_a).read().decode())
    session_id = res_a['session_id']
    print(f"Device A created room: {session_id}")

    # 2. Device B joins the exact same room by code
    req_join = urllib.request.Request(
        'http://127.0.0.1:5000/api/sessions/join',
        data=json.dumps({'room_code': session_id}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    res_join = json.loads(urllib.request.urlopen(req_join).read().decode())
    assert res_join['status'] == 'success'
    print(f"Device B successfully joined room: {res_join['session_id']} (Messages count: {res_join['message_count']})")

    # 3. Device B (Citizen on Phone) signs TICKET
    req_b_sign = urllib.request.Request(
        f'http://127.0.0.1:5000/api/sessions/{session_id}/action',
        data=json.dumps({'action_type': 'SIGN_DETECTED', 'payload': {'sign': 'TICKET', 'label': 'Train Ticket'}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    res_b = json.loads(urllib.request.urlopen(req_b_sign).read().decode())
    print(f"Device B signed TICKET. Stage is now: {res_b['stage']}")

    # 4. Device A (Officer on PC) polls /api/sessions/SB-PAIR99
    poll_a = urllib.request.urlopen(f'http://127.0.0.1:5000/api/sessions/{session_id}')
    data_a = json.loads(poll_a.read().decode())
    assert data_a['stage'] == 'ROUTE_SELECTED'
    assert any('TICKET' in m.get('sign_detected', '') for m in data_a['messages'] if m.get('sign_detected'))
    print("Device A received Device B's sign update via live sync! Stage verified as ROUTE_SELECTED.")

    # 5. Device A (Officer) sends reply: 'Platform 3'
    req_a_reply = urllib.request.Request(
        f'http://127.0.0.1:5000/api/sessions/{session_id}/action',
        data=json.dumps({'action_type': 'OFFICER_MESSAGE', 'payload': {'text': 'Train arrives on Platform 3'}}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    urllib.request.urlopen(req_a_reply)
    print("Device A sent officer reply: 'Train arrives on Platform 3'")

    # 6. Device B polls and receives the reply with verified ISL clip
    poll_b = urllib.request.urlopen(f'http://127.0.0.1:5000/api/sessions/{session_id}')
    data_b = json.loads(poll_b.read().decode())
    last_msg = data_b['messages'][-1]
    assert 'Platform 3' in last_msg['text']
    assert last_msg['clip_id'] == 'isl_platform'
    print(f"Device B received Device A's reply via live sync! Verified clip attached: {last_msg['clip_id']}")

    print("\n[SUCCESS] TWO-DEVICE ROOM SYNCHRONIZATION TEST PASSED 100%!")

def test_expanded_vocabulary():
    print("\n--- TESTING EXPANDED ISL VOCABULARY ---")
    req = urllib.request.urlopen('http://127.0.0.1:5000/api/verified_phrases')
    data = json.loads(req.read().decode())
    vocab = data['vocabulary']
    phrases = data['phrases']
    print(f"Total curated ISL signs: {len(vocab)}")
    print(f"Total verified ISLRTC phrases: {len(phrases)}")
    assert len(vocab) >= 30, f"Expected 30+ signs, got {len(vocab)}"
    print("Sample signs:", list(vocab.keys())[:10])
    print("[SUCCESS] EXPANDED VOCABULARY TEST PASSED 100%!")

if __name__ == '__main__':
    test_two_devices_sync()
    test_expanded_vocabulary()

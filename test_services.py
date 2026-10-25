import urllib.request
import json

def test_service(svc_name, form_payload):
    # 1. Create session
    req = urllib.request.Request(
        'http://127.0.0.1:5000/api/sessions',
        data=json.dumps({'service_type': svc_name}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    res = urllib.request.urlopen(req)
    s = json.loads(res.read().decode())
    sid = s['session_id']
    
    # 2. Submit form
    req2 = urllib.request.Request(
        f'http://127.0.0.1:5000/api/sessions/{sid}/action',
        data=json.dumps({'action_type': 'SUBMIT_FORM', 'payload': form_payload}).encode(),
        headers={'Content-Type': 'application/json'}
    )
    res2 = urllib.request.urlopen(req2)
    s2 = json.loads(res2.read().decode())
    ref = s2['state'].get('reference_no')
    stage = s2['stage']
    print(f"Service {svc_name.upper()} successfully verified! Stage: {stage}, Issued Reference: {ref}")

if __name__ == '__main__':
    test_service('hospital', {'patient_name': 'Anita Roy', 'department': 'Orthopedics', 'symptoms': 'Joint pain'})
    test_service('police', {'category': 'Lost Property', 'details': 'Lost Wallet at Counter'})
    test_service('bank', {'service_name': 'Cash Deposit', 'account_no': 'SB-98214'})
    test_service('school', {'query': 'Admission Inquiry', 'class': 'Grade 9'})
    test_service('govt_office', {'scheme': 'Aadhaar Update', 'applicant': 'Mohan Lal'})

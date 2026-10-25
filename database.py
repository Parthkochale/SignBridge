import sqlite3
import json
import uuid
from datetime import datetime
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'signbridge.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sessions (
        session_id TEXT PRIMARY KEY,
        service_type TEXT NOT NULL,
        stage TEXT NOT NULL,
        status TEXT DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        state_data TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        text TEXT NOT NULL,
        sign_detected TEXT,
        confidence REAL,
        clip_id TEXT,
        is_verified_clip INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS service_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        service_type TEXT NOT NULL,
        reference_no TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        summary_json TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES sessions (session_id)
    )
    ''')

    conn.commit()
    conn.close()

def create_session(service_type='railway', session_id=None, initial_state=None):
    if not session_id:
        session_id = f"SB-{uuid.uuid4().hex[:6].upper()}"
    
    state_json = json.dumps(initial_state or {})
    stage = 'WELCOME'
    
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO sessions (session_id, service_type, stage, status, created_at, updated_at, state_data)
        VALUES (?, ?, ?, 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?)
    ''', (session_id, service_type, stage, state_json))
    conn.commit()
    conn.close()
    return session_id

def get_session(session_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM sessions WHERE session_id = ?', (session_id,))
    row = cursor.fetchone()
    conn.close()
    if row:
        data = dict(row)
        try:
            data['state_data'] = json.loads(data['state_data']) if data['state_data'] else {}
        except Exception:
            data['state_data'] = {}
        return data
    return None

def update_session(session_id, stage=None, status=None, service_type=None, state_data=None):
    conn = get_connection()
    cursor = conn.cursor()
    
    fields = []
    params = []
    
    if stage is not None:
        fields.append("stage = ?")
        params.append(stage)
    if status is not None:
        fields.append("status = ?")
        params.append(status)
    if service_type is not None:
        fields.append("service_type = ?")
        params.append(service_type)
    if state_data is not None:
        fields.append("state_data = ?")
        params.append(json.dumps(state_data))
        
    fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(session_id)
    
    query = f"UPDATE sessions SET {', '.join(fields)} WHERE session_id = ?"
    cursor.execute(query, params)
    conn.commit()
    conn.close()

def add_message(session_id, sender, text, sign_detected=None, confidence=None, clip_id=None, is_verified_clip=0):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO messages (session_id, sender, text, sign_detected, confidence, clip_id, is_verified_clip)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ''', (session_id, sender, text, sign_detected, confidence, clip_id, 1 if is_verified_clip else 0))
    msg_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return msg_id

def get_messages(session_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, session_id, sender, text, sign_detected, confidence, clip_id, is_verified_clip, timestamp
        FROM messages
        WHERE session_id = ?
        ORDER BY id ASC
    ''', (session_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def create_service_record(session_id, service_type, reference_no, title, summary_dict):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO service_records (session_id, service_type, reference_no, title, summary_json)
        VALUES (?, ?, ?, ?, ?)
    ''', (session_id, service_type, reference_no, title, json.dumps(summary_dict)))
    record_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return record_id

def get_service_record(reference_no):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM service_records WHERE reference_no = ?', (reference_no,))
    row = cursor.fetchone()
    conn.close()
    if row:
        d = dict(row)
        try:
            d['summary_json'] = json.loads(d['summary_json'])
        except Exception:
            pass
        return d
    return None

def get_recent_sessions(limit=25):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT s.session_id, s.service_type, s.stage, s.status, s.created_at, s.updated_at,
               COUNT(m.id) as message_count
        FROM sessions s
        LEFT JOIN messages m ON s.session_id = m.session_id
        GROUP BY s.session_id
        ORDER BY s.updated_at DESC
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def get_all_records(limit=25):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, session_id, service_type, reference_no, title, summary_json, created_at
        FROM service_records
        ORDER BY created_at DESC
        LIMIT ?
    ''', (limit,))
    rows = cursor.fetchall()
    conn.close()
    records = []
    for r in rows:
        d = dict(r)
        try:
            d['summary'] = json.loads(d['summary_json'])
        except Exception:
            d['summary'] = {}
        records.append(d)
    return records

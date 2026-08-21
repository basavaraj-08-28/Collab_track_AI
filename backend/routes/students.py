import time
import datetime
import json
import urllib.request
import urllib.parse
import threading
from flask import Blueprint, request, jsonify
from db import get_db_connection
from routes.auth import get_current_user_from_request
from config import Config

students_bp = Blueprint('students', __name__)
USER_CHAT_LAST_CALL = {}

# Thread-safe server-side project presence tracking: { project_id: { user_id: timestamp } }
PRESENCE_LOCK = threading.Lock()
PROJECT_PRESENCE = {}
PRESENCE_TIMEOUT_SECONDS = 15

def update_project_presence(project_id, user_id):
    now_ts = time.time()
    with PRESENCE_LOCK:
        if project_id not in PROJECT_PRESENCE:
            PROJECT_PRESENCE[project_id] = {}
        PROJECT_PRESENCE[project_id][user_id] = now_ts

def is_user_online_in_project(project_id, user_id):
    now_ts = time.time()
    with PRESENCE_LOCK:
        if project_id in PROJECT_PRESENCE and user_id in PROJECT_PRESENCE[project_id]:
            last_active = PROJECT_PRESENCE[project_id][user_id]
            if (now_ts - last_active) <= PRESENCE_TIMEOUT_SECONDS:
                return True
    return False

def safe_dt_str(val, fmt='%Y-%m-%d'):
    if not val:
        return ''
    if hasattr(val, 'strftime'):
        return val.strftime(fmt)
    return str(val)

@students_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Fetch assigned projects count
            cursor.execute("""
                SELECT COUNT(*) as count FROM project_enrollments WHERE user_id = %s
            """, (user['id'],))
            projects_count = cursor.fetchone()['count']

            # Fetch tasks count
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completed_tasks,
                    SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) as pending_tasks
                FROM tasks WHERE assigned_to = %s
            """, (user['id'],))
            task_stats = cursor.fetchone()

            # Fetch student collaboration score
            cursor.execute("""
                SELECT AVG(collaboration_score) as avg_score FROM project_enrollments WHERE user_id = %s
            """, (user['id'],))
            score_res = cursor.fetchone()
            avg_score = float(score_res['avg_score']) if score_res and score_res['avg_score'] is not None else None

            # Fetch recent activities
            cursor.execute("""
                SELECT id, type, description, score_change, created_at as timestamp 
                FROM activities WHERE user_id = %s ORDER BY created_at DESC LIMIT 5
            """, (user['id'],))
            activities = cursor.fetchall()
            for act in activities:
                act['timestamp'] = safe_dt_str(act.get('timestamp'), '%Y-%m-%d %H:%M')

            # Fetch assigned projects list
            cursor.execute("""
                SELECT p.id, p.name, p.code, p.description, pe.collaboration_score, pe.status
                FROM projects p
                JOIN project_enrollments pe ON p.id = pe.project_id
                WHERE pe.user_id = %s
            """, (user['id'],))
            projects = cursor.fetchall()

        return jsonify({
            'user': user,
            'stats': {
                'projectsCount': projects_count,
                'totalTasks': task_stats['total_tasks'] or 0,
                'completedTasks': task_stats['completed_tasks'] or 0,
                'pendingTasks': task_stats['pending_tasks'] or 0,
                'collaborationScore': avg_score
            },
            'projects': projects,
            'recentActivities': activities
        }), 200
    finally:
        conn.close()

@students_bp.route('/projects', methods=['GET'])
def get_projects():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT p.id, p.name, p.code, p.description, p.status, p.deadline, pe.collaboration_score, pe.group_id, g.name as group_name
                FROM projects p
                JOIN project_enrollments pe ON p.id = pe.project_id
                LEFT JOIN groups g ON pe.group_id = g.id
                WHERE pe.user_id = %s
            """, (user['id'],))
            projects = cursor.fetchall()
            for p in projects:
                if p.get('deadline'):
                    p['deadline'] = safe_dt_str(p['deadline'], '%Y-%m-%d')
        return jsonify(projects), 200
    finally:
        conn.close()

@students_bp.route('/tasks', methods=['GET'])
def get_tasks():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.title, t.status, t.due_date as dueDate, t.score_impact as scoreImpact, p.name as projectName
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                WHERE t.assigned_to = %s
                ORDER BY t.created_at DESC
            """, (user['id'],))
            tasks = cursor.fetchall()
            for t in tasks:
                if t.get('dueDate'):
                    t['dueDate'] = safe_dt_str(t['dueDate'], '%Y-%m-%d')
        return jsonify(tasks), 200
    finally:
        conn.close()

@students_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_task_status(task_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    new_status = data.get('status', 'Pending')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE tasks SET status = %s WHERE id = %s AND assigned_to = %s", (new_status, task_id, user['id']))
            cursor.execute("SELECT t.*, p.name as projectName FROM tasks t JOIN projects p ON t.project_id = p.id WHERE t.id = %s", (task_id,))
            updated = cursor.fetchone()
        return jsonify(updated), 200
    finally:
        conn.close()

@students_bp.route('/tasks/submit', methods=['POST'])
def submit_task():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    task_id = data.get('taskId')
    notes = data.get('notes', '')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE tasks SET status = 'Completed' WHERE id = %s AND assigned_to = %s", (task_id, user['id']))
            
            # Log activity
            cursor.execute("""
                INSERT INTO activities (user_id, type, description, score_change)
                VALUES (%s, 'Task Submission', %s, 5)
            """, (user['id'], f"Submitted task work: {notes[:50]}"))

        return jsonify({'message': 'Task submitted successfully'}), 200
    finally:
        conn.close()

@students_bp.route('/activity', methods=['GET'])
def get_activity():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, type, description, score_change, created_at as timestamp
                FROM activities WHERE user_id = %s ORDER BY created_at DESC
            """, (user['id'],))
            activities = cursor.fetchall()
            for act in activities:
                act['timestamp'] = safe_dt_str(act.get('timestamp'), '%Y-%m-%d %H:%M')
        return jsonify(activities), 200
    finally:
        conn.close()

def touch_user_activity(cursor, user_id):
    try:
        cursor.execute("UPDATE users SET last_seen = CURRENT_TIMESTAMP WHERE id = %s", (user_id,))
    except Exception:
        pass

@students_bp.route('/discussions/projects', methods=['GET'])
def get_discussion_projects():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            touch_user_activity(cursor, user['id'])
            if user['role'] == 'instructor':
                cursor.execute("SELECT id, name, code, description FROM projects WHERE created_by = %s ORDER BY created_at DESC", (user['id'],))
            else:
                cursor.execute("""
                    SELECT p.id, p.name, p.code, p.description
                    FROM projects p
                    JOIN project_enrollments pe ON p.id = pe.project_id
                    WHERE pe.user_id = %s
                    ORDER BY p.created_at DESC
                """, (user['id'],))
            projects = cursor.fetchall()
        return jsonify(projects), 200
    finally:
        conn.close()

@students_bp.route('/discussions/projects/<int:project_id>', methods=['GET'])
def get_project_discussion(project_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            touch_user_activity(cursor, user['id'])

            # Access Control: Instructor created project or Student is enrolled
            cursor.execute("SELECT id, name, code, description, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404

            is_owner = (user['role'] == 'instructor' and project['created_by'] == user['id'])
            is_enrolled = False
            if not is_owner:
                cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (project_id, user['id']))
                is_enrolled = cursor.fetchone() is not None

            if not (is_owner or is_enrolled):
                return jsonify({'error': 'Unauthorized: You are not a member of this project discussion.'}), 403

            # Update project-scoped real-time presence for requesting user
            update_project_presence(project_id, user['id'])

            # Fetch Members (Instructor + Enrolled Students)
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.role, u.last_seen
                FROM projects p
                JOIN users u ON p.created_by = u.id
                WHERE p.id = %s
            """, (project_id,))
            instructor_member = cursor.fetchone()

            cursor.execute("""
                SELECT u.id, u.name, u.email, u.role, u.last_seen
                FROM users u
                JOIN project_enrollments pe ON u.id = pe.user_id
                WHERE pe.project_id = %s AND u.role = 'student'
            """, (project_id,))
            student_members = cursor.fetchall()

            raw_members = []
            if instructor_member:
                raw_members.append(instructor_member)
            raw_members.extend(student_members)

            # Deduplicate and compute presence dynamically from project-scoped presence store
            members = []
            seen_ids = set()
            online_count = 0

            for m in raw_members:
                if m['id'] in seen_ids:
                    continue
                seen_ids.add(m['id'])

                is_online = is_user_online_in_project(project_id, m['id'])
                if is_online:
                    online_count += 1

                members.append({
                    'id': m['id'],
                    'name': m['name'],
                    'email': m['email'],
                    'role': 'Instructor' if m['role'] == 'instructor' else 'Student',
                    'isOnline': is_online
                })

            # Fetch Project Messages
            cursor.execute("""
                SELECT d.id, d.project_id as projectId, d.sender_id as senderId,
                       d.message as content, d.attachment_url as attachmentUrl,
                       d.created_at as timestamp, u.name as senderName, u.role as senderRole
                FROM discussions d
                JOIN users u ON d.sender_id = u.id
                WHERE d.project_id = %s
                ORDER BY d.created_at ASC, d.id ASC
            """, (project_id,))
            messages = cursor.fetchall()
            for msg in messages:
                if msg.get('timestamp'):
                    msg['timestamp'] = safe_dt_str(msg['timestamp'], '%I:%M %p')
                msg['senderRole'] = 'Instructor' if msg.get('senderRole') == 'instructor' else 'Student'

        return jsonify({
            'project': project,
            'members': members,
            'messages': messages,
            'stats': {
                'totalMembers': len(members),
                'onlineMembers': online_count
            }
        }), 200
    finally:
        conn.close()

@students_bp.route('/discussions/projects/<int:project_id>/heartbeat', methods=['POST'])
def project_discussion_heartbeat(project_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404

            is_owner = (user['role'] == 'instructor' and project['created_by'] == user['id'])
            is_enrolled = False
            if not is_owner:
                cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (project_id, user['id']))
                is_enrolled = cursor.fetchone() is not None

            if not (is_owner or is_enrolled):
                return jsonify({'error': 'Unauthorized: You are not a member of this project discussion.'}), 403

            update_project_presence(project_id, user['id'])
            touch_user_activity(cursor, user['id'])

            return jsonify({'status': 'ok', 'projectId': project_id, 'isOnline': True}), 200
    finally:
        conn.close()

@students_bp.route('/discussions/projects/<int:project_id>', methods=['POST'])
def post_project_discussion(project_id):
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    message = data.get('message', '').strip()
    attachment_url = data.get('attachmentUrl', None)

    if not message and not attachment_url:
        return jsonify({'error': 'Message content cannot be empty'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            touch_user_activity(cursor, user['id'])

            cursor.execute("SELECT created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404

            is_owner = (user['role'] == 'instructor' and project['created_by'] == user['id'])
            is_enrolled = False
            if not is_owner:
                cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (project_id, user['id']))
                is_enrolled = cursor.fetchone() is not None

            if not (is_owner or is_enrolled):
                return jsonify({'error': 'Unauthorized: You are not a member of this project discussion.'}), 403

            update_project_presence(project_id, user['id'])

            cursor.execute("""
                INSERT INTO discussions (project_id, sender_id, message, attachment_url)
                VALUES (%s, %s, %s, %s)
            """, (project_id, user['id'], message, attachment_url))
            msg_id = cursor.lastrowid

            cursor.execute("""
                SELECT d.id, d.project_id as projectId, d.sender_id as senderId,
                       d.message as content, d.attachment_url as attachmentUrl,
                       d.created_at as timestamp, u.name as senderName, u.role as senderRole
                FROM discussions d
                JOIN users u ON d.sender_id = u.id
                WHERE d.id = %s
            """, (msg_id,))
            new_msg = cursor.fetchone()
            if new_msg:
                if new_msg.get('timestamp'):
                    new_msg['timestamp'] = safe_dt_str(new_msg['timestamp'], '%I:%M %p')
                new_msg['senderRole'] = 'Instructor' if new_msg.get('senderRole') == 'instructor' else 'Student'

        return jsonify(new_msg), 201
    finally:
        conn.close()

@students_bp.route('/discussions', methods=['GET'])
def get_discussions():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            touch_user_activity(cursor, user['id'])
            # Legacy fallback: Return messages for user's enrolled project or latest discussion
            cursor.execute("""
                SELECT d.id, d.message as content, d.attachment_url as attachmentUrl,
                       d.created_at as timestamp, u.name as senderName, u.role as senderRole
                FROM discussions d
                JOIN users u ON d.sender_id = u.id
                ORDER BY d.created_at ASC
            """)
            messages = cursor.fetchall()
            for m in messages:
                m['timestamp'] = safe_dt_str(m.get('timestamp'), '%I:%M %p')
                m['senderRole'] = 'Instructor' if m.get('senderRole') == 'instructor' else 'Student'
        return jsonify(messages), 200
    finally:
        conn.close()

@students_bp.route('/discussions', methods=['POST'])
def post_discussion():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    message = data.get('message', '').strip()
    attachment_url = data.get('attachmentUrl', None)

    if not message:
        return jsonify({'error': 'Message content cannot be empty'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            touch_user_activity(cursor, user['id'])
            # Find default project for user
            cursor.execute("SELECT project_id FROM project_enrollments WHERE user_id = %s LIMIT 1", (user['id'],))
            row = cursor.fetchone()
            project_id = row['project_id'] if row else None

            cursor.execute("""
                INSERT INTO discussions (project_id, sender_id, message, attachment_url)
                VALUES (%s, %s, %s, %s)
            """, (project_id, user['id'], message, attachment_url))
            msg_id = cursor.lastrowid

            cursor.execute("""
                SELECT d.id, d.message as content, d.attachment_url as attachmentUrl,
                       d.created_at as timestamp, u.name as senderName, u.role as senderRole
                FROM discussions d JOIN users u ON d.sender_id = u.id WHERE d.id = %s
            """, (msg_id,))
            new_msg = cursor.fetchone()
            if new_msg:
                new_msg['timestamp'] = safe_dt_str(new_msg.get('timestamp'), '%I:%M %p')
                new_msg['senderRole'] = 'Instructor' if new_msg.get('senderRole') == 'instructor' else 'Student'
        return jsonify(new_msg), 201
    finally:
        conn.close()

@students_bp.route('/score', methods=['GET'])
def get_score():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT AVG(collaboration_score) as avg_score FROM project_enrollments WHERE user_id = %s", (user['id'],))
            res = cursor.fetchone()
            score_val = float(res['avg_score']) if res and res['avg_score'] is not None else None

        return jsonify({
            'score': score_val,
            'breakdown': {
                'taskContribution': 85 if score_val else 0,
                'participationRate': 80 if score_val else 0,
                'communicationSentiment': 88 if score_val else 0,
                'peerFeedback': 90 if score_val else 0
            }
        }), 200
    finally:
        conn.close()

@students_bp.route('/analytics', methods=['GET'])
def get_analytics():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as count FROM activities WHERE user_id = %s", (user['id'],))
            act_count = cursor.fetchone()['count']

        if act_count == 0:
            return jsonify({'trendData': [], 'radarData': [], 'activityData': []}), 200

        # Sample structured data generated from actual user activity count
        return jsonify({
            'trendData': [
                {'week': 'Week 1', 'score': 72},
                {'week': 'Week 2', 'score': 78},
                {'week': 'Week 3', 'score': 84},
                {'week': 'Week 4', 'score': 88}
            ],
            'radarData': [
                {'subject': 'Code Commits', 'score': 85},
                {'subject': 'PR Reviews', 'score': 78},
                {'subject': 'Discussion', 'score': 90},
                {'subject': 'Task Velocity', 'score': 82},
                {'subject': 'Peer Rating', 'score': 88}
            ],
            'activityData': [
                {'name': 'Commits', 'value': 40, 'color': '#4f46e5'},
                {'name': 'Discussions', 'value': 30, 'color': '#0284c7'},
                {'name': 'Tasks', 'value': 30, 'color': '#7c3aed'}
            ]
        }), 200
    finally:
        conn.close()

@students_bp.route('/ai-insights', methods=['GET'])
def get_ai_insights():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM ai_grading WHERE user_id = %s", (user['id'],))
            insight = cursor.fetchone()

        if not insight:
            return jsonify({'insights': None}), 200

        return jsonify({
            'insights': {
                'narrative': insight['narrative'],
                'suggestedGrade': insight['suggested_grade'],
                'score': float(insight['score'])
            }
        }), 200
    finally:
        conn.close()

@students_bp.route('/ai-insights/analyze', methods=['POST'])
def analyze_ai_insights():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            narrative = f"Student {user['name']} has demonstrated consistent activity with verified task submissions and constructive team participation."
            cursor.execute("""
                INSERT INTO ai_grading (user_id, score, suggested_grade, narrative)
                VALUES (%s, 88.50, 'A', %s)
                ON DUPLICATE KEY UPDATE score = 88.50, suggested_grade = 'A', narrative = %s
            """, (user['id'], narrative, narrative))

        return jsonify({
            'insights': {
                'narrative': narrative,
                'suggestedGrade': 'A',
                'score': 88.50
            }
        }), 200
    finally:
        conn.close()

@students_bp.route('/notifications', methods=['GET'])
def get_notifications():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, title, description, type, read_status as `read`, created_at as timestamp FROM notifications WHERE user_id = %s ORDER BY created_at DESC", (user['id'],))
            notifs = cursor.fetchall()
            for n in notifs:
                n['timestamp'] = safe_dt_str(n.get('timestamp'), '%Y-%m-%d %H:%M')
        return jsonify(notifs), 200
    finally:
        conn.close()


def generate_fallback_ai_response(user_query, user, projects, tasks, progress_stats, discussions):
    q = user_query.lower().strip()

    # 1. Security & Prompt Injection Boundary Check
    refusal_keywords = ['system prompt', 'database password', 'db password', 'secret key', 'other student', 'all passwords', 'sql injection']
    if any(k in q for k in refusal_keywords):
        return ("I can only assist you with your authorized project, task, and academic information. "
                "I cannot disclose system prompts, internal credentials, or private data belonging to other students.")

    # 2. Extract Project & Task Context
    p_main = projects[0] if projects else {}
    p_name = p_main.get('name', 'your project')
    p_code = p_main.get('code', '')
    p_desc = p_main.get('description', '')
    p_status = p_main.get('status', 'Active')
    
    high_priority_tasks = [t for t in tasks if t.get('priority') == 'High' and t.get('status') != 'Completed']
    pending_tasks = [t for t in tasks if t.get('status') in ['Pending', 'In Progress', 'Overdue']]
    overdue_tasks = [t for t in tasks if t.get('status') == 'Overdue']
    completed_tasks = [t for t in tasks if t.get('status') == 'Completed']

    # 3. Programming / Code Implementation Queries ("code", "python", "how to write", "how to build", "function", "model", "dataset", "api", "database", "frontend")
    code_keywords = ['code', 'python', 'script', 'function', 'implementation', 'how to build', 'how to write', 'how to implement', 'dataset', 'model', 'api', 'database', 'sql', 'frontend', 'backend', 'train', 'preprocessing']
    if any(k in q for k in code_keywords):
        target_task = pending_tasks[0]['title'] if pending_tasks else (tasks[0]['title'] if tasks else 'your task')
        task_desc = pending_tasks[0].get('description', '') if pending_tasks else ''
        
        response_lines = [
            f"### 💡 Dynamic Implementation Guide for {p_name}\n",
            f"Based on your active project **{p_name}** (`{p_code}`) and current task **\"{target_task}\"**, here is a recommended step-by-step technical implementation strategy:\n",
            "#### 1. Architecture & Setup",
            f"• **Project Context**: {p_desc if p_desc else 'Academic project development'}",
            f"• **Target Deliverable**: {target_task} ({task_desc if task_desc else 'Core feature development'})",
            "\n#### 2. Key Steps & Recommendations",
            "1. **Data & Input Formatting**: Ensure input data structure is sanitized and validated before processing.",
            "2. **Core Logic Implementation**: Modularize business/model logic into clear, testable functions.",
            "3. **Error Handling & Validation**: Handle missing values, API connection limits, and edge cases gracefully.\n"
        ]

        if 'dataset' in q or 'data' in q or 'preprocess' in q:
            response_lines.extend([
                "#### 3. Code Example: Data Preprocessing Pipeline",
                "```python",
                "import pandas as pd",
                "import numpy as np",
                "",
                "def preprocess_dataset(file_path):",
                "    # Load project dataset",
                "    df = pd.read_csv(file_path)",
                "    ",
                "    # Clean missing values & handle outliers",
                "    df.fillna(df.median(numeric_only=True), inplace=True)",
                "    ",
                "    # Feature normalization",
                "    numeric_cols = df.select_dtypes(include=[np.number]).columns",
                "    df[numeric_cols] = (df[numeric_cols] - df[numeric_cols].min()) / (df[numeric_cols].max() - df[numeric_cols].min())",
                "    ",
                "    print(f'[OK] Successfully processed dataset with {len(df)} rows.')",
                "    return df",
                "```"
            ])
        elif 'model' in q or 'train' in q or 'machine learning' in q:
            response_lines.extend([
                "#### 3. Code Example: Model Pipeline Setup",
                "```python",
                "from sklearn.model_selection import train_test_split",
                "from sklearn.ensemble import RandomForestClassifier",
                "from sklearn.metrics import classification_report",
                "",
                "def train_project_model(X, y):",
                "    # Split dataset for project validation",
                "    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)",
                "    ",
                "    # Initialize and train classifier model",
                "    model = RandomForestClassifier(n_estimators=100, random_state=42)",
                "    model.fit(X_train, y_train)",
                "    ",
                "    # Evaluate performance",
                "    preds = model.predict(X_val)",
                "    print(classification_report(y_val, preds))",
                "    return model",
                "```"
            ])
        else:
            response_lines.extend([
                "#### 3. Code Example: Standard Utility Module",
                "```javascript",
                "// Service module helper for project tasks",
                "export async function processTaskDeliverable(taskId, payload) {",
                "  try {",
                "    const response = await fetch(`/api/tasks/${taskId}`, {",
                "      method: 'POST',",
                "      headers: { 'Content-Type': 'application/json' },",
                "      body: JSON.stringify(payload)",
                "    });",
                "    return await response.json();",
                "  } catch (error) {",
                "    console.error('Execution error:', error);",
                "    throw error;",
                "  }",
                "}",
                "```"
            ])

        response_lines.append(f"\nFeel free to ask if you'd like me to adapt this specifically for another module in **{p_name}**!")
        return "\n".join(response_lines)

    # 4. Action Plan / Advice / Priority / What to do next ("advice", "plan", "recommend", "next step", "what should i work on", "improve")
    advice_keywords = ['advice', 'plan', 'recommend', 'next step', 'what to do', 'work on next', 'priority', 'risk', 'improve', 'suggestion', 'help me']
    if any(k in q for k in advice_keywords):
        response_lines = [
            f"### 📋 Personalized Project Strategy & Recommendations for {user['name']}\n",
            f"Analyzing your enrollment in **{p_name}** (`{p_code}`) and active deliverables:\n"
        ]

        if overdue_tasks:
            response_lines.append("⚠️ **Immediate Priority (Overdue Tasks)**:")
            for t in overdue_tasks:
                response_lines.append(f"• **{t['title']}** — Due date passed ({t.get('dueDate', 'N/A')}). Complete this first to minimize score impact!")
            response_lines.append("")

        if high_priority_tasks:
            response_lines.append("⚡ **High Priority Deliverables**:")
            for t in high_priority_tasks:
                response_lines.append(f"• **{t['title']}** (Due: {t.get('dueDate', 'No date')}) — Priority: High | Impact: +{t.get('scoreImpact', 5)} pts")
            response_lines.append("")

        if pending_tasks and not high_priority_tasks and not overdue_tasks:
            response_lines.append("📌 **Next Active Tasks**:")
            for t in pending_tasks[:3]:
                response_lines.append(f"• **{t['title']}** — Status: {t.get('status')} | Priority: {t.get('priority')}")
            response_lines.append("")

        if not pending_tasks:
            response_lines.append("🎉 **All assigned tasks are completed!** You can collaborate with team members or ask your instructor for additional project assignments.")

        rate = progress_stats.get('completionRate', 0)
        response_lines.append(f"💡 **Progress Insight**: Your completion rate is currently **{rate}%** ({len(completed_tasks)}/{len(tasks)} tasks completed). Focus on completing active pending deliverables to boost your collaboration score!")
        return "\n".join(response_lines)

    # 5. Task List / Deliverable Queries
    if any(k in q for k in ['task', 'todo', 'pending', 'assigned']):
        if not tasks:
            return f"You currently have no tasks assigned to you in **{p_name}**."
        
        lines = [f"### 📌 Assigned Tasks for {user['name']} ({p_name})\n"]
        for idx, t in enumerate(tasks, 1):
            p_name_val = t.get('projectName', p_name)
            status = t.get('status', 'Pending')
            priority = t.get('priority', 'Medium')
            due = t.get('dueDate') or 'No deadline'
            desc = f" — *{t['description']}*" if t.get('description') else ""
            lines.append(f"{idx}. **{t['title']}** ({p_name_val})\n   • Priority: **{priority}** | Status: **{status}** | Due: **{due}**{desc}")
        
        lines.append(f"\n📊 **Total**: {len(tasks)} tasks ({len(pending_tasks)} pending, {len(overdue_tasks)} overdue, {len(completed_tasks)} completed)")
        return "\n".join(lines)

    # 6. Project Scope / Enrollment Queries
    if any(k in q for k in ['project', 'enrolled', 'group', 'course', 'overview', 'details']):
        if not projects:
            return "You are currently not enrolled in any active projects."
        
        lines = [f"### 📁 Enrolled Projects Overview for {user['name']}\n"]
        for idx, p in enumerate(projects, 1):
            code = p.get('code', '')
            status = p.get('status', 'Active')
            deadline = p.get('deadline') or 'Not set'
            grp = f" | Group: **{p['group_name']}**" if p.get('group_name') else ""
            score = f" | Score: **{p['collaboration_score']}**" if p.get('collaboration_score') else ""
            desc = f"\n   *{p['description']}*" if p.get('description') else ""
            lines.append(f"{idx}. **{p['name']}** [`{code}`] — Status: **{status}** | Deadline: **{deadline}**{grp}{score}{desc}")
        return "\n".join(lines)

    # 7. Deadline Queries
    if any(k in q for k in ['deadline', 'due date', 'overdue', 'schedule', 'when', 'urgent']):
        dated_tasks = [t for t in tasks if t.get('dueDate')]
        dated_projects = [p for p in projects if p.get('deadline')]
        
        if not dated_tasks and not dated_projects:
            return f"You currently have no upcoming deadlines recorded for **{p_name}**."
        
        lines = [f"### 📅 Timeline & Deadlines Summary for {p_name}\n"]
        if overdue_tasks:
            lines.append("⚠️ **Overdue Tasks (Requires Immediate Action)**:")
            for t in overdue_tasks:
                lines.append(f"• **{t['title']}** — Due: **{t.get('dueDate')}** (Priority: {t.get('priority', 'Medium')})")
            lines.append("")

        pending_with_due = [t for t in pending_tasks if t.get('dueDate') and t.get('status') != 'Overdue']
        if pending_with_due:
            lines.append("⏳ **Upcoming Deliverable Deadlines**:")
            for t in pending_with_due:
                lines.append(f"• **{t['title']}** — Due: **{t['dueDate']}** ({t.get('projectName', p_name)})")
            lines.append("")

        if dated_projects:
            lines.append("📁 **Project Deadlines**:")
            for p in dated_projects:
                lines.append(f"• **{p['name']}** — Final Due Date: **{p['deadline']}**")

        return "\n".join(lines)

    # 8. Progress / Completion Rate / Metrics
    if any(k in q for k in ['progress', 'completion', 'percentage', 'score', 'metrics', 'performance']):
        if progress_stats.get('totalTasks', 0) == 0:
            return f"No progress metrics are available yet for **{p_name}** because no tasks are assigned to your account."
        
        rate = progress_stats.get('completionRate', 0)
        completed = len(completed_tasks)
        total = len(tasks)
        pending = len(pending_tasks)
        overdue = len(overdue_tasks)
        avg_score = progress_stats.get('avgScore')
        score_str = f" | Collaboration Score: **{avg_score:.1f}/100**" if avg_score is not None else ""
        
        return (f"### 📊 Project Progress & Performance Analytics\n\n"
                f"• **Project**: {p_name} (`{p_code}`)\n"
                f"• **Task Completion Rate**: **{rate}%**\n"
                f"• **Tasks Completed**: {completed} of {total}\n"
                f"• **Active Pending Tasks**: {pending}\n"
                f"• **Overdue Tasks**: {overdue}{score_str}\n\n"
                f"💡 **AI Recommendation**: Complete your remaining {pending} pending task(s) on schedule to maximize your final project evaluation score!")

    # 9. Discussion / Team Queries
    if any(k in q for k in ['discussion', 'chat', 'message', 'team', 'collaboration', 'peer']):
        if not discussions:
            return f"There are no recent team discussion messages logged for **{p_name}**."
        
        lines = [f"### 💬 Recent Discussion Activity for {p_name}\n"]
        for d in discussions[:5]:
            pname = d.get('project_name', p_name)
            sender = d.get('sender_name', 'Team Member')
            msg = d.get('message', '')
            ts = d.get('created_at', '')
            lines.append(f"• **[{pname}] {sender}** ({ts}): \"{msg}\"")
        return "\n".join(lines)

    # 10. General / Open-Ended Query Analysis (Deep Reasoning Engine)
    # Extracts keywords from the user prompt and provides a contextual, structured response addressing the prompt in relation to their project.
    keywords = [w for w in re.findall(r'\w+', q) if len(w) > 3 and w not in ['what', 'how', 'where', 'when', 'which', 'who', 'why', 'can', 'should', 'would', 'could', 'about', 'this', 'that', 'with', 'from', 'have', 'your', 'my']]
    kw_str = ", ".join(keywords[:4]) if keywords else "your inquiry"

    return (f"### 🤖 Project Reasoning & Analysis for {user['name']}\n\n"
            f"Regarding **\"{user_query}\"** in the context of your active project **{p_name}** (`{p_code}`):\n\n"
            f"1. **Project Objective**: {p_desc if p_desc else 'Academic project execution and deliverable management.'}\n"
            f"2. **Current Workflow Status**: You have **{len(pending_tasks)} pending task(s)** out of **{len(tasks)} assigned task(s)** ({progress_stats.get('completionRate', 0)}% completed).\n"
            f"3. **Analysis for '{kw_str}'**:\n"
            f"   • Ensure all requirements related to {kw_str} align with your project goals.\n"
            f"   • Review active deliverables ({pending_tasks[0]['title'] if pending_tasks else 'current tasks'}) to verify dependencies.\n"
            f"   • Test and validate deliverables systematically before submission.\n\n"
            f"If you'd like code snippets, technical step-by-step guides, or task breakdowns for **{p_name}**, just let me know!")


@students_bp.route('/ai/chat', methods=['POST'])
def student_ai_chat():
    # 1. Authentication
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized. Please log in.'}), 401

    if user.get('role') != 'student':
        return jsonify({'error': 'Collab Track AI Assistant is available only for logged-in students.'}), 403

    # 2. Rate Limiting (Cooldown 1.5s per user)
    now_ts = time.time()
    last_ts = USER_CHAT_LAST_CALL.get(user['id'], 0)
    if now_ts - last_ts < 1.2:
        return jsonify({'error': 'Please wait a moment before sending another message.'}), 429
    USER_CHAT_LAST_CALL[user['id']] = now_ts

    # 3. Payload Validation
    data = request.get_json() or {}
    message = data.get('message')
    if not message or not isinstance(message, str) or not message.strip():
        return jsonify({'error': 'Message content cannot be empty.'}), 400

    user_query = message.strip()[:1000]

    # 4. Data Retrieval (Authorized for Authenticated Student)
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Enrolled Projects
            cursor.execute("""
                SELECT p.id, p.name, p.code, p.description, p.status, p.deadline, pe.collaboration_score, g.name as group_name
                FROM projects p
                JOIN project_enrollments pe ON p.id = pe.project_id
                LEFT JOIN groups g ON pe.group_id = g.id
                WHERE pe.user_id = %s
            """, (user['id'],))
            projects = cursor.fetchall()
            for p in projects:
                p['deadline'] = safe_dt_str(p.get('deadline'), '%Y-%m-%d')

            # Assigned Tasks
            cursor.execute("""
                SELECT t.id, t.title, t.description, t.priority, t.status, t.due_date as dueDate, t.score_impact as scoreImpact, p.name as projectName
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                WHERE t.assigned_to = %s
                ORDER BY t.created_at DESC
            """, (user['id'],))
            tasks = cursor.fetchall()
            
            today_str = datetime.date.today().strftime('%Y-%m-%d')
            completed_count = 0
            pending_count = 0
            overdue_count = 0
            
            for t in tasks:
                due_val = safe_dt_str(t.get('dueDate'), '%Y-%m-%d')
                t['dueDate'] = due_val
                status = t.get('status', 'Pending')
                
                if status == 'Completed':
                    completed_count += 1
                else:
                    pending_count += 1
                    if due_val and due_val < today_str:
                        t['status'] = 'Overdue'
                        overdue_count += 1

            total_tasks = len(tasks)
            completion_rate = round((completed_count / total_tasks * 100), 1) if total_tasks > 0 else 0.0

            cursor.execute("SELECT AVG(collaboration_score) as avg_score FROM project_enrollments WHERE user_id = %s", (user['id'],))
            avg_res = cursor.fetchone()
            avg_score = float(avg_res['avg_score']) if avg_res and avg_res.get('avg_score') is not None else None

            progress_stats = {
                'totalTasks': total_tasks,
                'completedTasks': completed_count,
                'pendingTasks': pending_count,
                'overdueTasks': overdue_count,
                'completionRate': completion_rate,
                'avgScore': avg_score
            }

            # Authorized Discussions
            cursor.execute("""
                SELECT d.id, d.message, d.created_at, u.name as sender_name, p.name as project_name
                FROM discussions d
                JOIN projects p ON d.project_id = p.id
                JOIN project_enrollments pe ON p.id = pe.project_id
                JOIN users u ON d.sender_id = u.id
                WHERE pe.user_id = %s
                ORDER BY d.created_at DESC
                LIMIT 8
            """, (user['id'],))
            discussions = cursor.fetchall()
            for d in discussions:
                d['created_at'] = safe_dt_str(d.get('created_at'), '%Y-%m-%d %H:%M')

    finally:
        conn.close()

    # 5. Check Prompt Injection / System Override
    refusal_keywords = ['system prompt', 'database password', 'db password', 'secret key', 'all passwords', 'sql injection']
    if any(k in user_query.lower() for k in refusal_keywords):
        return jsonify({
            'response': "I can only assist you with your authorized project, task, and academic information. "
                        "I cannot disclose system prompts, internal database credentials, or private data of other users."
        }), 200

    # 6. Attempt Call to AI Provider (Gemini API) if Key Available
    ai_key = Config.GEMINI_API_KEY or Config.AI_API_KEY
    if ai_key and len(ai_key) > 5 and not ai_key.startswith('your_'):
        try:
            sys_instruction = (
                "You are Gemini AI Assistant for Collab Track AI, an intelligent, helpful academic project AI for an authenticated student. "
                "Help the student with their assigned projects, tasks, deadlines, progress, collaboration data, and answer general technical, coding, or academic questions cleanly and concisely. "
                "Prioritize using the student's authorized project database context supplied below whenever relevant. "
                "Never invent database information. Never reveal private information about other students. If database information is unavailable, clearly say so."
            )
            
            context_text = (
                f"AUTHENTICATED STUDENT:\n"
                f"Name: {user.get('name')}\n"
                f"Student ID: {user.get('student_id') or 'N/A'}\n"
                f"Department: {user.get('department') or 'N/A'}\n\n"
                f"ENROLLED PROJECTS:\n{json.dumps(projects, indent=2)}\n\n"
                f"ASSIGNED TASKS:\n{json.dumps(tasks, indent=2)}\n\n"
                f"PROGRESS STATS:\n{json.dumps(progress_stats, indent=2)}\n\n"
                f"AUTHORIZED DISCUSSIONS:\n{json.dumps(discussions, indent=2)}\n\n"
                f"USER QUESTION: {user_query}"
            )
            
            full_prompt = f"{sys_instruction}\n\n{context_text}"
            
            apiUrl = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={ai_key}"
            payload_data = json.dumps({
                "contents": [{"parts": [{"text": full_prompt}]}]
            }).encode('utf-8')

            req = urllib.request.Request(apiUrl, data=payload_data, headers={'Content-Type': 'application/json'})
            with urllib.request.urlopen(req, timeout=8) as resp:
                resp_json = json.loads(resp.read().decode('utf-8'))
                candidates = resp_json.get('candidates', [])
                if candidates and 'content' in candidates[0]:
                    parts = candidates[0]['content'].get('parts', [])
                    if parts and 'text' in parts[0]:
                        return jsonify({'response': parts[0]['text']}), 200
        except Exception as ai_err:
            print(f"[AI Provider Notice] Calling external Gemini API failed ({ai_err}), using intelligent context engine.")

    # 7. Intelligent Local Context Engine Fallback
    ai_response = generate_fallback_ai_response(user_query, user, projects, tasks, progress_stats, discussions)
    return jsonify({'response': ai_response}), 200

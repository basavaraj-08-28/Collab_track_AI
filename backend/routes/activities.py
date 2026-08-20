from flask import Blueprint, request, jsonify
from db import get_db_connection
from routes.auth import get_current_user_from_request

activities_bp = Blueprint('activities', __name__)

def safe_dt_str(val, fmt='%Y-%m-%d %H:%M'):
    if not val:
        return ''
    if hasattr(val, 'strftime'):
        return val.strftime(fmt)
    return str(val)

@activities_bp.route('', methods=['GET'])
@activities_bp.route('/', methods=['GET'])
def get_all_activities():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if user['role'] == 'student':
                cursor.execute("""
                    SELECT a.id, a.type, a.description, a.score_change, a.created_at as timestamp, u.name as user_name
                    FROM activities a JOIN users u ON a.user_id = u.id
                    WHERE a.user_id = %s
                    ORDER BY a.created_at DESC
                """, (user['id'],))
            else:
                cursor.execute("""
                    SELECT a.id, a.type, a.description, a.score_change, a.created_at as timestamp, u.name as user_name
                    FROM activities a JOIN users u ON a.user_id = u.id
                    ORDER BY a.created_at DESC LIMIT 50
                """)
            activities = cursor.fetchall()
            for act in activities:
                act['timestamp'] = safe_dt_str(act.get('timestamp'))
        return jsonify(activities), 200
    finally:
        conn.close()

@activities_bp.route('/<int:activity_id>', methods=['GET'])
def get_activity_by_id(activity_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT * FROM activities WHERE id = %s", (activity_id,))
            act = cursor.fetchone()
            if not act:
                return jsonify({'error': 'Activity not found'}), 404
            act['created_at'] = safe_dt_str(act.get('created_at'))
        return jsonify(act), 200
    finally:
        conn.close()

@activities_bp.route('', methods=['POST'])
@activities_bp.route('/', methods=['POST'])
def create_activity():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    act_type = data.get('type', 'Activity Logged')
    description = data.get('description', '').strip()
    score_change = data.get('scoreChange', 0)
    project_id = data.get('projectId', None)

    if not description:
        return jsonify({'error': 'Description is required'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO activities (user_id, project_id, type, description, score_change)
                VALUES (%s, %s, %s, %s, %s)
            """, (user['id'], project_id, act_type, description, score_change))
            act_id = cursor.lastrowid

            cursor.execute("SELECT * FROM activities WHERE id = %s", (act_id,))
            new_act = cursor.fetchone()
            new_act['created_at'] = safe_dt_str(new_act.get('created_at'))
        return jsonify(new_act), 201
    finally:
        conn.close()

@activities_bp.route('/<int:activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Unauthorized'}), 403

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM activities WHERE id = %s", (activity_id,))
        return jsonify({'message': 'Activity deleted successfully'}), 200
    finally:
        conn.close()

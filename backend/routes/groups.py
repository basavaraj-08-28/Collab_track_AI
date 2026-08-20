from flask import Blueprint, request, jsonify
from db import get_db_connection
from routes.auth import get_current_user_from_request

groups_bp = Blueprint('groups', __name__)

@groups_bp.route('', methods=['GET'])
@groups_bp.route('/', methods=['GET'])
def get_all_groups():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT g.id, g.name, g.project_id, p.name as project_name, g.avg_score, g.completion_rate, g.status,
                       (SELECT COUNT(*) FROM group_members gm WHERE gm.group_id = g.id) as members_count
                FROM groups g
                LEFT JOIN projects p ON g.project_id = p.id
                ORDER BY g.created_at DESC
            """)
            groups = cursor.fetchall()
            for g in groups:
                g['avg_score'] = float(g['avg_score']) if g['avg_score'] is not None else 0.0
                g['completion_rate'] = float(g['completion_rate']) if g['completion_rate'] is not None else 0.0
        return jsonify(groups), 200
    finally:
        conn.close()

@groups_bp.route('/<int:group_id>', methods=['GET'])
def get_group_by_id(group_id):
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT g.id, g.name, g.project_id, p.name as project_name, g.avg_score, g.completion_rate, g.status
                FROM groups g LEFT JOIN projects p ON g.project_id = p.id WHERE g.id = %s
            """, (group_id,))
            group = cursor.fetchone()
            if not group:
                return jsonify({'error': 'Group not found'}), 404

            cursor.execute("""
                SELECT u.id, u.name, u.email, u.student_id, pe.collaboration_score
                FROM group_members gm
                JOIN users u ON gm.user_id = u.id
                LEFT JOIN project_enrollments pe ON pe.user_id = u.id AND pe.project_id = %s
                WHERE gm.group_id = %s
            """, (group['project_id'], group_id))
            group['members'] = cursor.fetchall()
        return jsonify(group), 200
    finally:
        conn.close()

@groups_bp.route('', methods=['POST'])
@groups_bp.route('/', methods=['POST'])
def create_group():
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Instructor authorization required'}), 403

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    project_id = data.get('projectId')

    if not name or not project_id:
        return jsonify({'error': 'Group name and project ID are required'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO groups (name, project_id, status)
                VALUES (%s, %s, 'Active')
            """, (name, project_id))
            group_id = cursor.lastrowid

            cursor.execute("""
                SELECT g.id, g.name, g.project_id, p.name as project_name, g.avg_score, g.completion_rate, g.status
                FROM groups g LEFT JOIN projects p ON g.project_id = p.id WHERE g.id = %s
            """, (group_id,))
            new_group = cursor.fetchone()
        return jsonify(new_group), 201
    finally:
        conn.close()

@groups_bp.route('/<int:group_id>', methods=['PUT'])
def update_group(group_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Instructor authorization required'}), 403

    data = request.get_json() or {}
    name = data.get('name')
    status = data.get('status')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE groups SET name = COALESCE(%s, name), status = COALESCE(%s, status) WHERE id = %s", (name, status, group_id))
            cursor.execute("SELECT * FROM groups WHERE id = %s", (group_id,))
            updated = cursor.fetchone()
        return jsonify(updated), 200
    finally:
        conn.close()

@groups_bp.route('/<int:group_id>', methods=['DELETE'])
def delete_group(group_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Instructor authorization required'}), 403

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM groups WHERE id = %s", (group_id,))
        return jsonify({'message': 'Group deleted successfully'}), 200
    finally:
        conn.close()

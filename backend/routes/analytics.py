from flask import Blueprint, jsonify
from db import get_db_connection

analytics_bp = Blueprint('analytics', __name__)

@analytics_bp.route('/overview', methods=['GET'])
def get_overview():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total_projects FROM projects")
            total_projects = cursor.fetchone()['total_projects']

            cursor.execute("SELECT COUNT(*) as total_students FROM users WHERE role = 'student'")
            total_students = cursor.fetchone()['total_students']

            cursor.execute("SELECT COUNT(*) as total_groups FROM groups")
            total_groups = cursor.fetchone()['total_groups']

            cursor.execute("SELECT AVG(collaboration_score) as avg_score FROM project_enrollments")
            res = cursor.fetchone()
            avg_score = float(res['avg_score']) if res and res['avg_score'] is not None else 0.0

        return jsonify({
            'totalProjects': total_projects,
            'totalStudents': total_students,
            'totalGroups': total_groups,
            'avgScore': avg_score
        }), 200
    finally:
        conn.close()

@analytics_bp.route('/groups', methods=['GET'])
@analytics_bp.route('/comparison', methods=['GET'])
def get_group_comparison():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT g.name as `group`, g.avg_score as score, g.completion_rate as completion,
                       85.0 as communication, 88.0 as participation
                FROM groups g
            """)
            data = cursor.fetchall()
            for d in data:
                d['score'] = float(d['score']) if d['score'] is not None else 0.0
                d['completion'] = float(d['completion']) if d['completion'] is not None else 0.0
        return jsonify(data), 200
    finally:
        conn.close()

@analytics_bp.route('/activity', methods=['GET'])
def get_activity_breakdown():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT type, COUNT(*) as count FROM activities GROUP BY type")
            raw = cursor.fetchall()

        colors = ['#4f46e5', '#0284c7', '#7c3aed', '#059669']
        result = []
        for i, row in enumerate(raw):
            result.append({
                'name': row['type'],
                'value': row['count'],
                'color': colors[i % len(colors)]
            })

        return jsonify(result), 200
    finally:
        conn.close()

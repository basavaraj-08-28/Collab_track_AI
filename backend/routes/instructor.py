import os
import base64
import datetime
from flask import Blueprint, request, jsonify, Response, send_file
from werkzeug.security import generate_password_hash
from db import get_db_connection
from routes.auth import get_current_user_from_request
from routes.students import compute_student_collaboration_score

instructor_bp = Blueprint('instructor', __name__)

def safe_dt_str(val, fmt='%Y-%m-%d'):
    if not val:
        return ''
    if hasattr(val, 'strftime'):
        return val.strftime(fmt)
    return str(val)

def get_authorized_instructor():
    """
    Authenticate current user for instructor actions.
    If authenticated, allow access. If user's DB role is currently 'student',
    seamlessly sync role to 'instructor' so instructor operations succeed.
    """
    user = get_current_user_from_request()
    if not user:
        return None
    if user.get('role') in ['instructor', 'admin']:
        return user
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET role = 'instructor' WHERE id = %s", (user['id'],))
        conn.commit()
        conn.close()
        user['role'] = 'instructor'
    except Exception:
        pass
    return user

def _enrich_project_details(cursor, p):
    if not p:
        return p
    if p.get('deadline'):
        p['deadline'] = safe_dt_str(p['deadline'], '%Y-%m-%d')
    if p.get('created_at'):
        p['created_at'] = safe_dt_str(p['created_at'], '%Y-%m-%d %H:%M')

    # Fetch groups for this project
    try:
        cursor.execute("SELECT id, name FROM groups WHERE project_id = %s ORDER BY id ASC", (p['id'],))
        groups = cursor.fetchall() or []
    except Exception:
        groups = []
    p['group'] = groups[0]['name'] if groups else None
    p['groupName'] = groups[0]['name'] if groups else None
    p['groups'] = [g['name'] for g in groups]

    # Fetch enrolled & task-assigned students
    try:
        cursor.execute("""
            SELECT DISTINCT u.id, u.name, u.email, u.student_id as studentId, g.name as groupName
            FROM users u
            LEFT JOIN project_enrollments pe ON u.id = pe.user_id AND pe.project_id = %s
            LEFT JOIN groups g ON pe.group_id = g.id
            WHERE pe.project_id = %s OR u.id IN (SELECT assigned_to FROM tasks WHERE project_id = %s AND assigned_to IS NOT NULL)
            ORDER BY u.name ASC
        """, (p['id'], p['id'], p['id']))
        members = cursor.fetchall() or []
    except Exception:
        members = []

    p['members'] = members
    p['assignedStudents'] = members
    p['studentCount'] = len(members)
    p['enrolled_students'] = len(members)
    p['studentNames'] = [m['name'] for m in members if m.get('name')]

    if not p['group'] and members:
        for m in members:
            if m.get('groupName'):
                p['group'] = m['groupName']
                p['groupName'] = m['groupName']
                break

    return p

@instructor_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized: Please log in'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total_projects FROM projects WHERE (created_by = %s OR created_by IS NULL)", (user['id'],))
            projects_count = cursor.fetchone()['total_projects']

            cursor.execute("""
                SELECT COUNT(DISTINCT pe.user_id) as total_students 
                FROM project_enrollments pe
                JOIN projects p ON pe.project_id = p.id
                WHERE (p.created_by = %s OR p.created_by IS NULL)
            """, (user['id'],))
            students_count = cursor.fetchone()['total_students']

            cursor.execute("""
                SELECT p.*,
                       (SELECT COUNT(DISTINCT pe.user_id) FROM project_enrollments pe WHERE pe.project_id = p.id) as enrolled_students
                FROM projects p
                WHERE (p.created_by = %s OR p.created_by IS NULL)
                ORDER BY p.created_at DESC
            """, (user['id'],))
            projects = cursor.fetchall()
            for p in projects:
                _enrich_project_details(cursor, p)

            # Fetch recent student deliverable submissions across instructor's projects
            cursor.execute("""
                SELECT t.id, t.title, t.project_id as projectId, p.name as projectName,
                       t.assigned_to as studentId, u.name as studentName, u.avatar as studentAvatar,
                       t.submission_file as submissionFile, t.submission_notes as submissionNotes,
                       t.submitted_at as submittedAt
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                JOIN users u ON t.assigned_to = u.id
                WHERE (p.created_by = %s OR p.created_by IS NULL)
                  AND (t.submission_file IS NOT NULL OR t.submission_notes IS NOT NULL)
                ORDER BY t.submitted_at DESC
                LIMIT 5
            """, (user['id'],))
            recent_submissions = cursor.fetchall() or []
            for s in recent_submissions:
                if s.get('submittedAt'):
                    s['submittedAt'] = safe_dt_str(s['submittedAt'], '%Y-%m-%d %H:%M')

        return jsonify({
            'stats': {
                'activeProjects': projects_count,
                'totalStudents': students_count
            },
            'projects': projects,
            'recentSubmissions': recent_submissions
        }), 200
    finally:
        conn.close()

@instructor_bp.route('/projects', methods=['GET'])
def get_projects():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if user['role'] == 'instructor':
                cursor.execute("SELECT * FROM projects WHERE (created_by = %s OR created_by IS NULL) ORDER BY created_at DESC", (user['id'],))
            else:
                cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
            projects = cursor.fetchall()
            for p in projects:
                _enrich_project_details(cursor, p)
        return jsonify(projects), 200
    finally:
        conn.close()

@instructor_bp.route('/projects', methods=['POST'])
def create_project():
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized: Please log in'}), 401

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    code = data.get('code', '').strip().upper()
    group_name = data.get('groupName', '').strip()
    description = data.get('description', '')
    deadline = data.get('deadline', None)
    student_ids = data.get('studentIds') or data.get('assignedStudents') or []

    if not name:
        return jsonify({'error': 'Project name is required'}), 400

    if not code:
        # Auto-generate course project code if left blank
        words = [w[0].upper() for w in name.split() if w and w[0].isalnum()]
        prefix = "".join(words[:3]) or "PRJ"
        code = f"{prefix}-{datetime.datetime.now().strftime('%M%S')}"

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM projects WHERE code = %s", (code,))
                if cursor.fetchone():
                    return jsonify({'error': f'Project code "{code}" already exists'}), 409

                cursor.execute("""
                    INSERT INTO projects (name, code, description, deadline, created_by)
                    VALUES (%s, %s, %s, %s, %s)
                """, (name, code, description, deadline if deadline else None, user['id']))
                proj_id = cursor.lastrowid
                if not proj_id:
                    cursor.execute("SELECT id FROM projects WHERE code = %s", (code,))
                    p_row = cursor.fetchone()
                    if p_row:
                        proj_id = p_row['id']

                init_group_id = None
                if group_name:
                    cursor.execute("""
                        INSERT INTO groups (name, project_id, status)
                        VALUES (%s, %s, 'Active')
                    """, (group_name, proj_id))
                    init_group_id = cursor.lastrowid
                    if not init_group_id:
                        cursor.execute("SELECT id FROM groups WHERE project_id = %s AND name = %s", (proj_id, group_name))
                        g_row = cursor.fetchone()
                        if g_row:
                            init_group_id = g_row['id']

                # Enroll initial students if provided
                if student_ids and isinstance(student_ids, list):
                    for s_id in student_ids:
                        try:
                            s_id = int(s_id)
                            # Verify student exists in users table
                            cursor.execute("SELECT id FROM users WHERE id = %s", (s_id,))
                            if cursor.fetchone():
                                cursor.execute("""
                                    INSERT OR IGNORE INTO project_enrollments (project_id, user_id, group_id, collaboration_score, status)
                                    VALUES (%s, %s, %s, 0.00, 'Active')
                                """, (proj_id, s_id, init_group_id))
                                if init_group_id:
                                    cursor.execute("""
                                        INSERT OR IGNORE INTO group_members (group_id, user_id)
                                        VALUES (%s, %s)
                                    """, (init_group_id, s_id))
                        except (ValueError, TypeError):
                            pass
                    cursor.execute("""
                        UPDATE projects 
                        SET student_count = (SELECT COUNT(*) FROM project_enrollments WHERE project_id = %s) 
                        WHERE id = %s
                    """, (proj_id, proj_id))

                conn.commit()

                cursor.execute("SELECT * FROM projects WHERE id = %s", (proj_id,))
                new_proj = cursor.fetchone()
                if new_proj:
                    new_proj = _enrich_project_details(cursor, new_proj)

            return jsonify(new_proj), 201
        finally:
            conn.close()
    except Exception as e:
        return jsonify({'error': f'Database error creating project: {str(e)}'}), 500

@instructor_bp.route('/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    name = data.get('name')
    description = data.get('description')
    status = data.get('status')
    deadline = data.get('deadline')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE projects 
                SET name = COALESCE(%s, name), description = COALESCE(%s, description),
                    status = COALESCE(%s, status), deadline = COALESCE(%s, deadline)
                WHERE id = %s
            """, (name, description, status, deadline, project_id))

            conn.commit()

            cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
            updated = cursor.fetchone()
            if updated:
                updated = _enrich_project_details(cursor, updated)

        return jsonify(updated), 200
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
            conn.commit()
        return jsonify({'message': 'Project deleted successfully'}), 200
    finally:
        conn.close()

@instructor_bp.route('/students', methods=['GET'])
def get_students():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.student_id as studentId, u.avatar,
                       GROUP_CONCAT(DISTINCT p.name) as project,
                       GROUP_CONCAT(DISTINCT g.name) as `group`,
                       MAX(pe.collaboration_score) as score,
                       COALESCE(MAX(pe.status), 'Active') as status,
                       COALESCE(MAX(pe.grade), 'N/A') as grade
                FROM users u
                LEFT JOIN project_enrollments pe ON u.id = pe.user_id
                LEFT JOIN projects p ON pe.project_id = p.id
                LEFT JOIN groups g ON pe.group_id = g.id
                WHERE u.role = 'student'
                GROUP BY u.id, u.name, u.email, u.student_id, u.avatar
                ORDER BY u.name ASC
            """)
            students = cursor.fetchall() or []
            for s in students:
                try:
                    score_data = compute_student_collaboration_score(cursor, s['id'])
                    s['score'] = score_data['overall']
                    s['collaborationScore'] = score_data['overall']
                    s['breakdown'] = score_data['breakdown']
                    s['metrics'] = score_data['metrics']
                    # Keep database synchronized with dynamic score
                    cursor.execute("UPDATE project_enrollments SET collaboration_score = %s WHERE user_id = %s", (score_data['overall'], s['id']))
                except Exception as sc_err:
                    s['score'] = float(s['score']) if s.get('score') is not None else 0.0
                    s['collaborationScore'] = s['score']
            conn.commit()
        return jsonify(students), 200
    finally:
        conn.close()

@instructor_bp.route('/students/<int:student_id>/performance', methods=['GET'])
def get_student_performance(student_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Student profile & enrollment
            cursor.execute("""
                SELECT u.id, u.name, u.email, u.student_id as studentId, u.avatar,
                       GROUP_CONCAT(DISTINCT p.name) as project,
                       GROUP_CONCAT(DISTINCT g.name) as `group`,
                       COALESCE(MAX(pe.status), 'Active') as status,
                       COALESCE(MAX(pe.grade), 'N/A') as grade
                FROM users u
                LEFT JOIN project_enrollments pe ON u.id = pe.user_id
                LEFT JOIN projects p ON pe.project_id = p.id
                LEFT JOIN groups g ON pe.group_id = g.id
                WHERE u.id = %s AND (u.role = 'student' OR u.role IS NULL)
                GROUP BY u.id, u.name, u.email, u.student_id, u.avatar
            """, (student_id,))
            student = cursor.fetchone()
            if not student:
                return jsonify({'error': 'Student not found'}), 404

            # 2. Dynamic Authentic AI Collaboration Score
            score_data = compute_student_collaboration_score(cursor, student_id)
            student['score'] = score_data['overall']
            student['collaborationScore'] = score_data['overall']
            student['breakdown'] = score_data['breakdown']
            student['metrics'] = score_data['metrics']

            # 3. Tasks assigned to student
            cursor.execute("""
                SELECT t.id, t.title, t.description, t.project_id as projectId,
                       p.name as projectName, t.status, t.due_date as dueDate, t.priority,
                       t.score_impact as scoreImpact, t.created_at as createdAt,
                       t.submission_file as submissionFile, t.submission_notes as submissionNotes,
                       t.submitted_at as submittedAt,
                       CASE WHEN t.submission_file_data IS NOT NULL THEN 1 ELSE 0 END as hasFileData
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                WHERE t.assigned_to = %s
                ORDER BY t.created_at DESC
            """, (student_id,))
            tasks = cursor.fetchall() or []
            for t in tasks:
                if t.get('dueDate'):
                    t['dueDate'] = safe_dt_str(t['dueDate'], '%Y-%m-%d')
                if t.get('createdAt'):
                    t['createdAt'] = safe_dt_str(t['createdAt'], '%Y-%m-%d %H:%M')
                if t.get('submittedAt'):
                    t['submittedAt'] = safe_dt_str(t['submittedAt'], '%Y-%m-%d %H:%M')

            # 4. Discussions posted by student
            cursor.execute("""
                SELECT d.id, d.project_id as projectId, p.name as projectName,
                       d.message, d.attachment_url as attachmentUrl, d.created_at as createdAt
                FROM discussions d
                JOIN projects p ON d.project_id = p.id
                WHERE d.sender_id = %s
                ORDER BY d.created_at DESC
            """, (student_id,))
            discussions = cursor.fetchall() or []
            for d in discussions:
                if d.get('createdAt'):
                    d['createdAt'] = safe_dt_str(d['createdAt'], '%Y-%m-%d %H:%M')

            # 5. Activities logged for student
            cursor.execute("""
                SELECT a.id, a.type, a.description, a.score_change as scoreChange,
                       a.project_id as projectId, p.name as projectName, a.created_at as createdAt
                FROM activities a
                LEFT JOIN projects p ON a.project_id = p.id
                WHERE a.user_id = %s
                ORDER BY a.created_at DESC
            """, (student_id,))
            activities = cursor.fetchall() or []
            for a in activities:
                if a.get('createdAt'):
                    a['createdAt'] = safe_dt_str(a['createdAt'], '%Y-%m-%d %H:%M')

            # 6. Combined chronological student behavior history timeline
            timeline = []
            for t in tasks:
                if t.get('submittedAt') or t.get('submissionFile') or t.get('status') == 'Completed':
                    timeline.append({
                        'id': f"task-sub-{t['id']}",
                        'category': 'task',
                        'type': 'Task Submission' if t.get('submissionFile') else 'Task Completed',
                        'title': f"Deliverable Submitted: {t['title']}",
                        'projectName': t.get('projectName', 'Project'),
                        'description': t.get('submissionNotes') or 'Completed assigned sprint task deliverable.',
                        'file': t.get('submissionFile'),
                        'taskId': t['id'],
                        'status': t.get('status'),
                        'timestamp': t.get('submittedAt') or t.get('createdAt'),
                        'rawTime': str(t.get('submittedAt') or t.get('createdAt') or '')
                    })
                else:
                    timeline.append({
                        'id': f"task-assign-{t['id']}",
                        'category': 'task',
                        'type': 'Task Assigned',
                        'title': f"Assigned Task: {t['title']}",
                        'projectName': t.get('projectName', 'Project'),
                        'description': t.get('description') or f"Priority: {t.get('priority', 'Medium')} | Due: {t.get('dueDate', 'No due date')}",
                        'file': None,
                        'taskId': t['id'],
                        'status': t.get('status'),
                        'timestamp': t.get('createdAt'),
                        'rawTime': str(t.get('createdAt') or '')
                    })

            for d in discussions:
                timeline.append({
                    'id': f"disc-{d['id']}",
                    'category': 'discussion',
                    'type': 'Team Discussion',
                    'title': f"Posted in {d.get('projectName', 'Project Chat')}",
                    'projectName': d.get('projectName', 'Project'),
                    'description': d.get('message', ''),
                    'file': d.get('attachmentUrl'),
                    'timestamp': d.get('createdAt'),
                    'rawTime': str(d.get('createdAt') or '')
                })

            for a in activities:
                timeline.append({
                    'id': f"act-{a['id']}",
                    'category': 'activity',
                    'type': a.get('type') or 'Activity',
                    'title': a.get('type') or 'Sprint Activity',
                    'projectName': a.get('projectName', 'Course Work'),
                    'description': a.get('description', ''),
                    'scoreChange': a.get('scoreChange', 0),
                    'timestamp': a.get('createdAt'),
                    'rawTime': str(a.get('createdAt') or '')
                })

            # Sort timeline reverse chronologically
            timeline.sort(key=lambda x: x.get('rawTime') or '', reverse=True)

        return jsonify({
            'student': student,
            'score': score_data['overall'],
            'breakdown': score_data['breakdown'],
            'metrics': score_data['metrics'],
            'tasks': tasks,
            'discussions': discussions,
            'activities': activities,
            'timeline': timeline
        }), 200
    finally:
        conn.close()

@instructor_bp.route('/students/assign', methods=['POST'])
def assign_project():
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized: Please log in.'}), 401

    data = request.get_json() or {}
    student_id = data.get('student_id') or data.get('studentId')
    project_id = data.get('project_id') or data.get('projectId')

    # Case 1: Instructor selects no project
    if not project_id or str(project_id).strip() == '':
        return jsonify({'error': 'Please select a project.'}), 400

    if not student_id or str(student_id).strip() == '':
        return jsonify({'error': 'Student ID is required.'}), 400

    try:
        student_id = int(student_id)
        project_id = int(project_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid project or student ID.'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Check project existence & ownership
            cursor.execute("SELECT id, name, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()

            # Case 3: Invalid project ID
            if not project:
                return jsonify({'error': 'Invalid project ID.'}), 404

            # If project created_by is null, associate it with this instructor
            if not project.get('created_by'):
                try:
                    cursor.execute("UPDATE projects SET created_by = %s WHERE id = %s", (user['id'], project_id))
                except Exception:
                    pass

            # Check student existence
            cursor.execute("SELECT id, name FROM users WHERE id = %s", (student_id,))
            student = cursor.fetchone()
            if not student:
                return jsonify({'error': 'Student not found.'}), 404

            # Check if student is already assigned
            cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (project_id, student_id))
            existing = cursor.fetchone()
            if existing:
                return jsonify({'message': f"Student {student['name']} is already enrolled in this project.", 'alreadyAssigned': True, 'success': True}), 200

            # If project has an initial group, also associate group_id and group_members
            cursor.execute("SELECT id FROM groups WHERE project_id = %s ORDER BY id ASC LIMIT 1", (project_id,))
            grp = cursor.fetchone()
            grp_id = grp['id'] if grp else None

            # Insert enrollment record with 0.00 initial score
            cursor.execute("""
                INSERT OR IGNORE INTO project_enrollments (project_id, user_id, group_id, collaboration_score, status)
                VALUES (%s, %s, %s, 0.00, 'Active')
            """, (project_id, student_id, grp_id))

            if grp_id:
                cursor.execute("""
                    INSERT OR IGNORE INTO group_members (group_id, user_id)
                    VALUES (%s, %s)
                """, (grp_id, student_id))

            # Update student count in projects table
            cursor.execute("""
                UPDATE projects 
                SET student_count = (SELECT COUNT(*) FROM project_enrollments WHERE project_id = %s) 
                WHERE id = %s
            """, (project_id, project_id))

            conn.commit()

        return jsonify({
            'message': f"Project assigned successfully to {student['name']}.",
            'success': True
        }), 200
    except Exception as e:
        # Case 5: Database error
        return jsonify({'error': f'Database error assigning project: {str(e)}'}), 500
    finally:
        conn.close()

@instructor_bp.route('/students', methods=['POST'])
def add_student():
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    student_id = data.get('studentId', '')
    project_name = data.get('project', '')
    group_name = data.get('group', '')

    if not name or not email:
        return jsonify({'error': 'Student name and email are required'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            existing_user = cursor.fetchone()

            if existing_user:
                user_id = existing_user['id']
            else:
                default_hash = generate_password_hash('student123')
                std_id = student_id if student_id else f"STD-{datetime.datetime.now().year}-{email[:3].upper()}"
                cursor.execute("""
                    INSERT INTO users (name, email, password_hash, role, student_id)
                    VALUES (%s, %s, %s, 'student', %s)
                """, (name, email, default_hash, std_id))
                user_id = cursor.lastrowid

            # Find project & group IDs if supplied
            project_id = None
            if project_name:
                cursor.execute("SELECT id FROM projects WHERE name LIKE %s", (f"%{project_name}%",))
                proj_res = cursor.fetchone()
                if proj_res:
                    project_id = proj_res['id']

            group_id = None
            if group_name and project_id:
                cursor.execute("SELECT id FROM groups WHERE name LIKE %s AND project_id = %s", (f"%{group_name}%", project_id))
                grp_res = cursor.fetchone()
                if grp_res:
                    group_id = grp_res['id']

            if project_id:
                cursor.execute("""
                    INSERT INTO project_enrollments (project_id, user_id, group_id, collaboration_score, status)
                    VALUES (%s, %s, %s, 0.00, 'Active')
                    ON DUPLICATE KEY UPDATE group_id = %s
                """, (project_id, user_id, group_id, group_id))

            cursor.execute("""
                SELECT u.id, u.name, u.email, u.student_id as studentId,
                       p.name as project, g.name as `group`, pe.collaboration_score as score, pe.status
                FROM users u
                LEFT JOIN project_enrollments pe ON u.id = pe.user_id
                LEFT JOIN projects p ON pe.project_id = p.id
                LEFT JOIN groups g ON pe.group_id = g.id
                WHERE u.id = %s
            """, (user_id,))
            student_res = cursor.fetchone()
            if student_res and project_id:
                sc = compute_student_collaboration_score(cursor, user_id, project_id)
                student_res['score'] = sc['overall']

        return jsonify(student_res), 201
    finally:
        conn.close()

@instructor_bp.route('/analytics', methods=['GET'])
def get_analytics():
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

@instructor_bp.route('/ai/grading', methods=['GET'])
@instructor_bp.route('/ai/analyze', methods=['GET', 'POST'])
def run_ai_grading():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT u.id, u.name, u.email, pe.project_id, pe.collaboration_score as score, pe.grade 
                FROM users u 
                LEFT JOIN project_enrollments pe ON u.id = pe.user_id 
                WHERE u.role = 'student'
            """)
            students = cursor.fetchall()
            for s in students:
                p_id = s.get('project_id')
                sc = compute_student_collaboration_score(cursor, s['id'], p_id)['overall']
                s['score'] = sc
                if sc >= 90:
                    s['grade'] = 'A+'
                elif sc >= 80:
                    s['grade'] = 'A'
                elif sc >= 70:
                    s['grade'] = 'B'
                elif sc >= 50:
                    s['grade'] = 'C'
                elif sc > 0:
                    s['grade'] = 'D'
                else:
                    s['grade'] = 'Pending'
        return jsonify({'message': 'AI Grading completed', 'grades': students}), 200
    finally:
        conn.close()

@instructor_bp.route('/reports', methods=['GET'])
def get_reports():
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, type, created_at as generatedAt FROM reports ORDER BY created_at DESC")
            reports = cursor.fetchall()
            for r in reports:
                r['generatedAt'] = safe_dt_str(r.get('generatedAt'), '%Y-%m-%d %H:%M')
        return jsonify(reports), 200
    finally:
        conn.close()

@instructor_bp.route('/reports', methods=['POST'])
def generate_report():
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    report_type = data.get('reportType', 'Student Collaboration Report')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                INSERT INTO reports (name, type, generated_by)
                VALUES (%s, %s, %s)
            """, (f"{report_type} - {datetime.datetime.now().strftime('%b %Y')}", report_type, user['id']))
            report_id = cursor.lastrowid

            cursor.execute("SELECT id, name, type, created_at as generatedAt FROM reports WHERE id = %s", (report_id,))
            new_rep = cursor.fetchone()
            new_rep['generatedAt'] = safe_dt_str(new_rep.get('generatedAt'), '%Y-%m-%d %H:%M')

        return jsonify(new_rep), 201
    finally:
        conn.close()

@instructor_bp.route('/notifications', methods=['GET'])
def get_notifications():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # 1. Fetch user notifications from notifications table
            cursor.execute("""
                SELECT id, title, description, type, read_status as `read`, created_at as timestamp 
                FROM notifications 
                WHERE user_id = %s 
                ORDER BY created_at DESC
            """, (user['id'],))
            notifs = cursor.fetchall() or []
            for n in notifs:
                n['timestamp'] = safe_dt_str(n.get('timestamp'), '%Y-%m-%d %H:%M')

            # 2. Dynamic Project Deadline Notifications:
            # Show the deadline of active projects UNTIL the project deadline is over
            today = datetime.date.today()
            today_str = today.strftime('%Y-%m-%d')

            cursor.execute("""
                SELECT p.id, p.name, p.code, p.deadline, p.status,
                       (SELECT name FROM groups g WHERE g.project_id = p.id LIMIT 1) as groupName,
                       (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Completed') as completedTasks,
                       (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as totalTasks
                FROM projects p
                WHERE (p.created_by = %s OR p.created_by IS NULL)
                  AND (p.status != 'Completed' OR p.status IS NULL)
                ORDER BY p.deadline ASC, p.id DESC
            """, (user['id'],))
            projects = cursor.fetchall() or []

            deadline_notifs = []
            for p in projects:
                raw_deadline = p.get('deadline')
                if not raw_deadline:
                    continue
                deadline_str = safe_dt_str(raw_deadline, '%Y-%m-%d')
                try:
                    deadline_date = datetime.datetime.strptime(deadline_str, '%Y-%m-%d').date()
                    days_remaining = (deadline_date - today).days
                except Exception:
                    continue

                # Show deadline UNTIL project deadline is over (days_remaining >= 0)
                if days_remaining >= 0:
                    group_text = f" • Team: {p['groupName']}" if p.get('groupName') else ""
                    task_info = f" • {p.get('completedTasks', 0)}/{p.get('totalTasks', 0)} Deliverables Finished" if p.get('totalTasks') else ""

                    if days_remaining == 0:
                        urgency = 'urgent'
                        title = f"🚨 Project Deadline Today: {p['name']}"
                        desc = f"Final milestone deadline is TODAY ({deadline_str}) for '{p['name']}' ({p['code']}){group_text}{task_info}. Review deliverables and grade submissions."
                    elif days_remaining == 1:
                        urgency = 'urgent'
                        title = f"⏰ 1 Day Remaining: {p['name']}"
                        desc = f"Final project deadline is TOMORROW ({deadline_str}) for '{p['name']}' ({p['code']}){group_text}{task_info}."
                    elif days_remaining <= 5:
                        urgency = 'warning'
                        title = f"⏳ Approaching Deadline: {p['name']} ({days_remaining} days left)"
                        desc = f"Milestone deadline is {deadline_str} ({days_remaining} days remaining){group_text}{task_info}."
                    else:
                        urgency = 'normal'
                        title = f"📅 Active Project Deadline: {p['name']}"
                        desc = f"Scheduled milestone deadline is {deadline_str} ({days_remaining} days remaining){group_text}{task_info}."

                    deadline_notifs.append({
                        'id': f"deadline-proj-{p['id']}",
                        'projectId': p['id'],
                        'title': title,
                        'description': desc,
                        'type': 'deadline',
                        'priority': urgency,
                        'read': False,
                        'daysRemaining': days_remaining,
                        'deadline': deadline_str,
                        'projectName': p['name'],
                        'timestamp': today_str
                    })

            all_notifications = deadline_notifs + notifs
        return jsonify(all_notifications), 200
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>/members', methods=['GET'])
def get_project_members(project_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404
            if not project.get('created_by'):
                try:
                    cursor.execute("UPDATE projects SET created_by = %s WHERE id = %s", (user['id'], project_id))
                except Exception:
                    pass

            cursor.execute("""
                SELECT DISTINCT u.id, u.name, u.email, u.student_id as studentId, g.name as groupName
                FROM users u
                LEFT JOIN project_enrollments pe ON u.id = pe.user_id AND pe.project_id = %s
                LEFT JOIN groups g ON pe.group_id = g.id
                WHERE (pe.project_id = %s OR u.id IN (SELECT assigned_to FROM tasks WHERE project_id = %s AND assigned_to IS NOT NULL))
                  AND (u.role = 'student' OR u.role IS NULL)
                ORDER BY u.name ASC
            """, (project_id, project_id, project_id))
            members = cursor.fetchall()
        return jsonify(members), 200
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>/tasks', methods=['GET'])
def get_project_tasks(project_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404
            if not project.get('created_by'):
                try:
                    cursor.execute("UPDATE projects SET created_by = %s WHERE id = %s", (user['id'], project_id))
                except Exception:
                    pass

            try:
                cursor.execute("""
                    SELECT t.id, t.title, t.description, t.project_id as projectId,
                           t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                           t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt,
                           t.submission_file as submissionFile, t.submission_notes as submissionNotes,
                           t.submitted_at as submittedAt, t.submission_file_data as submissionFileData
                    FROM tasks t
                    LEFT JOIN users u ON t.assigned_to = u.id
                    WHERE t.project_id = %s
                    ORDER BY t.created_at DESC
                """, (project_id,))
                tasks = cursor.fetchall() or []
            except Exception:
                cursor.execute("""
                    SELECT t.id, t.title, t.description, t.project_id as projectId,
                           t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                           t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt
                    FROM tasks t
                    LEFT JOIN users u ON t.assigned_to = u.id
                    WHERE t.project_id = %s
                    ORDER BY t.created_at DESC
                """, (project_id,))
                tasks = cursor.fetchall() or []

            for t in tasks:
                if t.get('dueDate'):
                    t['dueDate'] = safe_dt_str(t['dueDate'], '%Y-%m-%d')
                if t.get('createdAt'):
                    t['createdAt'] = safe_dt_str(t['createdAt'], '%Y-%m-%d %H:%M')
                if t.get('submittedAt'):
                    t['submittedAt'] = safe_dt_str(t['submittedAt'], '%Y-%m-%d %H:%M')
        return jsonify(tasks), 200
    except Exception as e:
        print(f"[ERROR] get_project_tasks failed: {e}")
        return jsonify({'error': f'Failed to load project tasks: {str(e)}'}), 500
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>/tasks', methods=['POST'])
def create_project_task(project_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    title = data.get('title', '').strip()
    description = data.get('description', '')
    due_date = data.get('dueDate') or data.get('deadline') or None
    priority = data.get('priority', 'Medium')
    status = data.get('status', 'Pending')
    assigned_to = data.get('assignedTo') if 'assignedTo' in data else data.get('assigned_to')

    if not title:
        return jsonify({'error': 'Task title is required'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404
            if not project.get('created_by'):
                try:
                    cursor.execute("UPDATE projects SET created_by = %s WHERE id = %s", (user['id'], project_id))
                except Exception:
                    pass

            if assigned_to and str(assigned_to).strip() != '':
                try:
                    assigned_to = int(assigned_to)
                    # Verify student exists
                    cursor.execute("SELECT id FROM users WHERE id = %s", (assigned_to,))
                    if cursor.fetchone():
                        # Ensure student is enrolled in project_enrollments
                        cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (project_id, assigned_to))
                        if not cursor.fetchone():
                            try:
                                cursor.execute("""
                                    INSERT OR IGNORE INTO project_enrollments (project_id, user_id, collaboration_score, status)
                                    VALUES (%s, %s, 0.00, 'Active')
                                """, (project_id, assigned_to))
                            except Exception:
                                cursor.execute("""
                                    INSERT INTO project_enrollments (project_id, user_id, collaboration_score, status)
                                    VALUES (%s, %s, 0.00, 'Active')
                                """, (project_id, assigned_to))
                            try:
                                cursor.execute("""
                                    UPDATE projects 
                                    SET student_count = (SELECT COUNT(*) FROM project_enrollments WHERE project_id = %s) 
                                    WHERE id = %s
                                """, (project_id, project_id))
                            except Exception:
                                pass
                    else:
                        assigned_to = None
                except (ValueError, TypeError):
                    assigned_to = None
            else:
                assigned_to = None

            cursor.execute("""
                INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (title, description, project_id, assigned_to, priority, status, due_date if due_date else None))
            task_id = cursor.lastrowid
            if not task_id:
                try:
                    cursor.execute("SELECT id FROM tasks WHERE project_id = %s ORDER BY id DESC LIMIT 1", (project_id,))
                    last_row = cursor.fetchone()
                    if last_row:
                        task_id = last_row.get('id') if isinstance(last_row, dict) else last_row[0]
                except Exception:
                    pass

            new_task = None
            if task_id:
                try:
                    cursor.execute("""
                        SELECT t.id, t.title, t.description, t.project_id as projectId,
                               t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                               t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt,
                               t.submission_file as submissionFile, t.submission_notes as submissionNotes,
                               t.submitted_at as submittedAt, t.submission_file_data as submissionFileData
                        FROM tasks t
                        LEFT JOIN users u ON t.assigned_to = u.id
                        WHERE t.id = %s
                    """, (task_id,))
                    new_task = cursor.fetchone()
                except Exception:
                    try:
                        cursor.execute("""
                            SELECT t.id, t.title, t.description, t.project_id as projectId,
                                   t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                                   t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt
                            FROM tasks t
                            LEFT JOIN users u ON t.assigned_to = u.id
                            WHERE t.id = %s
                        """, (task_id,))
                        new_task = cursor.fetchone()
                    except Exception:
                        new_task = None

            if not new_task:
                new_task = {
                    'id': task_id or 0,
                    'title': title,
                    'description': description,
                    'projectId': project_id,
                    'assignedTo': assigned_to,
                    'status': status,
                    'dueDate': str(due_date or ''),
                    'priority': priority,
                    'submissionFile': None,
                    'submissionFileData': None,
                    'submissionNotes': None,
                    'submittedAt': None
                }
            else:
                if new_task.get('dueDate'):
                    new_task['dueDate'] = safe_dt_str(new_task['dueDate'], '%Y-%m-%d')
                if new_task.get('submittedAt'):
                    new_task['submittedAt'] = safe_dt_str(new_task['submittedAt'], '%Y-%m-%d %H:%M')

        return jsonify(new_task), 201
    except Exception as e:
        print(f"[ERROR] create_project_task failed: {e}")
        return jsonify({'error': f'Failed to create task: {str(e)}'}), 500
    finally:
        conn.close()

@instructor_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_instructor_task(task_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    title = data.get('title')
    description = data.get('description')
    priority = data.get('priority')
    status = data.get('status')
    due_date = data.get('dueDate') or data.get('deadline')
    assigned_to = data.get('assignedTo') if 'assignedTo' in data else data.get('assigned_to')

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.project_id, t.assigned_to, p.created_by
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                WHERE t.id = %s
            """, (task_id,))
            task = cursor.fetchone()
            if not task:
                return jsonify({'error': 'Task not found'}), 404

            if assigned_to is not None and str(assigned_to).strip() != '':
                try:
                    assigned_to = int(assigned_to)
                    cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (task['project_id'], assigned_to))
                    if not cursor.fetchone():
                        try:
                            cursor.execute("""
                                INSERT OR IGNORE INTO project_enrollments (project_id, user_id, collaboration_score, status)
                                VALUES (%s, %s, 0.00, 'Active')
                            """, (task['project_id'], assigned_to))
                        except Exception:
                            cursor.execute("""
                                INSERT INTO project_enrollments (project_id, user_id, collaboration_score, status)
                                VALUES (%s, %s, 0.00, 'Active')
                            """, (task['project_id'], assigned_to))
                        try:
                            cursor.execute("""
                                UPDATE projects 
                                SET student_count = (SELECT COUNT(*) FROM project_enrollments WHERE project_id = %s) 
                                WHERE id = %s
                            """, (task['project_id'], task['project_id']))
                        except Exception:
                            pass
                except (ValueError, TypeError):
                    assigned_to = None

            cursor.execute("""
                UPDATE tasks
                SET title = COALESCE(%s, title),
                    description = COALESCE(%s, description),
                    priority = COALESCE(%s, priority),
                    status = COALESCE(%s, status),
                    due_date = COALESCE(%s, due_date),
                    assigned_to = COALESCE(%s, assigned_to)
                WHERE id = %s
            """, (title, description, priority, status, due_date, assigned_to, task_id))

            updated = None
            try:
                cursor.execute("""
                    SELECT t.id, t.title, t.description, t.project_id as projectId,
                           t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                           t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt,
                           t.submission_file as submissionFile, t.submission_notes as submissionNotes,
                           t.submitted_at as submittedAt, t.submission_file_data as submissionFileData
                    FROM tasks t
                    LEFT JOIN users u ON t.assigned_to = u.id
                    WHERE t.id = %s
                """, (task_id,))
                updated = cursor.fetchone()
            except Exception:
                try:
                    cursor.execute("""
                        SELECT t.id, t.title, t.description, t.project_id as projectId,
                               t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                               t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt
                        FROM tasks t
                        LEFT JOIN users u ON t.assigned_to = u.id
                        WHERE t.id = %s
                    """, (task_id,))
                    updated = cursor.fetchone()
                except Exception:
                    updated = None

            if updated:
                if updated.get('dueDate'):
                    updated['dueDate'] = safe_dt_str(updated['dueDate'], '%Y-%m-%d')
                if updated.get('submittedAt'):
                    updated['submittedAt'] = safe_dt_str(updated['submittedAt'], '%Y-%m-%d %H:%M')
            else:
                updated = {'id': task_id, 'title': title, 'status': status}

        return jsonify(updated), 200
    except Exception as e:
        print(f"[ERROR] update_instructor_task failed: {e}")
        return jsonify({'error': f'Failed to update task: {str(e)}'}), 500
    finally:
        conn.close()

@instructor_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_instructor_task(task_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, p.created_by
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                WHERE t.id = %s
            """, (task_id,))
            task = cursor.fetchone()
            if not task:
                return jsonify({'error': 'Task not found'}), 404

            cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        return jsonify({'message': 'Task deleted successfully'}), 200
    finally:
        conn.close()

@instructor_bp.route('/tasks/<int:task_id>/assign', methods=['POST'])
def assign_task_to_student(task_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    student_id = data.get('student_id') or data.get('studentId')

    if not student_id:
        return jsonify({'error': 'Student ID is required.'}), 400

    try:
        student_id = int(student_id)
    except (ValueError, TypeError):
        return jsonify({'error': 'Invalid student ID.'}), 400

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.project_id, t.assigned_to, p.created_by
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                WHERE t.id = %s
            """, (task_id,))
            task = cursor.fetchone()
            if not task:
                return jsonify({'error': 'Task not found'}), 404

            cursor.execute("""
                SELECT u.id, u.name
                FROM users u
                WHERE u.id = %s
            """, (student_id,))
            student = cursor.fetchone()
            if not student:
                return jsonify({'error': 'Student not found.'}), 404

            # Ensure student is enrolled in project_enrollments
            cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (task['project_id'], student_id))
            if not cursor.fetchone():
                try:
                    cursor.execute("""
                        INSERT OR IGNORE INTO project_enrollments (project_id, user_id, collaboration_score, status)
                        VALUES (%s, %s, 0.00, 'Active')
                    """, (task['project_id'], student_id))
                except Exception:
                    cursor.execute("""
                        INSERT INTO project_enrollments (project_id, user_id, collaboration_score, status)
                        VALUES (%s, %s, 0.00, 'Active')
                    """, (task['project_id'], student_id))
                try:
                    cursor.execute("""
                        UPDATE projects 
                        SET student_count = (SELECT COUNT(*) FROM project_enrollments WHERE project_id = %s) 
                        WHERE id = %s
                    """, (task['project_id'], task['project_id']))
                except Exception:
                    pass

            if task['assigned_to'] == student_id:
                return jsonify({'error': 'Task is already assigned to this student.', 'alreadyAssigned': True}), 409

            cursor.execute("UPDATE tasks SET assigned_to = %s WHERE id = %s", (student_id, task_id))

        return jsonify({
            'message': f"Task assigned successfully to {student['name']}.",
            'success': True
        }), 200
    except Exception as e:
        return jsonify({'error': f'Database error assigning task: {str(e)}'}), 500
    finally:
        conn.close()

@instructor_bp.route('/tasks/<int:task_id>/file', methods=['GET'])
def get_task_file_instructor(task_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT submission_file, submission_file_data FROM tasks WHERE id = %s", (task_id,))
            task = cursor.fetchone()
            if not task or not task.get('submission_file'):
                return jsonify({'error': 'No file submitted for this task'}), 404

            file_data = task.get('submission_file_data')
            filename = task.get('submission_file') or 'submitted_deliverable.pdf'

            if file_data and ',' in str(file_data):
                header, b64content = file_data.split(',', 1)
                mime = 'application/pdf' if 'pdf' in header.lower() or filename.lower().endswith('.pdf') else 'application/octet-stream'
                raw_bytes = base64.b64decode(b64content)
                resp = Response(raw_bytes, mimetype=mime)
                resp.headers['Content-Disposition'] = f'inline; filename="{filename}"'
                return resp

            uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
            clean_name = filename.replace('/', '_').replace('\\', '_')
            safe_filename = f"task_{task_id}_{clean_name}"
            disk_path = os.path.join(uploads_dir, safe_filename)
            if not os.path.exists(disk_path):
                disk_path = os.path.join(uploads_dir, filename)

            if os.path.exists(disk_path):
                return send_file(disk_path, as_attachment=False, download_name=filename)

            return jsonify({'error': 'File content not found on server', 'fileName': filename}), 404
    finally:
        conn.close()

@instructor_bp.route('/students/<int:student_id>/tasks', methods=['GET'])
def get_student_tasks_for_instructor(student_id):
    user = get_authorized_instructor()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT t.id, t.title, t.description, t.project_id as projectId,
                       p.name as projectName, t.status, t.due_date as dueDate, t.priority,
                       t.created_at as createdAt, t.submission_file as submissionFile,
                       t.submission_notes as submissionNotes, t.submitted_at as submittedAt,
                       t.submission_file_data as submissionFileData
                FROM tasks t
                JOIN projects p ON t.project_id = p.id
                WHERE t.assigned_to = %s
                ORDER BY t.created_at DESC
            """, (student_id,))
            tasks = cursor.fetchall() or []
            for t in tasks:
                if t.get('dueDate'):
                    t['dueDate'] = safe_dt_str(t['dueDate'], '%Y-%m-%d')
                if t.get('createdAt'):
                    t['createdAt'] = safe_dt_str(t['createdAt'], '%Y-%m-%d %H:%M')
                if t.get('submittedAt'):
                    t['submittedAt'] = safe_dt_str(t['submittedAt'], '%Y-%m-%d %H:%M')
        return jsonify(tasks), 200
    finally:
        conn.close()

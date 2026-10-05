import datetime
from flask import Blueprint, request, jsonify
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

@instructor_bp.route('/dashboard', methods=['GET'])
def get_dashboard():
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total_projects FROM projects WHERE created_by = %s", (user['id'],))
            projects_count = cursor.fetchone()['total_projects']

            cursor.execute("""
                SELECT COUNT(DISTINCT pe.user_id) as total_students 
                FROM project_enrollments pe
                JOIN projects p ON pe.project_id = p.id
                WHERE p.created_by = %s
            """, (user['id'],))
            students_count = cursor.fetchone()['total_students']

            cursor.execute("""
                SELECT p.*,
                       (SELECT COUNT(DISTINCT pe.user_id) FROM project_enrollments pe WHERE pe.project_id = p.id) as enrolled_students
                FROM projects p
                WHERE p.created_by = %s
                ORDER BY p.created_at DESC
            """, (user['id'],))
            projects = cursor.fetchall()
            for p in projects:
                p['student_count'] = p['enrolled_students']
                if p.get('deadline'):
                    p['deadline'] = safe_dt_str(p['deadline'], '%Y-%m-%d')

        return jsonify({
            'stats': {
                'activeProjects': projects_count,
                'totalStudents': students_count
            },
            'projects': projects
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
                cursor.execute("SELECT * FROM projects WHERE created_by = %s ORDER BY created_at DESC", (user['id'],))
            else:
                cursor.execute("SELECT * FROM projects ORDER BY created_at DESC")
            projects = cursor.fetchall()
            for p in projects:
                if p.get('deadline'):
                    p['deadline'] = safe_dt_str(p['deadline'], '%Y-%m-%d')
        return jsonify(projects), 200
    finally:
        conn.close()

@instructor_bp.route('/projects', methods=['POST'])
def create_project():
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Unauthorized: Only instructors can create projects'}), 401

    data = request.get_json() or {}
    name = data.get('name', '').strip()
    code = data.get('code', '').strip().upper()
    group_name = data.get('groupName', '').strip()
    description = data.get('description', '')
    deadline = data.get('deadline', None)

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

                if group_name:
                    cursor.execute("""
                        INSERT INTO groups (name, project_id, status)
                        VALUES (%s, %s, 'Active')
                    """, (group_name, proj_id))

                cursor.execute("SELECT * FROM projects WHERE id = %s", (proj_id,))
                new_proj = cursor.fetchone()
                if new_proj.get('deadline'):
                    new_proj['deadline'] = safe_dt_str(new_proj['deadline'], '%Y-%m-%d')

            return jsonify(new_proj), 201
        finally:
            conn.close()
    except Exception as e:
        return jsonify({'error': f'Database error creating project: {str(e)}'}), 500

@instructor_bp.route('/projects/<int:project_id>', methods=['PUT'])
def update_project(project_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
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

            cursor.execute("SELECT * FROM projects WHERE id = %s", (project_id,))
            updated = cursor.fetchone()
            if updated.get('deadline'):
                updated['deadline'] = safe_dt_str(updated['deadline'], '%Y-%m-%d')

        return jsonify(updated), 200
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>', methods=['DELETE'])
def delete_project(project_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM projects WHERE id = %s", (project_id,))
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
                       COALESCE(MAX(pe.status), 'Active') as status
                FROM users u
                LEFT JOIN project_enrollments pe ON u.id = pe.user_id
                LEFT JOIN projects p ON pe.project_id = p.id
                LEFT JOIN groups g ON pe.group_id = g.id
                WHERE u.role = 'student'
                  AND u.email NOT LIKE '%test%'
                  AND u.email NOT LIKE '%example%'
                  AND u.name NOT LIKE 'Test %'
                  AND u.name NOT LIKE 'Student %'
                GROUP BY u.id, u.name, u.email, u.student_id, u.avatar
            """)
            students = cursor.fetchall()
            for s in students:
                s['score'] = float(s['score']) if s['score'] is not None else None
        return jsonify(students), 200
    finally:
        conn.close()

@instructor_bp.route('/students/assign', methods=['POST'])
def assign_project():
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Unauthorized: Instructor access required'}), 401

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

            # Case 4: Project belongs to another instructor
            if project['created_by'] != user['id']:
                return jsonify({'error': 'Unauthorized: Project belongs to another instructor.'}), 403

            # Check student existence
            cursor.execute("SELECT id, name FROM users WHERE id = %s AND role = 'student'", (student_id,))
            student = cursor.fetchone()
            if not student:
                return jsonify({'error': 'Student not found.'}), 404

            # Case 2: Check if student is already assigned
            cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (project_id, student_id))
            existing = cursor.fetchone()
            if existing:
                return jsonify({'error': 'Student is already assigned to this project.', 'alreadyAssigned': True}), 409

            # Insert enrollment record with 0.00 initial score
            cursor.execute("""
                INSERT INTO project_enrollments (project_id, user_id, collaboration_score, status)
                VALUES (%s, %s, 0.00, 'Active')
            """, (project_id, student_id))

            # Increment student count in projects table
            cursor.execute("""
                UPDATE projects SET student_count = student_count + 1 WHERE id = %s
            """, (project_id,))

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
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
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
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
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
            cursor.execute("SELECT id, title, description, type, read_status as `read`, created_at as timestamp FROM notifications WHERE user_id = %s ORDER BY created_at DESC", (user['id'],))
            notifs = cursor.fetchall()
            for n in notifs:
                n['timestamp'] = safe_dt_str(n.get('timestamp'), '%Y-%m-%d %H:%M')
        return jsonify(notifs), 200
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>/members', methods=['GET'])
def get_project_members(project_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404
            if project['created_by'] != user['id']:
                return jsonify({'error': 'Unauthorized: Project belongs to another instructor'}), 403

            cursor.execute("""
                SELECT u.id, u.name, u.email, u.student_id as studentId
                FROM users u
                JOIN project_enrollments pe ON u.id = pe.user_id
                WHERE pe.project_id = %s AND u.role = 'student'
            """, (project_id,))
            members = cursor.fetchall()
        return jsonify(members), 200
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>/tasks', methods=['GET'])
def get_project_tasks(project_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
        return jsonify({'error': 'Unauthorized'}), 401

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, created_by FROM projects WHERE id = %s", (project_id,))
            project = cursor.fetchone()
            if not project:
                return jsonify({'error': 'Project not found'}), 404
            if project['created_by'] != user['id']:
                return jsonify({'error': 'Unauthorized: Project belongs to another instructor'}), 403

            cursor.execute("""
                SELECT t.id, t.title, t.description, t.project_id as projectId,
                       t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                       t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.project_id = %s
                ORDER BY t.created_at DESC
            """, (project_id,))
            tasks = cursor.fetchall()
            for t in tasks:
                if t.get('dueDate'):
                    t['dueDate'] = safe_dt_str(t['dueDate'], '%Y-%m-%d')
                if t.get('createdAt'):
                    t['createdAt'] = safe_dt_str(t['createdAt'], '%Y-%m-%d %H:%M')
        return jsonify(tasks), 200
    finally:
        conn.close()

@instructor_bp.route('/projects/<int:project_id>/tasks', methods=['POST'])
def create_project_task(project_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
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
            if project['created_by'] != user['id']:
                return jsonify({'error': 'Unauthorized: Project belongs to another instructor'}), 403

            if assigned_to and str(assigned_to).strip() != '':
                try:
                    assigned_to = int(assigned_to)
                    cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (project_id, assigned_to))
                    if not cursor.fetchone():
                        return jsonify({'error': 'Student is not enrolled in this project.'}), 400
                except (ValueError, TypeError):
                    assigned_to = None
            else:
                assigned_to = None

            cursor.execute("""
                INSERT INTO tasks (title, description, project_id, assigned_to, priority, status, due_date)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, (title, description, project_id, assigned_to, priority, status, due_date if due_date else None))
            task_id = cursor.lastrowid

            cursor.execute("""
                SELECT t.id, t.title, t.description, t.project_id as projectId,
                       t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                       t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.id = %s
            """, (task_id,))
            new_task = cursor.fetchone()
            if new_task.get('dueDate'):
                new_task['dueDate'] = safe_dt_str(new_task['dueDate'], '%Y-%m-%d')

        return jsonify(new_task), 201
    finally:
        conn.close()

@instructor_bp.route('/tasks/<int:task_id>', methods=['PUT'])
def update_instructor_task(task_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
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
            if task['created_by'] != user['id']:
                return jsonify({'error': 'Unauthorized: Project belongs to another instructor'}), 403

            if assigned_to is not None and str(assigned_to).strip() != '':
                try:
                    assigned_to = int(assigned_to)
                    cursor.execute("SELECT id FROM project_enrollments WHERE project_id = %s AND user_id = %s", (task['project_id'], assigned_to))
                    if not cursor.fetchone():
                        return jsonify({'error': 'Student is not enrolled in this project.'}), 400
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

            cursor.execute("""
                SELECT t.id, t.title, t.description, t.project_id as projectId,
                       t.assigned_to as assignedTo, u.name as assignedToName, u.email as assignedToEmail,
                       t.status, t.due_date as dueDate, t.priority, t.created_at as createdAt
                FROM tasks t
                LEFT JOIN users u ON t.assigned_to = u.id
                WHERE t.id = %s
            """, (task_id,))
            updated = cursor.fetchone()
            if updated.get('dueDate'):
                updated['dueDate'] = safe_dt_str(updated['dueDate'], '%Y-%m-%d')

        return jsonify(updated), 200
    finally:
        conn.close()

@instructor_bp.route('/tasks/<int:task_id>', methods=['DELETE'])
def delete_instructor_task(task_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
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
            if task['created_by'] != user['id']:
                return jsonify({'error': 'Unauthorized: Project belongs to another instructor'}), 403

            cursor.execute("DELETE FROM tasks WHERE id = %s", (task_id,))
        return jsonify({'message': 'Task deleted successfully'}), 200
    finally:
        conn.close()

@instructor_bp.route('/tasks/<int:task_id>/assign', methods=['POST'])
def assign_task_to_student(task_id):
    user = get_current_user_from_request()
    if not user or user['role'] != 'instructor':
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
            if task['created_by'] != user['id']:
                return jsonify({'error': 'Unauthorized: Project belongs to another instructor'}), 403

            cursor.execute("""
                SELECT u.id, u.name
                FROM users u
                JOIN project_enrollments pe ON u.id = pe.user_id
                WHERE pe.project_id = %s AND u.id = %s
            """, (task['project_id'], student_id))
            student = cursor.fetchone()
            if not student:
                return jsonify({'error': 'Student is not enrolled in this project.'}), 400

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

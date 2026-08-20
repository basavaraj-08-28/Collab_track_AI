import jwt
import datetime
from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from db import get_db_connection
from config import Config

auth_bp = Blueprint('auth', __name__)

def generate_token(user_id, role):
    payload = {
        'user_id': user_id,
        'role': role,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }
    return jwt.encode(payload, Config.SECRET_KEY, algorithm='HS256')

def get_current_user_from_request():
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return None
    token = auth_header.split(' ')[1]
    try:
        data = jwt.decode(token, Config.SECRET_KEY, algorithms=['HS256'])
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, name, email, role, student_id, instructor_id, title, department, avatar FROM users WHERE id = %s", (data['user_id'],))
            user = cursor.fetchone()
        conn.close()
        return user
    except Exception:
        return None

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'student').lower()
    student_id = data.get('studentId', '')
    department = data.get('department', '')
    title = data.get('title', '')

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    if role not in ['student', 'instructor']:
        role = 'student'

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
                if cursor.fetchone():
                    return jsonify({'error': 'Email is already registered'}), 409

                pwd_hash = generate_password_hash(password)
                inst_id = f"FAC-{datetime.datetime.now().year}-{email[:3].upper()}" if role == 'instructor' else None
                std_id = student_id if student_id else (f"STD-{datetime.datetime.now().year}-{email[:3].upper()}" if role == 'student' else None)

                cursor.execute("""
                    INSERT INTO users (name, email, password_hash, role, student_id, instructor_id, title, department)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (name, email, pwd_hash, role, std_id, inst_id, title, department))
                user_id = cursor.lastrowid

                token = generate_token(user_id, role)
                user_data = {
                    'id': user_id,
                    'name': name,
                    'email': email,
                    'role': role,
                    'studentId': std_id,
                    'instructorId': inst_id,
                    'title': title,
                    'department': department,
                    'avatar': None
                }
                return jsonify({'message': 'User registered successfully', 'token': token, 'user': user_data}), 201
        finally:
            conn.close()
    except Exception as e:
        if 'already registered' in str(e).lower() or 'unique' in str(e).lower():
            return jsonify({'error': 'Email is already registered'}), 409
        return jsonify({'error': f'Registration database error: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    requested_role = data.get('role', None)

    if not email or not password:
        return jsonify({'error': 'Email and password are required'}), 400

    try:
        conn = get_db_connection()
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
                user = cursor.fetchone()

                if not user or not check_password_hash(user['password_hash'], password):
                    return jsonify({'error': 'Invalid credentials'}), 401

                token = generate_token(user['id'], user['role'])
                user_data = {
                    'id': user['id'],
                    'name': user['name'],
                    'email': user['email'],
                    'role': user['role'],
                    'studentId': user['student_id'],
                    'instructorId': user['instructor_id'],
                    'title': user['title'],
                    'department': user['department'],
                    'avatar': user['avatar']
                }
                return jsonify({'message': 'Logged in successfully', 'token': token, 'user': user_data}), 200
        finally:
            conn.close()
    except Exception as e:
        return jsonify({'error': f'Login database error: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
def logout():
    return jsonify({'message': 'Logged out successfully'}), 200

@auth_bp.route('/me', methods=['GET'])
def get_me():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_data = {
        'id': user['id'],
        'name': user['name'],
        'email': user['email'],
        'role': user['role'],
        'studentId': user['student_id'],
        'instructorId': user['instructor_id'],
        'title': user['title'],
        'department': user['department'],
        'avatar': user['avatar']
    }
    return jsonify({'user': user_data}), 200

@auth_bp.route('/profile', methods=['PUT'])
def update_profile():
    user = get_current_user_from_request()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    data = request.get_json() or {}
    name = data.get('name', user['name'])
    title = data.get('title', user['title'])
    department = data.get('department', user['department'])
    student_id = data.get('studentId', user['student_id'])
    instructor_id = data.get('instructorId', user['instructor_id'])

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                UPDATE users 
                SET name = %s, title = %s, department = %s, student_id = %s, instructor_id = %s
                WHERE id = %s
            """, (name, title, department, student_id, instructor_id, user['id']))

            cursor.execute("SELECT id, name, email, role, student_id, instructor_id, title, department, avatar FROM users WHERE id = %s", (user['id'],))
            updated_user = cursor.fetchone()

        user_data = {
            'id': updated_user['id'],
            'name': updated_user['name'],
            'email': updated_user['email'],
            'role': updated_user['role'],
            'studentId': updated_user['student_id'],
            'instructorId': updated_user['instructor_id'],
            'title': updated_user['title'],
            'department': updated_user['department'],
            'avatar': updated_user['avatar']
        }
        return jsonify({'message': 'Profile updated', 'user': user_data}), 200
    finally:
        conn.close()

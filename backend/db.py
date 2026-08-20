import os
import re
import sqlite3
import pymysql
import pymysql.cursors
from config import Config

DB_ENGINE = None  # 'mysql' or 'sqlite'

class SQLiteCursorWrapper:
    def __init__(self, cursor):
        self.cursor = cursor
        self.lastrowid = None

    def execute(self, query, params=None):
        formatted_query = query
        # Remove MySQL-specific syntax keywords for SQLite compatibility
        formatted_query = re.sub(r'ENGINE=InnoDB\s*', '', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'DEFAULT CHARSET=\w+\s*', '', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'CHARACTER SET \w+', '', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'AUTO_INCREMENT', 'AUTOINCREMENT', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'ENUM\([^)]+\)', 'TEXT', formatted_query, flags=re.IGNORECASE)
        
        # Replace MySQL %s placeholders with SQLite ?
        formatted_query = formatted_query.replace('%s', '?')
        
        # Handle ON DUPLICATE KEY UPDATE
        if 'ON DUPLICATE KEY UPDATE' in formatted_query.upper():
            parts = re.split(r'ON DUPLICATE KEY UPDATE', formatted_query, flags=re.IGNORECASE)
            formatted_query = parts[0]
            formatted_query = re.sub(r'^INSERT INTO', 'INSERT OR REPLACE INTO', formatted_query, flags=re.IGNORECASE)

        if params:
            cleaned_params = list(params) if isinstance(params, (tuple, list)) else params
            res = self.cursor.execute(formatted_query, cleaned_params)
        else:
            res = self.cursor.execute(formatted_query)
            
        self.lastrowid = self.cursor.lastrowid
        return res

    def fetchone(self):
        row = self.cursor.fetchone()
        if row is None:
            return None
        return dict(row)

    def fetchall(self):
        rows = self.cursor.fetchall()
        return [dict(r) for r in rows]

    def close(self):
        self.cursor.close()

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

class SQLiteConnWrapper:
    def __init__(self, conn):
        self.conn = conn

    def cursor(self, cursorclass=None):
        return SQLiteCursorWrapper(self.conn.cursor())

    def close(self):
        self.conn.close()

    def commit(self):
        self.conn.commit()

def get_db_connection(use_db=True):
    """Create and return a MySQL connection using PyMySQL, falling back to SQLite if MySQL is unavailable."""
    global DB_ENGINE
    
    # First try MySQL
    try:
        kwargs = {
            'host': Config.MYSQL_HOST,
            'port': Config.MYSQL_PORT,
            'user': Config.MYSQL_USER,
            'password': Config.MYSQL_PASSWORD,
            'autocommit': True,
            'cursorclass': pymysql.cursors.DictCursor,
            'connect_timeout': 3
        }
        if use_db:
            kwargs['database'] = Config.MYSQL_DATABASE

        conn = pymysql.connect(**kwargs)
        DB_ENGINE = 'mysql'
        return conn
    except Exception as mysql_err:
        # Fallback to SQLite database file in backend directory
        DB_ENGINE = 'sqlite'
        db_path = os.path.join(os.path.dirname(__file__), f"{Config.MYSQL_DATABASE}.db")
        sqlite_conn = sqlite3.connect(db_path, check_same_thread=False)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_conn.isolation_level = None  # Autocommit mode
        return SQLiteConnWrapper(sqlite_conn)

def init_db():
    """Ensure database and tables are initialized from schema.sql or SQLite schema."""
    schema_path = os.path.join(os.path.dirname(__file__), 'schema.sql')
    if not os.path.exists(schema_path):
        print("[ERROR] schema.sql file not found.")
        return

    try:
        conn = get_db_connection(use_db=False)
        if DB_ENGINE == 'mysql':
            cursor = conn.cursor()
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{Config.MYSQL_DATABASE}` CHARACTER SET utf8mb4;")
            cursor.execute(f"USE `{Config.MYSQL_DATABASE}`;")
            
            with open(schema_path, 'r', encoding='utf-8') as f:
                sql_script = f.read()

            statements = sql_script.split(';')
            for stmt in statements:
                stmt = stmt.strip()
                if stmt and not stmt.startswith('--'):
                    try:
                        cursor.execute(stmt)
                    except Exception as stmt_err:
                        if 'already exists' not in str(stmt_err).lower():
                            print(f"[WARNING] Statement notice: {stmt_err}")
                            
            cursor.close()
            conn.close()
            print(f"[OK] MySQL Database '{Config.MYSQL_DATABASE}' initialized successfully.")
        else:
            sqlite_db_path = os.path.join(os.path.dirname(__file__), f"{Config.MYSQL_DATABASE}.db")
            conn = sqlite3.connect(sqlite_db_path)
            cursor = conn.cursor()

            cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'student',
                student_id TEXT NULL,
                instructor_id TEXT NULL,
                title TEXT NULL,
                department TEXT NULL,
                avatar TEXT NULL,
                last_seen TIMESTAMP NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            """)
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN last_seen TIMESTAMP NULL;")
            except Exception:
                pass
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                code TEXT NOT NULL UNIQUE,
                description TEXT NULL,
                status TEXT DEFAULT 'Active',
                student_count INTEGER DEFAULT 0,
                deadline DATE NULL,
                created_by INTEGER NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS groups (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                project_id INTEGER NOT NULL,
                avg_score REAL DEFAULT 0.00,
                completion_rate REAL DEFAULT 0.00,
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS group_members (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                group_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (group_id, user_id),
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS project_enrollments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NOT NULL,
                user_id INTEGER NOT NULL,
                group_id INTEGER NULL,
                collaboration_score REAL DEFAULT 0.00,
                grade TEXT DEFAULT 'N/A',
                status TEXT DEFAULT 'Active',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (project_id, user_id),
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NULL,
                project_id INTEGER NOT NULL,
                assigned_to INTEGER NULL,
                priority TEXT DEFAULT 'Medium',
                status TEXT DEFAULT 'Pending',
                due_date DATE NULL,
                score_impact INTEGER DEFAULT 5,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
            );
            """)
            try:
                cursor.execute("ALTER TABLE tasks ADD COLUMN description TEXT;")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'Medium';")
            except Exception:
                pass
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS activities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                project_id INTEGER NULL,
                type TEXT NOT NULL,
                description TEXT NOT NULL,
                score_change INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS discussions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                project_id INTEGER NULL,
                group_id INTEGER NULL,
                sender_id INTEGER NOT NULL,
                message TEXT NOT NULL,
                attachment_url TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
                FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS ai_grading (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                project_id INTEGER NULL,
                score REAL DEFAULT 0.00,
                suggested_grade TEXT DEFAULT 'P',
                narrative TEXT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE (user_id, project_id),
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                generated_by INTEGER NULL,
                file_path TEXT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL
            );
            """)
            cursor.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                type TEXT DEFAULT 'info',
                read_status INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );
            """)
            conn.commit()
            cursor.close()
            conn.close()
            print(f"[OK] Fallback SQLite Database '{Config.MYSQL_DATABASE}.db' initialized successfully.")
    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")

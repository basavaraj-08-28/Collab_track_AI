import os
import re
import json
import sqlite3
from config import Config

DB_ENGINE = 'sqlite'

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

        cleaned_params = list(params) if isinstance(params, (tuple, list)) else params

        # Handle ON DUPLICATE KEY UPDATE -> INSERT OR REPLACE INTO
        if 'ON DUPLICATE KEY UPDATE' in formatted_query.upper():
            parts = re.split(r'ON DUPLICATE KEY UPDATE', formatted_query, flags=re.IGNORECASE)
            placeholders_in_insert = parts[0].count('%s') + parts[0].count('?')
            formatted_query = parts[0]
            formatted_query = re.sub(r'^\s*INSERT INTO', 'INSERT OR REPLACE INTO', formatted_query, flags=re.IGNORECASE)
            if cleaned_params and len(cleaned_params) > placeholders_in_insert:
                cleaned_params = cleaned_params[:placeholders_in_insert]

        # Replace MySQL %s placeholders with SQLite ?
        formatted_query = formatted_query.replace('%s', '?')

        if cleaned_params is not None:
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

class TursoCursorWrapper:
    """Cursor wrapper for Turso / libSQL HTTP pipeline API when hosted SQLite is configured."""
    def __init__(self, db_url, auth_token):
        import requests
        self.requests = requests
        self.db_url = db_url.replace('libsql://', 'https://').rstrip('/')
        self.auth_token = auth_token
        self.lastrowid = None
        self._results = []

    def execute(self, query, params=None):
        formatted_query = query
        formatted_query = re.sub(r'ENGINE=InnoDB\s*', '', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'DEFAULT CHARSET=\w+\s*', '', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'CHARACTER SET \w+', '', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'AUTO_INCREMENT', 'AUTOINCREMENT', formatted_query, flags=re.IGNORECASE)
        formatted_query = re.sub(r'ENUM\([^)]+\)', 'TEXT', formatted_query, flags=re.IGNORECASE)

        cleaned_params = list(params) if isinstance(params, (tuple, list)) else (params or [])
        if 'ON DUPLICATE KEY UPDATE' in formatted_query.upper():
            parts = re.split(r'ON DUPLICATE KEY UPDATE', formatted_query, flags=re.IGNORECASE)
            placeholders_in_insert = parts[0].count('%s') + parts[0].count('?')
            formatted_query = parts[0]
            formatted_query = re.sub(r'^\s*INSERT INTO', 'INSERT OR REPLACE INTO', formatted_query, flags=re.IGNORECASE)
            if cleaned_params and len(cleaned_params) > placeholders_in_insert:
                cleaned_params = cleaned_params[:placeholders_in_insert]

        formatted_query = formatted_query.replace('%s', '?')

        args = []
        for p in cleaned_params:
            if p is None:
                args.append({"type": "null"})
            elif isinstance(p, int):
                args.append({"type": "integer", "value": str(p)})
            elif isinstance(p, float):
                args.append({"type": "float", "value": p})
            else:
                args.append({"type": "text", "value": str(p)})

        payload = {
            "requests": [
                {
                    "type": "execute",
                    "stmt": {
                        "sql": formatted_query,
                        "args": args
                    }
                },
                {"type": "close"}
            ]
        }

        headers = {
            "Authorization": f"Bearer {self.auth_token}",
            "Content-Type": "application/json"
        }

        res = self.requests.post(f"{self.db_url}/v2/pipeline", json=payload, headers=headers, timeout=10)
        res.raise_for_status()
        data = res.json()
        results = data.get("results", [])

        self._results = []
        if results and results[0].get("type") == "ok":
            resp_result = results[0].get("response", {}).get("result", {})
            cols = [c.get("name") for c in resp_result.get("cols", [])]
            rows = resp_result.get("rows", [])
            self.lastrowid = resp_result.get("last_insert_rowid")

            for r in rows:
                row_dict = {}
                for idx, col in enumerate(cols):
                    cell = r[idx]
                    val = cell.get("value") if isinstance(cell, dict) else cell
                    row_dict[col] = val
                self._results.append(row_dict)

        return self

    def fetchone(self):
        if not self._results:
            return None
        return self._results[0]

    def fetchall(self):
        return self._results

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

class TursoConnWrapper:
    def __init__(self, db_url, auth_token):
        self.db_url = db_url
        self.auth_token = auth_token

    def cursor(self, cursorclass=None):
        return TursoCursorWrapper(self.db_url, self.auth_token)

    def close(self):
        pass

    def commit(self):
        pass

def get_db_connection(use_db=True):
    """Create and return a SQLite database connection for Collab Track AI."""
    # Check if hosted Turso SQLite is configured for cloud deployment
    if Config.TURSO_DATABASE_URL and Config.TURSO_AUTH_TOKEN:
        return TursoConnWrapper(Config.TURSO_DATABASE_URL, Config.TURSO_AUTH_TOKEN)

    db_path = Config.DATABASE_PATH
    db_dir = os.path.dirname(db_path)
    if db_dir and not os.path.exists(db_dir):
        os.makedirs(db_dir, exist_ok=True)

    sqlite_conn = sqlite3.connect(db_path, check_same_thread=False, timeout=10.0)
    sqlite_conn.row_factory = sqlite3.Row
    sqlite_conn.isolation_level = None  # Autocommit mode

    try:
        sqlite_conn.execute("PRAGMA journal_mode=WAL;")
        sqlite_conn.execute("PRAGMA foreign_keys=ON;")
    except Exception:
        pass

    return SQLiteConnWrapper(sqlite_conn)

def init_db():
    """Ensure SQLite database and tables are initialized in collab_track_ai.db or hosted Turso."""
    try:
        conn = get_db_connection()
        with conn.cursor() as cursor:
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
            try:
                cursor.execute("ALTER TABLE tasks ADD COLUMN submission_file TEXT;")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE tasks ADD COLUMN submission_notes TEXT;")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE tasks ADD COLUMN submitted_at TIMESTAMP NULL;")
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

        conn.close()
        target_name = Config.TURSO_DATABASE_URL if Config.TURSO_DATABASE_URL else Config.DATABASE_PATH
        print(f"[OK] SQLite Database initialized successfully at '{target_name}'.")
    except Exception as e:
        print(f"[ERROR] Database initialization error: {e}")

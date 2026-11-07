import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from db import init_db

# Import blueprints
from routes.auth import auth_bp
from routes.students import students_bp
from routes.groups import groups_bp
from routes.activities import activities_bp
from routes.analytics import analytics_bp
from routes.instructor import instructor_bp

app = Flask(__name__)
app.config.from_object(Config)

# Enable CORS for all routes
CORS(app, resources={r"/*": {"origins": "*"}})

class VercelPathMiddleware:
    """Ensure WSGI PATH_INFO routes correctly on Vercel serverless functions."""
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get('PATH_INFO', '')

        # If PATH_INFO is literally the entry script name or empty
        if path in ('/api/index.py', '/api/index', '/index.py', '', '/api', '/api/'):
            orig_uri = (
                environ.get('HTTP_X_MATCHED_PATH') or
                environ.get('REQUEST_URI') or
                environ.get('RAW_URI') or
                ''
            )
            if orig_uri and orig_uri not in ('/', '/api', '/api/'):
                path = orig_uri.split('?')[0]

        # Handle cases where path is prefixed with the handler filename:
        # e.g. /api/index.py/auth/login -> /api/auth/login
        if path.startswith('/api/index.py/'):
            path = '/api/' + path[len('/api/index.py/'):]
        elif path.startswith('/api/index/'):
            path = '/api/' + path[len('/api/index/'):]
        elif path.startswith('/index.py/'):
            path = '/api/' + path[len('/index.py/'):]

        # Ensure path begins with /api if it's an API route (e.g. /auth/login -> /api/auth/login)
        if not path.startswith('/api') and path != '/':
            path = '/api' + path

        environ['PATH_INFO'] = path
        return self.wsgi_app(environ, start_response)

app.wsgi_app = VercelPathMiddleware(app.wsgi_app)

# Register blueprints under /api prefix and direct prefix for Vercel compatibility
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(students_bp, url_prefix='/api/student')
app.register_blueprint(groups_bp, url_prefix='/api/groups')
app.register_blueprint(activities_bp, url_prefix='/api/activities')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(instructor_bp, url_prefix='/api/instructor')

app.register_blueprint(auth_bp, url_prefix='/auth', name='auth_alt')
app.register_blueprint(students_bp, url_prefix='/student', name='students_alt')
app.register_blueprint(groups_bp, url_prefix='/groups', name='groups_alt')
app.register_blueprint(activities_bp, url_prefix='/activities', name='activities_alt')
app.register_blueprint(analytics_bp, url_prefix='/analytics', name='analytics_alt')
app.register_blueprint(instructor_bp, url_prefix='/instructor', name='instructor_alt')

# Initialize DB at module load time so tables exist on Vercel cold starts
try:
    init_db()
except Exception as _init_err:
    print(f"[WARN] init_db on import failed: {_init_err}")

@app.route('/api/health', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    from config import Config as _Cfg
    from db import get_db_connection
    db_info = _Cfg.TURSO_DATABASE_URL if _Cfg.TURSO_DATABASE_URL else os.path.basename(_Cfg.DATABASE_PATH)
    counts = {'users': 0, 'projects': 0}
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) as c FROM users;")
            u = cur.fetchone()
            counts['users'] = u.get('c', 0) if isinstance(u, dict) else (u[0] if u else 0)
            cur.execute("SELECT COUNT(*) as c FROM projects;")
            p = cur.fetchone()
            counts['projects'] = p.get('c', 0) if isinstance(p, dict) else (p[0] if p else 0)
        conn.close()
    except Exception as e:
        counts['error'] = str(e)

    return jsonify({
        'status': 'healthy',
        'application': 'Collab Track AI API',
        'database': f"Turso ({db_info})" if _Cfg.TURSO_DATABASE_URL else f"SQLite ({db_info})",
        'records': counts,
        'version': '1.0.0'
    }), 200

@app.errorhandler(404)
def handle_404(e):
    from flask import request
    return jsonify({
        "error": "Not Found",
        "message": f"Endpoint '{request.path}' was not found.",
        "status": 404
    }), 404

@app.errorhandler(500)
def handle_500(e):
    return jsonify({
        "error": "Internal Server Error",
        "message": str(e),
        "status": 500
    }), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"[OK] Collab Track AI Backend Flask Server running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)

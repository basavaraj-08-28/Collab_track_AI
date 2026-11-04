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
        if path.startswith('/api/index.py'):
            environ['PATH_INFO'] = path.replace('/api/index.py', '/api', 1)
        elif path.startswith('/api/index'):
            environ['PATH_INFO'] = path.replace('/api/index', '/api', 1)
        elif not path.startswith('/api') and path != '/':
            environ['PATH_INFO'] = '/api' + path
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
    db_info = _Cfg.TURSO_DATABASE_URL if _Cfg.TURSO_DATABASE_URL else os.path.basename(_Cfg.DATABASE_PATH)
    return jsonify({
        'status': 'healthy',
        'application': 'Collab Track AI API',
        'database': f"Turso ({db_info})" if _Cfg.TURSO_DATABASE_URL else f"SQLite ({db_info})",
        'version': '1.0.0'
    }), 200

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    print(f"[OK] Collab Track AI Backend Flask Server running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)

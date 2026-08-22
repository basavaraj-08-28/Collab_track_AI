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

# Enable CORS for localhost frontend ports
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(students_bp, url_prefix='/api/student')
app.register_blueprint(groups_bp, url_prefix='/api/groups')
app.register_blueprint(activities_bp, url_prefix='/api/activities')
app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
app.register_blueprint(instructor_bp, url_prefix='/api/instructor')

# Initialize DB at module load time so tables exist on Vercel cold starts
try:
    init_db()
except Exception as _init_err:
    print(f"[WARN] init_db on import failed: {_init_err}")

@app.route('/api/health', methods=['GET'])
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

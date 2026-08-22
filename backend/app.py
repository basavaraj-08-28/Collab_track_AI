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

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'application': 'Collab Track AI API',
        'database': f"SQLite ({os.path.basename(Config.DATABASE_PATH)})",
        'version': '1.0.0'
    }), 200

if __name__ == '__main__':
    # Initialize DB tables on startup
    init_db()
    port = int(os.getenv('PORT', 5000))
    print(f"[OK] Collab Track AI Backend Flask Server running on http://localhost:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)

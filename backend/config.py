import os
from dotenv import load_dotenv

# Explicitly load .env from the backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

class Config:
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'localhost')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', 3306))
    MYSQL_USER = os.getenv('MYSQL_USER', 'root')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', '')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'collab_track_ai')
    SECRET_KEY = os.getenv('SECRET_KEY', 'collab_track_ai_super_secret_jwt_key_2026')
    AI_API_KEY = os.getenv('AI_API_KEY', os.getenv('GEMINI_API_KEY', os.getenv('OPENAI_API_KEY', '')))
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', os.getenv('AI_API_KEY', ''))
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

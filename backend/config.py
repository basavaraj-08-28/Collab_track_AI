import os
from dotenv import load_dotenv

# Explicitly load .env from the backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

class Config:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    is_serverless = bool(os.getenv('VERCEL') or os.getenv('AWS_LAMBDA_FUNCTION_NAME'))
    default_db_path = '/tmp/collab_track_ai.db' if is_serverless else os.path.join(BASE_DIR, 'collab_track_ai.db')
    DATABASE_PATH = os.getenv('DATABASE_PATH', default_db_path)
    TURSO_DATABASE_URL = os.getenv('TURSO_DATABASE_URL', os.getenv('DATABASE_URL', ''))
    TURSO_AUTH_TOKEN = os.getenv('TURSO_AUTH_TOKEN', '')
    SECRET_KEY = os.getenv('SECRET_KEY', 'collab_track_ai_super_secret_jwt_key_2026')
    AI_API_KEY = os.getenv('AI_API_KEY', os.getenv('GEMINI_API_KEY', os.getenv('OPENAI_API_KEY', '')))
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', os.getenv('AI_API_KEY', ''))
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

import os
from dotenv import load_dotenv

# Explicitly load .env from the backend directory
env_path = os.path.join(os.path.dirname(__file__), '.env')
load_dotenv(env_path)

class Config:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DATABASE_PATH = os.getenv('DATABASE_PATH', os.path.join(BASE_DIR, 'collab_track_ai.db'))
    SECRET_KEY = os.getenv('SECRET_KEY', 'collab_track_ai_super_secret_jwt_key_2026')
    AI_API_KEY = os.getenv('AI_API_KEY', os.getenv('GEMINI_API_KEY', os.getenv('OPENAI_API_KEY', '')))
    GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', os.getenv('AI_API_KEY', ''))
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '')

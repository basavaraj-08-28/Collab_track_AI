import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
possible_backend_dirs = [
    os.path.abspath(os.path.join(current_dir, '..', 'backend')),
    os.path.abspath(os.path.join(current_dir, 'backend')),
    os.path.abspath(os.path.join(current_dir, '..')),
    current_dir,
]

for b_dir in possible_backend_dirs:
    if os.path.exists(os.path.join(b_dir, 'app.py')) and b_dir not in sys.path:
        sys.path.insert(0, b_dir)
        break

from app import app

# Vercel serverless function entry handler
handler = app

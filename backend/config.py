import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-mediconnect-key-for-dev'
    
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    db_url = os.environ.get('DATABASE_URL') or 'sqlite:///mediconnect.db'
    if db_url.startswith('sqlite:///') and not db_url.startswith('sqlite:////'):
        db_name = db_url.replace('sqlite:///', '')
        db_url = f"sqlite:///{os.path.join(BASE_DIR, 'instance', db_name)}"
        
    SQLALCHEMY_DATABASE_URI = db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    MAX_LOGIN_ATTEMPTS = 3
    LOCKOUT_DURATION_MINUTES = 15

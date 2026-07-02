import os
from datetime import timedelta

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'super-secret-mediconnect-key-for-dev'
    # Defaulting to SQLite for prototype to avoid MySQL connection errors.
    # To use MySQL, set the DATABASE_URL environment variable.
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or 'sqlite:///mediconnect.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    MAX_LOGIN_ATTEMPTS = 4
    LOCKOUT_DURATION_MINUTES = 15

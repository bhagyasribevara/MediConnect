# pyrefly: ignore [unexpected-keyword]
# pyright: reportCallIssue=false
from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone
import random
import string
from models import db, User, Role

auth_bp = Blueprint('auth', __name__)

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role_name = data.get('role')
    phone_number = data.get('phone_number')

    if not username or not password or not role_name:
        return jsonify({'message': 'Missing required fields'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'User already exists'}), 400

    role = Role.query.filter_by(name=role_name).first()
    if not role:
        return jsonify({'message': 'Invalid role'}), 400

    hashed_password = generate_password_hash(password)
    new_user = User(  # type: ignore
        # pyrefly: ignore [unexpected-keyword]
        username=username,
        # pyrefly: ignore [unexpected-keyword]
        password_hash=hashed_password,
        # pyrefly: ignore [unexpected-keyword]
        role_id=role.id,
        # pyrefly: ignore [unexpected-keyword]
        phone_number=phone_number
    )
    
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()
    
    if not user:
        return jsonify({'message': 'Invalid username or password'}), 401

    # Check for lockout
    if user.lockout_until and user.lockout_until.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc):
        return jsonify({'message': 'Account locked out. Try again later.'}), 429

    if check_password_hash(user.password_hash, password):
        # Successful login, reset attempts
        user.failed_login_attempts = 0
        user.lockout_until = None
        db.session.commit()

        token = jwt.encode({
            'user_id': user.id,
            'role': user.role.name,
            'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({'token': token, 'role': user.role.name}), 200
    else:
        # Failed login attempt
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= current_app.config['MAX_LOGIN_ATTEMPTS']:
            user.lockout_until = datetime.now(timezone.utc) + timedelta(minutes=current_app.config['LOCKOUT_DURATION_MINUTES'])
            db.session.commit()
            return jsonify({'message': 'Too many failed attempts. Account locked for 15 minutes.'}), 429
        
        db.session.commit()
        return jsonify({'message': 'Invalid username or password'}), 401

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    username = data.get('username')
    
    user = User.query.filter_by(username=username).first()
    if not user:
        return jsonify({'message': 'If the user exists, an OTP has been sent.'}), 200
        
    if not user.phone_number:
        return jsonify({'message': 'No phone number associated with this account.'}), 400

    otp = generate_otp()
    user.reset_otp = otp
    user.reset_otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.session.commit()

    # In a real app, send OTP via SMS (Twilio/AWS SNS)
    print(f"Mock SMS Sent: Your OTP for MediConnect is {otp}")

    return jsonify({'message': 'If the user exists, an OTP has been sent.'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    username = data.get('username')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    user = User.query.filter_by(username=username).first()
    
    if not user or user.reset_otp != otp:
        return jsonify({'message': 'Invalid OTP or username'}), 400
        
    if user.reset_otp_expires.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
        return jsonify({'message': 'OTP expired'}), 400
        
    user.password_hash = generate_password_hash(new_password)
    user.reset_otp = None
    user.reset_otp_expires = None
    user.failed_login_attempts = 0
    user.lockout_until = None
    db.session.commit()
    
    return jsonify({'message': 'Password reset successfully'}), 200

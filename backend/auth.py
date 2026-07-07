from flask import Blueprint, request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from datetime import datetime, timedelta, timezone
import random
import string
from collections import defaultdict
import threading
import os
import requests
from urllib.parse import urlencode
from models import db, Patient, Doctor, Admin

auth_bp = Blueprint('auth', __name__)

# IP-based lockout storage (cleared on server reload)
ip_failed_attempts = defaultdict(int)
ip_lockout_until = {}
ip_lock = threading.Lock()

def generate_otp(length=6):
    return ''.join(random.choices(string.digits, k=length))

def username_exists(username):
    return (Patient.query.filter_by(username=username).first() is not None or
            Doctor.query.filter_by(username=username).first() is not None or
            Admin.query.filter_by(username=username).first() is not None)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    role_name = data.get('role')
    phone_number = data.get('phone_number')
    email = data.get('email')

    if not username or not password or not role_name:
        return jsonify({'message': 'Missing required fields'}), 400

    if username_exists(username):
        return jsonify({'message': 'User already exists'}), 400

    hashed_password = generate_password_hash(password)
    
    if role_name == 'Patient':
        new_user = Patient(
            username=username,
            password_hash=hashed_password,
            phone_number=phone_number,
            email=email
        )
    elif role_name == 'Doctor':
        new_user = Doctor(
            username=username,
            password_hash=hashed_password,
            phone_number=phone_number,
            email=email,
            department='General Medicine',
            specialization='General Medicine',
            is_on_leave=False
        )
    else:
        return jsonify({'message': 'Registration not allowed for this role'}), 400
        
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully'}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    target_role = data.get('role') # Patient, Doctor, Admin

    if not username or not password or not target_role:
        return jsonify({'message': 'Missing username, password, or role'}), 400

    # 1. IP Lockout Check
    ip = request.remote_addr
    with ip_lock:
        lock_until = ip_lockout_until.get(ip)
        if lock_until:
            lock_until_utc = lock_until.replace(tzinfo=timezone.utc)
            now_utc = datetime.now(timezone.utc)
            if lock_until_utc > now_utc:
                remaining_seconds = int((lock_until_utc - now_utc).total_seconds())
                if remaining_seconds > 60:
                    mins = remaining_seconds // 60
                    secs = remaining_seconds % 60
                    time_str = f"{mins} minutes and {secs} seconds" if secs > 0 else f"{mins} minutes"
                else:
                    time_str = f"{remaining_seconds} seconds"
                return jsonify({
                    'message': f'Too many failed attempts. Please try again after {time_str}.',
                    'remaining_seconds': remaining_seconds
                }), 429

    user = None
    if target_role == 'Patient':
        user = Patient.query.filter_by(username=username).first()
    elif target_role == 'Doctor':
        user = Doctor.query.filter_by(username=username).first()
    elif target_role in ['Admin', 'HospitalAdmin', 'DistrictAdmin', 'SuperAdmin']:
        user = Admin.query.filter_by(username=username).first()
    else:
        return jsonify({'message': 'Invalid role specified'}), 400
    
    if not user:
        with ip_lock:
            ip_failed_attempts[ip] += 1
            if ip_failed_attempts[ip] >= current_app.config['MAX_LOGIN_ATTEMPTS']:
                ip_lockout_until[ip] = datetime.now(timezone.utc) + timedelta(minutes=current_app.config['LOCKOUT_DURATION_MINUTES'])
                ip_failed_attempts[ip] = 0
                remaining_seconds = current_app.config["LOCKOUT_DURATION_MINUTES"] * 60
                return jsonify({
                    'message': f'Too many failed attempts. Account locked. Please try again after {current_app.config["LOCKOUT_DURATION_MINUTES"]} minutes.',
                    'remaining_seconds': remaining_seconds
                }), 429
        return jsonify({'message': 'Invalid username or password'}), 401

    # 2. Username Lockout Check
    if user.lockout_until:
        lockout_until_utc = user.lockout_until.replace(tzinfo=timezone.utc)
        now_utc = datetime.now(timezone.utc)
        if lockout_until_utc > now_utc:
            remaining_seconds = int((lockout_until_utc - now_utc).total_seconds())
            if remaining_seconds > 60:
                mins = remaining_seconds // 60
                secs = remaining_seconds % 60
                time_str = f"{mins} minutes and {secs} seconds" if secs > 0 else f"{mins} minutes"
            else:
                time_str = f"{remaining_seconds} seconds"
            return jsonify({
                'message': f'Account locked due to too many failed attempts. Please try again after {time_str}.',
                'remaining_seconds': remaining_seconds
            }), 429

    if check_password_hash(user.password_hash, password):
        # Successful login, reset attempts
        user.failed_login_attempts = 0
        user.lockout_until = None
        db.session.commit()
        
        with ip_lock:
            ip_failed_attempts[ip] = 0
            ip_lockout_until[ip] = None

        # Build payload role name
        if target_role == 'Patient':
            payload_role = 'Patient'
        elif target_role == 'Doctor':
            payload_role = 'Doctor'
        else:
            payload_role = user.role.name # e.g. HospitalAdmin, DistrictAdmin, SuperAdmin

        token = jwt.encode({
            'user_id': user.id,
            'role': payload_role,
            'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({'token': token, 'role': payload_role}), 200
    else:
        # Failed login attempt
        user.failed_login_attempts += 1
        locked = False
        if user.failed_login_attempts >= current_app.config['MAX_LOGIN_ATTEMPTS']:
            user.lockout_until = datetime.now(timezone.utc) + timedelta(minutes=current_app.config['LOCKOUT_DURATION_MINUTES'])
            locked = True
            
        with ip_lock:
            ip_failed_attempts[ip] += 1
            if ip_failed_attempts[ip] >= current_app.config['MAX_LOGIN_ATTEMPTS']:
                ip_lockout_until[ip] = datetime.now(timezone.utc) + timedelta(minutes=current_app.config['LOCKOUT_DURATION_MINUTES'])
                ip_failed_attempts[ip] = 0
                locked = True
                
        db.session.commit()
        if locked:
            remaining_seconds = current_app.config["LOCKOUT_DURATION_MINUTES"] * 60
            return jsonify({
                'message': f'Too many failed attempts. Account locked. Please try again after {current_app.config["LOCKOUT_DURATION_MINUTES"]} minutes.',
                'remaining_seconds': remaining_seconds
            }), 429
            
        return jsonify({'message': 'Invalid username or password'}), 401

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    username = data.get('username')
    
    user = Patient.query.filter_by(username=username).first() or \
           Doctor.query.filter_by(username=username).first() or \
           Admin.query.filter_by(username=username).first()

    if not user:
        return jsonify({'message': 'If the user exists, an OTP has been sent.'}), 200
        
    if not user.phone_number:
        return jsonify({'message': 'No phone number associated with this account.'}), 400

    otp = generate_otp()
    user.reset_otp = otp
    user.reset_otp_expires = datetime.now(timezone.utc) + timedelta(minutes=10)
    db.session.commit()

    # In a real app, send OTP via SMS
    print(f"Mock SMS Sent: Your OTP for MediConnect is {otp}")

    return jsonify({'message': 'If the user exists, an OTP has been sent.'}), 200

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json()
    username = data.get('username')
    otp = data.get('otp')
    new_password = data.get('new_password')
    
    user = Patient.query.filter_by(username=username).first() or \
           Doctor.query.filter_by(username=username).first() or \
           Admin.query.filter_by(username=username).first()
    
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

@auth_bp.route('/me', methods=['GET'])
def get_current_user():
    token = None
    if 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
        else:
            token = auth_header
            
    if not token:
        return jsonify({'message': 'Token is missing!'}), 401
        
    try:
        data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        role_name = data.get('role')
        user = None
        if role_name == 'Patient':
            user = Patient.query.get(data['user_id'])
        elif role_name == 'Doctor':
            user = Doctor.query.get(data['user_id'])
        elif role_name in ['HospitalAdmin', 'DistrictAdmin', 'SuperAdmin']:
            user = Admin.query.get(data['user_id'])
            
        if not user:
            return jsonify({'message': 'User not found!'}), 404
            
        user_info = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'phone_number': user.phone_number,
            'role': role_name
        }
        
        if role_name == 'Doctor':
            user_info['specialization'] = user.specialization
            user_info['department'] = user.department
            user_info['hospital_id'] = user.hospital_id
        elif role_name == 'Patient':
            user_info['emergency_contact'] = getattr(user, 'emergency_contact', None)
            user_info['blood_group'] = getattr(user, 'blood_group', None)
            
        return jsonify(user_info), 200
        
    except Exception as e:
        return jsonify({'message': 'Token is invalid!'}), 401


@auth_bp.route('/google/login', methods=['GET'])
def google_login():
    from flask import redirect
    role = request.args.get('role', 'Patient')
    if role not in ['Patient', 'Doctor']:
        return jsonify({'message': 'Invalid role specified'}), 400
        
    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    callback_url = os.environ.get('GOOGLE_CALLBACK_URL')
    
    if not client_id or not callback_url:
        return jsonify({'message': 'Google client config missing on backend'}), 500

    params = {
        'client_id': client_id,
        'redirect_uri': callback_url,
        'response_type': 'code',
        'scope': 'openid email profile',
        'state': role,
        'access_type': 'offline',
        'prompt': 'select_account'
    }
    
    auth_url = f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"
    return redirect(auth_url)


@auth_bp.route('/google/callback', methods=['GET'])
def google_callback():
    from flask import redirect
    code = request.args.get('code')
    role = request.args.get('state', 'Patient')

    if not code:
        frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/login?error=no_code_from_google")

    client_id = os.environ.get('GOOGLE_CLIENT_ID')
    client_secret = os.environ.get('GOOGLE_CLIENT_SECRET')
    callback_url = os.environ.get('GOOGLE_CALLBACK_URL')
    frontend_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')

    if not client_id or not client_secret or not callback_url:
        return redirect(f"{frontend_url}/login?error=backend_config_missing")

    try:
        # 1. Exchange authorization code for access token
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': callback_url,
            'grant_type': 'authorization_code'
        }
        token_response = requests.post(token_url, data=token_data)
        if token_response.status_code != 200:
            current_app.logger.error(f"Failed to exchange code: {token_response.text}")
            return redirect(f"{frontend_url}/login?error=token_exchange_failed")

        tokens = token_response.json()
        access_token = tokens.get('access_token')

        if not access_token:
            return redirect(f"{frontend_url}/login?error=no_access_token")

        # 2. Get user info using access token
        userinfo_url = "https://www.googleapis.com/oauth2/v3/userinfo"
        userinfo_headers = {'Authorization': f"Bearer {access_token}"}
        userinfo_response = requests.get(userinfo_url, headers=userinfo_headers)
        if userinfo_response.status_code != 200:
            current_app.logger.error(f"Failed to fetch userinfo: {userinfo_response.text}")
            return redirect(f"{frontend_url}/login?error=fetch_userinfo_failed")

        user_info = userinfo_response.json()
        email = user_info.get('email')
        name = user_info.get('name', 'Google User')
        picture = user_info.get('picture')

        if not email:
            return redirect(f"{frontend_url}/login?error=no_email_provided")

        # 3. Find or Create User based on role
        user = None
        if role == 'Patient':
            user = Patient.query.filter_by(email=email).first()
            if not user:
                # Generate unique username
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while Patient.query.filter_by(username=username).first() or \
                      Doctor.query.filter_by(username=username).first() or \
                      Admin.query.filter_by(username=username).first():
                    username = f"{base_username}{counter}"
                    counter += 1

                # Generate a random password hash since login is managed by Google
                random_pass = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
                hashed_password = generate_password_hash(random_pass)

                user = Patient(
                    username=username,
                    email=email,
                    password_hash=hashed_password,
                    phone_number=None,
                    emergency_contact=None,
                    blood_group=None
                )
                db.session.add(user)
                db.session.commit()

        elif role == 'Doctor':
            user = Doctor.query.filter_by(email=email).first()
            if not user:
                # Generate unique username
                username = email.split('@')[0]
                base_username = username
                counter = 1
                while Patient.query.filter_by(username=username).first() or \
                      Doctor.query.filter_by(username=username).first() or \
                      Admin.query.filter_by(username=username).first():
                    username = f"{base_username}{counter}"
                    counter += 1

                random_pass = ''.join(random.choices(string.ascii_letters + string.digits, k=16))
                hashed_password = generate_password_hash(random_pass)

                user = Doctor(
                    username=username,
                    email=email,
                    password_hash=hashed_password,
                    phone_number=None,
                    specialization='General Medicine',
                    department='General Medicine',
                    is_on_leave=False,
                    profile_photo=picture
                )
                db.session.add(user)
                db.session.commit()
        else:
            return redirect(f"{frontend_url}/login?error=invalid_role")

        # 4. Generate standard JWT token for the authenticated user
        payload_role = role
        token = jwt.encode({
            'user_id': user.id,
            'role': payload_role,
            'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES']
        }, current_app.config['SECRET_KEY'], algorithm='HS256')

        # 5. Redirect to frontend oauth-callback component
        return redirect(f"{frontend_url}/oauth-callback?token={token}&role={payload_role}")

    except Exception as e:
        current_app.logger.error(f"Google Callback Exception: {str(e)}")
        return redirect(f"{frontend_url}/login?error=internal_server_error")


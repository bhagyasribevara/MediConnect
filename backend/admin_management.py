# pyrefly: ignore [missing-import, unexpected-keyword]
# pyright: ignore[reportMissingImports, reportCallIssue]
from flask import Blueprint, request, jsonify, current_app
from models import db, Patient, Doctor, Admin, Hospital, DoctorShift, ShiftQueue, LeaveRequest, DoctorAttendance, DistrictAdminProfile, District  # type: ignore
from dashboard import token_required  # type: ignore
from werkzeug.security import generate_password_hash
from datetime import datetime, date

admin_management_bp = Blueprint('admin_management', __name__)

@admin_management_bp.route('/doctors', methods=['GET'])
@token_required
def get_doctors(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    # For prototype, returning all doctors. In real scenario, filter by admin's hospital
    doctors = Doctor.query.all()
    result = []
    for d in doctors:
        result.append({
            'id': d.id,
            'user_id': d.user_id,
            'name': d.user.username,
            'email': d.user.email,
            'department': d.department,
            'hospital_id': d.hospital_id,
            'hospital_name': d.hospital.name if d.hospital else None,
            'is_on_leave': d.is_on_leave,
        })
    return jsonify(result), 200

@admin_management_bp.route('/doctors', methods=['POST'])
@token_required
def add_doctor(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    department = data.get('department')
    hospital_id = data.get('hospital_id')
    
    if not all([username, password, department, hospital_id]):
        return jsonify({'error': 'Missing required fields (username, password, department, hospital_id)'}), 400
        
    from auth import username_exists
    if username_exists(username):
        return jsonify({'error': 'Username already exists'}), 400
        
    new_doctor = Doctor(
        username=username,
        email=email,
        password_hash=generate_password_hash(password),
        hospital_id=hospital_id,
        department=department,
        specialization=department
    )
    db.session.add(new_doctor)
    db.session.commit()
    
    return jsonify({'message': 'Doctor added successfully', 'doctor_id': new_doctor.id}), 201

@admin_management_bp.route('/doctors/<int:doctor_id>', methods=['PUT'])
@token_required
def edit_doctor(current_user, doctor_id):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    data = request.get_json()
    if 'department' in data:
        doctor.department = data['department']
    if 'is_on_leave' in data:
        doctor.is_on_leave = data['is_on_leave']
        
    db.session.commit()
    return jsonify({'message': 'Doctor updated successfully'}), 200

@admin_management_bp.route('/doctors/<int:doctor_id>/transfer', methods=['PUT'])
@token_required
def transfer_doctor(current_user, doctor_id):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    data = request.get_json()
    new_hospital_id = data.get('hospital_id')
    if not new_hospital_id:
        return jsonify({'error': 'Target hospital ID required'}), 400
        
    doctor.hospital_id = new_hospital_id
    db.session.commit()
    
    return jsonify({'message': 'Doctor transferred successfully'}), 200

@admin_management_bp.route('/doctors/<int:doctor_id>', methods=['DELETE'])
@token_required
def delete_doctor(current_user, doctor_id):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    # Soft delete the user
    if doctor.user:
        doctor.user.soft_delete = True
        
    db.session.commit()
    return jsonify({'message': 'Doctor removed successfully'}), 200

@admin_management_bp.route('/doctors/<int:doctor_id>/shifts', methods=['POST'])
@token_required
def add_doctor_shift(current_user, doctor_id):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    data = request.get_json()
    shift_date_str = data.get('shift_date', date.today().strftime('%Y-%m-%d'))
    shift_date = datetime.strptime(shift_date_str, '%Y-%m-%d').date()
    
    new_shift = DoctorShift(  
        # type: ignore
        doctor_id=doctor.id,
        # type: ignore
        shift_date=shift_date,
        # type: ignore
        start_time=data.get('start_time', '09:00'),
        # type: ignore
        end_time=data.get('end_time', '17:00'),
        # type: ignore
        max_appointments=data.get('max_appointments', 20),
        # type: ignore
        is_active=True
    )
    db.session.add(new_shift)
    db.session.commit()
    return jsonify({'message': 'Shift added', 'shift_id': new_shift.id}), 201

@admin_management_bp.route('/attendance/<int:attendance_id>', methods=['PUT'])
@token_required
def update_attendance(current_user, attendance_id):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    attendance = DoctorAttendance.query.get(attendance_id)
    if not attendance:
        return jsonify({'error': 'Attendance record not found'}), 404
        
    data = request.get_json()
    if 'status' in data:
        attendance.status = data['status']  # Present, Absent, On_Leave, Half_Day
        
    db.session.commit()
    return jsonify({'message': 'Attendance updated successfully'}), 200

# ═══════════════════════════════════════════════════════════════════════════
# Super Admin Endpoints
# ═══════════════════════════════════════════════════════════════════════════

@admin_management_bp.route('/district-admins', methods=['GET'])
@token_required
def get_district_admins(current_user):
    if current_user.role.name != 'SuperAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    admins = DistrictAdminProfile.query.all()
    result = []
    for admin in admins:
        result.append({
            'id': admin.id,
            'user_id': admin.user_id,
            'username': admin.user.username,
            'email': admin.user.email,
            'phone_number': admin.user.phone_number,
            'district_id': admin.district_id,
            'district_name': admin.district.name if admin.district else None,
            'status': 'Active' if not admin.user.soft_delete else 'Inactive'
        })
    return jsonify(result), 200

@admin_management_bp.route('/district-admins', methods=['POST'])
@token_required
def add_district_admin(current_user):
    if current_user.role.name != 'SuperAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    username = data.get('username')
    email = data.get('email')
    password = data.get('password')
    phone_number = data.get('phone_number')
    district_id = data.get('district_id')
    
    if not all([username, password, district_id]):
        return jsonify({'error': 'Missing required fields (username, password, district_id)'}), 400
        
    from auth import username_exists
    if username_exists(username):
        return jsonify({'error': 'Username already exists'}), 400
        
    # Verify district exists
    district = District.query.get(district_id)
    if not district:
        return jsonify({'error': 'District not found'}), 404
        
    new_admin_user = Admin(
        username=username,
        email=email,
        phone_number=phone_number,
        password_hash=generate_password_hash(password),
        role_level='District',
        district_id=district_id
    )
    db.session.add(new_admin_user)
    db.session.commit()
    
    new_admin = DistrictAdminProfile(
        user_id=new_admin_user.id,
        district_id=district_id
    )
    db.session.add(new_admin)
    db.session.commit()
    
    return jsonify({'message': 'District Admin added successfully', 'admin_id': new_admin.id}), 201

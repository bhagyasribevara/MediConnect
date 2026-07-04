# pyrefly: ignore [missing-import, unexpected-keyword]
# pyright: ignore[reportMissingImports, reportCallIssue]
from flask import Blueprint, request, jsonify, current_app
from models import db, User, Role, Doctor, Hospital, DoctorShift, ShiftQueue, LeaveRequest, DoctorAttendance
from dashboard import token_required
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
        
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Username already exists'}), 400
        
    role = Role.query.filter_by(name='Doctor').first()
    if not role:
        return jsonify({'error': 'Doctor role not found'}), 500
        
    new_user = User(
        # type: ignore
        username=username,
        # type: ignore
        email=email,
        # type: ignore
        password_hash=generate_password_hash(password),
        # type: ignore
        role_id=role.id
    )
    db.session.add(new_user)
    db.session.commit()
    
    new_doctor = Doctor(
        # type: ignore
        user_id=new_user.id,
        # type: ignore
        hospital_id=hospital_id,
        # type: ignore
        department=department
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

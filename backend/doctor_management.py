# pyrefly: ignore [missing-import, unexpected-keyword]
# pyright: ignore[reportMissingImports, reportCallIssue]
import os
from datetime import datetime, timezone, date
from flask import Blueprint, request, jsonify, send_from_directory, current_app
from werkzeug.utils import secure_filename
from models import db, Doctor, DoctorShift, ShiftQueue, LeaveRequest, DoctorAttendance
from dashboard import token_required

doctor_mgmt_bp = Blueprint('doctor_mgmt', __name__)

UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads', 'photos')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ─── SHIFTS ──────────────────────────────────────────────────────────────

@doctor_mgmt_bp.route('/shifts', methods=['GET'])
@token_required
def get_shifts(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    query_date = request.args.get('date')
    if query_date:
        target_date = datetime.strptime(query_date, '%Y-%m-%d').date()
    else:
        target_date = date.today()
    
    shifts = DoctorShift.query.filter_by(doctor_id=doctor.id, shift_date=target_date).order_by(DoctorShift.start_time).all()
    
    result = []
    for s in shifts:
        queue_count = ShiftQueue.query.filter_by(shift_id=s.id).filter(ShiftQueue.status.in_(['Waiting', 'In_Consultation'])).count()
        completed_count = ShiftQueue.query.filter_by(shift_id=s.id, status='Completed').count()
        result.append({
            'id': s.id,
            'shift_date': s.shift_date.strftime('%Y-%m-%d'),
            'start_time': s.start_time,
            'end_time': s.end_time,
            'max_appointments': s.max_appointments,
            'is_active': s.is_active,
            'current_queue': queue_count,
            'completed': completed_count
        })
    
    return jsonify(result), 200


@doctor_mgmt_bp.route('/shifts', methods=['POST'])
@token_required
def create_shift(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    data = request.get_json()
    shift_date_str = data.get('shift_date', date.today().strftime('%Y-%m-%d'))
    shift_date = datetime.strptime(shift_date_str, '%Y-%m-%d').date()
    
    # Check if doctor is on leave for that date
    leave = LeaveRequest.query.filter_by(doctor_id=doctor.id, leave_date=shift_date, status='Approved').first()
    if leave:
        return jsonify({'error': 'Cannot create shift — you are on approved leave for this date'}), 400
    
    new_shift = DoctorShift(
        #type = ignore
        doctor_id=doctor.id,
        shift_date=shift_date,
        start_time=data.get('start_time', '09:00'),
        end_time=data.get('end_time', '10:00'),
        max_appointments=data.get('max_appointments', 10),
        is_active=True
    )
    db.session.add(new_shift)
    db.session.commit()
    
    return jsonify({'message': 'Shift created', 'id': new_shift.id}), 201


@doctor_mgmt_bp.route('/shifts/<int:shift_id>', methods=['PUT'])
@token_required
def update_shift(current_user, shift_id):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    shift = DoctorShift.query.filter_by(id=shift_id, doctor_id=doctor.id).first()
    if not shift:
        return jsonify({'error': 'Shift not found'}), 404
    
    data = request.get_json()
    if 'start_time' in data:
        shift.start_time = data['start_time']
    if 'end_time' in data:
        shift.end_time = data['end_time']
    if 'max_appointments' in data:
        shift.max_appointments = data['max_appointments']
    if 'is_active' in data:
        shift.is_active = data['is_active']
    
    db.session.commit()
    return jsonify({'message': 'Shift updated'}), 200


@doctor_mgmt_bp.route('/shifts/<int:shift_id>', methods=['DELETE'])
@token_required
def delete_shift(current_user, shift_id):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    shift = DoctorShift.query.filter_by(id=shift_id, doctor_id=doctor.id).first()
    if not shift:
        return jsonify({'error': 'Shift not found'}), 404
    
    # Delete queue entries first
    ShiftQueue.query.filter_by(shift_id=shift.id).delete()
    db.session.delete(shift)
    db.session.commit()
    
    return jsonify({'message': 'Shift deleted'}), 200


# ─── LIVE QUEUE ──────────────────────────────────────────────────────────

@doctor_mgmt_bp.route('/shifts/<int:shift_id>/queue', methods=['GET'])
@token_required
def get_queue(current_user, shift_id):
    shift = DoctorShift.query.get(shift_id)
    if not shift:
        return jsonify({'error': 'Shift not found'}), 404
    
    entries = ShiftQueue.query.filter_by(shift_id=shift_id).order_by(ShiftQueue.token_number).all()
    
    return jsonify([{
        'id': e.id,
        'token_number': e.token_number,
        'patient_name': e.patient_name,
        'status': e.status,
        'booked_at': e.booked_at.strftime('%Y-%m-%d %H:%M') if e.booked_at else None
    } for e in entries]), 200


@doctor_mgmt_bp.route('/shifts/<int:shift_id>/queue/add', methods=['POST'])
@token_required
def add_to_queue(current_user, shift_id):
    shift = DoctorShift.query.get(shift_id)
    if not shift:
        return jsonify({'error': 'Shift not found'}), 404
    
    if not shift.is_active:
        return jsonify({'error': 'This shift is disabled (doctor may be on leave)'}), 400
    
    active_count = ShiftQueue.query.filter_by(shift_id=shift_id).filter(
        ShiftQueue.status.in_(['Waiting', 'In_Consultation'])
    ).count()
    
    if active_count >= shift.max_appointments:
        return jsonify({'error': f'Shift is full. Maximum {shift.max_appointments} appointments allowed.'}), 400
    
    data = request.get_json()
    last_token = db.session.query(db.func.max(ShiftQueue.token_number)).filter_by(shift_id=shift_id).scalar() or 0
    
    entry = ShiftQueue(
        shift_id=shift_id,
        patient_name=data.get('patient_name', 'Walk-in Patient'),
        patient_id=data.get('patient_id'),
        token_number=last_token + 1,
        status='Waiting'
    )
    db.session.add(entry)
    db.session.commit()
    
    return jsonify({'message': 'Patient added to queue', 'token_number': entry.token_number}), 201


@doctor_mgmt_bp.route('/shifts/<int:shift_id>/queue/next', methods=['POST'])
@token_required
def call_next(current_user, shift_id):
    # Complete current in-consultation patient
    current = ShiftQueue.query.filter_by(shift_id=shift_id, status='In_Consultation').first()
    if current:
        current.status = 'Completed'
    
    # Get next waiting patient
    next_patient = ShiftQueue.query.filter_by(shift_id=shift_id, status='Waiting').order_by(ShiftQueue.token_number).first()
    if next_patient:
        next_patient.status = 'In_Consultation'
        db.session.commit()
        return jsonify({
            'message': f'Calling Token #{next_patient.token_number}: {next_patient.patient_name}',
            'token_number': next_patient.token_number,
            'patient_name': next_patient.patient_name
        }), 200
    
    db.session.commit()
    return jsonify({'message': 'No more patients in queue'}), 200


# ─── PROFILE PHOTO ───────────────────────────────────────────────────────

@doctor_mgmt_bp.route('/profile/photo', methods=['POST'])
@token_required
def upload_photo(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    if 'photo' not in request.files:
        return jsonify({'error': 'No photo file provided'}), 400
    
    file = request.files['photo']
    filename = file.filename
    if not filename:
        return jsonify({'error': 'No file selected'}), 400
    
    if file and allowed_file(filename):
        # Ensure upload directory exists
        os.makedirs(UPLOAD_FOLDER, exist_ok=True)
        
        secure_name = f"doctor_{doctor.id}_{secure_filename(filename)}"
        filepath = os.path.join(UPLOAD_FOLDER, secure_name)
        file.save(filepath)
        
        doctor.profile_photo = secure_name
        db.session.commit()
        
        return jsonify({'message': 'Photo uploaded', 'filename': secure_name}), 200
    
    return jsonify({'error': 'File type not allowed'}), 400


@doctor_mgmt_bp.route('/profile/photo/<int:doctor_id>', methods=['GET'])
def get_photo(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    if not doctor or not doctor.profile_photo:
        return jsonify({'error': 'No photo found'}), 404
    
    return send_from_directory(UPLOAD_FOLDER, doctor.profile_photo)


@doctor_mgmt_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    return jsonify({
        'id': doctor.id,
        'username': current_user.username,
        'department': doctor.department,
        'hospital': doctor.hospital.name if doctor.hospital else None,
        'is_on_leave': doctor.is_on_leave,
        'profile_photo': doctor.profile_photo,
        'photo_url': f'/api/doctor/profile/photo/{doctor.id}' if doctor.profile_photo else None
    }), 200


# ─── ATTENDANCE ──────────────────────────────────────────────────────────

@doctor_mgmt_bp.route('/attendance/punch-in', methods=['POST'])
@token_required
def punch_in(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    today = date.today()
    
    # Check for approved leave
    leave = LeaveRequest.query.filter_by(doctor_id=doctor.id, leave_date=today, status='Approved').first()
    if leave:
        return jsonify({'error': 'You are on approved leave today. Cannot punch in.'}), 400
    
    existing = DoctorAttendance.query.filter_by(doctor_id=doctor.id, date=today).first()
    if existing and existing.punch_in:
        return jsonify({'error': 'Already punched in today', 'punch_in': existing.punch_in.strftime('%H:%M')}), 400
    
    if not existing:
        existing = DoctorAttendance(
            doctor_id=doctor.id,
            date=today,
            punch_in=datetime.now(timezone.utc),
            status='Present'
        )
        db.session.add(existing)
    else:
        existing.punch_in = datetime.now(timezone.utc)
        existing.status = 'Present'
    
    db.session.commit()
    return jsonify({'message': 'Punched in successfully', 'punch_in': existing.punch_in.strftime('%H:%M')}), 200


@doctor_mgmt_bp.route('/attendance/punch-out', methods=['POST'])
@token_required
def punch_out(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    today = date.today()
    existing = DoctorAttendance.query.filter_by(doctor_id=doctor.id, date=today).first()
    
    if not existing or not existing.punch_in:
        return jsonify({'error': 'Cannot punch out without punching in first'}), 400
    
    if existing.punch_out:
        return jsonify({'error': 'Already punched out today'}), 400
    
    existing.punch_out = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({'message': 'Punched out successfully', 'punch_out': existing.punch_out.strftime('%H:%M')}), 200


@doctor_mgmt_bp.route('/attendance', methods=['GET'])
@token_required
def get_attendance(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    records = DoctorAttendance.query.filter_by(doctor_id=doctor.id).order_by(DoctorAttendance.date.desc()).limit(30).all()
    
    return jsonify([{
        'id': r.id,
        'date': r.date.strftime('%Y-%m-%d'),
        'punch_in': r.punch_in.strftime('%H:%M') if r.punch_in else None,
        'punch_out': r.punch_out.strftime('%H:%M') if r.punch_out else None,
        'status': r.status
    } for r in records]), 200


@doctor_mgmt_bp.route('/attendance/today', methods=['GET'])
@token_required
def get_today_attendance(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    today = date.today()
    record = DoctorAttendance.query.filter_by(doctor_id=doctor.id, date=today).first()
    
    if not record:
        return jsonify({'status': 'Not_Punched', 'punch_in': None, 'punch_out': None}), 200
    
    return jsonify({
        'status': record.status,
        'punch_in': record.punch_in.strftime('%H:%M') if record.punch_in else None,
        'punch_out': record.punch_out.strftime('%H:%M') if record.punch_out else None
    }), 200


# ─── LEAVE REQUESTS ─────────────────────────────────────────────────────

@doctor_mgmt_bp.route('/leave', methods=['POST'])
@token_required
def submit_leave(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    data = request.get_json()
    leave_date = datetime.strptime(data['leave_date'], '%Y-%m-%d').date()
    
    # Check for duplicate
    existing = LeaveRequest.query.filter_by(doctor_id=doctor.id, leave_date=leave_date).filter(
        LeaveRequest.status.in_(['Pending', 'Approved'])
    ).first()
    if existing:
        return jsonify({'error': 'Leave request already exists for this date'}), 400
    
    leave = LeaveRequest(
        doctor_id=doctor.id,
        leave_date=leave_date,
        reason=data.get('reason', 'Personal'),
        status='Pending'
    )
    db.session.add(leave)
    db.session.commit()
    
    return jsonify({'message': 'Leave request submitted', 'id': leave.id}), 201


@doctor_mgmt_bp.route('/leave', methods=['GET'])
@token_required
def get_leaves(current_user):
    doctor = current_user if current_user.role.name == 'Doctor' else None
    if not doctor:
        return jsonify({'error': 'Doctor profile not found'}), 404
    
    leaves = LeaveRequest.query.filter_by(doctor_id=doctor.id).order_by(LeaveRequest.leave_date.desc()).all()
    
    return jsonify([{
        'id': l.id,
        'leave_date': l.leave_date.strftime('%Y-%m-%d'),
        'reason': l.reason,
        'status': l.status,
        'created_at': l.created_at.strftime('%Y-%m-%d %H:%M') if l.created_at else None
    } for l in leaves]), 200


# ─── DOCTOR AVAILABILITY (for patient app) ───────────────────────────────

@doctor_mgmt_bp.route('/availability/<int:doctor_id>', methods=['GET'])
def check_availability(doctor_id):
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
    
    today = date.today()
    leave = LeaveRequest.query.filter_by(doctor_id=doctor.id, leave_date=today, status='Approved').first()
    
    if doctor.is_on_leave or leave:
        return jsonify({
            'available': False,
            'message': f'Dr. {doctor.user.username} is on leave today. Please come back tomorrow or choose another doctor.',
            'is_on_leave': True
        }), 200
    
    # Get today's active shifts with capacity
    shifts = DoctorShift.query.filter_by(doctor_id=doctor.id, shift_date=today, is_active=True).all()
    available_shifts = []
    for s in shifts:
        booked = ShiftQueue.query.filter_by(shift_id=s.id).filter(
            ShiftQueue.status.in_(['Waiting', 'In_Consultation'])
        ).count()
        if booked < s.max_appointments:
            available_shifts.append({
                'shift_id': s.id,
                'start_time': s.start_time,
                'end_time': s.end_time,
                'slots_available': s.max_appointments - booked
            })
    
    return jsonify({
        'available': True,
        'is_on_leave': False,
        'shifts': available_shifts
    }), 200

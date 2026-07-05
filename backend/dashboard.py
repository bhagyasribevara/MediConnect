from flask import Blueprint, jsonify, request, current_app
from functools import wraps
import jwt
from models import db, User, Role, Hospital, Bed, Doctor, LeaveRequest, DoctorShift, DoctorAttendance, ShiftQueue, PatientRecord, DistrictAdminProfile, District
from datetime import date

dashboard_bp = Blueprint('dashboard', __name__)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
            
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
            
        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])
            if not current_user:
                raise Exception("User not found")
        except Exception as e:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    return decorated

@dashboard_bp.route('/patient', methods=['GET'])
@token_required
def patient_dashboard(current_user):
    if current_user.role.name != 'Patient':
        return jsonify({'message': 'Unauthorized'}), 403
        
    return jsonify({
        'metrics': {
            'appointments': 2,
            'prescriptions': 5,
            'recent_activity': 'Booked General Consultation'
        }
    }), 200

@dashboard_bp.route('/doctor', methods=['GET'])
@token_required
def doctor_dashboard(current_user):
    if current_user.role.name != 'Doctor':
        return jsonify({'message': 'Unauthorized'}), 403
        
    return jsonify({
        'metrics': {
            'todays_appointments': 8,
            'pending_reports': 3,
            'ai_insights': 'High number of seasonal flu cases detected.'
        }
    }), 200

@dashboard_bp.route('/hospitaladmin', methods=['GET'])
@token_required
def hospitaladmin_dashboard(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    # Get total beds count as a demo metric
    total_beds = Bed.query.count()
    available_beds = Bed.query.filter_by(status='Available').count()
    
    return jsonify({
        'metrics': {
            'total_beds': total_beds,
            'available_beds': available_beds,
            'staff_on_duty': 42,
            'inventory_alerts': 2
        }
    }), 200

@dashboard_bp.route('/districtadmin', methods=['GET'])
@token_required
def districtadmin_dashboard(current_user):
    if current_user.role.name != 'DistrictAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    from models import DistrictAdminProfile
    profile = DistrictAdminProfile.query.filter_by(user_id=current_user.id).first()
    district_id = profile.district_id if profile else None
    
    if not district_id:
        return jsonify({'error': 'District not assigned to this admin'}), 400

    hospitals = Hospital.query.filter_by(district_id=district_id).all()
    hospital_ids = [h.id for h in hospitals]
    
    total_hospitals = len(hospitals)
    total_district_beds = Bed.query.filter(Bed.hospital_id.in_(hospital_ids)).count() if hospital_ids else 0
    available_beds = Bed.query.filter(Bed.hospital_id.in_(hospital_ids), Bed.status == 'Available').count() if hospital_ids else 0
    
    hospitals_data = []
    for h in hospitals:
        h_beds_total = Bed.query.filter_by(hospital_id=h.id).count()
        h_beds_avail = Bed.query.filter_by(hospital_id=h.id, status='Available').count()
        hospitals_data.append({
            'id': h.id,
            'name': h.name,
            'type': h.hospital_type,
            'total_beds': h_beds_total,
            'available_beds': h_beds_avail
        })
        
    return jsonify({
        'metrics': {
            'district_name': profile.district.name if profile.district else 'Unknown',
            'total_hospitals': total_hospitals,
            'total_district_beds': total_district_beds,
            'available_beds': available_beds,
            'active_outbreaks': 0,
            'resource_recommendations': 'Transfer 50 units of Paracetamol from PHC-1 to City Hospital.',
            'hospitals_list': hospitals_data
        }
    }), 200

@dashboard_bp.route('/superadmin', methods=['GET'])
@token_required
def superadmin_dashboard(current_user):
    print("DEBUG SUPERADMIN ROUTE:", current_user.username, "Role:", current_user.role.name if current_user.role else "None")
    if current_user.role.name != 'SuperAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
        
    total_users = User.query.count()
    
    return jsonify({
        'metrics': {
            'total_users': total_users,
            'system_health': '99.9% Uptime',
            'ai_model_status': 'Online'
        }
    }), 200


# ─── HOSPITAL ADMIN: LEAVE REQUEST MANAGEMENT ────────────────────────────

@dashboard_bp.route('/hospitaladmin/leave-requests', methods=['GET'])
@token_required
def get_leave_requests(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    status_filter = request.args.get('status', None)
    query = LeaveRequest.query.join(Doctor).join(User, Doctor.user_id == User.id)
    
    if status_filter:
        query = query.filter(LeaveRequest.status == status_filter)
    
    leaves = query.order_by(LeaveRequest.created_at.desc()).all()
    
    return jsonify([{
        'id': l.id,
        'doctor_id': l.doctor_id,
        'doctor_name': l.doctor.user.username if l.doctor and l.doctor.user else 'Unknown',
        'department': l.doctor.department if l.doctor else 'N/A',
        'leave_date': l.leave_date.strftime('%Y-%m-%d'),
        'reason': l.reason,
        'status': l.status,
        'created_at': l.created_at.strftime('%Y-%m-%d %H:%M') if l.created_at else None
    } for l in leaves]), 200


@dashboard_bp.route('/hospitaladmin/leave-requests/<int:leave_id>', methods=['PUT'])
@token_required
def handle_leave_request(current_user, leave_id):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    leave = LeaveRequest.query.get(leave_id)
    if not leave:
        return jsonify({'error': 'Leave request not found'}), 404
    
    data = request.get_json()
    action = data.get('action')  # 'approve' or 'reject'
    
    if action == 'approve':
        leave.status = 'Approved'
        leave.approved_by = current_user.id
        
        # Set doctor on leave and disable shifts for that date
        doctor = Doctor.query.get(leave.doctor_id)
        if doctor:
            # If leave is for today, set is_on_leave
            if leave.leave_date == date.today():
                doctor.is_on_leave = True
            
            # Disable all shifts for that date
            shifts = DoctorShift.query.filter_by(doctor_id=doctor.id, shift_date=leave.leave_date).all()
            for shift in shifts:
                shift.is_active = False
            
            # Mark attendance as On_Leave
            attendance = DoctorAttendance.query.filter_by(doctor_id=doctor.id, date=leave.leave_date).first()
            if not attendance:
                attendance = DoctorAttendance(
                    doctor_id=doctor.id,  # type: ignore
                    date=leave.leave_date,  # type: ignore
                    status='On_Leave'  # type: ignore
                )
                db.session.add(attendance)
            else:
                attendance.status = 'On_Leave'
        
        db.session.commit()
        return jsonify({'message': 'Leave request approved. Doctor shifts disabled for the date.'}), 200
    
    elif action == 'reject':
        leave.status = 'Rejected'
        leave.approved_by = current_user.id
        db.session.commit()
        return jsonify({'message': 'Leave request rejected.'}), 200
    
    return jsonify({'error': 'Invalid action. Use "approve" or "reject".'}), 400


@dashboard_bp.route('/hospitaladmin/doctor-attendance', methods=['GET'])
@token_required
def get_all_doctor_attendance(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
    
    today = date.today()
    doctors = Doctor.query.all()
    
    result = []
    for doc in doctors:
        attendance = DoctorAttendance.query.filter_by(doctor_id=doc.id, date=today).first()
        result.append({
            'doctor_id': doc.id,
            'doctor_name': doc.user.username if doc.user else 'Unknown',
            'department': doc.department,
            'photo_url': f'/api/doctor/profile/photo/{doc.id}' if doc.profile_photo else None,
            'is_on_leave': doc.is_on_leave,
            'status': attendance.status if attendance else 'Absent',
            'punch_in': attendance.punch_in.strftime('%H:%M') if attendance and attendance.punch_in else None,
            'punch_out': attendance.punch_out.strftime('%H:%M') if attendance and attendance.punch_out else None
        })
    
    return jsonify(result), 200

@dashboard_bp.route('/hospitaladmin/appointments', methods=['GET'])
@token_required
def get_all_appointments(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
    queues = ShiftQueue.query.all()
    result = []
    for q in queues:
        result.append({
            'id': q.id,
            'patient_name': q.patient_name,
            'token_number': q.token_number,
            'status': q.status,
            'booked_at': q.booked_at.strftime('%Y-%m-%d %H:%M') if q.booked_at else None,
            'doctor_name': q.shift.doctor.user.username if q.shift and q.shift.doctor and q.shift.doctor.user else 'Unknown',
            'department': q.shift.doctor.department if q.shift and q.shift.doctor else 'N/A'
        })
    return jsonify(result), 200

@dashboard_bp.route('/hospitaladmin/beds', methods=['GET'])
@token_required
def get_all_beds(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
    beds = Bed.query.all()
    result = []
    for b in beds:
        result.append({
            'id': b.id,
            'type': b.type,
            'status': b.status,
            'patient_id': b.current_patient_id
        })
    return jsonify(result), 200

@dashboard_bp.route('/hospitaladmin/beds/<int:bed_id>', methods=['PUT'])
@token_required
def update_bed_status(current_user, bed_id):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
    bed = Bed.query.get(bed_id)
    if not bed:
        return jsonify({'error': 'Bed not found'}), 404
    
    data = request.get_json()
    if 'status' in data:
        bed.status = data['status']
    db.session.commit()
    return jsonify({'message': 'Bed updated'}), 200

@dashboard_bp.route('/hospitaladmin/lab', methods=['GET'])
@token_required
def get_all_lab_reports(current_user):
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'message': 'Unauthorized'}), 403
    reports = PatientRecord.query.filter_by(record_type='Report').all()
    result = []
    for r in reports:
        result.append({
            'id': r.id,
            'patient_name': r.patient.user.username if r.patient and r.patient.user else 'Unknown',
            'ai_summary': r.ai_summary,
            'ai_abnormal_values': r.ai_abnormal_values,
            'created_at': r.created_at.strftime('%Y-%m-%d') if r.created_at else None
        })
    return jsonify(result), 200

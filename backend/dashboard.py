from flask import Blueprint, jsonify, request, current_app
from functools import wraps
import jwt
from models import db, User, Role, Hospital, Bed

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
        
    total_hospitals = Hospital.query.count()
    
    return jsonify({
        'metrics': {
            'total_hospitals': total_hospitals,
            'active_outbreaks': 0,
            'resource_recommendations': 'Transfer 50 units of Paracetamol from PHC-1 to City Hospital.'
        }
    }), 200

@dashboard_bp.route('/superadmin', methods=['GET'])
@token_required
def superadmin_dashboard(current_user):
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

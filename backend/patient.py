from flask import Blueprint, request, jsonify
from models import db, Patient, PatientRecord, User
from dashboard import token_required

patient_bp = Blueprint('patient', __name__)

@patient_bp.route('/records', methods=['GET', 'POST'])
@token_required
def manage_records(current_user):
    # Fetch patient profile
    patient = Patient.query.filter_by(user_id=current_user.id).first()
    
    if request.method == 'GET':
        if not patient and current_user.role.name != 'Doctor':
            return jsonify({'error': 'Patient profile not found'}), 404
            
        # If doctor, they might request via query param ?patient_id=X
        target_patient_id = request.args.get('patient_id', patient.id if patient else None)
        
        records = PatientRecord.query.filter_by(patient_id=target_patient_id).all()
        return jsonify([{
            'id': r.id,
            'type': r.record_type,
            'url': r.file_url,
            'summary': r.ai_summary,
            'abnormal_values': r.ai_abnormal_values,
            'date': r.created_at.strftime('%Y-%m-%d')
        } for r in records]), 200

    if request.method == 'POST':
        # Doctors or Patients can upload records
        if current_user.role.name not in ['Doctor', 'Patient']:
            return jsonify({'error': 'Unauthorized'}), 403
            
        data = request.get_json()
        target_patient_id = data.get('patient_id', patient.id if patient else None)
        
        new_record = PatientRecord(
            patient_id=target_patient_id,
            record_type=data.get('type', 'Report'),
            file_url=data.get('url'),
            ai_summary=data.get('summary'),
            ai_abnormal_values=data.get('abnormal_values')
        )
        db.session.add(new_record)
        db.session.commit()
        
        return jsonify({'message': 'Record saved successfully', 'id': new_record.id}), 201

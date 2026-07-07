from flask import Blueprint, request, jsonify
from models import db, DiseaseReport, OutbreakReport, District
from dashboard import token_required

disease_bp = Blueprint('disease', __name__)

@disease_bp.route('/', methods=['GET'])
@token_required
def get_disease_reports(current_user):
    if current_user.role.name not in ['Super Admin', 'District Admin']:
        return jsonify({'message': 'Unauthorized'}), 403
    
    reports = DiseaseReport.query.all()
    results = []
    for r in reports:
        results.append({
            'id': r.id,
            'disease_name': r.disease_name,
            'cases_count': r.cases_count,
            'district_id': r.district_id,
            'report_date': str(r.report_date)
        })
    return jsonify(results), 200

@disease_bp.route('/outbreaks', methods=['GET'])
@token_required
def get_outbreaks(current_user):
    outbreaks = OutbreakReport.query.all()
    results = []
    for o in outbreaks:
        results.append({
            'id': o.id,
            'disease_name': o.disease_name,
            'severity': o.severity,
            'district_id': o.district_id,
            'status': o.status,
            'date_declared': str(o.date_declared)
        })
    return jsonify(results), 200

@disease_bp.route('/outbreaks', methods=['POST'])
@token_required
def add_outbreak(current_user):
    if current_user.role.name not in ['Super Admin', 'District Admin']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    new_outbreak = OutbreakReport(
        disease_name=data.get('disease_name'),
        severity=data.get('severity'),
        district_id=data.get('district_id')
    )
    db.session.add(new_outbreak)
    db.session.commit()
    
    return jsonify({'message': 'Outbreak report added successfully'}), 201

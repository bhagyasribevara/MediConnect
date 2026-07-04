from flask import Blueprint, request, jsonify
from models import db, InventoryRequest, Medicine, Hospital, BloodBank
from dashboard import token_required
from extensions import socketio

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/requests', methods=['POST'])
@token_required
def create_request(current_user):
    """Hospital Admin requests medicine from District"""
    data = request.get_json()
    medicine_name = data.get('medicine_name')
    requested_quantity = data.get('requested_quantity')
    
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    # Find which hospital this admin belongs to
    # For prototype, assuming the admin is linked via some logic. 
    # Let's just pick the first hospital for demo if not explicitly mapped.
    hospital = Hospital.query.first() 
    if not hospital:
        return jsonify({'error': 'No hospitals found'}), 404
        
    new_request = InventoryRequest(
        medicine_name=medicine_name,  # type: ignore
        requested_quantity=requested_quantity,  # type: ignore
        requesting_hospital_id=hospital.id,  # type: ignore
        status='Pending'  # type: ignore
    )
    db.session.add(new_request)
    db.session.commit()
    
    # Emit real-time event to district admins
    socketio.emit('new_inventory_request', {
        'id': new_request.id,
        'medicine': medicine_name,
        'quantity': requested_quantity,
        'hospital': hospital.name
    }, namespace='/')
    
    return jsonify({'message': 'Request submitted successfully', 'request_id': new_request.id}), 201

@inventory_bp.route('/requests', methods=['GET'])
@token_required
def get_requests(current_user):
    """District Admin views pending requests"""
    if current_user.role.name not in ['DistrictAdmin', 'SuperAdmin']:
        return jsonify({'error': 'Unauthorized'}), 403
        
    requests = InventoryRequest.query.filter_by(status='Pending').all()
    output = []
    for req in requests:
        output.append({
            'id': req.id,
            'medicine': req.medicine_name,
            'quantity': req.requested_quantity,
            'hospital': req.hospital.name,
            'status': req.status,
            'date': req.created_at.strftime('%Y-%m-%d %H:%M')
        })
    return jsonify({'requests': output}), 200

@inventory_bp.route('/requests/<int:request_id>/approve', methods=['POST'])
@token_required
def approve_request(current_user, request_id):
    """District Admin approves request"""
    if current_user.role.name not in ['DistrictAdmin', 'SuperAdmin']:
        return jsonify({'error': 'Unauthorized'}), 403
        
    inv_req = InventoryRequest.query.get(request_id)
    if not inv_req:
        return jsonify({'error': 'Request not found'}), 404
        
    if inv_req.status != 'Pending':
        return jsonify({'error': 'Request already processed'}), 400
        
    inv_req.status = 'Approved'
    
    # Add medicine to hospital's stock
    medicine = Medicine.query.filter_by(name=inv_req.medicine_name, hospital_id=inv_req.requesting_hospital_id).first()
    if medicine:
        medicine.quantity += inv_req.requested_quantity
    else:
        new_med = Medicine(
            name=inv_req.medicine_name,  # type: ignore
            quantity=inv_req.requested_quantity,  # type: ignore
            hospital_id=inv_req.requesting_hospital_id  # type: ignore
        )
        db.session.add(new_med)
        
    db.session.commit()
    
    # Emit real-time event back to the hospital
    socketio.emit('inventory_approved', {
        'id': inv_req.id,
        'medicine': inv_req.medicine_name,
        'hospital_id': inv_req.requesting_hospital_id
    }, namespace='/')
    
    return jsonify({'message': 'Request approved and stock updated'}), 200

@inventory_bp.route('/bloodbank', methods=['GET', 'POST'])
@token_required
def manage_bloodbank(current_user):
    if request.method == 'GET':
        blood_stock = BloodBank.query.all()
        return jsonify([{
            'id': b.id,
            'group': b.blood_group,
            'units': b.units,
            'hospital': b.hospital.name
        } for b in blood_stock]), 200
        
    if request.method == 'POST':
        if current_user.role.name != 'HospitalAdmin':
            return jsonify({'error': 'Unauthorized'}), 403
        data = request.get_json()
        hospital = Hospital.query.first()
        blood = BloodBank.query.filter_by(blood_group=data['group'], hospital_id=hospital.id).first()
        if blood:
            blood.units += data.get('units', 0)
        else:
            blood = BloodBank(blood_group=data['group'], units=data.get('units', 0), hospital_id=hospital.id)  # type: ignore
            db.session.add(blood)
        db.session.commit()
        
        socketio.emit('blood_stock_updated', {'group': blood.blood_group, 'units': blood.units}, namespace='/')
        return jsonify({'message': 'Blood stock updated'}), 200

@inventory_bp.route('/medicines', methods=['GET'])
@token_required
def get_medicines(current_user):
    """Hospital Admin views medicines"""
    if current_user.role.name != 'HospitalAdmin':
        return jsonify({'error': 'Unauthorized'}), 403
        
    medicines = Medicine.query.all()
    output = []
    for m in medicines:
        output.append({
            'id': m.id,
            'name': m.name,
            'quantity': m.quantity,
            'batch_number': m.batch_number,
            'expiry_date': m.expiry_date.strftime('%Y-%m-%d') if m.expiry_date else None,
            'hospital': m.hospital.name if m.hospital else 'Unknown'
        })
    return jsonify(output), 200

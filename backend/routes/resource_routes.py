from flask import Blueprint, request, jsonify
from models import db, ResourceTransfer
from dashboard import token_required

resource_bp = Blueprint('resource', __name__)

@resource_bp.route('/transfers', methods=['GET'])
@token_required
def get_transfers(current_user):
    if current_user.role.name not in ['Super Admin', 'District Admin', 'Hospital Admin']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    transfers = ResourceTransfer.query.all()
    results = []
    for t in transfers:
        results.append({
            'id': t.id,
            'item_type': t.item_type,
            'item_name': t.item_name,
            'quantity': t.quantity,
            'from_hospital_id': t.from_hospital_id,
            'to_hospital_id': t.to_hospital_id,
            'status': t.status,
            'requested_by': t.requested_by,
            'created_at': str(t.created_at)
        })
    return jsonify(results), 200

@resource_bp.route('/transfers', methods=['POST'])
@token_required
def request_transfer(current_user):
    if current_user.role.name not in ['Super Admin', 'District Admin', 'Hospital Admin']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    new_transfer = ResourceTransfer(
        item_type=data.get('item_type'),
        item_name=data.get('item_name'),
        quantity=data.get('quantity'),
        from_hospital_id=data.get('from_hospital_id'),
        to_hospital_id=data.get('to_hospital_id'),
        requested_by=current_user.id
    )
    
    db.session.add(new_transfer)
    db.session.commit()
    
    return jsonify({'message': 'Resource transfer requested successfully'}), 201

@resource_bp.route('/transfers/<int:id>/status', methods=['PUT'])
@token_required
def update_transfer_status(current_user, id):
    if current_user.role.name not in ['Super Admin', 'District Admin']:
        return jsonify({'message': 'Unauthorized'}), 403
        
    data = request.get_json()
    transfer = ResourceTransfer.query.get(id)
    if not transfer:
        return jsonify({'message': 'Transfer not found'}), 404
        
    transfer.status = data.get('status')
    db.session.commit()
    
    return jsonify({'message': f"Transfer status updated to {transfer.status}"}), 200

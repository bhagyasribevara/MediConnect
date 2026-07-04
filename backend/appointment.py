from flask import Blueprint, request, jsonify
from datetime import datetime, date, timedelta, time as datetime_time
from models import db, Slot, Appointment, Queue, DoctorAvailability, DoctorLeave, Doctor, Patient, Hospital
from extensions import socketio

appointment_bp = Blueprint('appointment_bp', __name__)

@appointment_bp.route('/slots', methods=['GET'])
def get_slots():
    doctor_id = request.args.get('doctor_id')
    query_date = request.args.get('date')
    
    if not doctor_id or not query_date:
        return jsonify({'error': 'doctor_id and date are required'}), 400
        
    try:
        parsed_date = datetime.strptime(query_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    slots = Slot.query.filter_by(doctor_id=doctor_id, date=parsed_date).order_by(Slot.start_time).all()
    
    result = []
    for s in slots:
        status = s.status
        if s.booked_count >= s.capacity:
            status = 'Full'
        elif s.booked_count > 0:
            status = 'Partially Available'
        else:
            status = 'Available'
            
        result.append({
            'id': s.id,
            'start_time': s.start_time.strftime('%H:%M:%S'),
            'end_time': s.end_time.strftime('%H:%M:%S'),
            'capacity': s.capacity,
            'booked_count': s.booked_count,
            'remaining_count': s.capacity - s.booked_count,
            'status': status
        })
        
    return jsonify(result), 200

@appointment_bp.route('/book', methods=['POST'])
def book_appointment():
    data = request.json
    patient_id = data.get('patient_id')
    slot_id = data.get('slot_id')
    
    if not patient_id or not slot_id:
        return jsonify({'error': 'patient_id and slot_id are required'}), 400
        
    try:
        # Transaction handling with Row Lock
        slot = Slot.query.with_for_update().get(slot_id)
        if not slot:
            return jsonify({'error': 'Slot not found'}), 404
            
        if slot.booked_count >= slot.capacity or slot.status == 'Unavailable':
            return jsonify({'error': 'Slot is full or unavailable'}), 400
            
        # Check if already booked
        existing_appt = Appointment.query.filter_by(patient_id=patient_id, slot_id=slot_id).first()
        if existing_appt:
            return jsonify({'error': 'You have already booked this slot'}), 400

        # Create appointment
        queue_number = slot.booked_count + 1
        new_appt = Appointment(
            patient_id=patient_id,
            doctor_id=slot.doctor_id,
            hospital_id=slot.hospital_id,
            slot_id=slot.id,
            queue_number=queue_number,
            appointment_status='Booked'
        )
        db.session.add(new_appt)
        
        # Update slot
        slot.booked_count += 1
        slot.remaining_count = slot.capacity - slot.booked_count
        if slot.booked_count >= slot.capacity:
            slot.status = 'Full'
        elif slot.booked_count > 0:
            slot.status = 'Partially Available'
            
        # Add to Queue
        db.session.flush() # get new_appt.id
        new_queue = Queue(
            appointment_id=new_appt.id,
            queue_number=queue_number,
            current_status='Waiting'
        )
        db.session.add(new_queue)
        
        db.session.commit()
        
        # Broadcast via socket
        socketio.emit('slot_updated', {'slot_id': slot.id, 'booked_count': slot.booked_count, 'status': slot.status, 'doctor_id': slot.doctor_id, 'date': slot.date.strftime('%Y-%m-%d')})
        socketio.emit('queue_updated', {'doctor_id': slot.doctor_id, 'date': slot.date.strftime('%Y-%m-%d')})
        
        return jsonify({'message': 'Appointment booked successfully', 'appointment_id': new_appt.id, 'queue_number': queue_number}), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@appointment_bp.route('/queue', methods=['GET'])
def get_queue():
    doctor_id = request.args.get('doctor_id')
    query_date = request.args.get('date', datetime.today().strftime('%Y-%m-%d'))
    
    if not doctor_id:
        return jsonify({'error': 'doctor_id is required'}), 400
        
    try:
        parsed_date = datetime.strptime(query_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    appointments = Appointment.query.join(Slot).filter(
        Appointment.doctor_id == doctor_id,
        Slot.date == parsed_date
    ).order_by(Appointment.queue_number).all()
    
    result = []
    for appt in appointments:
        queue_entry = appt.queue_entry
        patient = appt.patient.user
        result.append({
            'appointment_id': appt.id,
            'queue_id': queue_entry.id if queue_entry else None,
            'queue_number': appt.queue_number,
            'patient_name': patient.username,
            'time': appt.slot.start_time.strftime('%H:%M:%S'),
            'status': queue_entry.current_status if queue_entry else 'Unknown'
        })
        
    return jsonify(result), 200

@appointment_bp.route('/queue/status', methods=['POST'])
def update_queue_status():
    data = request.json
    queue_id = data.get('queue_id')
    new_status = data.get('status')
    
    if not queue_id or not new_status:
        return jsonify({'error': 'queue_id and status are required'}), 400
        
    queue_entry = Queue.query.get(queue_id)
    if not queue_entry:
        return jsonify({'error': 'Queue entry not found'}), 404
        
    queue_entry.current_status = new_status
    if new_status in ['Completed', 'Skipped', 'Cancelled']:
        queue_entry.appointment.appointment_status = new_status
        
    db.session.commit()
    
    # Notify updates
    appt = queue_entry.appointment
    socketio.emit('queue_updated', {'doctor_id': appt.doctor_id, 'date': appt.slot.date.strftime('%Y-%m-%d')})
    
    return jsonify({'message': 'Queue status updated'}), 200

@appointment_bp.route('/availability', methods=['POST'])
def set_availability():
    data = request.json
    doctor_id = data.get('doctor_id')
    avail_date = data.get('date')
    start_time_str = data.get('start_time')
    end_time_str = data.get('end_time')
    duration_mins = data.get('duration', 30)
    
    if not all([doctor_id, avail_date, start_time_str, end_time_str]):
        return jsonify({'error': 'Missing required fields'}), 400
        
    doctor = Doctor.query.get(doctor_id)
    if not doctor:
        return jsonify({'error': 'Doctor not found'}), 404
        
    parsed_date = datetime.strptime(avail_date, '%Y-%m-%d').date()
    start_time = datetime.strptime(start_time_str, '%H:%M').time()
    end_time = datetime.strptime(end_time_str, '%H:%M').time()
    
    # Save availability
    avail = DoctorAvailability(
        doctor_id=doctor_id,
        date=parsed_date,
        start_time=start_time,
        end_time=end_time,
        status='Available'
    )
    db.session.add(avail)
    
    # Generate Slots (simplified: duration_mins segments)
    current_dt = datetime.combine(parsed_date, start_time)
    end_dt = datetime.combine(parsed_date, end_time)
    
    slots_created = 0
    while current_dt + timedelta(minutes=duration_mins) <= end_dt:
        nxt_dt = current_dt + timedelta(minutes=duration_mins)
        
        slot = Slot(
            doctor_id=doctor_id,
            hospital_id=doctor.hospital_id,
            date=parsed_date,
            start_time=current_dt.time(),
            end_time=nxt_dt.time(),
            capacity=10,
            booked_count=0,
            remaining_count=10,
            status='Available'
        )
        db.session.add(slot)
        slots_created += 1
        current_dt = nxt_dt
        
    db.session.commit()
    
    return jsonify({'message': f'Availability set and {slots_created} slots generated'}), 201

@appointment_bp.route('/hospital/stats', methods=['GET'])
def get_hospital_stats():
    hospital_id = request.args.get('hospital_id')
    query_date = request.args.get('date', datetime.today().strftime('%Y-%m-%d'))
    
    if not hospital_id:
        return jsonify({'error': 'hospital_id is required'}), 400
        
    parsed_date = datetime.strptime(query_date, '%Y-%m-%d').date()
    
    doctors = Doctor.query.filter_by(hospital_id=hospital_id).all()
    stats = []
    
    for doc in doctors:
        slots = Slot.query.filter_by(doctor_id=doc.id, date=parsed_date).all()
        total_slots = len(slots)
        total_capacity = sum(s.capacity for s in slots)
        total_booked = sum(s.booked_count for s in slots)
        
        appts = Appointment.query.filter_by(doctor_id=doc.id).join(Slot).filter(Slot.date == parsed_date).all()
        completed = sum(1 for a in appts if a.appointment_status == 'Completed')
        pending = sum(1 for a in appts if a.appointment_status in ['Booked'])
        
        stats.append({
            'doctor_name': doc.user.username, # assuming doc.user exists
            'department': doc.department,
            'slots': total_slots,
            'booked': total_booked,
            'completed': completed,
            'pending': pending,
            'is_on_leave': doc.is_on_leave
        })
        
    return jsonify(stats), 200

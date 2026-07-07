from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timezone

db = SQLAlchemy()

class Role(db.Model):
    __tablename__ = 'roles'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False, unique=True)
    
class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    email = db.Column(db.String(255), nullable=True, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey('roles.id'), nullable=False)
    phone_number = db.Column(db.String(15))
    failed_login_attempts = db.Column(db.Integer, default=0)
    lockout_until = db.Column(db.DateTime, nullable=True)
    reset_otp = db.Column(db.String(6), nullable=True)
    reset_otp_expires = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    soft_delete = db.Column(db.Boolean, default=False)
    
    role = db.relationship('Role', backref='users')

class District(db.Model):
    __tablename__ = 'districts'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)

class Hospital(db.Model):
    __tablename__ = 'hospitals'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    type = db.Column(db.Enum('Hospital', 'PHC', 'CHC'), nullable=False)
    district_id = db.Column(db.Integer, db.ForeignKey('districts.id'), nullable=False)
    location_lat = db.Column(db.Numeric(10, 8))
    location_lng = db.Column(db.Numeric(11, 8))
    address = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Patient(db.Model):
    __tablename__ = 'patients'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    emergency_contact = db.Column(db.String(15))
    blood_group = db.Column(db.Enum('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'))
    
    user = db.relationship('User', backref=db.backref('patient_profile', uselist=False))

class Doctor(db.Model):
    __tablename__ = 'doctors'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    is_on_leave = db.Column(db.Boolean, default=False)
    profile_photo = db.Column(db.String(255), nullable=True)
    
    user = db.relationship('User', backref=db.backref('doctor_profile', uselist=False))
    hospital = db.relationship('Hospital', backref='doctors')

class DistrictAdminProfile(db.Model):
    __tablename__ = 'district_admins'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    district_id = db.Column(db.Integer, db.ForeignKey('districts.id'), nullable=False)
    
    user = db.relationship('User', backref=db.backref('district_admin_profile', uselist=False))
    district = db.relationship('District', backref='admins')

class Bed(db.Model):
    __tablename__ = 'beds'
    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    type = db.Column(db.Enum('General', 'ICU', 'Maternity_ICU', 'NICU'), nullable=False)
    status = db.Column(db.Enum('Available', 'Occupied', 'Maintenance'), default='Available')
    current_patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Medicine(db.Model):
    __tablename__ = 'medicines'
    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    name = db.Column(db.String(255), nullable=False)
    quantity = db.Column(db.Integer, default=0)
    batch_number = db.Column(db.String(100))
    expiry_date = db.Column(db.DateTime)
    
    hospital = db.relationship('Hospital', backref='medicines')

class InventoryRequest(db.Model):
    __tablename__ = 'inventory_requests'
    id = db.Column(db.Integer, primary_key=True)
    medicine_name = db.Column(db.String(255), nullable=False)
    requested_quantity = db.Column(db.Integer, nullable=False)
    requesting_hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    status = db.Column(db.Enum('Pending', 'Approved', 'Rejected'), default='Pending')
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    hospital = db.relationship('Hospital', backref='inventory_requests')

class BloodBank(db.Model):
    __tablename__ = 'blood_bank'
    id = db.Column(db.Integer, primary_key=True)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    blood_group = db.Column(db.Enum('A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'), nullable=False)
    units = db.Column(db.Integer, default=0)
    
    hospital = db.relationship('Hospital', backref='blood_bank')

class PatientRecord(db.Model):
    __tablename__ = 'patient_records'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    record_type = db.Column(db.Enum('Prescription', 'Report', 'Vaccination', 'History'), nullable=False)
    file_url = db.Column(db.String(255))
    ai_summary = db.Column(db.Text)
    ai_abnormal_values = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    patient = db.relationship('Patient', backref='records')


class DoctorAvailability(db.Model):
    __tablename__ = 'doctor_availability'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    status = db.Column(db.Enum('Available', 'Half-day', 'Leave', 'Emergency'), nullable=False)
    
    doctor = db.relationship('Doctor', backref='availabilities')

class DoctorLeave(db.Model):
    __tablename__ = 'doctor_leaves'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    leave_date = db.Column(db.Date, nullable=False)
    leave_type = db.Column(db.Enum('Full-day', 'Half-day', 'Emergency', 'Weekly off', 'Vacation'), nullable=False)
    
    doctor = db.relationship('Doctor', backref='leaves')

class Slot(db.Model):
    __tablename__ = 'slots'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.Time, nullable=False)
    end_time = db.Column(db.Time, nullable=False)
    capacity = db.Column(db.Integer, default=10)
    booked_count = db.Column(db.Integer, default=0)
    remaining_count = db.Column(db.Integer, default=10)
    status = db.Column(db.Enum('Available', 'Partially Available', 'Full', 'Unavailable'), default='Available')
    
    doctor = db.relationship('Doctor', backref='slots')
    hospital = db.relationship('Hospital', backref='slots')

class Appointment(db.Model):
    __tablename__ = 'appointments'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    slot_id = db.Column(db.Integer, db.ForeignKey('slots.id'), nullable=False)
    queue_number = db.Column(db.Integer, nullable=False)
    booking_time = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    appointment_status = db.Column(db.Enum('Booked', 'Cancelled', 'Completed', 'Rescheduled'), default='Booked')
    
    patient = db.relationship('Patient', backref='appointments')
    doctor = db.relationship('Doctor', backref='appointments')
    hospital = db.relationship('Hospital', backref='appointments')
    slot = db.relationship('Slot', backref='appointments')

class Queue(db.Model):
    __tablename__ = 'queues'
    id = db.Column(db.Integer, primary_key=True)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=False)
    queue_number = db.Column(db.Integer, nullable=False)
    current_status = db.Column(db.Enum('Waiting', 'In Progress', 'Completed', 'Skipped', 'Cancelled'), default='Waiting')
    
    appointment = db.relationship('Appointment', backref=db.backref('queue_entry', uselist=False))

class DoctorShift(db.Model):
    __tablename__ = 'doctor_shifts'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    shift_date = db.Column(db.Date, nullable=False)
    start_time = db.Column(db.String(10), nullable=False)  # "09:00"
    end_time = db.Column(db.String(10), nullable=False)    # "10:00"
    max_appointments = db.Column(db.Integer, default=10)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    doctor = db.relationship('Doctor', backref='shifts')

class ShiftQueue(db.Model):
    __tablename__ = 'shift_queue'
    id = db.Column(db.Integer, primary_key=True)
    shift_id = db.Column(db.Integer, db.ForeignKey('doctor_shifts.id'), nullable=False)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=True)
    patient_name = db.Column(db.String(100), nullable=False)
    token_number = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), default='Waiting')  # Waiting, In_Consultation, Completed, Cancelled
    booked_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    shift = db.relationship('DoctorShift', backref='queue_entries')

class LeaveRequest(db.Model):
    __tablename__ = 'leave_requests'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    leave_date = db.Column(db.Date, nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(20), default='Pending')  # Pending, Approved, Rejected
    approved_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    doctor = db.relationship('Doctor', backref='leave_requests')

class DoctorAttendance(db.Model):
    __tablename__ = 'doctor_attendance'
    id = db.Column(db.Integer, primary_key=True)
    doctor_id = db.Column(db.Integer, db.ForeignKey('doctors.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    punch_in = db.Column(db.DateTime, nullable=True)
    punch_out = db.Column(db.DateTime, nullable=True)
    status = db.Column(db.String(20), default='Absent')  # Present, Absent, On_Leave, Half_Day
    
    doctor = db.relationship('Doctor', backref='attendance_records')



# ═══════════════════════════════════════════════════════════════════════════
# AI/ML Models — Prediction Logs, Model Metadata, Training Logs, AI Alerts
# ═══════════════════════════════════════════════════════════════════════════

class PredictionLog(db.Model):
    """Stores every AI prediction for audit and analytics."""
    __tablename__ = 'prediction_logs'
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False)  # appointment, symptom, etc.
    input_summary = db.Column(db.Text)  # JSON summary of input
    prediction = db.Column(db.String(255))  # Prediction result
    confidence = db.Column(db.Float, default=0.0)
    dashboard = db.Column(db.String(100))  # Which dashboard requested it
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class ModelMetadata(db.Model):
    """Tracks model versions, accuracy, and health."""
    __tablename__ = 'model_metadata'
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False, unique=True)
    model_type = db.Column(db.String(100))  # RandomForest, XGBoost, etc.
    accuracy = db.Column(db.Float, default=0.0)
    precision_score = db.Column(db.Float, default=0.0)
    recall_score = db.Column(db.Float, default=0.0)
    f1_score = db.Column(db.Float, default=0.0)
    dataset_rows = db.Column(db.Integer, default=0)
    training_duration = db.Column(db.Float, default=0.0)  # seconds
    version = db.Column(db.Integer, default=1)
    file_path = db.Column(db.String(255))
    last_trained_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(50), default='active')  # active, retraining, error

class TrainingLog(db.Model):
    """Logs training events with status and metrics."""
    __tablename__ = 'training_logs'
    id = db.Column(db.Integer, primary_key=True)
    model_name = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)  # started, completed, failed
    accuracy = db.Column(db.Float, nullable=True)
    duration_seconds = db.Column(db.Float, nullable=True)
    dataset_rows = db.Column(db.Integer, nullable=True)
    error_message = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class AIAlert(db.Model):
    """AI-generated alerts for dashboard display."""
    __tablename__ = 'ai_alerts'
    id = db.Column(db.Integer, primary_key=True)
    alert_type = db.Column(db.String(100), nullable=False)  # low_stock, outbreak, no_show_risk
    severity = db.Column(db.String(20), default='LOW')  # LOW, MEDIUM, HIGH, CRITICAL
    title = db.Column(db.String(255), nullable=False)
    message = db.Column(db.Text)
    dashboard = db.Column(db.String(100))  # hospital, district, doctor, patient
    is_read = db.Column(db.Boolean, default=False)
    model_name = db.Column(db.String(100))
    confidence = db.Column(db.Float, default=0.0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

# ═══════════════════════════════════════════════════════════════════════════
# Phase 1: New Application & System Models
# ═══════════════════════════════════════════════════════════════════════════

class OrganDonationRegistry(db.Model):
    __tablename__ = 'organ_donation_registry'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    organ_type = db.Column(db.String(100), nullable=False)
    status = db.Column(db.Enum('Registered', 'Available', 'Transplanted'), default='Registered')
    hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Notification(db.Model):
    __tablename__ = 'notifications'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    type = db.Column(db.String(50), nullable=False)
    message = db.Column(db.Text, nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    
    user = db.relationship('User', backref='notifications')

class AuditLog(db.Model):
    __tablename__ = 'audit_logs'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    action = db.Column(db.String(255), nullable=False)
    ip_address = db.Column(db.String(50))
    timestamp = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class DiseaseReport(db.Model):
    __tablename__ = 'disease_reports'
    id = db.Column(db.Integer, primary_key=True)
    disease_name = db.Column(db.String(100), nullable=False)
    cases_count = db.Column(db.Integer, default=1)
    district_id = db.Column(db.Integer, db.ForeignKey('districts.id'), nullable=False)
    report_date = db.Column(db.Date, nullable=False)
    
    district = db.relationship('District', backref='disease_reports')

class OutbreakReport(db.Model):
    __tablename__ = 'outbreak_reports'
    id = db.Column(db.Integer, primary_key=True)
    disease_name = db.Column(db.String(100), nullable=False)
    severity = db.Column(db.String(50), nullable=False)
    district_id = db.Column(db.Integer, db.ForeignKey('districts.id'), nullable=False)
    date_declared = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    status = db.Column(db.String(50), default='Active')

class ResourceTransfer(db.Model):
    __tablename__ = 'resource_transfers'
    id = db.Column(db.Integer, primary_key=True)
    item_type = db.Column(db.Enum('Medicine', 'Doctor', 'Bed', 'Ambulance', 'Oxygen', 'Blood'), nullable=False)
    item_name = db.Column(db.String(100))
    quantity = db.Column(db.Integer, nullable=False)
    from_hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    to_hospital_id = db.Column(db.Integer, db.ForeignKey('hospitals.id'), nullable=False)
    status = db.Column(db.Enum('Pending', 'Approved', 'Completed', 'Rejected'), default='Pending')
    requested_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class Payment(db.Model):
    __tablename__ = 'payments'
    id = db.Column(db.Integer, primary_key=True)
    patient_id = db.Column(db.Integer, db.ForeignKey('patients.id'), nullable=False)
    appointment_id = db.Column(db.Integer, db.ForeignKey('appointments.id'), nullable=True)
    amount = db.Column(db.Numeric(10, 2), nullable=False)
    payment_method = db.Column(db.String(50), nullable=False)
    status = db.Column(db.Enum('Pending', 'Completed', 'Failed', 'Refunded'), default='Pending')
    transaction_id = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

class SystemSetting(db.Model):
    __tablename__ = 'system_settings'
    id = db.Column(db.Integer, primary_key=True)
    setting_key = db.Column(db.String(100), unique=True, nullable=False)
    setting_value = db.Column(db.Text, nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))



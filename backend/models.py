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
    
    user = db.relationship('User', backref=db.backref('doctor_profile', uselist=False))
    hospital = db.relationship('Hospital', backref='doctors')

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

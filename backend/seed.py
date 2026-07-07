from app import create_app
from models import db, Patient, Doctor, Admin, District, Hospital, Bed, DoctorShift, ShiftQueue, DistrictAdminProfile
from werkzeug.security import generate_password_hash
from datetime import date, datetime, timezone


def seed_database():
    app = create_app()
    with app.app_context():
        print("Dropping existing tables...")
        db.drop_all()

        print("Creating tables...")
        db.create_all()

        print("Seeding districts...")
        district_name = "Central Healthcare District"
        district = District(name=district_name)
        db.session.add(district)
        db.session.commit()

        print("Seeding hospitals...")
        hospital_name = "City General Hospital"
        hospital = Hospital(name=hospital_name, type="Hospital", district_id=district.id)
        db.session.add(hospital)
        db.session.commit()

        print("Seeding beds...")
        for _ in range(10): # 10 General beds
            db.session.add(Bed(hospital_id=hospital.id, type='General', status='Available'))
        for _ in range(5):  # 5 ICU beds
            db.session.add(Bed(hospital_id=hospital.id, type='ICU', status='Available'))
        for _ in range(3):  # 3 Maternity ICU
            db.session.add(Bed(hospital_id=hospital.id, type='Maternity_ICU', status='Available'))
        db.session.commit()

        print("Seeding demo users...")
        password_hash = generate_password_hash("Demo@123")

        # 1. Patient
        patient = Patient(
            username='patient_yusuf',
            password_hash=password_hash,
            phone_number="1234567890"
        )
        db.session.add(patient)

        # 2. Doctor
        doctor = Doctor(
            username='doc_yusuf',
            password_hash=password_hash,
            phone_number="1234567890",
            hospital_id=hospital.id,
            department='General Medicine',
            specialization='General Medicine',
            is_on_leave=False
        )
        db.session.add(doctor)

        # 3. Hospital Admin
        hospital_admin = Admin(
            username='hospital_yusuf',
            password_hash=password_hash,
            phone_number="1234567890",
            role_level='Hospital',
            hospital_id=hospital.id
        )
        db.session.add(hospital_admin)

        # 4. District Admin
        district_admin = Admin(
            username='district_yusuf',
            password_hash=password_hash,
            phone_number="1234567890",
            role_level='District',
            district_id=district.id
        )
        db.session.add(district_admin)

        # 5. Super Admin
        super_admin = Admin(
            username='admin_yusuf',
            password_hash=password_hash,
            phone_number="1234567890",
            role_level='Super'
        )
        db.session.add(super_admin)
        db.session.commit()

        # ─── Seed District Admin Profile ─────────────────────────────────
        print("Seeding district admin profile...")
        da_profile = DistrictAdminProfile(
            user_id=district_admin.id,
            district_id=district.id
        )
        db.session.add(da_profile)
        db.session.commit()

        # ─── Seed Doctor Shifts ──────────────────────────────────────────
        print("Seeding doctor shifts...")
        if DoctorShift.query.filter_by(doctor_id=doctor.id, shift_date=date.today()).count() == 0:
            shifts_data = [
                {'start': '09:00', 'end': '10:00', 'max': 10},
                {'start': '10:00', 'end': '12:00', 'max': 15},
                {'start': '14:00', 'end': '17:00', 'max': 20},
            ]
            for s in shifts_data:
                shift = DoctorShift(
                    doctor_id=doctor.id,
                    shift_date=date.today(),
                    start_time=s['start'],
                    end_time=s['end'],
                    max_appointments=s['max'],
                    is_active=True
                )
                db.session.add(shift)
            db.session.commit()
            print(f"  Created {len(shifts_data)} shifts for today")

            # Seed queue entries for first shift
            first_shift = DoctorShift.query.filter_by(doctor_id=doctor.id, shift_date=date.today()).first()
            if first_shift and ShiftQueue.query.filter_by(shift_id=first_shift.id).count() == 0:
                queue_data = [
                    {'name': 'Rohan Sen', 'token': 1, 'status': 'Completed'},
                    {'name': 'Priya Sharma', 'token': 2, 'status': 'In_Consultation'},
                    {'name': 'Anil Kumar', 'token': 3, 'status': 'Waiting'},
                    {'name': 'Neha Patel', 'token': 4, 'status': 'Waiting'},
                    {'name': 'Suresh Gupta', 'token': 5, 'status': 'Waiting'},
                ]
                for q in queue_data:
                    entry = ShiftQueue(
                        shift_id=first_shift.id,
                        patient_name=q['name'],
                        token_number=q['token'],
                        status=q['status']
                    )
                    db.session.add(entry)
                db.session.commit()
                print(f"  Created {len(queue_data)} queue entries for first shift")

        print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()

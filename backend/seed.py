from app import create_app
from models import db, Role, User, District, Hospital, Bed, Doctor, DoctorShift, ShiftQueue, DistrictAdminProfile
# pyrefly: ignore [missing-import, unexpected-keyword]
# pyright: ignore[reportMissingImports, reportCallIssue]
from werkzeug.security import generate_password_hash
from datetime import date, datetime, timezone


def seed_database():
    app = create_app()
    with app.app_context():
        print("Creating tables...")
        db.create_all()

        print("Seeding roles...")
        roles = ['Patient', 'Doctor', 'HospitalAdmin', 'DistrictAdmin', 'SuperAdmin']
        for role_name in roles:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))  # type: ignore
        db.session.commit()

        print("Seeding districts...")
        district_name = "Central Healthcare District"
        district = District.query.filter_by(name=district_name).first()
        if not district:
            district = District(name=district_name)#type:ignore
            db.session.add(district)
            db.session.commit()

        print("Seeding hospitals...")
        hospital_name = "City General Hospital"
        hospital = Hospital.query.filter_by(name=hospital_name).first()
        if not hospital:
            hospital = Hospital(name=hospital_name, type="Hospital", district_id=district.id)  # type: ignore
            db.session.add(hospital)
            db.session.commit()

        print("Seeding beds...")
        if Bed.query.count() == 0:
            for _ in range(10): # 10 General beds
                db.session.add(Bed(hospital_id=hospital.id, type='General', status='Available'))#type:ignore
            for _ in range(5):  # 5 ICU beds
                db.session.add(Bed(hospital_id=hospital.id, type='ICU', status='Available'))#type:ignore
            for _ in range(3):  # 3 Maternity ICU
                db.session.add(Bed(hospital_id=hospital.id, type='Maternity_ICU', status='Available'))#type:ignore
            db.session.commit()

        print("Seeding demo users...")
        demo_users = [
            {'username': 'patient_yusuf', 'role': 'Patient'},
            {'username': 'doc_yusuf', 'role': 'Doctor'},
            {'username': 'hospital_yusuf', 'role': 'HospitalAdmin'},
            {'username': 'district_yusuf', 'role': 'DistrictAdmin'},
            {'username': 'admin_yusuf', 'role': 'SuperAdmin'}
        ]

        password_hash = generate_password_hash("Demo@123")

        for u in demo_users:
            role = Role.query.filter_by(name=u['role']).first()
            if not User.query.filter_by(username=u['username']).first():
                user = User(  #type:ignore
                    # pyrefly: ignore [unexpected-keyword]
                    username=u['username'],
                    # pyrefly: ignore [unexpected-keyword]
                    password_hash=password_hash,
                    # pyrefly: ignore [unexpected-keyword]
                    role_id=role.id,
                    # pyrefly: ignore [unexpected-keyword]
                    phone_number="1234567890"
                )
                db.session.add(user)
        
        db.session.commit()

        db.session.commit()

        # ─── Seed District Admin Profile ─────────────────────────────────
        print("Seeding district admin profile...")
        da_user = User.query.filter_by(username='district_yusuf').first()
        from models import DistrictAdminProfile
        if da_user and not DistrictAdminProfile.query.filter_by(user_id=da_user.id).first():
            da_profile = DistrictAdminProfile( #type:ignore
                user_id=da_user.id,
                district_id=district.id
            )
            db.session.add(da_profile)
            db.session.commit()
            print(f"  District Admin profile created for {da_user.username}")

        # ─── Seed Doctor Profile ─────────────────────────────────────────
        print("Seeding doctor profile...")
        doc_user = User.query.filter_by(username='doc_yusuf').first()
        if doc_user and not Doctor.query.filter_by(user_id=doc_user.id).first():
            doctor = Doctor(  #type:ignore
                user_id=doc_user.id,
                hospital_id=hospital.id,
                department='General Medicine',
                is_on_leave=False
            )
            db.session.add(doctor)
            db.session.commit()
            print(f"  Doctor profile created for {doc_user.username} (ID: {doctor.id})")

        # ─── Seed Doctor Shifts ──────────────────────────────────────────
        print("Seeding doctor shifts...")
        doctor = Doctor.query.first()
        if doctor and DoctorShift.query.filter_by(doctor_id=doctor.id, shift_date=date.today()).count() == 0:
            shifts_data = [
                {'start': '09:00', 'end': '10:00', 'max': 10},
                {'start': '10:00', 'end': '12:00', 'max': 15},
                {'start': '14:00', 'end': '17:00', 'max': 20},
            ]
            for s in shifts_data:
                shift = DoctorShift(  #type:ignore
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
                    entry = ShiftQueue(  #type:ignore
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

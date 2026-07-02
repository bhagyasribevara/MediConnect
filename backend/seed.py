from app import create_app
from models import db, Role, User, District, Hospital, Bed
from werkzeug.security import generate_password_hash
import sys

def seed_database():
    app = create_app()
    with app.app_context():
        print("Creating tables...")
        db.create_all()

        print("Seeding roles...")
        roles = ['Patient', 'Doctor', 'HospitalAdmin', 'DistrictAdmin', 'SuperAdmin']
        for role_name in roles:
            if not Role.query.filter_by(name=role_name).first():
                db.session.add(Role(name=role_name))
        db.session.commit()

        print("Seeding districts...")
        district_name = "Central Healthcare District"
        district = District.query.filter_by(name=district_name).first()
        if not district:
            district = District(name=district_name)
            db.session.add(district)
            db.session.commit()

        print("Seeding hospitals...")
        hospital_name = "City General Hospital"
        hospital = Hospital.query.filter_by(name=hospital_name).first()
        if not hospital:
            hospital = Hospital(name=hospital_name, type="Hospital", district_id=district.id)
            db.session.add(hospital)
            db.session.commit()

        print("Seeding beds...")
        if Bed.query.count() == 0:
            for _ in range(10): # 10 General beds
                db.session.add(Bed(hospital_id=hospital.id, type='General', status='Available'))
            for _ in range(5):  # 5 ICU beds
                db.session.add(Bed(hospital_id=hospital.id, type='ICU', status='Available'))
            for _ in range(3):  # 3 Maternity ICU
                db.session.add(Bed(hospital_id=hospital.id, type='Maternity_ICU', status='Available'))
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
                user = User(
                    username=u['username'],
                    password_hash=password_hash,
                    role_id=role.id,
                    phone_number="1234567890"
                )
                db.session.add(user)
        
        db.session.commit()
        print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()

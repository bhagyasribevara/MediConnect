from app import create_app
from models import db, Role, User, District, Hospital, Bed
# pyrefly: ignore [missing-import, unexpected-keyword]
# pyright: ignore[reportMissingImports, reportCallIssue]
from werkzeug.security import generate_password_hash


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
        print("Database seeding completed successfully!")

if __name__ == '__main__':
    seed_database()

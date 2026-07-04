import os
from dotenv import load_dotenv
load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS
from models import db
from extensions import socketio
from config import Config
from auth import auth_bp
from dashboard import dashboard_bp
from ai_copilot import copilot_bp
from inventory import inventory_bp
from patient import patient_bp
from medlens import medlens_bp
from doctor_management import doctor_mgmt_bp
from admin_management import admin_management_bp

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(copilot_bp, url_prefix='/api/copilot')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(patient_bp, url_prefix='/api/patient')
    app.register_blueprint(medlens_bp, url_prefix='/api/medlens')
    app.register_blueprint(doctor_mgmt_bp, url_prefix='/api/doctor')
    app.register_blueprint(admin_management_bp, url_prefix='/api/admin')

    @app.route('/api/health')
    def health_check():
        return jsonify({'status': 'ok'}), 200

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    # Use socketio.run with allow_unsafe_werkzeug for development
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)

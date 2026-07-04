import os
import sys
import logging
import threading
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

# AI/ML Route Blueprints
from routes.appointment_routes import appointment_bp
from routes.medicine_routes import medicine_bp
from routes.symptom_routes import symptom_bp
from routes.district_routes import district_bp
from routes.model_routes import model_bp

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mediconnect.app")


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    CORS(app)
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")
    
    # ─── Existing Blueprints ─────────────────────────────────────
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(copilot_bp, url_prefix='/api/copilot')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(patient_bp, url_prefix='/api/patient')
    app.register_blueprint(medlens_bp, url_prefix='/api/medlens')
    app.register_blueprint(doctor_mgmt_bp, url_prefix='/api/doctor')
    app.register_blueprint(admin_management_bp, url_prefix='/api/admin')

    # ─── AI/ML Prediction Blueprints ─────────────────────────────
    app.register_blueprint(appointment_bp, url_prefix='/api/predict')
    app.register_blueprint(medicine_bp, url_prefix='/api/predict')
    app.register_blueprint(symptom_bp, url_prefix='/api/predict')
    app.register_blueprint(district_bp, url_prefix='/api/predict')
    app.register_blueprint(model_bp, url_prefix='/api/models')

    @app.route('/api/health')
    def health_check():
        from services.model_registry import registry
        loaded = registry.get_loaded_models()
        return jsonify({
            'status': 'ok',
            'models_loaded': len(loaded),
            'models': loaded,
        }), 200

    return app


def _initialize_ml_models(app):
    """Initialize ML models in a background thread to avoid blocking startup."""
    with app.app_context():
        try:
            from train_models import initialize_models
            initialize_models()
            logger.info("ML model initialization complete")
        except Exception as e:
            logger.error("ML model initialization failed: %s", str(e))
            logger.info("Server will continue without ML models — train manually with: python train_models.py")


if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()

    # Initialize ML models in background thread (non-blocking)
    ml_thread = threading.Thread(
        target=_initialize_ml_models,
        args=(app,),
        daemon=True,
    )
    ml_thread.start()
    logger.info("ML model initialization started in background...")

    # Use socketio.run with allow_unsafe_werkzeug for development
    socketio.run(app, debug=True, port=5000, allow_unsafe_werkzeug=True)

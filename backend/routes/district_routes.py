"""
MediConnect 360 — District Analytics API Routes
================================================
Flask blueprint for district-level healthcare predictions.
"""

from flask import Blueprint, jsonify, request
import logging

from services.district_service import district_service

logger = logging.getLogger("mediconnect.routes.district")

district_bp = Blueprint("district_predict", __name__)


@district_bp.route("/outbreak", methods=["POST"])
def predict_outbreak():
    """
    Predict disease outbreak probability.

    Request Body:
        {
            "state": "Maharashtra",
            "disease": "Dengue",
            "current_cases": 75
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        result = district_service.predict_outbreak(data)
        return jsonify(result), 200

    except Exception as e:
        logger.error("Outbreak prediction error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@district_bp.route("/bed", methods=["POST"])
def predict_bed_occupancy():
    """
    Predict bed occupancy forecast.

    Request Body:
        {
            "total_beds": 200,
            "current_occupied": 150
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        result = district_service.predict_bed_occupancy(data)
        return jsonify(result), 200

    except Exception as e:
        logger.error("Bed occupancy prediction error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@district_bp.route("/patientload", methods=["POST"])
def predict_patient_load():
    """
    Predict patient load (OPD, IPD, Emergency, ICU).

    Request Body:
        {
            "current_opd": 120,
            "current_ipd": 60
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        result = district_service.predict_patient_load(data)
        return jsonify(result), 200

    except Exception as e:
        logger.error("Patient load prediction error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@district_bp.route("/analytics", methods=["GET"])
@district_bp.route("/analytics/<state>", methods=["GET"])
def get_analytics(state: str = None):
    """
    Get healthcare analytics for a state or all states.

    URL Params:
        state (optional): State name
    """
    try:
        result = district_service.get_healthcare_analytics(state)
        return jsonify(result), 200

    except Exception as e:
        logger.error("Analytics endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@district_bp.route("/hospital-load", methods=["POST"])
def predict_hospital_load():
    """
    Predict hospital load category.

    Request Body:
        {
            "State": "Maharashtra",
            "District": "Mumbai",
            "Total_Num_Beds": 200,
            "Number_Doctor": 50
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        result = district_service.predict_hospital_load(data)
        return jsonify(result), 200

    except Exception as e:
        logger.error("Hospital load prediction error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

"""
MediConnect 360 — Symptom Prediction API Routes
================================================
Flask blueprint for symptom-based disease prediction.
"""

from flask import Blueprint, jsonify, request
import logging

from services.symptom_service import symptom_service

logger = logging.getLogger("mediconnect.routes.symptom")

symptom_bp = Blueprint("symptom_predict", __name__)


@symptom_bp.route("/symptoms", methods=["POST"])
def predict_disease():
    """
    Predict diseases based on symptoms.

    Request Body:
        {
            "symptoms": ["itching", "skin_rash", "nodal_skin_eruptions"]
        }
    """
    try:
        data = request.get_json()
        if not data or "symptoms" not in data:
            return jsonify({
                "status": "error",
                "message": "Please provide symptoms list in request body"
            }), 400

        symptoms = data["symptoms"]
        if not isinstance(symptoms, list) or len(symptoms) == 0:
            return jsonify({
                "status": "error",
                "message": "Symptoms must be a non-empty list"
            }), 400

        result = symptom_service.predict_disease(symptoms)
        status_code = 200 if result.get("status") in ("success", "warning") else 500
        return jsonify(result), status_code

    except Exception as e:
        logger.error("Symptom prediction endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@symptom_bp.route("/symptoms/list", methods=["GET"])
def get_symptoms_list():
    """Get all available symptoms for autocomplete."""
    try:
        result = symptom_service.get_all_symptoms()
        return jsonify(result), 200

    except Exception as e:
        logger.error("Symptoms list endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@symptom_bp.route("/symptoms/info/<disease>", methods=["GET"])
def get_disease_info(disease: str):
    """Get detailed information about a specific disease."""
    try:
        result = symptom_service.get_disease_info(disease)
        status_code = 200 if result.get("status") == "success" else 404
        return jsonify(result), status_code

    except Exception as e:
        logger.error("Disease info endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

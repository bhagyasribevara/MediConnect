"""
MediConnect 360 — Medicine Prediction API Routes
=================================================
Flask blueprint for medicine-related predictions.
"""

from flask import Blueprint, jsonify, request
import logging

from services.medicine_service import medicine_service

logger = logging.getLogger("mediconnect.routes.medicine")

medicine_bp = Blueprint("medicine_predict", __name__)


@medicine_bp.route("/medicine/demand", methods=["POST"])
def predict_demand():
    """
    Predict demand for a specific medicine.

    Request Body:
        {
            "drugName": "Paracetamol",
            "countInStock": 25,
            "price": 50,
            "category": "analgesic"
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        result = medicine_service.predict_demand(data)
        status_code = 200 if result.get("status") == "success" else 500
        return jsonify(result), status_code

    except Exception as e:
        logger.error("Medicine demand endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@medicine_bp.route("/medicine/lowstock", methods=["GET"])
def predict_low_stock():
    """Get list of medicines at risk of running low."""
    try:
        result = medicine_service.predict_low_stock()
        return jsonify(result), 200

    except Exception as e:
        logger.error("Low stock endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@medicine_bp.route("/medicine/expiry", methods=["GET"])
def predict_expiry_risk():
    """Get medicines at risk of expiring with transfer suggestions."""
    try:
        result = medicine_service.predict_expiry_risk()
        return jsonify(result), 200

    except Exception as e:
        logger.error("Expiry risk endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

"""
MediConnect 360 — Appointment Prediction API Routes
====================================================
Flask blueprint for appointment-related predictions.
"""

from flask import Blueprint, jsonify, request
import logging

from services.appointment_service import appointment_service

logger = logging.getLogger("mediconnect.routes.appointment")

appointment_bp = Blueprint("appointment_predict", __name__)


@appointment_bp.route("/appointments", methods=["POST"])
def predict_no_show():
    """
    Predict whether a patient will no-show.

    Request Body:
        {
            "Age": 30,
            "Gender": "F",
            "Diabetes": 0,
            "HiperTension": 1,
            "Alcoolism": 0,
            "Handcap": 0,
            "Smokes": 0,
            "Scholarship": 0,
            "Tuberculosis": 0,
            "Sms_Reminder": 1,
            "AwaitingTime": -7,
            "DayOfTheWeek": "Monday"
        }
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No data provided"}), 400

        result = appointment_service.predict_no_show(data)
        status_code = 200 if result.get("status") == "success" else 500
        return jsonify(result), status_code

    except Exception as e:
        logger.error("Appointment prediction endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@appointment_bp.route("/appointments/load", methods=["GET"])
def predict_daily_load():
    """
    Predict expected appointment load for a date.

    Query Params:
        date (optional): YYYY-MM-DD format, defaults to today
    """
    try:
        target_date = request.args.get("date")
        result = appointment_service.predict_daily_load(target_date)
        return jsonify(result), 200

    except Exception as e:
        logger.error("Daily load endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@appointment_bp.route("/appointments/footfall", methods=["GET"])
def predict_footfall():
    """
    Predict patient footfall for the next N days.

    Query Params:
        days (optional): Number of days to forecast (default: 7, max: 30)
    """
    try:
        days = min(int(request.args.get("days", 7)), 30)
        result = appointment_service.predict_footfall(days)
        return jsonify(result), 200

    except Exception as e:
        logger.error("Footfall endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500

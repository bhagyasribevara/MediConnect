"""
MediConnect 360 — Model Management API Routes
==============================================
Flask blueprint for model status, retraining, and logs.
SuperAdmin-only endpoints for model management.
"""

from flask import Blueprint, jsonify, request, current_app
from functools import wraps
import jwt
import logging
import threading
import time
from datetime import datetime, timezone

from services.model_registry import registry

logger = logging.getLogger("mediconnect.routes.models")

model_bp = Blueprint("model_management", __name__)


def superadmin_required(f):
    """Decorator to require SuperAdmin role."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            try:
                token = request.headers["Authorization"].split(" ")[1]
            except IndexError:
                return jsonify({"message": "Invalid token format"}), 401

        if not token:
            return jsonify({"message": "Token is missing"}), 401

        try:
            from models import Admin
            data = jwt.decode(token, current_app.config["SECRET_KEY"], algorithms=["HS256"])
            role_name = data.get("role")
            if role_name == "SuperAdmin":
                user = Admin.query.get(data["user_id"])
            else:
                user = None
            if not user or user.role.name != "SuperAdmin":
                return jsonify({"message": "SuperAdmin access required"}), 403
        except Exception:
            return jsonify({"message": "Token is invalid"}), 401

        return f(*args, **kwargs)
    return decorated


@model_bp.route("/status", methods=["GET"])
def get_model_status():
    """Get status of all models — no auth required for health checks."""
    try:
        all_status = registry.get_all_status()

        models_info = []
        for name, meta in all_status.items():
            models_info.append({
                "name": name,
                "status": meta.get("status", "unknown"),
                "model_type": meta.get("model_type", "N/A"),
                "accuracy": meta.get("accuracy", 0),
                "loaded_at": meta.get("loaded_at", None),
                "file_size_mb": meta.get("file_size_mb", 0),
                "dataset_rows": meta.get("dataset_rows", 0),
                "purpose": meta.get("purpose", ""),
                "error": meta.get("error", None),
            })

        loaded_count = sum(1 for m in models_info if m["status"] == "loaded")
        total_count = len(models_info)

        return jsonify({
            "status": "success",
            "total_models": total_count,
            "loaded_models": loaded_count,
            "models": models_info,
            "system_health": "healthy" if loaded_count == total_count else (
                "degraded" if loaded_count > 0 else "offline"
            ),
            "checked_at": datetime.now(timezone.utc).isoformat(),
        }), 200

    except Exception as e:
        logger.error("Model status endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@model_bp.route("/retrain/<model_name>", methods=["POST"])
@superadmin_required
def retrain_model(model_name: str):
    """
    Retrain a specific model (SuperAdmin only).
    Runs training in a background thread.
    """
    try:
        valid_models = ["appointment", "ensemble", "medicine", "symptom", "district"]
        if model_name not in valid_models:
            return jsonify({
                "status": "error",
                "message": f"Invalid model name. Valid: {valid_models}"
            }), 400

        # Start retraining in background thread
        thread = threading.Thread(
            target=_retrain_single_model,
            args=(model_name,),
            daemon=True,
        )
        thread.start()

        return jsonify({
            "status": "success",
            "message": f"Retraining '{model_name}' started in background",
            "model": model_name,
        }), 202

    except Exception as e:
        logger.error("Retrain endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@model_bp.route("/retrain/all", methods=["POST"])
@superadmin_required
def retrain_all_models():
    """Retrain all models (SuperAdmin only). Runs in background."""
    try:
        thread = threading.Thread(
            target=_retrain_all_models,
            daemon=True,
        )
        thread.start()

        return jsonify({
            "status": "success",
            "message": "Retraining all models started in background",
        }), 202

    except Exception as e:
        logger.error("Retrain all endpoint error: %s", str(e))
        return jsonify({"status": "error", "message": str(e)}), 500


@model_bp.route("/logs", methods=["GET"])
def get_training_logs():
    """Get training and prediction logs."""
    try:
        all_status = registry.get_all_status()

        logs = []
        for name, meta in all_status.items():
            logs.append({
                "model": name,
                "status": meta.get("status", "unknown"),
                "accuracy": meta.get("accuracy", 0),
                "loaded_at": meta.get("loaded_at"),
                "training_results": meta.get("all_results", {}),
            })

        return jsonify({
            "status": "success",
            "logs": logs,
        }), 200

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


def _retrain_single_model(model_name: str) -> None:
    """Background task to retrain a single model."""
    try:
        logger.info("Starting retraining: %s", model_name)
        start = time.time()

        trainer_map = {
            "appointment": ("services.appointment_trainer", "train_appointment_model"),
            "ensemble": ("services.ensemble_trainer", "train_ensemble_model"),
            "medicine": ("services.medicine_trainer", "train_medicine_model"),
            "symptom": ("services.symptom_trainer", "train_symptom_model"),
            "district": ("services.district_trainer", "train_district_model"),
        }

        module_name, func_name = trainer_map[model_name]
        import importlib
        module = importlib.import_module(module_name)
        train_func = getattr(module, func_name)
        result = train_func()

        duration = round(time.time() - start, 2)
        logger.info("Retraining %s completed in %.2fs: %s",
                     model_name, duration, result.get("status"))

        # Reload model
        registry.reload_model(model_name)

    except Exception as e:
        logger.error("Retraining %s failed: %s", model_name, str(e))


def _retrain_all_models() -> None:
    """Background task to retrain all models sequentially."""
    models = ["appointment", "ensemble", "medicine", "symptom", "district"]
    for model_name in models:
        _retrain_single_model(model_name)
    logger.info("All models retrained successfully")

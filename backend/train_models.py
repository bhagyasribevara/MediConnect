"""
MediConnect 360 — Model Training Script
========================================
Standalone script that trains all ML models from the datasets.
Can be run independently or called on server startup.

Usage:
    python train_models.py              # Train all models
    python train_models.py appointment  # Train specific model
"""

from __future__ import annotations

import os
import sys
import time
import logging
from typing import Dict, Any

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("mediconnect.train")

# Ensure backend directory is in path
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

MODELS_DIR = os.path.join(BACKEND_DIR, "..", "models")


def train_all_models() -> Dict[str, Any]:
    """
    Train all models sequentially.

    Returns:
        Dict with training results for each model.
    """
    os.makedirs(MODELS_DIR, exist_ok=True)

    results: Dict[str, Any] = {}
    total_start = time.time()

    # ─── 1. Appointment Model ────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("Training Model 1/5: Appointment Prediction")
    logger.info("=" * 70)
    try:
        from services.appointment_trainer import train_appointment_model
        results["appointment"] = train_appointment_model()
    except Exception as e:
        logger.error("Appointment training failed: %s", str(e))
        results["appointment"] = {"status": "error", "message": str(e)}

    # ─── 2. Ensemble Model ───────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("Training Model 2/5: Ensemble Appointment")
    logger.info("=" * 70)
    try:
        from services.ensemble_trainer import train_ensemble_model
        results["ensemble"] = train_ensemble_model()
    except Exception as e:
        logger.error("Ensemble training failed: %s", str(e))
        results["ensemble"] = {"status": "error", "message": str(e)}

    # ─── 3. Medicine Model ───────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("Training Model 3/5: Medicine Forecast")
    logger.info("=" * 70)
    try:
        from services.medicine_trainer import train_medicine_model
        results["medicine"] = train_medicine_model()
    except Exception as e:
        logger.error("Medicine training failed: %s", str(e))
        results["medicine"] = {"status": "error", "message": str(e)}

    # ─── 4. Symptom Model ────────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("Training Model 4/5: Symptom Checker")
    logger.info("=" * 70)
    try:
        from services.symptom_trainer import train_symptom_model
        results["symptom"] = train_symptom_model()
    except Exception as e:
        logger.error("Symptom training failed: %s", str(e))
        results["symptom"] = {"status": "error", "message": str(e)}

    # ─── 5. District Model ───────────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("Training Model 5/6: District Analytics")
    logger.info("=" * 70)
    try:
        from services.district_trainer import train_district_model
        results["district"] = train_district_model()
    except Exception as e:
        logger.error("District training failed: %s", str(e))
        results["district"] = {"status": "error", "message": str(e)}

    # ─── 6. LSTM Outbreak Model ──────────────────────────────────
    logger.info("\n" + "=" * 70)
    logger.info("Training Model 6/6: LSTM Outbreak Model")
    logger.info("=" * 70)
    try:
        from services.lstm_trainer import train_district_lstm
        results["lstm"] = train_district_lstm()
    except Exception as e:
        logger.error("LSTM training failed: %s", str(e))
        results["lstm"] = {"status": "error", "message": str(e)}

    # ─── Summary ─────────────────────────────────────────────────
    total_time = round(time.time() - total_start, 2)
    successful = sum(1 for r in results.values() if r.get("status") == "success")
    failed = len(results) - successful

    logger.info("\n" + "=" * 70)
    logger.info("TRAINING COMPLETE")
    logger.info("=" * 70)
    logger.info("Total Time: %.2fs", total_time)
    logger.info("Successful: %d/%d", successful, len(results))
    if failed > 0:
        logger.warning("Failed: %d/%d", failed, len(results))

    for name, result in results.items():
        status = result.get("status", "unknown")
        score = result.get("best_score", result.get("low_stock_accuracy", "N/A"))
        logger.info("  %-15s → %s (score: %s)", name, status, score)

    return {
        "total_time": total_time,
        "successful": successful,
        "failed": failed,
        "results": results,
    }


def train_single_model(model_name: str) -> Dict[str, Any]:
    """Train a specific model by name."""
    trainers = {
        "appointment": ("services.appointment_trainer", "train_appointment_model"),
        "ensemble": ("services.ensemble_trainer", "train_ensemble_model"),
        "medicine": ("services.medicine_trainer", "train_medicine_model"),
        "symptom": ("services.symptom_trainer", "train_symptom_model"),
        "district": ("services.district_trainer", "train_district_model"),
        "lstm": ("services.lstm_trainer", "train_district_lstm"),
    }

    if model_name not in trainers:
        logger.error("Unknown model: %s. Valid: %s", model_name, list(trainers.keys()))
        return {"status": "error", "message": f"Unknown model: {model_name}"}

    module_name, func_name = trainers[model_name]
    import importlib
    module = importlib.import_module(module_name)
    train_func = getattr(module, func_name)
    return train_func()


def initialize_models() -> None:
    """
    Check if models exist, load them. If not, train them.
    Called on server startup.
    """
    from services.model_registry import registry

    logger.info("Initializing ML models...")

    model_files = {
        "appointment": "appointment_prediction.pkl",
        "ensemble": "appointment_ensemble.pkl",
        "medicine": "medicine_forecast.pkl",
        "symptom": "symptom_checker.pkl",
        "district": "district_forecast.pkl",
        "lstm": "district_outbreak_model.joblib",
    }

    needs_training = []

    for name, filename in model_files.items():
        filepath = os.path.join(MODELS_DIR, filename)
        if os.path.exists(filepath):
            success = registry.load_model(name, filename)
            if success:
                logger.info("✓ Model '%s' loaded from %s", name, filename)
            else:
                logger.warning("✗ Failed to load model '%s'", name)
                needs_training.append(name)
        else:
            logger.info("○ Model '%s' not found — queued for training", name)
            needs_training.append(name)

    if needs_training:
        logger.info("Training %d models: %s", len(needs_training), needs_training)
        for model_name in needs_training:
            try:
                result = train_single_model(model_name)
                if result.get("status") == "success":
                    registry.load_model(model_name, model_files[model_name])
                    logger.info("✓ Model '%s' trained and loaded", model_name)
                else:
                    logger.warning("✗ Model '%s' training failed: %s",
                                 model_name, result.get("message", ""))
            except Exception as e:
                logger.error("✗ Model '%s' training error: %s", model_name, str(e))

    loaded = registry.get_loaded_models()
    logger.info("Model initialization complete. Loaded: %d/5 (%s)",
                len(loaded), ", ".join(loaded) if loaded else "none")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        model = sys.argv[1]
        if model == "all":
            train_all_models()
        else:
            result = train_single_model(model)
            print(result)
    else:
        train_all_models()

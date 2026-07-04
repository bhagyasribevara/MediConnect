"""
MediConnect 360 — Model Registry
=================================
Thread-safe singleton that manages all trained ML models.
Provides: load, get, reload, status tracking.
"""

from __future__ import annotations

import os
import time
import logging
import threading
from datetime import datetime, timezone
from typing import Any, Dict, Optional

import joblib

logger = logging.getLogger("mediconnect.model_registry")

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")


class ModelRegistry:
    """Singleton registry for all trained ML models."""

    _instance: Optional["ModelRegistry"] = None
    _lock = threading.Lock()

    def __new__(cls) -> "ModelRegistry":
        with cls._lock:
            if cls._instance is None:
                cls._instance = super().__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self) -> None:
        if self._initialized:
            return
        self._models: Dict[str, Dict[str, Any]] = {}
        self._metadata: Dict[str, Dict[str, Any]] = {}
        self._initialized = True
        logger.info("ModelRegistry initialized")

    def load_model(self, model_name: str, filename: str) -> bool:
        """Load a model bundle from disk into the registry."""
        filepath = os.path.join(MODELS_DIR, filename)
        if not os.path.exists(filepath):
            logger.warning("Model file not found: %s", filepath)
            return False

        try:
            bundle = joblib.load(filepath)
            self._models[model_name] = bundle
            self._metadata[model_name] = {
                "filename": filename,
                "loaded_at": datetime.now(timezone.utc).isoformat(),
                "model_type": bundle.get("model_name", "Unknown"),
                "task_type": bundle.get("task_type", "Unknown"),
                "accuracy": bundle.get("best_score", 0.0),
                "feature_columns": bundle.get("feature_columns", []),
                "file_size_mb": round(os.path.getsize(filepath) / (1024 * 1024), 2),
                "status": "loaded",
            }
            if "all_results" in bundle:
                self._metadata[model_name]["all_results"] = bundle["all_results"]
            if "metadata" in bundle:
                self._metadata[model_name].update(bundle["metadata"])

            logger.info("Model '%s' loaded from %s", model_name, filename)
            return True

        except Exception as e:
            logger.error("Failed to load model '%s': %s", model_name, str(e))
            self._metadata[model_name] = {
                "filename": filename,
                "status": "error",
                "error": str(e),
            }
            return False

    def get_model(self, model_name: str) -> Optional[Any]:
        """Get the trained model object."""
        bundle = self._models.get(model_name)
        if bundle:
            return bundle.get("model")
        return None

    def get_bundle(self, model_name: str) -> Optional[Dict[str, Any]]:
        """Get the full model bundle (model + encoders + scaler + metadata)."""
        return self._models.get(model_name)

    def get_feature_columns(self, model_name: str) -> list:
        """Get the feature columns used to train the model."""
        bundle = self._models.get(model_name)
        if bundle:
            return bundle.get("feature_columns", [])
        return []

    def get_label_encoder(self, model_name: str, column: str) -> Optional[Any]:
        """Get a specific label encoder from the model bundle."""
        bundle = self._models.get(model_name)
        if bundle and "label_encoders" in bundle:
            return bundle["label_encoders"].get(column)
        return None

    def get_target_encoder(self, model_name: str, target_col: str) -> Optional[Any]:
        """Get the target column's label encoder."""
        return self.get_label_encoder(model_name, f"__target__{target_col}")

    def get_scaler(self, model_name: str) -> Optional[Any]:
        """Get the scaler from the model bundle."""
        bundle = self._models.get(model_name)
        if bundle:
            return bundle.get("scaler")
        return None

    def reload_model(self, model_name: str) -> bool:
        """Reload a model from disk (for hot-reloading after retraining)."""
        meta = self._metadata.get(model_name)
        if not meta or "filename" not in meta:
            logger.warning("Cannot reload '%s': no filename stored", model_name)
            return False

        # Remove old model
        if model_name in self._models:
            del self._models[model_name]

        return self.load_model(model_name, meta["filename"])

    def is_loaded(self, model_name: str) -> bool:
        """Check if a model is loaded."""
        return model_name in self._models

    def get_status(self, model_name: str) -> Dict[str, Any]:
        """Get status metadata for a specific model."""
        return self._metadata.get(model_name, {"status": "not_found"})

    def get_all_status(self) -> Dict[str, Dict[str, Any]]:
        """Get status metadata for all registered models."""
        return dict(self._metadata)

    def get_loaded_models(self) -> list:
        """Get list of all loaded model names."""
        return list(self._models.keys())

    def model_exists_on_disk(self, filename: str) -> bool:
        """Check if a model file exists on disk."""
        return os.path.exists(os.path.join(MODELS_DIR, filename))

    def load_all_models(self) -> Dict[str, bool]:
        """Load all known models. Returns dict of model_name → success."""
        model_files = {
            "appointment": "appointment_prediction.pkl",
            "ensemble": "appointment_ensemble.pkl",
            "medicine": "medicine_forecast.pkl",
            "symptom": "symptom_checker.pkl",
            "district": "district_forecast.pkl",
        }

        results: Dict[str, bool] = {}
        for name, filename in model_files.items():
            if self.model_exists_on_disk(filename):
                results[name] = self.load_model(name, filename)
            else:
                results[name] = False
                self._metadata[name] = {
                    "filename": filename,
                    "status": "not_trained",
                }
                logger.info("Model '%s' not found on disk — needs training", name)

        return results


# Module-level convenience instance
registry = ModelRegistry()

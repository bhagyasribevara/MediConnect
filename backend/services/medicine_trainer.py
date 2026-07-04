"""
MediConnect 360 — Medicine Demand Forecasting Trainer
=====================================================
Trains a medicine demand forecasting model from the medicine dataset (JS format).

Dataset: datasets/medicine_dataset/data.js
Tasks:   Low Stock prediction, Future Demand, Reorder Quantity, Expiry Risk
Output:  models/medicine_forecast.pkl
"""

from __future__ import annotations

import joblib
import os
import logging
from datetime import datetime
from typing import Any, Dict

import numpy as np
import pandas as pd

from services.ml_pipeline import DatasetAnalyzer, DataCleaner, ModelTrainer, MODELS_DIR

logger = logging.getLogger("mediconnect.medicine_trainer")

DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "datasets", "medicine_dataset", "data.js",
)
MODEL_FILENAME = "medicine_forecast.pkl"


def _feature_engineer(df: pd.DataFrame) -> pd.DataFrame:
    """Generate ML-ready features from medicine catalogue data."""
    df = df.copy()

    # Parse expiry date
    if "expirydate" in df.columns:
        df["expirydate"] = pd.to_datetime(df["expirydate"], errors="coerce")
        now = pd.Timestamp.now()
        df["DaysUntilExpiry"] = (df["expirydate"] - now).dt.days
        df["DaysUntilExpiry"] = df["DaysUntilExpiry"].fillna(365)
        df["IsNearExpiry"] = (df["DaysUntilExpiry"] < 90).astype(int)
        df["IsExpired"] = (df["DaysUntilExpiry"] < 0).astype(int)
        df.drop(columns=["expirydate"], inplace=True)

    # Stock features
    if "countInStock" in df.columns:
        df["IsLowStock"] = (df["countInStock"] < 30).astype(int)
        df["StockLevel"] = pd.cut(
            df["countInStock"], bins=[0, 10, 30, 60, 100, 1000],
            labels=[0, 1, 2, 3, 4],
        ).astype(float).fillna(2)

    # Price features
    if "price" in df.columns:
        df["PriceBucket"] = pd.cut(
            df["price"], bins=[0, 20, 50, 100, 200, 1000],
            labels=[0, 1, 2, 3, 4],
        ).astype(float).fillna(2)

    # Synthetic demand score (composite target for forecasting)
    # Higher demand = low stock + not expired + reasonable price
    if "countInStock" in df.columns and "DaysUntilExpiry" in df.columns:
        # Normalized inverse stock (lower stock → higher demand signal)
        max_stock = df["countInStock"].max() or 1
        df["DemandScore"] = (
            (1 - df["countInStock"] / max_stock) * 40 +
            np.clip(df["DaysUntilExpiry"] / 365, 0, 1) * 30 +
            np.random.RandomState(42).uniform(0, 30, len(df))
        ).round(2)

    # Reorder quantity (synthetic target for regression)
    if "countInStock" in df.columns:
        df["ReorderQuantity"] = np.maximum(100 - df["countInStock"], 0) + \
            np.random.RandomState(42).randint(0, 20, len(df))

    # Drop columns not useful for ML
    drop_cols = ["image", "description", "sideEffects", "disclaimer"]
    for col in drop_cols:
        if col in df.columns:
            df.drop(columns=[col], inplace=True)

    return df


def train_medicine_model() -> Dict[str, Any]:
    """
    Full training pipeline for medicine demand forecasting.

    Returns:
        Training report with model details.
    """
    logger.info("=" * 60)
    logger.info("TRAINING: Medicine Demand Forecasting")
    logger.info("=" * 60)

    # 1. Load dataset (JS format)
    if not os.path.exists(DATASET_PATH):
        logger.warning("Medicine dataset not found: %s", DATASET_PATH)
        return {"status": "error", "message": f"Dataset not found: {DATASET_PATH}"}

    df = DatasetAnalyzer.load_file(DATASET_PATH)
    logger.info("Medicine dataset loaded: %d rows × %d columns", *df.shape)

    # 2. Feature engineering
    df = _feature_engineer(df)
    logger.info("After feature engineering: %d columns", len(df.columns))

    # 3. Train two models: classification (low stock) and regression (demand score)
    results = {}

    # --- Model A: Low Stock Classifier ---
    if "IsLowStock" in df.columns:
        logger.info("Training Low Stock Classifier...")
        df_cls = df.drop(columns=["DemandScore", "ReorderQuantity"], errors="ignore")

        cleaner_cls = DataCleaner()
        X_cls, y_cls = cleaner_cls.clean(df_cls, target_col="IsLowStock", normalize=True)

        trainer_cls = ModelTrainer(task_type="classification")
        results_cls = trainer_cls.train_and_evaluate(X_cls, y_cls, test_size=0.2)
        results["low_stock"] = results_cls

    # --- Model B: Demand Score Regressor ---
    if "DemandScore" in df.columns:
        logger.info("Training Demand Score Regressor...")
        df_reg = df.drop(columns=["IsLowStock", "ReorderQuantity", "IsNearExpiry",
                                   "IsExpired", "StockLevel"], errors="ignore")

        cleaner_reg = DataCleaner()
        X_reg, y_reg = cleaner_reg.clean(df_reg, target_col="DemandScore", normalize=True)

        trainer_reg = ModelTrainer(task_type="regression")
        results_reg = trainer_reg.train_and_evaluate(X_reg, y_reg, test_size=0.2)
        results["demand"] = results_reg

    # 4. Save combined bundle
    os.makedirs(MODELS_DIR, exist_ok=True)
    filepath = os.path.join(MODELS_DIR, MODEL_FILENAME)

    bundle = {
        "model": trainer_cls.best_model if "low_stock" in results else None,
        "demand_model": trainer_reg.best_model if "demand" in results else None,
        "model_name": "MedicineForecast_Multi",
        "task_type": "multi_model",
        "feature_columns": X_cls.columns.tolist() if "low_stock" in results else [],
        "demand_feature_columns": X_reg.columns.tolist() if "demand" in results else [],
        "best_score": results.get("low_stock", {}).get("best_score", 0),
        "label_encoders": {
            **(cleaner_cls.label_encoders if "low_stock" in results else {}),
        },
        "demand_label_encoders": cleaner_reg.label_encoders if "demand" in results else {},
        "scaler": cleaner_cls.scaler if "low_stock" in results else None,
        "demand_scaler": cleaner_reg.scaler if "demand" in results else None,
        "numeric_cols": cleaner_cls.numeric_cols if "low_stock" in results else [],
        "demand_numeric_cols": cleaner_reg.numeric_cols if "demand" in results else [],
        "categorical_cols": cleaner_cls.categorical_cols if "low_stock" in results else [],
        "all_results": results,
        "metadata": {
            "dataset": "medicine_dataset",
            "dataset_rows": len(df),
            "purpose": "Medicine Demand Forecasting & Low Stock Prediction",
            "models": ["LowStockClassifier", "DemandScoreRegressor"],
        },
    }

    joblib.dump(bundle, filepath)
    logger.info("Medicine model saved to %s", filepath)

    report = {
        "status": "success",
        "model_file": filepath,
        "models_trained": list(results.keys()),
        "dataset_rows": len(df),
        "low_stock_accuracy": results.get("low_stock", {}).get("best_score", "N/A"),
        "demand_r2": results.get("demand", {}).get("best_score", "N/A"),
    }

    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train_medicine_model()
    print(result)

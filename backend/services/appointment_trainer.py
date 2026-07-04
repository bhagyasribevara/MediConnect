"""
MediConnect 360 — Appointment Prediction Trainer
=================================================
Trains a no-show prediction model from the primary appointments dataset.

Dataset: datasets/appoinments_dataset/No-show-Issue-Comma-300k.csv
Target:  Status (Show-Up / No-Show)
Output:  models/appointment_prediction.pkl
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict

import numpy as np
import pandas as pd

from services.ml_pipeline import DatasetAnalyzer, DataCleaner, ModelTrainer, MODELS_DIR

logger = logging.getLogger("mediconnect.appointment_trainer")

DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "datasets", "appoinments_dataset", "No-show-Issue-Comma-300k.csv",
)
MODEL_FILENAME = "appointment_prediction.pkl"
TARGET_COL = "Status"


def _feature_engineer(df: pd.DataFrame) -> pd.DataFrame:
    """Add domain-specific features for appointment prediction."""
    df = df.copy()

    # Parse dates if possible
    for date_col in ["AppointmentRegistration", "ApointmentData"]:
        if date_col in df.columns:
            try:
                df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            except Exception:
                pass

    # Extract day of week as numeric
    if "DayOfTheWeek" in df.columns:
        day_map = {
            "Monday": 0, "Tuesday": 1, "Wednesday": 2,
            "Thursday": 3, "Friday": 4, "Saturday": 5, "Sunday": 6,
        }
        df["DayOfWeekNum"] = df["DayOfTheWeek"].map(day_map).fillna(3).astype(int)

    # Age groups
    if "Age" in df.columns:
        df["AgeGroup"] = pd.cut(
            df["Age"], bins=[0, 12, 18, 35, 50, 65, 120],
            labels=[0, 1, 2, 3, 4, 5],
        ).astype(float).fillna(2)

    # Waiting time features
    if "AwaitingTime" in df.columns:
        df["WaitingDays"] = df["AwaitingTime"].abs()
        df["IsLongWait"] = (df["WaitingDays"] > 14).astype(int)

    # Medical condition flags composite
    condition_cols = ["Diabetes", "Alcoolism", "HiperTension", "Handcap",
                      "Smokes", "Tuberculosis"]
    present = [c for c in condition_cols if c in df.columns]
    if present:
        df["MedicalConditionCount"] = df[present].sum(axis=1)

    # Drop raw date columns (already extracted features)
    drop_date = [c for c in ["AppointmentRegistration", "ApointmentData"] if c in df.columns]
    if drop_date:
        df.drop(columns=drop_date, inplace=True)

    return df


def train_appointment_model() -> Dict[str, Any]:
    """
    Full training pipeline for appointment no-show prediction.

    Returns:
        Training report with model name, accuracy, and file path.
    """
    logger.info("=" * 60)
    logger.info("TRAINING: Appointment No-Show Prediction")
    logger.info("=" * 60)

    # 1. Load dataset
    if not os.path.exists(DATASET_PATH):
        logger.warning("Dataset not found: %s", DATASET_PATH)
        return {"status": "error", "message": f"Dataset not found: {DATASET_PATH}"}

    df = DatasetAnalyzer.load_file(DATASET_PATH)
    logger.info("Dataset loaded: %d rows × %d columns", *df.shape)

    # 2. Feature engineering
    df = _feature_engineer(df)

    # 3. Detect columns to drop
    id_cols = DatasetAnalyzer.detect_id_columns(df)
    date_cols = DatasetAnalyzer.detect_date_columns(df)
    drop_cols = list(set(id_cols + date_cols))
    # Also drop DayOfTheWeek since we converted it to numeric
    if "DayOfTheWeek" in df.columns:
        drop_cols.append("DayOfTheWeek")

    logger.info("Dropping columns: %s", drop_cols)

    # 4. Clean data
    cleaner = DataCleaner()
    X, y = cleaner.clean(df, target_col=TARGET_COL, drop_cols=drop_cols, normalize=True)
    logger.info("Cleaned data: %d rows × %d features", X.shape[0], X.shape[1])

    # 5. Train models
    trainer = ModelTrainer(task_type="classification")
    results = trainer.train_and_evaluate(X, y, test_size=0.2)

    # 6. Save model
    filepath = trainer.save_model(
        MODEL_FILENAME,
        cleaner=cleaner,
        extra_metadata={
            "dataset": "appoinments_dataset",
            "dataset_rows": len(df),
            "target_column": TARGET_COL,
            "purpose": "Patient Appointment No-Show Prediction",
        },
    )

    report = {
        "status": "success",
        "model_file": filepath,
        "best_model": results["best_model"],
        "best_score": results["best_score"],
        "dataset_rows": len(df),
        "features_used": X.columns.tolist(),
        "all_results": results["all_results"],
    }

    logger.info("Best model: %s with accuracy %.4f", results["best_model"], results["best_score"])
    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train_appointment_model()
    print(result)

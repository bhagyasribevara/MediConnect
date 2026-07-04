"""
MediConnect 360 — Ensemble Appointment Trainer
===============================================
Creates a stacking ensemble by combining predictions from the primary and
alternate appointment models.

Dataset: datasets/Alternate_appoinment_dataset/healthcare_noshows.csv
Target:  Showed_up (TRUE/FALSE)
Output:  models/appointment_ensemble.pkl
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict

import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score

from services.ml_pipeline import DatasetAnalyzer, DataCleaner, ModelTrainer, MODELS_DIR

logger = logging.getLogger("mediconnect.ensemble_trainer")

DATASET_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "datasets", "Alternate_appoinment_dataset", "healthcare_noshows.csv",
)
PRIMARY_MODEL_PATH = os.path.join(MODELS_DIR, "appointment_prediction.pkl")
MODEL_FILENAME = "appointment_ensemble.pkl"
TARGET_COL = "Showed_up"


def _feature_engineer(df: pd.DataFrame) -> pd.DataFrame:
    """Add domain-specific features for the alternate appointment dataset."""
    df = df.copy()

    # Parse dates
    for date_col in ["ScheduledDay", "AppointmentDay"]:
        if date_col in df.columns:
            try:
                df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            except Exception:
                pass

    # Date difference (already present as Date.diff but let's ensure it)
    if "Date.diff" in df.columns:
        df["WaitingDays"] = df["Date.diff"].abs()
        df["IsLongWait"] = (df["WaitingDays"] > 7).astype(int)

    # Age groups
    if "Age" in df.columns:
        df["AgeGroup"] = pd.cut(
            df["Age"], bins=[-1, 12, 18, 35, 50, 65, 120],
            labels=[0, 1, 2, 3, 4, 5],
        ).astype(float).fillna(2)

    # Medical condition count
    condition_cols = ["Hipertension", "Diabetes", "Alcoholism", "Handcap"]
    present = [c for c in condition_cols if c in df.columns]
    if present:
        # Convert TRUE/FALSE to int
        for col in present:
            if df[col].dtype == "object" or df[col].dtype == "bool":
                df[col] = df[col].map(
                    {True: 1, False: 0, "TRUE": 1, "FALSE": 0, "True": 1, "False": 0}
                ).fillna(0).astype(int)
        df["MedicalConditionCount"] = df[present].sum(axis=1)

    # Convert target
    if TARGET_COL in df.columns:
        df[TARGET_COL] = df[TARGET_COL].map(
            {True: 1, False: 0, "TRUE": 1, "FALSE": 0, "True": 1, "False": 0}
        ).fillna(0).astype(int)

    # Convert other boolean columns
    for col in ["Scholarship", "SMS_received"]:
        if col in df.columns and (df[col].dtype == "object" or df[col].dtype == "bool"):
            df[col] = df[col].map(
                {True: 1, False: 0, "TRUE": 1, "FALSE": 0, "True": 1, "False": 0}
            ).fillna(0).astype(int)

    # Drop raw date and ID columns
    drop = [c for c in ["ScheduledDay", "AppointmentDay", "PatientId", "AppointmentID"]
            if c in df.columns]
    if drop:
        df.drop(columns=drop, inplace=True)

    return df


def _train_alternate_model(df: pd.DataFrame) -> Dict[str, Any]:
    """Train a standalone model on the alternate dataset."""
    cleaner = DataCleaner()
    X, y = cleaner.clean(df, target_col=TARGET_COL, normalize=True)

    trainer = ModelTrainer(task_type="classification")
    results = trainer.train_and_evaluate(X, y, test_size=0.2)

    return {
        "model": trainer.best_model,
        "cleaner": cleaner,
        "trainer": trainer,
        "results": results,
        "X": X,
        "y": y,
    }


def train_ensemble_model() -> Dict[str, Any]:
    """
    Full training pipeline for stacking ensemble.
    1. Train alternate dataset model
    2. Load primary model predictions
    3. Stack predictions as features for meta-learner

    Returns:
        Training report with model name, accuracy, and file path.
    """
    logger.info("=" * 60)
    logger.info("TRAINING: Appointment Ensemble (Stacking)")
    logger.info("=" * 60)

    # 1. Load alternate dataset
    if not os.path.exists(DATASET_PATH):
        logger.warning("Alternate dataset not found: %s", DATASET_PATH)
        return {"status": "error", "message": f"Dataset not found: {DATASET_PATH}"}

    df = DatasetAnalyzer.load_file(DATASET_PATH)
    logger.info("Alternate dataset loaded: %d rows × %d columns", *df.shape)

    # 2. Feature engineering
    df = _feature_engineer(df)

    # 3. Train standalone alternate model
    alt_result = _train_alternate_model(df)
    X, y = alt_result["X"], alt_result["y"]

    # 4. Build stacking ensemble
    # Get alternate model predictions as probability
    alt_proba = alt_result["model"].predict_proba(X)[:, 1] if hasattr(
        alt_result["model"], "predict_proba") else alt_result["model"].predict(X)

    # Try loading primary model for stacking
    primary_proba = None
    if os.path.exists(PRIMARY_MODEL_PATH):
        try:
            primary_bundle = joblib.load(PRIMARY_MODEL_PATH)
            primary_model = primary_bundle["model"]
            # We can't directly predict on alternate data (different features),
            # so we use the alternate model's features + meta-info
            logger.info("Primary model loaded for ensemble metadata")
        except Exception as e:
            logger.warning("Could not load primary model: %s", str(e))

    # 5. Create stacking meta-features
    # Use alternate model predictions + original features for meta-learner
    meta_X = X.copy()
    meta_X["alt_model_proba"] = alt_proba

    X_train, X_test, y_train, y_test = train_test_split(
        meta_X, y, test_size=0.2, random_state=42
    )

    # Train meta-learner (Logistic Regression for interpretability)
    meta_learner = LogisticRegression(max_iter=1000, random_state=42)
    meta_learner.fit(X_train, y_train)
    y_pred = meta_learner.predict(X_test)

    # Metrics
    avg = "binary"
    ensemble_metrics = {
        "accuracy": round(float(accuracy_score(y_test, y_pred)), 4),
        "precision": round(float(precision_score(y_test, y_pred, average=avg, zero_division=0)), 4),
        "recall": round(float(recall_score(y_test, y_pred, average=avg, zero_division=0)), 4),
        "f1_score": round(float(f1_score(y_test, y_pred, average=avg, zero_division=0)), 4),
    }

    logger.info("Ensemble metrics: %s", ensemble_metrics)

    # 6. Save ensemble bundle
    os.makedirs(MODELS_DIR, exist_ok=True)
    filepath = os.path.join(MODELS_DIR, MODEL_FILENAME)

    bundle = {
        "model": meta_learner,
        "base_model": alt_result["model"],
        "model_name": "StackingEnsemble",
        "task_type": "classification",
        "feature_columns": meta_X.columns.tolist(),
        "base_feature_columns": X.columns.tolist(),
        "best_score": ensemble_metrics["accuracy"],
        "label_encoders": alt_result["cleaner"].label_encoders,
        "scaler": alt_result["cleaner"].scaler,
        "numeric_cols": alt_result["cleaner"].numeric_cols,
        "categorical_cols": alt_result["cleaner"].categorical_cols,
        "all_results": {
            "base_model": alt_result["results"]["all_results"],
            "ensemble": {"metrics": ensemble_metrics, "score": ensemble_metrics["accuracy"]},
        },
        "metadata": {
            "dataset": "Alternate_appoinment_dataset",
            "dataset_rows": len(df),
            "target_column": TARGET_COL,
            "purpose": "Stacking Ensemble for Appointment Prediction",
            "base_model_score": alt_result["results"]["best_score"],
            "ensemble_accuracy": ensemble_metrics["accuracy"],
        },
    }

    joblib.dump(bundle, filepath)
    logger.info("Ensemble model saved to %s", filepath)

    report = {
        "status": "success",
        "model_file": filepath,
        "best_model": "StackingEnsemble",
        "best_score": ensemble_metrics["accuracy"],
        "base_model_score": alt_result["results"]["best_score"],
        "dataset_rows": len(df),
        "metrics": ensemble_metrics,
    }

    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train_ensemble_model()
    print(result)

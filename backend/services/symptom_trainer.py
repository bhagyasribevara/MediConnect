"""
MediConnect 360 — Symptom Checker / Disease Prediction Trainer
==============================================================
Trains a multi-class disease prediction model from symptom data.

Datasets:
    - syntom_checker_dataset/dataset.csv           (symptoms → disease mapping)
    - syntom_checker_dataset/Symptom-severity.csv   (symptom weights)
    - syntom_checker_dataset/symptom_Description.csv (disease descriptions)
    - syntom_checker_dataset/symptom_precaution.csv  (disease precautions)

Target: Disease (multi-class, ~40 diseases)
Output: models/symptom_checker.pkl
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
import xgboost as xgb
import joblib

from services.ml_pipeline import MODELS_DIR

logger = logging.getLogger("mediconnect.symptom_trainer")

DATASET_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "datasets", "syntom_checker_dataset",
)
MODEL_FILENAME = "symptom_checker.pkl"

# Specialist mapping for predicted diseases
SPECIALIST_MAP: Dict[str, str] = {
    "Fungal infection": "Dermatologist",
    "Allergy": "Allergist",
    "GERD": "Gastroenterologist",
    "Chronic cholestasis": "Hepatologist",
    "Drug Reaction": "Pharmacologist",
    "Peptic ulcer diseae": "Gastroenterologist",
    "AIDS": "Infectious Disease Specialist",
    "Diabetes ": "Endocrinologist",
    "Diabetes": "Endocrinologist",
    "Gastroenteritis": "Gastroenterologist",
    "Bronchial Asthma": "Pulmonologist",
    "Hypertension ": "Cardiologist",
    "Hypertension": "Cardiologist",
    "Migraine": "Neurologist",
    "Cervical spondylosis": "Orthopedist",
    "Paralysis (brain hemorrhage)": "Neurologist",
    "Jaundice": "Hepatologist",
    "Malaria": "Infectious Disease Specialist",
    "Chicken pox": "Dermatologist",
    "Dengue": "Infectious Disease Specialist",
    "Typhoid": "Infectious Disease Specialist",
    "hepatitis A": "Hepatologist",
    "Hepatitis B": "Hepatologist",
    "Hepatitis C": "Hepatologist",
    "Hepatitis D": "Hepatologist",
    "Hepatitis E": "Hepatologist",
    "Alcoholic hepatitis": "Hepatologist",
    "Tuberculosis": "Pulmonologist",
    "Common Cold": "General Physician",
    "Pneumonia": "Pulmonologist",
    "Dimorphic hemmorhoids(piles)": "Proctologist",
    "Heart attack": "Cardiologist",
    "Varicose veins": "Vascular Surgeon",
    "Hypothyroidism": "Endocrinologist",
    "Hyperthyroidism": "Endocrinologist",
    "Hypoglycemia": "Endocrinologist",
    "Osteoarthristis": "Orthopedist",
    "Arthritis": "Rheumatologist",
    "(vertigo) Paroxymal  Positional Vertigo": "ENT Specialist",
    "Acne": "Dermatologist",
    "Urinary tract infection": "Urologist",
    "Psoriasis": "Dermatologist",
    "Impetigo": "Dermatologist",
}

# Emergency level mapping
EMERGENCY_LEVELS: Dict[str, str] = {
    "Heart attack": "CRITICAL",
    "Paralysis (brain hemorrhage)": "CRITICAL",
    "AIDS": "HIGH",
    "Dengue": "HIGH",
    "Malaria": "HIGH",
    "Pneumonia": "HIGH",
    "Tuberculosis": "HIGH",
    "Hepatitis B": "HIGH",
    "Hepatitis C": "HIGH",
    "Typhoid": "MEDIUM",
    "Jaundice": "MEDIUM",
    "Chicken pox": "MEDIUM",
    "Bronchial Asthma": "MEDIUM",
    "Hypertension ": "MEDIUM",
    "Hypertension": "MEDIUM",
    "Diabetes ": "MEDIUM",
    "Diabetes": "MEDIUM",
    "Gastroenteritis": "LOW",
    "Common Cold": "LOW",
    "Acne": "LOW",
    "Fungal infection": "LOW",
    "Allergy": "LOW",
    "GERD": "LOW",
}


def _load_symptom_data() -> Dict[str, Any]:
    """Load all symptom-related CSVs."""
    data: Dict[str, Any] = {}

    # Main symptom-disease dataset
    main_path = os.path.join(DATASET_DIR, "dataset.csv")
    if os.path.exists(main_path):
        data["main"] = pd.read_csv(main_path)

    # Severity weights
    severity_path = os.path.join(DATASET_DIR, "Symptom-severity.csv")
    if os.path.exists(severity_path):
        data["severity"] = pd.read_csv(severity_path)

    # Descriptions
    desc_path = os.path.join(DATASET_DIR, "symptom_Description.csv")
    if os.path.exists(desc_path):
        data["descriptions"] = pd.read_csv(desc_path)

    # Precautions
    prec_path = os.path.join(DATASET_DIR, "symptom_precaution.csv")
    if os.path.exists(prec_path):
        data["precautions"] = pd.read_csv(prec_path)

    return data


def _prepare_symptom_features(df: pd.DataFrame, severity_df: pd.DataFrame = None) -> tuple:
    """
    Convert symptom columns into a binary feature matrix.
    Each unique symptom becomes a binary column (0/1).
    """
    # Collect all unique symptoms
    symptom_cols = [c for c in df.columns if c.startswith("Symptom")]
    all_symptoms = set()
    for col in symptom_cols:
        symptoms = df[col].dropna().str.strip().unique()
        all_symptoms.update(s for s in symptoms if s)

    all_symptoms = sorted(all_symptoms)
    logger.info("Found %d unique symptoms", len(all_symptoms))

    # Build severity lookup
    severity_map: Dict[str, int] = {}
    if severity_df is not None:
        for _, row in severity_df.iterrows():
            symptom = str(row.iloc[0]).strip()
            weight = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 1
            severity_map[symptom] = weight

    # Create binary feature matrix with severity weighting
    feature_matrix = np.zeros((len(df), len(all_symptoms)), dtype=np.float32)
    symptom_to_idx = {s: i for i, s in enumerate(all_symptoms)}

    for _, row in df.iterrows():
        row_idx = row.name
        for col in symptom_cols:
            symptom = str(row[col]).strip() if pd.notna(row[col]) else ""
            if symptom and symptom in symptom_to_idx:
                weight = severity_map.get(symptom, 1)
                feature_matrix[row_idx, symptom_to_idx[symptom]] = weight

    X = pd.DataFrame(feature_matrix, columns=all_symptoms)
    return X, all_symptoms


def train_symptom_model() -> Dict[str, Any]:
    """
    Full training pipeline for disease prediction from symptoms.

    Returns:
        Training report with model details.
    """
    logger.info("=" * 60)
    logger.info("TRAINING: Symptom Checker / Disease Prediction")
    logger.info("=" * 60)

    # 1. Load datasets
    data = _load_symptom_data()
    if "main" not in data:
        return {"status": "error", "message": "Main symptom dataset not found"}

    df = data["main"]
    logger.info("Symptom dataset loaded: %d rows × %d columns", *df.shape)

    # 2. Prepare features (binary symptom encoding with severity weights)
    severity_df = data.get("severity")
    X, all_symptoms = _prepare_symptom_features(df, severity_df)

    # 3. Encode target (Disease)
    le_disease = LabelEncoder()
    y = le_disease.fit_transform(df["Disease"].str.strip())
    diseases = le_disease.classes_.tolist()
    logger.info("Found %d unique diseases", len(diseases))

    # 4. Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # 5. Train individual models
    models = {
        "DecisionTree": DecisionTreeClassifier(max_depth=15, random_state=42),
        "RandomForest": RandomForestClassifier(n_estimators=100, max_depth=15,
                                                random_state=42, n_jobs=-1),
        "NaiveBayes": GaussianNB(),
        "XGBoost": xgb.XGBClassifier(n_estimators=100, max_depth=6,
                                      learning_rate=0.1, random_state=42,
                                      use_label_encoder=False, eval_metric="mlogloss"),
    }

    model_results = {}
    for name, model in models.items():
        try:
            model.fit(X_train, y_train)
            y_pred = model.predict(X_test)
            acc = accuracy_score(y_test, y_pred)
            model_results[name] = {
                "model": model,
                "accuracy": round(float(acc), 4),
                "precision": round(float(precision_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
                "recall": round(float(recall_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
                "f1_score": round(float(f1_score(y_test, y_pred, average="weighted", zero_division=0)), 4),
            }
            logger.info("%s → Accuracy: %.4f", name, acc)
        except Exception as e:
            logger.error("%s failed: %s", name, str(e))

    # 6. Build Voting Ensemble
    estimators = [(name, res["model"]) for name, res in model_results.items() if res.get("model")]
    if estimators:
        ensemble = VotingClassifier(estimators=estimators, voting="hard")
        ensemble.fit(X_train, y_train)
        y_pred = ensemble.predict(X_test)
        ensemble_acc = accuracy_score(y_test, y_pred)
        logger.info("VotingEnsemble → Accuracy: %.4f", ensemble_acc)
    else:
        ensemble = model_results.get("RandomForest", {}).get("model")
        ensemble_acc = model_results.get("RandomForest", {}).get("accuracy", 0)

    # 7. Build metadata lookups
    description_map = {}
    if "descriptions" in data:
        for _, row in data["descriptions"].iterrows():
            disease = str(row.iloc[0]).strip()
            desc = str(row.iloc[1]).strip() if len(row) > 1 else ""
            description_map[disease] = desc

    precaution_map = {}
    if "precautions" in data:
        for _, row in data["precautions"].iterrows():
            disease = str(row.iloc[0]).strip()
            precs = [str(row.iloc[i]).strip() for i in range(1, len(row)) if pd.notna(row.iloc[i])]
            precaution_map[disease] = precs

    severity_lookup = {}
    if severity_df is not None:
        for _, row in severity_df.iterrows():
            severity_lookup[str(row.iloc[0]).strip()] = int(row.iloc[1]) if pd.notna(row.iloc[1]) else 1

    # 8. Save model bundle
    os.makedirs(MODELS_DIR, exist_ok=True)
    filepath = os.path.join(MODELS_DIR, MODEL_FILENAME)

    bundle = {
        "model": ensemble,
        "model_name": "VotingEnsemble",
        "task_type": "classification",
        "feature_columns": list(all_symptoms),
        "best_score": round(float(ensemble_acc), 4),
        "disease_encoder": le_disease,
        "diseases": diseases,
        "all_symptoms": list(all_symptoms),
        "description_map": description_map,
        "precaution_map": precaution_map,
        "specialist_map": SPECIALIST_MAP,
        "emergency_levels": EMERGENCY_LEVELS,
        "severity_lookup": severity_lookup,
        "individual_results": {
            name: {k: v for k, v in res.items() if k != "model"}
            for name, res in model_results.items()
        },
        "all_results": {
            "VotingEnsemble": {"score": round(float(ensemble_acc), 4), "metrics": {
                "accuracy": round(float(ensemble_acc), 4),
            }},
        },
        "metadata": {
            "dataset": "syntom_checker_dataset",
            "dataset_rows": len(df),
            "unique_diseases": len(diseases),
            "unique_symptoms": len(all_symptoms),
            "purpose": "Disease Prediction from Symptoms",
        },
    }

    joblib.dump(bundle, filepath)
    logger.info("Symptom model saved to %s", filepath)

    report = {
        "status": "success",
        "model_file": filepath,
        "best_model": "VotingEnsemble",
        "best_score": round(float(ensemble_acc), 4),
        "dataset_rows": len(df),
        "unique_diseases": len(diseases),
        "unique_symptoms": len(all_symptoms),
        "individual_models": {
            name: res.get("accuracy", 0) for name, res in model_results.items()
        },
    }

    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train_symptom_model()
    print(result)

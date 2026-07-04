"""
MediConnect 360 — District Healthcare Analytics Trainer
=======================================================
Trains models for healthcare analytics from Indian statistics datasets.

Datasets:
    - hospital_directory.csv          (40K+ hospitals, main training source)
    - NFHS_5_India_Districts_Factsheet_Data.xls (district health indicators)
    - RS_Session_246_AU_2330_1.1.csv   (health infrastructure)
    - 1Hospitaldis_new_0.csv           (hospital classification)
    - registration_of_indian_medicine_and_homeopathy_practitioners_2020.csv

Target:  Hospital capacity scoring, bed occupancy estimation
Output:  models/district_forecast.pkl
"""

from __future__ import annotations

import os
import logging
from typing import Any, Dict, List

import numpy as np
import pandas as pd
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
import xgboost as xgb
import joblib

from services.ml_pipeline import MODELS_DIR

logger = logging.getLogger("mediconnect.district_trainer")

DATASET_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
    "datasets", "indian_statistics_datasets",
)
MODEL_FILENAME = "district_forecast.pkl"


def _load_hospital_directory() -> pd.DataFrame:
    """Load and preprocess the hospital directory dataset."""
    filepath = os.path.join(DATASET_DIR, "hospital_directory.csv")
    if not os.path.exists(filepath):
        return pd.DataFrame()

    try:
        df = pd.read_csv(filepath, encoding="utf-8", low_memory=False)
    except UnicodeDecodeError:
        df = pd.read_csv(filepath, encoding="latin-1", low_memory=False)

    logger.info("Hospital directory loaded: %d rows × %d columns", *df.shape)
    return df


def _load_infrastructure_data() -> Dict[str, pd.DataFrame]:
    """Load supporting datasets."""
    data: Dict[str, pd.DataFrame] = {}

    # Health infrastructure by state
    infra_path = os.path.join(DATASET_DIR, "RS_Session_246_AU_2330_1.1.csv")
    if os.path.exists(infra_path):
        try:
            data["infrastructure"] = pd.read_csv(infra_path)
        except Exception as e:
            logger.warning("Failed to load infrastructure data: %s", str(e))

    # NFHS district data
    nfhs_path = os.path.join(DATASET_DIR, "NFHS_5_India_Districts_Factsheet_Data.xls")
    if os.path.exists(nfhs_path):
        try:
            data["nfhs_district"] = pd.read_excel(nfhs_path)
        except Exception as e:
            logger.warning("Failed to load NFHS data: %s", str(e))

    return data


def _engineer_hospital_features(df: pd.DataFrame) -> pd.DataFrame:
    """Engineer features from hospital directory for ML training."""
    df = df.copy()

    # Select useful columns
    keep_cols = []
    for col in df.columns:
        col_lower = col.lower()
        if any(kw in col_lower for kw in [
            "state", "district", "hospital_category", "hospital_care_type",
            "discipline", "specialties", "total_num_beds", "number_doctor",
            "num_mediconsultant", "emergency_services", "num_bed",
            "number_private", "establised_year", "ayush",
        ]):
            keep_cols.append(col)

    if not keep_cols:
        # Fallback: use all non-text, non-ID columns
        keep_cols = [c for c in df.columns if c not in [
            "Sr_No", "Location_Coordinates", "Location", "Hospital_Name",
            "Address_Original_First_Line", "Pincode", "Telephone",
            "Mobile_Number", "Emergency_Num", "Ambulance_Phone_No",
            "Bloodbank_Phone_No", "Tollfree", "Helpline", "Hospital_Fax",
            "Hospital_Primary_Email_Id", "Hospital_Secondary_Email_Id",
            "Website", "Hospital_Regis_Number", "Registeration_Number_Scan",
            "Nodal_Person_Info", "Nodal_Person_Tele", "Nodal_Person_Email_Id",
            "Town", "Subtown", "Village", "Subdistrict", "Foreign_pcare",
            "Miscellaneous_Facilities", "Facilities", "Accreditation",
            "Empanelment_or_Collaboration_with", "Tariff_Range",
            "State_ID", "District_ID",
        ]]

    df = df[keep_cols].copy()

    # Clean numeric columns
    for col in ["Total_Num_Beds", "Number_Doctor", "Num_Mediconsultant_or_Expert",
                 "Number_Private_Wards", "Num_Bed_for_Eco_Weaker_Sec"]:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").fillna(0).astype(int)

    # Create capacity score (synthetic target for regression)
    if "Total_Num_Beds" in df.columns and "Number_Doctor" in df.columns:
        df["CapacityScore"] = (
            df["Total_Num_Beds"].clip(0, 1000) * 0.4 +
            df["Number_Doctor"].clip(0, 100) * 0.3 +
            df.get("Num_Mediconsultant_or_Expert", pd.Series(0)).clip(0, 50) * 0.3
        ).round(2)

    # Create load category (synthetic target for classification)
    if "Total_Num_Beds" in df.columns:
        df["LoadCategory"] = pd.cut(
            df["Total_Num_Beds"],
            bins=[-1, 0, 10, 50, 200, 10000],
            labels=["no_beds", "small", "medium", "large", "very_large"],
        )

    # Established year → age
    if "Establised_Year" in df.columns:
        df["Establised_Year"] = pd.to_numeric(df["Establised_Year"], errors="coerce")
        df["HospitalAge"] = 2026 - df["Establised_Year"]
        df["HospitalAge"] = df["HospitalAge"].clip(0, 200).fillna(20)
        df.drop(columns=["Establised_Year"], inplace=True, errors="ignore")

    return df


def _build_state_analytics(
    hospital_df: pd.DataFrame,
    infra_data: Dict[str, pd.DataFrame],
) -> Dict[str, Any]:
    """Build state-level analytics for dashboard use."""
    analytics: Dict[str, Any] = {}

    if hospital_df.empty:
        return analytics

    # State-wise hospital count
    if "State" in hospital_df.columns:
        state_counts = hospital_df["State"].value_counts().to_dict()
        analytics["hospitals_by_state"] = state_counts

    # State-wise bed count
    if "State" in hospital_df.columns and "Total_Num_Beds" in hospital_df.columns:
        beds_num = pd.to_numeric(hospital_df["Total_Num_Beds"], errors="coerce").fillna(0)
        state_beds = hospital_df.assign(beds_numeric=beds_num).groupby("State")["beds_numeric"].sum().to_dict()
        analytics["beds_by_state"] = {k: int(v) for k, v in state_beds.items()}

    # District-wise stats
    if "District" in hospital_df.columns:
        district_counts = hospital_df["District"].value_counts().head(50).to_dict()
        analytics["hospitals_by_district"] = district_counts

    # Infrastructure data integration
    if "infrastructure" in infra_data:
        infra = infra_data["infrastructure"]
        if "States/UTs" in infra.columns:
            analytics["infrastructure_by_state"] = infra.set_index("States/UTs").to_dict("index")

    return analytics


def train_district_model() -> Dict[str, Any]:
    """
    Full training pipeline for district healthcare analytics.

    Returns:
        Training report with model details.
    """
    logger.info("=" * 60)
    logger.info("TRAINING: District Healthcare Analytics")
    logger.info("=" * 60)

    # 1. Load datasets
    hospital_df = _load_hospital_directory()
    infra_data = _load_infrastructure_data()

    if hospital_df.empty:
        return {"status": "error", "message": "Hospital directory dataset not found"}

    # 2. Feature engineering
    df = _engineer_hospital_features(hospital_df)
    logger.info("After feature engineering: %d rows × %d columns", *df.shape)

    # 3. Build state/district analytics
    analytics = _build_state_analytics(hospital_df, infra_data)

    # 4. Train Load Category Classifier
    results = {}
    classifier_model = None
    regressor_model = None
    le_encoders: Dict[str, LabelEncoder] = {}
    scaler = None
    feature_cols: List[str] = []

    if "LoadCategory" in df.columns:
        logger.info("Training Hospital Load Category Classifier...")
        df_cls = df.dropna(subset=["LoadCategory"]).copy()

        # Encode categorical columns
        cat_cols = df_cls.select_dtypes(include=["object"]).columns.tolist()
        cat_cols = [c for c in cat_cols if c != "LoadCategory"]

        for col in cat_cols:
            le = LabelEncoder()
            df_cls[col] = le.fit_transform(df_cls[col].astype(str))
            le_encoders[col] = le

        # Target
        le_target = LabelEncoder()
        y = le_target.fit_transform(df_cls["LoadCategory"].astype(str))
        le_encoders["__target__LoadCategory"] = le_target

        X = df_cls.drop(columns=["LoadCategory", "CapacityScore"], errors="ignore")

        # Handle remaining non-numeric columns
        for col in X.columns:
            if X[col].dtype == "object":
                le = LabelEncoder()
                X[col] = le.fit_transform(X[col].astype(str))
                le_encoders[col] = le

        X = X.fillna(0)
        feature_cols = X.columns.tolist()

        # Scale
        scaler = StandardScaler()
        X_scaled = pd.DataFrame(scaler.fit_transform(X), columns=feature_cols)

        X_train, X_test, y_train, y_test = train_test_split(
            X_scaled, y, test_size=0.2, random_state=42
        )

        # Train
        rf = RandomForestClassifier(n_estimators=100, max_depth=15,
                                     random_state=42, n_jobs=-1)
        rf.fit(X_train, y_train)
        y_pred = rf.predict(X_test)
        acc = float(accuracy_score(y_test, y_pred))
        classifier_model = rf
        results["load_classifier"] = {
            "accuracy": round(acc, 4),
            "model_name": "RandomForest",
        }
        logger.info("Load Classifier Accuracy: %.4f", acc)

    # 5. Train Capacity Score Regressor
    if "CapacityScore" in df.columns:
        logger.info("Training Capacity Score Regressor...")
        df_reg = df.dropna(subset=["CapacityScore"]).copy()
        df_reg = df_reg.drop(columns=["LoadCategory"], errors="ignore")

        for col in df_reg.select_dtypes(include=["object"]).columns:
            if col not in le_encoders:
                le = LabelEncoder()
                df_reg[col] = le.fit_transform(df_reg[col].astype(str))
                le_encoders[col] = le
            else:
                try:
                    df_reg[col] = le_encoders[col].transform(df_reg[col].astype(str))
                except ValueError:
                    le = LabelEncoder()
                    df_reg[col] = le.fit_transform(df_reg[col].astype(str))
                    le_encoders[col] = le

        y_reg = df_reg["CapacityScore"]
        X_reg = df_reg.drop(columns=["CapacityScore"]).fillna(0)

        X_train_r, X_test_r, y_train_r, y_test_r = train_test_split(
            X_reg, y_reg, test_size=0.2, random_state=42
        )

        xgb_reg = xgb.XGBRegressor(n_estimators=100, max_depth=6,
                                     learning_rate=0.1, random_state=42)
        xgb_reg.fit(X_train_r, y_train_r)
        y_pred_r = xgb_reg.predict(X_test_r)

        from sklearn.metrics import r2_score, mean_absolute_error
        r2 = float(r2_score(y_test_r, y_pred_r))
        mae = float(mean_absolute_error(y_test_r, y_pred_r))
        regressor_model = xgb_reg
        results["capacity_regressor"] = {
            "r2_score": round(r2, 4),
            "mae": round(mae, 4),
            "model_name": "XGBoost",
        }
        logger.info("Capacity Regressor R²: %.4f, MAE: %.4f", r2, mae)

    # 6. Save model bundle
    os.makedirs(MODELS_DIR, exist_ok=True)
    filepath = os.path.join(MODELS_DIR, MODEL_FILENAME)

    best_score = results.get("load_classifier", {}).get("accuracy", 0)

    bundle = {
        "model": classifier_model,
        "regressor_model": regressor_model,
        "model_name": "DistrictForecast_Multi",
        "task_type": "multi_model",
        "feature_columns": feature_cols,
        "best_score": best_score,
        "label_encoders": le_encoders,
        "scaler": scaler,
        "analytics": analytics,
        "all_results": results,
        "metadata": {
            "dataset": "indian_statistics_datasets",
            "dataset_rows": len(hospital_df),
            "purpose": "District Healthcare Analytics & Hospital Load Prediction",
            "models": ["LoadCategoryClassifier", "CapacityScoreRegressor"],
        },
    }

    joblib.dump(bundle, filepath)
    logger.info("District model saved to %s", filepath)

    report = {
        "status": "success",
        "model_file": filepath,
        "models_trained": list(results.keys()),
        "dataset_rows": len(hospital_df),
        "results": results,
        "analytics_keys": list(analytics.keys()),
    }

    return report


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    result = train_district_model()
    print(result)

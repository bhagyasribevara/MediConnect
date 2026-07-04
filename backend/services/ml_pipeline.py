"""
MediConnect 360 — Generic ML Pipeline
======================================
Reusable, column-agnostic data processing and model training infrastructure.
Automatically analyses, cleans, encodes, normalises, trains, evaluates and saves
models for any tabular dataset.

Classes:
    DatasetAnalyzer  – schema inference, target column detection
    DataCleaner      – missing values, duplicates, encoding, scaling
    ModelTrainer     – multi-model training, evaluation, selection
"""

from __future__ import annotations

import os
import re
import json
import time
import logging
from typing import Any, Dict, List, Optional, Tuple

import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    mean_absolute_error, mean_squared_error, r2_score,
    classification_report, confusion_matrix,
)
from sklearn.ensemble import (
    RandomForestClassifier, RandomForestRegressor,
    GradientBoostingClassifier, GradientBoostingRegressor,
)
from sklearn.tree import DecisionTreeClassifier
from sklearn.naive_bayes import GaussianNB
import xgboost as xgb

try:
    import lightgbm as lgb
    HAS_LIGHTGBM = True
except ImportError:
    HAS_LIGHTGBM = False

logger = logging.getLogger("mediconnect.ml_pipeline")

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
TARGET_HINTS: List[str] = [
    "status", "target", "label", "class", "outcome", "result",
    "showed_up", "no_show", "noshow", "disease", "diagnosis",
    "prediction", "is_", "has_",
]

ID_HINTS: List[str] = [
    "id", "patientid", "appointmentid", "sr_no", "sl.no", "s.no",
    "serial", "index", "unnamed",
]

DATE_HINTS: List[str] = [
    "date", "time", "timestamp", "day", "created", "updated",
    "scheduled", "appointment", "registration",
]

MODELS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "models")


# ═══════════════════════════════════════════════════════════════════════════
# DatasetAnalyzer
# ═══════════════════════════════════════════════════════════════════════════
class DatasetAnalyzer:
    """Automatically analyse a dataset's schema and infer the target column."""

    @staticmethod
    def load_file(filepath: str) -> pd.DataFrame:
        """Load CSV, Excel, or JS (JSON array) files into a DataFrame."""
        ext = os.path.splitext(filepath)[1].lower()

        if ext == ".csv":
            try:
                df = pd.read_csv(filepath, encoding="utf-8")
            except UnicodeDecodeError:
                df = pd.read_csv(filepath, encoding="latin-1")
            return df

        if ext in (".xls", ".xlsx"):
            return pd.read_excel(filepath)

        if ext == ".js":
            return DatasetAnalyzer._parse_js_file(filepath)

        raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    def _parse_js_file(filepath: str) -> pd.DataFrame:
        """Parse a JavaScript array literal into a DataFrame."""
        with open(filepath, "r", encoding="utf-8") as fh:
            content = fh.read()

        # Extract the array portion between [ ... ]
        match = re.search(r"\[.*\]", content, re.DOTALL)
        if not match:
            raise ValueError(f"Could not find JSON array in {filepath}")

        json_str = match.group(0)
        # Clean JS → JSON: remove trailing commas, convert single quotes
        json_str = re.sub(r",\s*([\]}])", r"\1", json_str)
        json_str = json_str.replace("'", '"')
        
        # Add quotes to unquoted keys
        json_str = re.sub(r'([{,]\s*)([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_str)

        data = json.loads(json_str)
        return pd.DataFrame(data)

    @staticmethod
    def analyse_columns(df: pd.DataFrame) -> Dict[str, Any]:
        """Return a schema summary: dtypes, missing counts, unique counts."""
        info: Dict[str, Any] = {}
        for col in df.columns:
            info[col] = {
                "dtype": str(df[col].dtype),
                "missing": int(df[col].isnull().sum()),
                "missing_pct": round(df[col].isnull().mean() * 100, 2),
                "unique": int(df[col].nunique()),
                "sample_values": df[col].dropna().head(3).tolist(),
            }
        return info

    @staticmethod
    def infer_target(df: pd.DataFrame, hint: Optional[str] = None) -> Optional[str]:
        """Infer the most likely target column from column names."""
        cols_lower = {c.lower().strip(): c for c in df.columns}

        # If an explicit hint is given, match it
        if hint:
            hint_lower = hint.lower().strip()
            if hint_lower in cols_lower:
                return cols_lower[hint_lower]

        # Heuristic: match known target-like column names
        for target_hint in TARGET_HINTS:
            for col_lower, col_original in cols_lower.items():
                if target_hint in col_lower:
                    return col_original

        # Fallback: last column with few unique values (likely a label)
        for col in reversed(df.columns):
            if df[col].nunique() < 50 and df[col].dtype == "object":
                return col

        return None

    @staticmethod
    def detect_id_columns(df: pd.DataFrame) -> List[str]:
        """Detect columns that are likely IDs and should be dropped."""
        id_cols: List[str] = []
        for col in df.columns:
            col_lower = col.lower().strip()
            # Direct name match
            if any(hint == col_lower or col_lower.endswith(hint) for hint in ID_HINTS):
                id_cols.append(col)
                continue
            # High-cardinality numeric with unique values ≈ row count
            if df[col].dtype in ("int64", "float64"):
                if df[col].nunique() > 0.9 * len(df) and len(df) > 100:
                    id_cols.append(col)
        return id_cols

    @staticmethod
    def detect_date_columns(df: pd.DataFrame) -> List[str]:
        """Detect columns that contain date/time values."""
        date_cols: List[str] = []
        for col in df.columns:
            col_lower = col.lower().strip()
            if any(hint in col_lower for hint in DATE_HINTS):
                date_cols.append(col)
                continue
            # Try parsing a sample value
            if df[col].dtype == "object":
                sample = df[col].dropna().head(5)
                try:
                    pd.to_datetime(sample)
                    date_cols.append(col)
                except (ValueError, TypeError):
                    pass
        return date_cols

    @staticmethod
    def detect_task_type(df: pd.DataFrame, target: str) -> str:
        """Determine if the task is 'classification' or 'regression'."""
        if df[target].dtype == "object" or df[target].nunique() < 20:
            return "classification"
        return "regression"


# ═══════════════════════════════════════════════════════════════════════════
# DataCleaner
# ═══════════════════════════════════════════════════════════════════════════
class DataCleaner:
    """Clean, encode, and normalise a DataFrame for ML training."""

    def __init__(self) -> None:
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.scaler: Optional[StandardScaler] = None
        self.numeric_cols: List[str] = []
        self.categorical_cols: List[str] = []
        self.columns_dropped: List[str] = []

    def clean(
        self,
        df: pd.DataFrame,
        target_col: str,
        drop_cols: Optional[List[str]] = None,
        normalize: bool = True,
    ) -> Tuple[pd.DataFrame, pd.Series]:
        """
        Full cleaning pipeline:
        1. Drop ID / date columns
        2. Remove duplicates
        3. Handle missing values
        4. Encode categoricals
        5. Normalise numerics
        """
        df = df.copy()

        # 1. Drop specified columns
        if drop_cols:
            existing = [c for c in drop_cols if c in df.columns]
            df.drop(columns=existing, inplace=True)
            self.columns_dropped.extend(existing)

        # 2. Remove duplicates
        before = len(df)
        df.drop_duplicates(inplace=True)
        logger.info("Removed %d duplicate rows", before - len(df))

        # 3. Separate target
        if target_col not in df.columns:
            raise ValueError(f"Target column '{target_col}' not found in DataFrame")
        y = df[target_col].copy()
        X = df.drop(columns=[target_col])

        # 4. Identify column types
        self.numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
        self.categorical_cols = X.select_dtypes(include=["object", "bool"]).columns.tolist()

        # 5. Handle missing values
        for col in self.numeric_cols:
            X[col].fillna(X[col].median(), inplace=True)
        for col in self.categorical_cols:
            X[col].fillna(X[col].mode().iloc[0] if not X[col].mode().empty else "Unknown", inplace=True)

        # 6. Encode categoricals
        for col in self.categorical_cols:
            le = LabelEncoder()
            X[col] = le.fit_transform(X[col].astype(str))
            self.label_encoders[col] = le

        # 7. Encode target if categorical
        if y.dtype == "object" or y.dtype == "bool":
            le_target = LabelEncoder()
            y = pd.Series(le_target.fit_transform(y.astype(str)), name=target_col)
            self.label_encoders[f"__target__{target_col}"] = le_target

        # 8. Normalise numeric features
        if normalize and len(self.numeric_cols) > 0:
            self.scaler = StandardScaler()
            X[self.numeric_cols] = self.scaler.fit_transform(X[self.numeric_cols])

        return X, y

    def transform_input(self, input_data: Dict[str, Any], feature_columns: List[str]) -> pd.DataFrame:
        """Transform a single prediction input using fitted encoders/scalers."""
        row: Dict[str, Any] = {}
        for col in feature_columns:
            val = input_data.get(col, 0)
            if col in self.label_encoders:
                try:
                    val = self.label_encoders[col].transform([str(val)])[0]
                except ValueError:
                    val = 0  # Unknown category
            row[col] = val

        df = pd.DataFrame([row], columns=feature_columns)

        if self.scaler and len(self.numeric_cols) > 0:
            scale_cols = [c for c in self.numeric_cols if c in df.columns]
            if scale_cols:
                df[scale_cols] = self.scaler.transform(df[scale_cols])

        return df


# ═══════════════════════════════════════════════════════════════════════════
# ModelTrainer
# ═══════════════════════════════════════════════════════════════════════════
class ModelTrainer:
    """Train, evaluate, and persist ML models."""

    CLASSIFICATION_MODELS = {
        "RandomForest": lambda: RandomForestClassifier(
            n_estimators=100, max_depth=15, random_state=42, n_jobs=-1
        ),
        "XGBoost": lambda: xgb.XGBClassifier(
            n_estimators=100, max_depth=6, learning_rate=0.1,
            random_state=42, use_label_encoder=False, eval_metric="mlogloss",
        ),
        "GradientBoosting": lambda: GradientBoostingClassifier(
            n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42,
        ),
    }

    REGRESSION_MODELS = {
        "RandomForest": lambda: RandomForestRegressor(
            n_estimators=100, max_depth=15, random_state=42, n_jobs=-1
        ),
        "XGBoost": lambda: xgb.XGBRegressor(
            n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42,
        ),
        "GradientBoosting": lambda: GradientBoostingRegressor(
            n_estimators=100, max_depth=5, learning_rate=0.1, random_state=42,
        ),
    }

    def __init__(self, task_type: str = "classification") -> None:
        self.task_type = task_type
        self.best_model: Any = None
        self.best_model_name: str = ""
        self.best_score: float = 0.0
        self.all_results: Dict[str, Dict[str, Any]] = {}
        self.feature_columns: List[str] = []

    def train_and_evaluate(
        self,
        X: pd.DataFrame,
        y: pd.Series,
        test_size: float = 0.2,
        custom_models: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """Train multiple models, evaluate, and select the best one."""
        self.feature_columns = X.columns.tolist()

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42
        )

        # Select model pool
        if custom_models:
            model_pool = custom_models
        elif self.task_type == "classification":
            model_pool = self.CLASSIFICATION_MODELS.copy()
        else:
            model_pool = self.REGRESSION_MODELS.copy()

        # Add LightGBM if available
        if HAS_LIGHTGBM and "LightGBM" not in model_pool:
            if self.task_type == "classification":
                model_pool["LightGBM"] = lambda: lgb.LGBMClassifier(
                    n_estimators=100, max_depth=6, learning_rate=0.1,
                    random_state=42, verbose=-1,
                )
            else:
                model_pool["LightGBM"] = lambda: lgb.LGBMRegressor(
                    n_estimators=100, max_depth=6, learning_rate=0.1,
                    random_state=42, verbose=-1,
                )

        best_score = -1.0
        results: Dict[str, Dict[str, Any]] = {}

        for name, model_fn in model_pool.items():
            start = time.time()
            try:
                model = model_fn()
                model.fit(X_train, y_train)
                y_pred = model.predict(X_test)
                duration = round(time.time() - start, 2)

                if self.task_type == "classification":
                    metrics = self._classification_metrics(y_test, y_pred)
                    score = metrics["accuracy"]
                else:
                    metrics = self._regression_metrics(y_test, y_pred)
                    score = metrics["r2_score"]

                metrics["training_time_seconds"] = duration
                results[name] = {"model": model, "metrics": metrics, "score": score}

                logger.info("%s → Score: %.4f (%.2fs)", name, score, duration)

                if score > best_score:
                    best_score = score
                    self.best_model = model
                    self.best_model_name = name
                    self.best_score = score

            except Exception as e:
                logger.error("Model %s failed: %s", name, str(e))
                results[name] = {"model": None, "metrics": {}, "score": 0, "error": str(e)}

        self.all_results = results
        return {
            "best_model": self.best_model_name,
            "best_score": round(self.best_score, 4),
            "all_results": {
                k: {kk: vv for kk, vv in v.items() if kk != "model"}
                for k, v in results.items()
            },
        }

    def save_model(
        self,
        filename: str,
        cleaner: Optional[DataCleaner] = None,
        extra_metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Save the best model along with preprocessing artifacts."""
        os.makedirs(MODELS_DIR, exist_ok=True)
        filepath = os.path.join(MODELS_DIR, filename)

        bundle = {
            "model": self.best_model,
            "model_name": self.best_model_name,
            "task_type": self.task_type,
            "feature_columns": self.feature_columns,
            "best_score": self.best_score,
            "all_results": {
                k: {kk: vv for kk, vv in v.items() if kk != "model"}
                for k, v in self.all_results.items()
            },
        }

        if cleaner:
            bundle["label_encoders"] = cleaner.label_encoders
            bundle["scaler"] = cleaner.scaler
            bundle["numeric_cols"] = cleaner.numeric_cols
            bundle["categorical_cols"] = cleaner.categorical_cols

        if extra_metadata:
            bundle["metadata"] = extra_metadata

        joblib.dump(bundle, filepath)
        logger.info("Model saved to %s", filepath)
        return filepath

    @staticmethod
    def _classification_metrics(y_true: Any, y_pred: Any) -> Dict[str, Any]:
        """Calculate classification metrics."""
        avg = "weighted" if len(np.unique(y_true)) > 2 else "binary"
        return {
            "accuracy": round(float(accuracy_score(y_true, y_pred)), 4),
            "precision": round(float(precision_score(y_true, y_pred, average=avg, zero_division=0)), 4),
            "recall": round(float(recall_score(y_true, y_pred, average=avg, zero_division=0)), 4),
            "f1_score": round(float(f1_score(y_true, y_pred, average=avg, zero_division=0)), 4),
        }

    @staticmethod
    def _regression_metrics(y_true: Any, y_pred: Any) -> Dict[str, Any]:
        """Calculate regression metrics."""
        return {
            "mae": round(float(mean_absolute_error(y_true, y_pred)), 4),
            "mse": round(float(mean_squared_error(y_true, y_pred)), 4),
            "rmse": round(float(np.sqrt(mean_squared_error(y_true, y_pred))), 4),
            "r2_score": round(float(r2_score(y_true, y_pred)), 4),
        }

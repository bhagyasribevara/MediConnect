"""
MediConnect 360 — Symptom Prediction Service
=============================================
Loads the trained symptom checker model and provides disease prediction.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List

import numpy as np
import pandas as pd

from services.model_registry import registry

logger = logging.getLogger("mediconnect.symptom_service")


class SymptomService:
    """Service layer for symptom-based disease prediction."""

    MODEL_NAME = "symptom"

    def predict_disease(self, symptoms: List[str]) -> Dict[str, Any]:
        """
        Predict top diseases based on input symptoms.

        Args:
            symptoms: List of symptom strings (e.g. ["itching", "skin_rash"])

        Returns:
            Dict with top 5 diseases, confidence, specialist, emergency level, precautions.
        """
        try:
            bundle = registry.get_bundle(self.MODEL_NAME)
            if not bundle:
                return self._error_response("Symptom model not loaded")

            model = bundle["model"]
            all_symptoms = bundle.get("all_symptoms", [])
            disease_encoder = bundle.get("disease_encoder")
            severity_lookup = bundle.get("severity_lookup", {})
            description_map = bundle.get("description_map", {})
            precaution_map = bundle.get("precaution_map", {})
            specialist_map = bundle.get("specialist_map", {})
            emergency_levels = bundle.get("emergency_levels", {})

            # Build feature vector
            feature_vector = np.zeros(len(all_symptoms), dtype=np.float32)
            matched_symptoms = []

            for symptom in symptoms:
                symptom_clean = symptom.strip().lower().replace(" ", "_")
                # Try exact match
                for i, s in enumerate(all_symptoms):
                    s_clean = s.strip().lower().replace(" ", "_")
                    if s_clean == symptom_clean or symptom_clean in s_clean or s_clean in symptom_clean:
                        weight = severity_lookup.get(s.strip(), 1)
                        feature_vector[i] = weight
                        matched_symptoms.append(s.strip())
                        break

            if not matched_symptoms:
                return {
                    "status": "warning",
                    "message": "No matching symptoms found",
                    "matched_symptoms": [],
                    "suggestions": all_symptoms[:20],
                }

            # Predict
            X = pd.DataFrame([feature_vector], columns=all_symptoms)

            # Get probability scores if available
            if hasattr(model, "predict_proba"):
                probabilities = model.predict_proba(X)[0]
                top_indices = np.argsort(probabilities)[::-1][:5]
                top_diseases = []

                for idx in top_indices:
                    disease_name = disease_encoder.inverse_transform([idx])[0] if disease_encoder else f"Disease_{idx}"
                    confidence = float(probabilities[idx])

                    if confidence < 0.01:
                        continue

                    top_diseases.append({
                        "disease": disease_name.strip(),
                        "confidence": round(confidence * 100, 2),
                        "specialist": specialist_map.get(disease_name.strip(), "General Physician"),
                        "emergency_level": emergency_levels.get(disease_name.strip(), "LOW"),
                        "description": description_map.get(disease_name.strip(), ""),
                        "precautions": precaution_map.get(disease_name.strip(), []),
                    })
            else:
                # Fallback: single prediction
                prediction = model.predict(X)[0]
                disease_name = disease_encoder.inverse_transform([prediction])[0] if disease_encoder else f"Disease_{prediction}"
                top_diseases = [{
                    "disease": disease_name.strip(),
                    "confidence": 85.0,
                    "specialist": specialist_map.get(disease_name.strip(), "General Physician"),
                    "emergency_level": emergency_levels.get(disease_name.strip(), "LOW"),
                    "description": description_map.get(disease_name.strip(), ""),
                    "precautions": precaution_map.get(disease_name.strip(), []),
                }]

            # Determine overall emergency level
            if top_diseases:
                emergency_order = {"CRITICAL": 4, "HIGH": 3, "MEDIUM": 2, "LOW": 1}
                max_emergency = max(
                    top_diseases,
                    key=lambda d: emergency_order.get(d.get("emergency_level", "LOW"), 0)
                )
                overall_emergency = max_emergency.get("emergency_level", "LOW")
            else:
                overall_emergency = "LOW"

            return {
                "status": "success",
                "matched_symptoms": matched_symptoms,
                "total_symptoms_matched": len(matched_symptoms),
                "top_diseases": top_diseases,
                "overall_emergency_level": overall_emergency,
                "recommended_specialist": top_diseases[0]["specialist"] if top_diseases else "General Physician",
            }

        except Exception as e:
            logger.error("Disease prediction failed: %s", str(e))
            return self._error_response(str(e))

    def get_all_symptoms(self) -> Dict[str, Any]:
        """
        Get list of all valid symptoms for autocomplete.

        Returns:
            Dict with symptom list.
        """
        try:
            bundle = registry.get_bundle(self.MODEL_NAME)
            if not bundle:
                return {"status": "error", "symptoms": []}

            all_symptoms = bundle.get("all_symptoms", [])
            severity_lookup = bundle.get("severity_lookup", {})

            symptom_list = []
            for s in all_symptoms:
                s_clean = s.strip()
                if s_clean:
                    symptom_list.append({
                        "name": s_clean,
                        "display_name": s_clean.replace("_", " ").title(),
                        "severity": severity_lookup.get(s_clean, 1),
                    })

            return {
                "status": "success",
                "total": len(symptom_list),
                "symptoms": sorted(symptom_list, key=lambda x: x["display_name"]),
            }

        except Exception as e:
            logger.error("Get symptoms failed: %s", str(e))
            return {"status": "error", "symptoms": [], "message": str(e)}

    def get_disease_info(self, disease_name: str) -> Dict[str, Any]:
        """
        Get detailed information about a disease.

        Args:
            disease_name: Name of the disease.

        Returns:
            Dict with description, precautions, specialist, emergency level.
        """
        try:
            bundle = registry.get_bundle(self.MODEL_NAME)
            if not bundle:
                return self._error_response("Symptom model not loaded")

            description_map = bundle.get("description_map", {})
            precaution_map = bundle.get("precaution_map", {})
            specialist_map = bundle.get("specialist_map", {})
            emergency_levels = bundle.get("emergency_levels", {})

            # Case-insensitive search
            matched_disease = None
            for d in description_map.keys():
                if d.strip().lower() == disease_name.strip().lower():
                    matched_disease = d
                    break

            if not matched_disease:
                return {"status": "error", "message": f"Disease '{disease_name}' not found"}

            return {
                "status": "success",
                "disease": matched_disease,
                "description": description_map.get(matched_disease, ""),
                "precautions": precaution_map.get(matched_disease, []),
                "specialist": specialist_map.get(matched_disease, "General Physician"),
                "emergency_level": emergency_levels.get(matched_disease, "LOW"),
            }

        except Exception as e:
            logger.error("Get disease info failed: %s", str(e))
            return self._error_response(str(e))

    @staticmethod
    def _error_response(message: str) -> Dict[str, Any]:
        return {
            "status": "error",
            "message": message,
            "top_diseases": [],
        }


symptom_service = SymptomService()

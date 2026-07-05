# pyrefly: ignore [unexpected-keyword]
# pyright: ignore[reportCallIssue]
import os
from google import genai
from google.genai import types
from flask import Blueprint, request, jsonify
from dashboard import token_required
from models import db, PatientRecord, Patient

medlens_bp = Blueprint('medlens', __name__)

gemini_api_key = os.environ.get("GEMINI_API_KEY")
if gemini_api_key:
    client = genai.Client(api_key=gemini_api_key)
else:
    client = None

@medlens_bp.route('/upload', methods=['POST'])
@token_required
def upload_report(current_user):
    """
    Accepts medical reports (text/image base64) and uses Gemini to extract insights.
    Returns structured JSON with summary, abnormal values, and recommendations.
    """
    if current_user.role.name not in ['Doctor', 'Patient']:
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.get_json()
    report_text = data.get('report_text', '') # For prototype, frontend can send extracted text or we just pass it to Gemini
    
    if not report_text:
        return jsonify({'error': 'No report data provided'}), 400

    if not gemini_api_key:
        return jsonify({'error': 'Gemini API not configured'}), 500

    system_instruction = """
    You are MedLens, an advanced AI medical report analyzer. 
    Analyze the provided medical report text and return a STRICT JSON object with exactly these keys:
    {
      "summary": "Brief 2-3 sentence summary of the report.",
      "abnormal_values": ["List of any abnormal values found", "e.g., High Blood Pressure 140/90"],
      "recommendations": ["List of recommendations", "e.g., Consult cardiologist"]
    }
    Do not return markdown, only the JSON object.
    """

    try:
        assert client is not None
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=report_text,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction
            )
        )
        
        # Clean the response to ensure it's valid JSON
        text_content = response.text or ""
        result = text_content.replace("```json", "").replace("```", "").strip()
        
        import json
        structured_data = json.loads(result)
        
        # Optionally save to database if requested
        save = data.get('save_to_record', False)
        if save:
            patient = Patient.query.filter_by(user_id=current_user.id).first()
            if patient:
                record = PatientRecord(
                    # pyrefly: ignore [unexpected-keyword]
                    patient_id=patient.id,
                    # pyrefly: ignore [unexpected-keyword]
                    record_type='Report',
                    # pyrefly: ignore [unexpected-keyword]
                    ai_summary=structured_data.get('summary'),
                    # pyrefly: ignore [unexpected-keyword]
                    ai_abnormal_values=", ".join(structured_data.get('abnormal_values', []))
                )
                db.session.add(record)
                db.session.commit()

        return jsonify(structured_data), 200

    except Exception as e:
        print(f"MedLens Error: {e}")
        return jsonify({'error': 'Failed to process report via MedLens'}), 500

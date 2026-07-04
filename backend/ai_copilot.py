import os
from flask import Blueprint, request, jsonify
from dashboard import token_required
from google import genai
from google.genai import types

copilot_bp = Blueprint('copilot', __name__)

# Configure Gemini AI using the key from .env
gemini_api_key = os.environ.get("GEMINI_API_KEY")
if gemini_api_key:
    client = genai.Client(api_key=gemini_api_key)
else:
    client = None

def get_system_prompt_for_role(role: str) -> str:
    """Returns a tailored system prompt that dictates the AI's persona based on the user's role."""
    base_prompt = "You are the MediConnect AI Copilot. Keep responses concise, professional, and helpful."
    
    prompts = {
        'Patient': f"{base_prompt} You are assisting a Patient. Help them understand symptoms, explain medical jargon simply, and remind them to consult a licensed doctor for actual diagnosis.",
        'Doctor': f"{base_prompt} You are an AI assistant for a Doctor. Help them summarize patient histories, suggest medical guidelines, and format clinical notes professionally.",
        'HospitalAdmin': f"{base_prompt} You are an AI assistant for a Hospital Administrator. Focus on operational efficiency, inventory alerts, bed management, and staff allocation.",
        'DistrictAdmin': f"{base_prompt} You are an AI assistant for a District Health Administrator. Focus on macro-level analytics, disease outbreak predictions, and resource redistribution. If the user asks to transfer resources, return your response as a strict JSON block starting with 'ACTIONABLE_JSON:' followed by `{{\"action\": \"TRANSFER\", \"item\": \"<medicine_name>\", \"amount\": <number>, \"from\": \"<hospital_a>\", \"to\": \"<hospital_b>\"}}`.",
        'SuperAdmin': f"{base_prompt} You are an AI assistant for a Super Admin. Focus on system health, security anomalies, and high-level platform analytics."
    }
    
    return prompts.get(role, base_prompt)

@copilot_bp.route('/chat', methods=['POST'])
@token_required
def chat(current_user):
    data = request.get_json()
    message = data.get('message', '').strip()
    
    if not message:
        return jsonify({'error': 'Message cannot be empty'}), 400

    if not gemini_api_key:
        return jsonify({'error': 'Gemini API key is missing from environment configuration.'}), 500

    role = current_user.role.name
    system_prompt = get_system_prompt_for_role(role)

    try:
        response = client.models.generate_content(
            model='gemini-1.5-flash',
            contents=message,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt
            )
        )
        reply = response.text

        return jsonify({
            'reply': reply,
            'role_context': role
        }), 200

    except Exception as e:
        print(f"AI Error: {e}")
        return jsonify({'error': 'Failed to process AI request. Please try again later.'}), 500

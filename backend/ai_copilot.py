import os
from flask import Blueprint, request, jsonify
from dashboard import token_required

copilot_bp = Blueprint('copilot', __name__)

# Configure Gemini AI using the key from .env (lazy-loaded to avoid SSL hang on import)
gemini_api_key = os.environ.get("GEMINI_API_KEY")
_client = None

def get_genai_client():
    global _client
    if _client is None and gemini_api_key:
        try:
            from google import genai
            _client = genai.Client(api_key=gemini_api_key)
        except Exception as e:
            print(f"Failed to initialize Gemini client: {e}")
    return _client

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
        if gemini_api_key == "AQ.Ab8RN6K_FDaeu70zKv9CHr5A3g1pXkYRMBKKu1N3Kr1uLZnNsg":
            raise Exception("Known invalid dummy Gemini API key. Skipping remote call for instant offline response.")
            
        client = get_genai_client()
        assert client is not None
        from google.genai import types
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
        # Fallback if API key is invalid or network fails
        fallback_reply = "I'm currently operating in offline fallback mode because my AI API key is missing or invalid. Based on your input, please consult a medical professional for a proper diagnosis."
        
        # Try to extract the ML prediction from the prompt if it's there
        if "ML Model suspects:" in message:
            try:
                suspect_part = message.split("ML Model suspects:")[1].split(" Provide")[0].strip()
                fallback_reply = f"I'm currently in offline fallback mode, but my local ML analysis suspects: {suspect_part}. Please consult a doctor."
            except:
                pass
                
        return jsonify({
            'reply': fallback_reply,
            'role_context': role,
            'is_fallback': True
        }), 200

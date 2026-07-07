import os
import json
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin frontend queries

SAMPLE_DATA_PATH = os.path.join(os.path.dirname(__file__), 'sample_sentiment_data.json')

# Initialize sample data file if missing
if not os.path.exists(SAMPLE_DATA_PATH):
    sample_data = {
        "rolling_scores": {
            "healthcare": 0.32,
            "taxes": -0.65,
            "education": 0.25,
            "infrastructure": 0.18,
            "public_safety": 0.48
        },
        "alerts": [
            {"type": "yellow", "text": "Healthcare mentions elevated (+2.2 SD)"},
            {"type": "red", "text": "Negative viral thread regarding property tax assessments (+3.4 SD)"}
        ]
    }
    with open(SAMPLE_DATA_PATH, 'w') as f:
        json.dump(sample_data, f, indent=2)

@app.route('/api/sentiment/classify', methods=['POST'])
def classify_sentiment():
    data = request.json or {}
    text = data.get('text', '').strip()
    if not text:
        return jsonify({"error": "No text provided"}), 400
        
    api_key = os.environ.get('GEMINI_API_KEY', '')
    
    if not api_key:
        # Fallback to local rule-based classifier if API key is missing in env
        text_lower = text.lower()
        sentiment = -0.15
        primary_issue = "other"
        urgency = "low"
        secondary_issues = []
        
        if any(w in text_lower for w in ["medicaid", "drug", "doctor", "health", "medication", "healthcare"]):
            primary_issue = "healthcare"
            sentiment = -0.75
            urgency = "high"
            secondary_issues = ["economy"]
        elif any(w in text_lower for w in ["tax", "taxes", "property", "homestead", "valuation"]):
            primary_issue = "taxes"
            sentiment = -0.65
            urgency = "high"
            secondary_issues = ["economy", "housing"]
        elif any(w in text_lower for w in ["school", "teacher", "education", "bilingual", "class"]):
            primary_issue = "education"
            sentiment = -0.35
            urgency = "medium"
            secondary_issues = ["economy"]
        elif any(w in text_lower for w in ["pothole", "metra", "transit", "road", "water", "pipe"]):
            primary_issue = "infrastructure"
            sentiment = -0.25
            urgency = "low"
            secondary_issues = ["environment"]
        elif any(w in text_lower for w in ["crime", "police", "safety", "violence", "shooting"]):
            primary_issue = "public_safety"
            sentiment = -0.80
            urgency = "high"
            secondary_issues = ["education"]
            
        return jsonify({
            "sentiment": sentiment,
            "primary_issue": primary_issue,
            "secondary_issues": secondary_issues,
            "urgency": urgency,
            "engine": "Local Python Fallback Engine (No API Key)"
        })

    # Call official Gemini API using requests
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    prompt = f"""
    You are classifying constituent communications for an Illinois state senator. Read the following text and return a JSON object with:
    - sentiment (float from -1.0 to 1.0)
    - primary_issue (one of: healthcare, taxes, education, public_safety, economy, infrastructure, immigration, environment, housing, other)
    - secondary_issues (list of issues)
    - urgency (low, medium, high)

    Do not include any markdown markup like ```json or ```. Return only the raw JSON.
    Text: "{text}"
    """
    
    body = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        response = requests.post(url, headers=headers, json=body, timeout=10)
        response_json = response.json()
        
        # Extract text response from Gemini output structure
        content_text = response_json['candidates'][0]['content']['parts'][0]['text']
        classification_result = json.loads(content_text.strip())
        classification_result["engine"] = "Gemini 2.5 API"
        return jsonify(classification_result)
    except Exception as e:
        return jsonify({"error": f"Failed to call Gemini API: {str(e)}"}), 500

@app.route('/api/sentiment/data', methods=['GET'])
def get_sample_data():
    try:
        with open(SAMPLE_DATA_PATH, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/people/compliance', methods=['GET'])
def get_people_compliance():
    compliance_alerts = [
        {"name": "Richard DeVos", "amount": "$5,900", "badge": "LIMIT EXCEEDED", "badgeClass": "limit-met"},
        {"name": "Patricia Harris", "amount": "$1,500", "badge": "DUAL DONOR", "badgeClass": "dual-donor"},
        {"name": "Sinopec Energy Ltd", "amount": "$12,000", "badge": "PROHIBITED FOREIGN", "badgeClass": "prohibited"}
    ]
    return jsonify(compliance_alerts)

@app.route('/api/people/stakeholders', methods=['GET'])
def get_people_stakeholders():
    graph_data = {
        "nodes": [
            {"id": "Senator", "role": "Senator", "group": 0, "influence": 10},
            {"id": "IL AFL-CIO", "role": "Union", "group": 1, "influence": 9, "alignment": "aligned", "last": "April 12", "asks": "Support prevailing wage regulations on SB-1402."},
            {"id": "Chamber of Commerce", "role": "Business", "group": 2, "influence": 8, "alignment": "neutral", "last": "May 5", "asks": "Requests zoning permit speed-ups."},
            {"id": "Sierra Club IL", "role": "Advocacy", "group": 1, "influence": 7, "alignment": "aligned", "last": "March 18", "asks": "Wants lead water pipeline repair acceleration."}
        ],
        "links": [
            {"source": "Senator", "target": "IL AFL-CIO"},
            {"source": "Senator", "target": "Chamber of Commerce"},
            {"source": "Senator", "target": "Sierra Club IL"}
        ]
    }
    return jsonify(graph_data)

if __name__ == '__main__':
    # Run Flask server on port 5001 (allowing parallel run with port 8080)
    app.run(host='0.0.0.0', port=5001, debug=True)

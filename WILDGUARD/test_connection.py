import requests
import json
from datetime import datetime

# Test data similar to what ML system sends
test_detection = {
    "newDetection": {
        "id": int(datetime.now().timestamp()),
        "type": "person",
        "species": "Human",
        "confidence": 85,
        "camera": "Cam-01",
        "blindspot": "No",
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
}

try:
    response = requests.post(
        "http://localhost:5000/api/detection/update",
        json=test_detection,
        headers={'Content-Type': 'application/json'}
    )
    
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Connection successful! Detection data sent to backend.")
    else:
        print("❌ Connection failed!")
        
except Exception as e:
    print(f"❌ Error connecting to backend: {e}")
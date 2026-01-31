import requests
import json
import time
from datetime import datetime

# Configuration
API_BASE_URL = "http://localhost:5000/api/detection/update"

def send_detection_data(detection_result):
    """
    Send detection data from ML model to the backend API
    
    Args:
        detection_result (dict): Dictionary containing detection information
            Expected keys: type, species, confidence, camera, blindspot, timestamp
    """
    try:
        # Prepare the payload
        payload = {
            "newDetection": {
                "id": int(time.time()),  # Use timestamp as ID
                "type": detection_result.get('type', 'unknown'),
                "species": detection_result.get('species', 'Unknown'),
                "confidence": detection_result.get('confidence', 0),
                "camera": detection_result.get('camera', 'Unknown'),
                "blindspot": detection_result.get('blindspot', 'No'),
                "timestamp": detection_result.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
            }
        }
        
        # Send POST request to backend
        response = requests.post(
            API_BASE_URL,
            json=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print(f"Detection data sent successfully: {payload['newDetection']}")
            return True
        else:
            print(f"Failed to send detection data. Status code: {response.status_code}")
            print(f"Response: {response.text}")
            return False
            
    except Exception as e:
        print(f"Error sending detection data: {str(e)}")
        return False

# Example usage
if __name__ == "__main__":
    # Example detection result from your ML model
    sample_detection = {
        "type": "animal",  # animal, person, fire
        "species": "Deer",
        "confidence": 92,
        "camera": "Cam-01",
        "blindspot": "No",  # Yes or No
        "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    }
    
    # Send the detection data
    success = send_detection_data(sample_detection)
    
    if success:
        print("Sample detection sent successfully!")
    else:
        print("Failed to send sample detection.")
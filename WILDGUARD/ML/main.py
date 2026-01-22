import cv2
import requests
import json
from datetime import datetime
from camera_module import get_camera
from detection_module import detect
from alert_module import send_alert

# Configuration for sending data to backend
API_BASE_URL = "http://localhost:5000/api/detection/update"

def send_detection_to_backend(detection):
    """
    Send detection data to the backend API
    
    Args:
        detection: Detection object with properties like type, species, confidence, etc.
    """
    try:
        # Prepare the payload based on your detection object structure
        # Adjust these according to your actual detection object properties
        detection_data = {
            "newDetection": {
                "id": int(datetime.now().timestamp()),
                "type": detection.get('type', 'unknown') if isinstance(detection, dict) else getattr(detection, 'type', 'unknown'),  # animal, person, fire
                "species": detection.get('species', 'Unknown') if isinstance(detection, dict) else getattr(detection, 'species', 'Unknown'),
                "confidence": detection.get('confidence', 0) if isinstance(detection, dict) else getattr(detection, 'confidence', 0),
                "camera": detection.get('camera', 'Cam-01') if isinstance(detection, dict) else getattr(detection, 'camera', 'Cam-01'),
                "blindspot": detection.get('blindspot', 'No') if isinstance(detection, dict) else getattr(detection, 'blindspot', 'No'),
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
            }
        }
        
        # Send POST request to backend
        response = requests.post(
            API_BASE_URL,
            json=detection_data,
            headers={'Content-Type': 'application/json'}
        )
        
        if response.status_code == 200:
            print(f"Detection sent to backend: {detection_data['newDetection']}")
        else:
            print(f"Failed to send detection to backend. Status: {response.status_code}")
            
    except Exception as e:
        print(f"Error sending detection to backend: {str(e)}")


cap = get_camera()

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame = cv2.resize(frame, (640, 480))
    detections, frame = detect(frame)

    for d in detections:
        # If d is a dictionary (new format), use it directly
        # If d is a string (old format), create detection object
        if isinstance(d, str):
            # Convert string detection to object
            if d == "person":
                detection_obj = {
                    "type": "person",
                    "species": "Human",
                    "confidence": 0,
                    "camera": "Cam-01",
                    "blindspot": "No"
                }
            elif d == "fire":
                detection_obj = {
                    "type": "fire",
                    "species": "Fire",
                    "confidence": 0,
                    "camera": "Cam-01",
                    "blindspot": "No"
                }
            elif d.startswith("animal:"):
                animal_type = d.split(":", 1)[1]
                detection_obj = {
                    "type": "animal",
                    "species": animal_type,
                    "confidence": 0,
                    "camera": "Cam-01",
                    "blindspot": "No"
                }
            else:
                detection_obj = {
                    "type": "unknown",
                    "species": "Unknown",
                    "confidence": 0,
                    "camera": "Cam-01",
                    "blindspot": "No"
                }
        else:
            # d is already a detection object
            detection_obj = d
        
        # Send alert locally
        send_alert(detection_obj)
        # Send detection data to backend for dashboard
        send_detection_to_backend(detection_obj)

    cv2.imshow("WildGuard AI - Human & Animal", frame)
    if cv2.waitKey(1) == 27:  # ESC key to exit
        break

cap.release()
cv2.destroyAllWindows()

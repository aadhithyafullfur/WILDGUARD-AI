import cv2
import requests
import json
import threading
import base64
import os
from datetime import datetime
from queue import Queue
from camera_module import get_camera
from detection_module import detect
from alert_module import send_alert

# Configuration for sending data to backend
# Use environment variable or default to deployed server
BACKEND_URL = os.getenv('API_URL', 'https://wildguard-ai-backend.onrender.com')
API_BASE_URL = f"{BACKEND_URL}/api/detection/update"

# Detection queue for async processing
detection_queue = Queue(maxsize=10)

def send_detection_to_backend(detection):
    """
    Send detection data to the backend API (runs in background thread)
    
    Args:
        detection: Detection object with properties like type, species, confidence, etc.
    """
    try:
        # Prepare the payload based on your detection object structure
        detection_data = {
            "newDetection": {
                "id": int(datetime.now().timestamp()),
                "type": detection.get('type', 'unknown') if isinstance(detection, dict) else getattr(detection, 'type', 'unknown'),
                "species": detection.get('species', 'Unknown') if isinstance(detection, dict) else getattr(detection, 'species', 'Unknown'),
                "confidence": detection.get('confidence', 0) if isinstance(detection, dict) else getattr(detection, 'confidence', 0),
                "camera": detection.get('camera', 'Cam-01') if isinstance(detection, dict) else getattr(detection, 'camera', 'Cam-01'),
                "blindspot": detection.get('blindspot', 'No') if isinstance(detection, dict) else getattr(detection, 'blindspot', 'No'),
                "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                "image": detection.get('image') if isinstance(detection, dict) else getattr(detection, 'image', None)  # Base64 encoded image
            }
        }
        
        # Send POST request to backend with timeout
        response = requests.post(
            API_BASE_URL,
            json=detection_data,
            headers={'Content-Type': 'application/json'},
            timeout=2
        )
        
        if response.status_code == 200:
            print(f"Detection sent to backend: {detection_data['newDetection']['type']} - {detection_data['newDetection']['species']}")
        else:
            print(f"Failed to send detection to backend. Status: {response.status_code}")
            
    except Exception as e:
        print(f"Error sending detection to backend: {str(e)}")

def background_detection_handler():
    """Process detections in a background thread to avoid blocking the main frame loop"""
    while True:
        try:
            detection = detection_queue.get(timeout=1)
            send_alert(detection)
            send_detection_to_backend(detection)
        except:
            pass

def capture_and_encode_image(frame):
    """
    Capture and encode frame as base64 JPEG for transmission
    
    Args:
        frame: OpenCV frame
        
    Returns:
        Base64 encoded JPEG string
    """
    try:
        # Encode frame as JPEG
        _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
        # Convert to base64
        image_base64 = base64.b64encode(buffer).decode('utf-8')
        return image_base64
    except Exception as e:
        print(f"Error encoding image: {e}")
        return None

# Start background thread for detection processing
detection_thread = threading.Thread(target=background_detection_handler, daemon=True)
detection_thread.start()


cap = get_camera()
cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)  # Minimize buffer to reduce lag
cap.set(cv2.CAP_PROP_FPS, 30)  # Set target FPS

frame_skip = 0
SKIP_FRAMES = 0  # Process every frame (set to 1 to process every 2nd frame for faster speed)

while True:
    ret, frame = cap.read()
    if not ret:
        break

    frame_skip += 1
    
    # Skip frames for faster processing if needed
    if frame_skip % (SKIP_FRAMES + 1) != 0:
        cv2.imshow("WildGuard AI - Human & Animal", frame)
        if cv2.waitKey(1) == 27:  # ESC key to exit
            break
        continue

    # Resize frame for faster processing
    frame = cv2.resize(frame, (640, 480))
    detections, frame = detect(frame)

    # Queue detections for background processing instead of blocking
    for d in detections:
        if isinstance(d, str):
            # Convert string detection to object
            if d == "person":
                detection_obj = {
                    "type": "person",
                    "species": "Human",
                    "confidence": 0.95,
                    "camera": "Cam-01",
                    "blindspot": "No",
                    "image": capture_and_encode_image(frame)  # Capture image for human detections
                }
            elif d == "fire":
                detection_obj = {
                    "type": "fire",
                    "species": "Fire",
                    "confidence": 0.90,
                    "camera": "Cam-01",
                    "blindspot": "No",
                    "image": capture_and_encode_image(frame)  # Capture image for fire detections
                }
            elif d.startswith("animal:"):
                animal_type = d.split(":", 1)[1]
                detection_obj = {
                    "type": "animal",
                    "species": animal_type,
                    "confidence": 0.80,
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
            # Capture image if it's a critical detection (person or fire)
            if isinstance(detection_obj, dict):
                obj_type = detection_obj.get('type', '').lower()
                if obj_type in ['person', 'fire']:
                    detection_obj['image'] = capture_and_encode_image(frame)
        
        # Add detection to queue for background processing
        try:
            detection_queue.put_nowait(detection_obj)
        except:
            pass  # Queue full, skip this detection

    cv2.imshow("WildGuard AI - Human & Animal", frame)
    if cv2.waitKey(1) == 27:  # ESC key to exit
        break

cap.release()
cv2.destroyAllWindows()

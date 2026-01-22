import requests
import json
from datetime import datetime
import time
import random

# Configuration for sending data to backend
API_BASE_URL = "http://localhost:5000/api/detection/update"

def send_detection_to_backend(detection_type, species="Human", confidence=None):
    """
    Send detection data to the backend API
    
    Args:
        detection_type: Type of detection ('person', 'animal', 'fire')
        species: Species name (for animal detections)
        confidence: Confidence level (0-100)
    """
    if confidence is None:
        confidence = random.randint(70, 95)
    
    try:
        # Prepare the payload
        detection_data = {
            "newDetection": {
                "id": int(datetime.now().timestamp()),
                "type": detection_type,
                "species": species,
                "confidence": confidence,
                "camera": "Cam-01",
                "blindspot": "No",
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
            print(f"✅ Detection sent to backend: {detection_type} ({species}) - {confidence}%")
            result = response.json()
            print(f"   Backend response: {result.get('message', 'Success')}")
        else:
            print(f"❌ Failed to send detection to backend. Status: {response.status_code}")
            print(f"   Response: {response.text}")
            
    except Exception as e:
        print(f"❌ Error sending detection to backend: {str(e)}")

def simulate_detections():
    """Simulate various detections for testing"""
    print("🎯 Starting detection simulation...")
    print("Press Ctrl+C to stop")
    
    try:
        while True:
            # Randomly generate different types of detections
            detection_types = [
                ('person', 'Human'),
                ('animal', 'Elephant'),
                ('animal', 'Tiger'),
                ('animal', 'Deer'),
                ('fire', 'Fire')
            ]
            
            # Choose a random detection
            detection_type, species = random.choice(detection_types)
            
            # Send the detection
            send_detection_to_backend(detection_type, species)
            
            # Wait before next detection (random interval)
            wait_time = random.uniform(3, 8)
            print(f"⏳ Waiting {wait_time:.1f} seconds before next detection...\n")
            time.sleep(wait_time)
            
    except KeyboardInterrupt:
        print("\n🛑 Simulation stopped by user")

if __name__ == "__main__":
    simulate_detections()
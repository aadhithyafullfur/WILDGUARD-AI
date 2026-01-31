from flask import Flask, render_template, jsonify, request, send_from_directory
from flask_socketio import SocketIO, emit
import cv2
import numpy as np
from ultralytics import YOLO
import threading
import time
import os
from datetime import datetime
import json

app = Flask(__name__, template_folder='templates', static_folder='static')
app.config['SECRET_KEY'] = 'wildguard_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables for detection
detection_flags = {
    'person': False,
    'animal': False,
    'fire': False
}

detection_counts = {
    'hunters_detected': 0,
    'animals_detected': 0,
    'wildfires_detected': 0
}

last_detection_time = {
    'person': 0,
    'animal': 0,
    'fire': 0
}

# Create images directory if it doesn't exist
if not os.path.exists('images'):
    os.makedirs('images')

# Create static directory if it doesn't exist
if not os.path.exists('static'):
    os.makedirs('static')

# Create templates directory if it doesn't exist
if not os.path.exists('templates'):
    os.makedirs('templates')

# Load YOLO models
person_model = None
animal_model = None
fire_model = None

import os

# Create absolute paths for models
models_dir = os.path.join('WILDGUARD', 'ML', 'models')
person_model_path = os.path.join(models_dir, 'yolov8n.pt')
animal_model_path = os.path.join(models_dir, 'best (3).pt')
fire_model_path = os.path.join(models_dir, 'best.pt')

try:
    # Person detection model - using COCO dataset model which includes 'person' class
    person_model = YOLO(person_model_path)
    
    # Animal detection model - using the existing animal detection model
    animal_model = YOLO(animal_model_path)
    
    # Fire detection model
    fire_model = YOLO(fire_model_path)
    
    print("All models loaded successfully!")
except Exception as e:
    print(f"Error loading models: {e}")
    print("Attempting to load models from alternative paths...")
    try:
        # Try loading from the ML models directory directly
        person_model_path_alt = os.path.join('..', 'ML', 'models', 'yolov8n.pt')
        animal_model_path_alt = os.path.join('..', 'ML', 'models', 'best (3).pt')
        fire_model_path_alt = os.path.join('..', 'ML', 'models', 'best.pt')
        
        person_model = YOLO(person_model_path_alt)
        animal_model = YOLO(animal_model_path_alt)
        fire_model = YOLO(fire_model_path_alt)
        print("Models loaded successfully with alternative paths!")
    except Exception as e2:
        print(f"Critical error loading models: {e2}")
        print("Make sure the model files exist in the WILDGUARD/ML/models/ directory")
        person_model = None
        animal_model = None
        fire_model = None

# Camera capture thread
camera_thread = None
stop_camera = False

def capture_frames():
    global detection_flags, detection_counts, last_detection_time, stop_camera
    
    # Try multiple camera indices as fallback
    cap = None
    for camera_index in [0, 1, 2]:
        cap = cv2.VideoCapture(camera_index)
        if cap.isOpened():
            print(f"Successfully opened camera at index {camera_index}")
            break
        else:
            print(f"Failed to open camera at index {camera_index}")
    
    if cap is None or not cap.isOpened():
        print("Error: Could not open any camera.")
        return
    
    frame_count = 0
    cooldown_period = 10  # seconds to wait before allowing another detection of the same type
    
    while not stop_camera:
        ret, frame = cap.read()
        if not ret:
            print("Error: Could not read frame from camera. Attempting to reinitialize camera...")
            # Reinitialize camera if reading fails
            cap.release()
            cap = cv2.VideoCapture(0)
            if not cap.isOpened():
                print("Could not reinitialize camera, waiting before retry...")
                time.sleep(2)
                continue
            else:
                print("Camera reinitialized successfully")
            continue
            
        # Process every 5th frame to reduce computational load
        frame_count += 1
        if frame_count % 5 != 0:
            continue
            
        # Run person detection
        if person_model:
            person_results = person_model(frame, verbose=False)
            for result in person_results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        cls = int(box.cls[0])
                        conf = float(box.conf[0])
                        
                        # Class 0 is 'person' in COCO dataset
                        if cls == 0 and conf > 0.5:  # person detected
                            current_time = time.time()
                            
                            # Check if enough time has passed since last person detection
                            if current_time - last_detection_time['person'] > cooldown_period:
                                if not detection_flags['person']:
                                    detection_flags['person'] = True
                                    detection_counts['hunters_detected'] += 1
                                    
                                    # Capture and save image
                                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                                    img_filename = f"hunter_{timestamp}.jpg"
                                    img_path = os.path.join('images', img_filename)
                                    cv2.imwrite(img_path, frame)
                                    
                                    # Prepare detection data
                                    detection_data = {
                                        'type': 'hunter',
                                        'name': 'Hunter Detected',
                                        'image': f'/images/{img_filename}',
                                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                        'counters': detection_counts.copy()
                                    }
                                    
                                    # Emit to all connected clients
                                    socketio.emit('detection_alert', detection_data)
                                    print(f"Hunter detected! Image saved: {img_path}")
                                    
                                    # Update last detection time
                                    last_detection_time['person'] = current_time
        
        # Run animal detection
        if animal_model:
            animal_results = animal_model(frame, verbose=False)
            for result in animal_results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        conf = float(box.conf[0])
                        
                        # Assuming any detection from animal model is an animal
                        if conf > 0.5:
                            current_time = time.time()
                            
                            # Check if enough time has passed since last animal detection
                            if current_time - last_detection_time['animal'] > cooldown_period:
                                if not detection_flags['animal']:
                                    detection_flags['animal'] = True
                                    detection_counts['animals_detected'] += 1
                                    
                                    # Capture and save image
                                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                                    img_filename = f"animal_{timestamp}.jpg"
                                    img_path = os.path.join('images', img_filename)
                                    cv2.imwrite(img_path, frame)
                                    
                                    # Get the animal class name if available
                                    # For this example, we'll just use 'Animal Detected'
                                    # In a real implementation, you'd get the specific animal type
                                    detection_name = 'Animal Detected'
                                    
                                    # Prepare detection data
                                    detection_data = {
                                        'type': 'animal',
                                        'name': detection_name,
                                        'image': f'/images/{img_filename}',
                                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                        'counters': detection_counts.copy()
                                    }
                                    
                                    # Emit to all connected clients
                                    socketio.emit('detection_alert', detection_data)
                                    print(f"Animal detected! Image saved: {img_path}")
                                    
                                    # Update last detection time
                                    last_detection_time['animal'] = current_time
        
        # Run fire detection
        if fire_model:
            fire_results = fire_model(frame, verbose=False)
            for result in fire_results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        conf = float(box.conf[0])
                        
                        # Assuming any detection from fire model is fire
                        if conf > 0.5:
                            current_time = time.time()
                            
                            # Check if enough time has passed since last fire detection
                            if current_time - last_detection_time['fire'] > cooldown_period:
                                if not detection_flags['fire']:
                                    detection_flags['fire'] = True
                                    detection_counts['wildfires_detected'] += 1
                                    
                                    # Capture and save image
                                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                                    img_filename = f"fire_{timestamp}.jpg"
                                    img_path = os.path.join('images', img_filename)
                                    cv2.imwrite(img_path, frame)
                                    
                                    # Prepare detection data
                                    detection_data = {
                                        'type': 'fire',
                                        'name': 'Wildfire Detected',
                                        'image': f'/images/{img_filename}',
                                        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
                                        'counters': detection_counts.copy()
                                    }
                                    
                                    # Emit to all connected clients
                                    socketio.emit('detection_alert', detection_data)
                                    print(f"Wildfire detected! Image saved: {img_path}")
                                    
                                    # Update last detection time
                                    last_detection_time['fire'] = current_time
        
        time.sleep(0.1)  # Small delay to prevent excessive CPU usage
    
    cap.release()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/images/<filename>')
def uploaded_file(filename):
    return send_from_directory('images', filename)

@app.route('/reset', methods=['POST'])
def reset_detections():
    global detection_flags, detection_counts, last_detection_time
    
    # Reset all flags
    detection_flags = {
        'person': False,
        'animal': False,
        'fire': False
    }
    
    # Reset counters
    detection_counts = {
        'hunters_detected': 0,
        'animals_detected': 0,
        'wildfires_detected': 0
    }
    
    # Reset last detection times
    current_time = time.time()
    last_detection_time = {
        'person': current_time,
        'animal': current_time,
        'fire': current_time
    }
    
    # Emit reset signal to all clients
    reset_data = {
        'type': 'reset',
        'message': 'Detections reset successfully',
        'counters': detection_counts.copy()
    }
    socketio.emit('reset_signal', reset_data)
    
    return jsonify({'success': True, 'message': 'Detections reset successfully'})


@app.route('/api/detection/update', methods=['POST'])
def update_detection():
    global detection_flags, detection_counts, last_detection_time
    
    print("📥 Received POST request to /api/detection/update")
    
    try:
        # Get the detection data from the request
        data = request.get_json()
        print(f"📥 Raw data received: {data}")
        new_detection = data.get('newDetection', {})
        print(f"📥 New detection data: {new_detection}")
        
        detection_type = new_detection.get('type', 'unknown')
        species = new_detection.get('species', 'Unknown')
        confidence = new_detection.get('confidence', 0)
        timestamp = new_detection.get('timestamp', datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
        
        # Map detection types
        mapped_type = detection_type
        if detection_type == 'person':
            mapped_type = 'hunter'
        
        # Update counters based on detection type
        if mapped_type == 'hunter':
            detection_counts['hunters_detected'] += 1
            flag_key = 'person'
            img_prefix = 'hunter'
            detection_name = 'Hunter Detected'
        elif mapped_type == 'animal':
            detection_counts['animals_detected'] += 1
            flag_key = 'animal'
            img_prefix = 'animal'
            detection_name = f'{species} Detected'
        elif mapped_type == 'fire':
            detection_counts['wildfires_detected'] += 1
            flag_key = 'fire'
            img_prefix = 'fire'
            detection_name = 'Wildfire Detected'
        else:
            return jsonify({'success': False, 'message': 'Unknown detection type'})
        
        # Capture and save image
        timestamp_file = datetime.now().strftime("%Y%m%d_%H%M%S")
        img_filename = f"{img_prefix}_{timestamp_file}.jpg"
        img_path = os.path.join('images', img_filename)
        
        # For now, we'll create a placeholder image since we don't have the actual frame
        # In a real implementation, you'd receive the image data or capture it here
        placeholder_img = np.zeros((480, 640, 3), dtype=np.uint8)
        cv2.putText(placeholder_img, f"{detection_name} - {confidence}%", 
                   (50, 240), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
        cv2.imwrite(img_path, placeholder_img)
        
        # Prepare detection data for frontend
        detection_data = {
            'type': mapped_type,
            'name': detection_name,
            'image': f'/images/{img_filename}',
            'timestamp': timestamp,
            'counters': detection_counts.copy()
        }
        
        # Emit to all connected clients
        print(f"📤 Emitting detection_alert: {detection_data}")
        socketio.emit('detection_alert', detection_data)
        print(f"📤 Detection emitted to frontend: {detection_name}")
        
        # Update last detection time
        last_detection_time[flag_key] = time.time()
        
        return jsonify({'success': True, 'message': 'Detection updated successfully'})
        
    except Exception as e:
        print(f"Error processing detection update: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500


@app.route('/api/detection/data', methods=['GET'])
def get_detection_data():
    global detection_counts
    
    # Calculate total detections
    total_detections = detection_counts['hunters_detected'] + detection_counts['animals_detected'] + detection_counts['wildfires_detected']
    
    # Create response data
    response_data = {
        'summary': {
            'totalDetections': total_detections,
            'animalsDetected': detection_counts['animals_detected'],
            'personsDetected': detection_counts['hunters_detected'],
            'activeAlerts': 0  # This can be calculated based on current alerts
        },
        'trendData': [
            {'day': 'Mon', 'detections': 120},
            {'day': 'Tue', 'detections': 195},
            {'day': 'Wed', 'detections': 180},
            {'day': 'Thu', 'detections': 210},
            {'day': 'Fri', 'detections': 175},
            {'day': 'Sat', 'detections': 160},
            {'day': 'Sun', 'detections': 145}
        ],
        'speciesData': [
            {'name': 'Elephant', 'count': detection_counts['animals_detected']},
            {'name': 'Tiger', 'count': max(0, detection_counts['animals_detected'] - 5)},
            {'name': 'Lion', 'count': max(0, detection_counts['animals_detected'] - 10)},
            {'name': 'Deer', 'count': max(0, detection_counts['animals_detected'] - 3)},
            {'name': 'Human', 'count': detection_counts['hunters_detected']},
            {'name': 'Fire', 'count': detection_counts['wildfires_detected']}
        ],
        'detections': [],  # This will be populated with recent detections
        'alerts': []  # This will be populated with recent alerts
    }
    
    return jsonify(response_data)

@app.route('/test-endpoint', methods=['GET'])
def test_endpoint():
    return jsonify({'message': 'Test endpoint working', 'timestamp': datetime.now().isoformat()})


@app.route('/counters', methods=['GET'])
def get_counters():
    return jsonify(detection_counts)

@socketio.on('connect')
def handle_connect():
    print('Client connected')
    # Send current counters to newly connected client
    emit('counters_update', detection_counts)

@socketio.on('request_counters')
def handle_request_counters():
    emit('counters_update', detection_counts)

@socketio.on('disconnect')
def handle_disconnect():
    print('Client disconnected')

def start_camera_capture():
    global camera_thread
    if camera_thread is None or not camera_thread.is_alive():
        camera_thread = threading.Thread(target=capture_frames, daemon=True)
        camera_thread.start()

# Serve React app
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    # Start camera capture in a separate thread
    start_camera_capture()
    
    # Run the Flask app
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
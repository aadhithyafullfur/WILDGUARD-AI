from flask import Flask, jsonify, request
from flask_socketio import SocketIO, emit
import threading
import time
from datetime import datetime

app = Flask(__name__)
app.config['SECRET_KEY'] = 'wildguard_secret_key'
socketio = SocketIO(app, cors_allowed_origins="*")

# Global variables for detection
detection_counts = {
    'hunters_detected': 0,
    'animals_detected': 0,
    'wildfires_detected': 0
}

@app.route('/api/detection/update', methods=['POST'])
def update_detection():
    global detection_counts
    
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
            detection_name = 'Hunter Detected'
        elif mapped_type == 'animal':
            detection_counts['animals_detected'] += 1
            detection_name = f'{species} Detected'
        elif mapped_type == 'fire':
            detection_counts['wildfires_detected'] += 1
            detection_name = 'Wildfire Detected'
        else:
            return jsonify({'success': False, 'message': 'Unknown detection type'})
        
        # Prepare detection data for frontend
        detection_data = {
            'type': mapped_type,
            'name': detection_name,
            'image': None,  # No image for now
            'timestamp': timestamp,
            'counters': detection_counts.copy()
        }
        
        # Emit to all connected clients
        print(f"📤 Emitting detection_alert: {detection_data}")
        socketio.emit('detection_alert', detection_data)
        print(f"📤 Detection emitted to frontend: {detection_name}")
        
        return jsonify({'success': True, 'message': 'Detection updated successfully'})
        
    except Exception as e:
        print(f"Error processing detection update: {e}")
        return jsonify({'success': False, 'message': f'Error: {str(e)}'}), 500

@app.route('/counters', methods=['GET'])
def get_counters():
    return jsonify(detection_counts)

@app.route('/reset', methods=['POST'])
def reset_detections():
    global detection_counts
    
    # Reset counters
    detection_counts = {
        'hunters_detected': 0,
        'animals_detected': 0,
        'wildfires_detected': 0
    }
    
    # Emit reset signal to all clients
    reset_data = {
        'type': 'reset',
        'message': 'Detections reset successfully',
        'counters': detection_counts.copy()
    }
    socketio.emit('reset_signal', reset_data)
    
    return jsonify({'success': True, 'message': 'Detections reset successfully'})

@socketio.on('connect')
def handle_connect():
    print('🔌 Client connected')
    # Send current counters to newly connected client
    emit('counters_update', detection_counts)

@socketio.on('request_counters')
def handle_request_counters():
    emit('counters_update', detection_counts)

@socketio.on('disconnect')
def handle_disconnect():
    print('🔌 Client disconnected')

if __name__ == '__main__':
    print("🚀 Starting simplified WildGuard backend...")
    socketio.run(app, host='0.0.0.0', port=5000, debug=True, use_reloader=False)
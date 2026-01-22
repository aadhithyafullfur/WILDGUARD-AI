# WILDGUARD 2.0 - API Integration Guide

Detailed guide for integrating ML detection systems with the WILDGUARD alert system.

## Detection Payload Format

### Standard Detection Object

All detections should be POST'd to: `http://localhost:5000/api/detection/update`

#### JSON Structure
```json
{
  "newDetection": {
    "id": 1234567890,
    "type": "person",
    "species": "human",
    "confidence": 95.5,
    "camera": "Cam-01",
    "blindspot": "No",
    "timestamp": "2024-01-22 14:30:45"
  }
}
```

#### Field Reference

| Field | Type | Required | Example | Notes |
|-------|------|----------|---------|-------|
| `id` | Number | ✅ | `1234567890` | Unique detection ID, use Unix timestamp |
| `type` | String | ✅ | `"person"`, `"animal"`, `"fire"` | Detection category |
| `species` | String | ✅ | `"human"`, `"elephant"`, `"tiger"` | Specific species detected |
| `confidence` | Number | ✅ | `95.5` | Confidence score 0-100 |
| `camera` | String | ✅ | `"Cam-01"` | Camera identifier |
| `blindspot` | String | ⚠️ | `"Yes"`, `"No"` | Optional, for zone detection |
| `timestamp` | String | ✅ | `"2024-01-22 14:30:45"` | ISO format recommended |

## Detection Types & Mapping

### Type: Person (Hunters)
```json
{
  "newDetection": {
    "id": 1234567890,
    "type": "person",
    "species": "human",
    "confidence": 95.5,
    "camera": "Cam-01",
    "timestamp": "2024-01-22 14:30:45"
  }
}
```

**Result**: 
- 🚨 Alert: "HUNTER DETECTED"
- Counter: `hunters_detected` increments by 1
- Severity: CRITICAL
- Color: Red

### Type: Animal - Elephant
```json
{
  "newDetection": {
    "id": 1234567891,
    "type": "animal",
    "species": "elephant",
    "confidence": 87.3,
    "camera": "Cam-02",
    "timestamp": "2024-01-22 14:30:40"
  }
}
```

**Result**:
- 🐘 Alert: "ELEPHANT DETECTED"
- Counter: `elephants_detected` increments by 1
- Severity: HIGH
- Color: Blue

### Type: Animal - Tiger
```json
{
  "newDetection": {
    "id": 1234567892,
    "type": "animal",
    "species": "tiger",
    "confidence": 92.1,
    "camera": "Cam-03",
    "timestamp": "2024-01-22 14:30:35"
  }
}
```

**Result**:
- 🐯 Alert: "TIGER DETECTED"
- Counter: `tigers_detected` increments by 1
- Severity: HIGH
- Color: Orange

### Type: Fire (Wildfires)
```json
{
  "newDetection": {
    "id": 1234567893,
    "type": "fire",
    "species": "fire",
    "confidence": 98.0,
    "camera": "Cam-04",
    "timestamp": "2024-01-22 14:30:30"
  }
}
```

**Result**:
- 🔥 Alert: "WILDFIRE DETECTED"
- Counter: `wildfires_detected` increments by 1
- Severity: CRITICAL
- Color: Amber

## API Responses

### Success Response (New Detection)
```json
{
  "success": true,
  "message": "Detection processed",
  "alert": {
    "id": 1234567890,
    "type": "HUNTER",
    "title": "🚨 HUNTER DETECTED",
    "message": "Illegal hunting activity detected in protected area!",
    "emoji": "🚨",
    "severity": "CRITICAL",
    "detection": {
      "species": "human",
      "confidence": 95.5,
      "camera": "Cam-01",
      "timestamp": "2024-01-22 14:30:45"
    },
    "createdAt": "2024-01-22T14:30:45.000Z"
  },
  "counters": {
    "hunters_detected": 5,
    "elephants_detected": 12,
    "tigers_detected": 3,
    "wildfires_detected": 1,
    "total_detections": 21
  }
}
```

### Success Response (Duplicate Detection)
```json
{
  "success": true,
  "message": "Detection processed (duplicate ignored)",
  "counters": {
    "hunters_detected": 5,
    "elephants_detected": 12,
    "tigers_detected": 3,
    "wildfires_detected": 1,
    "total_detections": 21
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "No detection data provided"
}
```

## Integration Examples

### Python (ML Detection Module)

```python
import requests
import json
from datetime import datetime

API_URL = "http://localhost:5000/api/detection/update"

def send_detection_to_backend(detection_type, species, confidence, camera):
    """Send detection to WILDGUARD alert system"""
    
    payload = {
        "newDetection": {
            "id": int(datetime.now().timestamp()),
            "type": detection_type,        # "person", "animal", "fire"
            "species": species,             # "human", "elephant", "tiger"
            "confidence": confidence,       # 0-100
            "camera": camera,               # "Cam-01", etc.
            "timestamp": datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    }
    
    try:
        response = requests.post(
            API_URL,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get('alert'):
                print(f"✅ Alert Generated: {data['alert']['title']}")
            else:
                print("⏭️ Detection processed (duplicate ignored)")
            print(f"📊 Counters: {data['counters']}")
        else:
            print(f"❌ Error: {response.status_code}")
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Connection error: {e}")


# Example usage in detection loop
def process_detections(frame, results):
    """Process YOLO results and send to backend"""
    
    for detection in results:
        # Assuming YOLO detection object with class_name, confidence, bbox
        
        if detection.class_name == "person":
            send_detection_to_backend(
                detection_type="person",
                species="human",
                confidence=detection.confidence * 100,
                camera="Cam-01"
            )
            
        elif detection.class_name == "elephant":
            send_detection_to_backend(
                detection_type="animal",
                species="elephant",
                confidence=detection.confidence * 100,
                camera="Cam-02"
            )
            
        elif detection.class_name == "tiger":
            send_detection_to_backend(
                detection_type="animal",
                species="tiger",
                confidence=detection.confidence * 100,
                camera="Cam-03"
            )
            
        elif detection.class_name == "fire":
            send_detection_to_backend(
                detection_type="fire",
                species="fire",
                confidence=detection.confidence * 100,
                camera="Cam-04"
            )
```

### Node.js/JavaScript (Custom Integration)

```javascript
const http = require('http');

/**
 * Send detection to WILDGUARD backend
 * @param {Object} detection - Detection object
 */
function sendDetectionToBackend(detection) {
  const payload = JSON.stringify({
    newDetection: {
      id: Math.floor(Date.now() / 1000),
      type: detection.type,           // "person", "animal", "fire"
      species: detection.species,     // "human", "elephant", "tiger"
      confidence: detection.confidence,
      camera: detection.camera || "Cam-01",
      timestamp: new Date().toLocaleString()
    }
  });

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/detection/update',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(payload)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      const response = JSON.parse(data);
      console.log('📊 Response:', response);
    });
  });

  req.on('error', (e) => {
    console.error(`❌ Error: ${e.message}`);
  });

  req.write(payload);
  req.end();
}

// Usage
sendDetectionToBackend({
  type: 'person',
  species: 'human',
  confidence: 95.5,
  camera: 'Cam-01'
});
```

### cURL Commands

#### Send Hunter Detection
```bash
curl -X POST http://localhost:5000/api/detection/update \
  -H "Content-Type: application/json" \
  -d '{
    "newDetection": {
      "id": 1234567890,
      "type": "person",
      "species": "human",
      "confidence": 95.5,
      "camera": "Cam-01",
      "timestamp": "2024-01-22 14:30:45"
    }
  }'
```

#### Send Elephant Detection
```bash
curl -X POST http://localhost:5000/api/detection/update \
  -H "Content-Type: application/json" \
  -d '{
    "newDetection": {
      "id": 1234567891,
      "type": "animal",
      "species": "elephant",
      "confidence": 87.3,
      "camera": "Cam-02",
      "timestamp": "2024-01-22 14:30:40"
    }
  }'
```

#### Get Current Counters
```bash
curl http://localhost:5000/counters
```

#### Reset System
```bash
curl -X POST http://localhost:5000/reset
```

## WebSocket Integration (Real-Time Client)

### JavaScript Client

```javascript
import io from 'socket.io-client';

// Connect to backend
const socket = io('http://localhost:5000');

// Handle new alerts
socket.on('alert', (alert) => {
  console.log(`🚨 New Alert: ${alert.title}`);
  console.log(`   Message: ${alert.message}`);
  console.log(`   Camera: ${alert.detection.camera}`);
  console.log(`   Confidence: ${alert.detection.confidence}%`);
  
  // Update UI, play sound, send notification, etc.
  playAlertSound(alert.severity);
  showAlertNotification(alert);
});

// Handle counter updates
socket.on('counters-updated', (counters) => {
  console.log('📊 Counters Updated:', counters);
  
  // Update dashboard cards
  updateHunterCount(counters.hunters_detected);
  updateElephantCount(counters.elephants_detected);
  updateTigerCount(counters.tigers_detected);
  updateFireCount(counters.wildfires_detected);
});

// Handle system reset
socket.on('system-reset', (counters) => {
  console.log('🔄 System Reset:', counters);
  clearAllAlerts();
  resetAllCounters();
});

// Connection status
socket.on('connect', () => {
  console.log('✅ Connected to WILDGUARD server');
  updateConnectionStatus('ONLINE');
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
  updateConnectionStatus('OFFLINE');
});
```

## Batch Detection Processing

### Processing Multiple Detections

```python
# For high-throughput scenarios, batch detections

detections_buffer = []

def buffer_detection(detection):
    """Add detection to buffer"""
    detections_buffer.append(detection)
    
    # Send batch every 10 detections or 5 seconds
    if len(detections_buffer) >= 10:
        flush_detections()

def flush_detections():
    """Send all buffered detections"""
    for detection in detections_buffer:
        send_detection_to_backend(detection)
    detections_buffer.clear()

# Set up periodic flush
import threading
threading.Timer(5.0, flush_detections).start()
```

## Error Handling & Retry Logic

### Robust Detection Sending

```python
import requests
from time import sleep

def send_detection_with_retry(detection, max_retries=3):
    """Send detection with automatic retry on failure"""
    
    url = "http://localhost:5000/api/detection/update"
    payload = {"newDetection": detection}
    
    for attempt in range(max_retries):
        try:
            response = requests.post(
                url,
                json=payload,
                timeout=5
            )
            
            if response.status_code == 200:
                print(f"✅ Detection sent successfully")
                return True
            else:
                print(f"⚠️ Server error: {response.status_code}")
                
        except requests.exceptions.ConnectionError:
            print(f"⚠️ Connection failed (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                sleep(2 ** attempt)  # Exponential backoff
                
        except requests.exceptions.Timeout:
            print(f"⚠️ Request timeout (attempt {attempt + 1}/{max_retries})")
            if attempt < max_retries - 1:
                sleep(2 ** attempt)
    
    print(f"❌ Failed to send detection after {max_retries} attempts")
    return False
```

## Performance Considerations

### Optimal Detection Rate

- **Recommended**: 1-5 detections per second per camera
- **Maximum**: 10 detections per second (tested)
- **Deduplication Window**: 5 seconds (tunable in alertManager)

### Confidence Thresholds

Recommended minimum confidence levels:
- **Person/Hunter**: 60-80%
- **Animals**: 50-70%
- **Fire**: 70-90%

### Network Optimization

```python
# Only send high-confidence detections
MIN_CONFIDENCE = 80  # percent

if detection.confidence >= MIN_CONFIDENCE:
    send_detection_to_backend(detection)
```

## Troubleshooting Integration

### Detection Not Received
1. Verify URL: `http://localhost:5000/api/detection/update`
2. Verify backend is running
3. Check payload format (type/species must match schema)
4. Check server logs for errors

### Counter Not Incrementing
1. Verify detection type is: "person", "animal", or "fire"
2. For animals, verify species is: "elephant", "tiger", etc.
3. Check if detection is duplicate (same type+camera within 5s)
4. Verify confidence is > 0

### WebSocket Not Receiving Alerts
1. Verify client is connected: `socket.on('connect')`
2. Check browser console for errors
3. Verify server broadcast is working
4. Check for JavaScript errors in alert handler

## Testing Integration

### Unit Test
```python
import requests

def test_detection_api():
    """Test detection endpoint"""
    
    detection = {
        "newDetection": {
            "id": 9999,
            "type": "person",
            "species": "human",
            "confidence": 95.0,
            "camera": "TestCam",
            "timestamp": "2024-01-22 14:30:45"
        }
    }
    
    response = requests.post(
        "http://localhost:5000/api/detection/update",
        json=detection
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data['success'] == True
    assert 'counters' in data
    
    print("✅ All tests passed!")

test_detection_api()
```

---

**Document Version**: 1.0
**Last Updated**: January 22, 2025
**Status**: Production Ready

# WILDGUARD 2.0 - Quick Setup Guide

Complete guide to set up and run the new professional alert system and dashboard.

## System Overview

```
┌──────────────────────────────────────────────────────────────┐
│                         WILDGUARD 2.0                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  🐍 ML Detection Module          📝 Backend Server           │
│  (Python)                        (Node.js + Express)         │
│  ├─ Camera Feed                  ├─ Alert Manager Service    │
│  ├─ YOLO Detection               ├─ WebSocket (Socket.IO)    │
│  ├─ Analysis                     ├─ Detection Routes         │
│  └─ HTTP POST Detections  ────→  └─ Counter Endpoints       │
│                                        ↑                      │
│                                        │ WebSocket            │
│                                        ↓                      │
│                                  ⚛️  React Dashboard         │
│                                  ├─ Live Alerts             │
│                                  ├─ Analytics Cards         │
│                                  ├─ Event Timeline          │
│                                  ├─ Camera Feed             │
│                                  └─ Control Panel           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Prerequisites

### System Requirements
- Node.js v14+ 
- npm v6+
- Python 3.8+
- 4GB RAM minimum
- Port availability: 3000 (React), 5000 (Backend), 5001+ (ML)

### Dependencies Status
```
✅ socket.io - WebSocket library (already in backend)
✅ socket.io-client - Client library (install in next steps)
✅ ultralytics - YOLO models (already in ML)
✅ cv2 - OpenCV (already in ML)
✅ express - Framework (already in backend)
✅ mongodb - Database (already in backend)
```

## Step-by-Step Installation

### Step 1: Verify Backend Setup

```bash
cd "d:\Projects\WILDGUARD 2.0\WILDGUARD\backend"

# Check if dependencies are installed
npm list

# If not, install
npm install

# Verify socket.io is installed
npm list socket.io
```

**Expected output:**
```
├── socket.io@4.5.x (or higher)
├── express
├── mongoose
└── cors
```

### Step 2: Verify Frontend Setup

```bash
cd "d:\Projects\WILDGUARD 2.0\WILDGUARD\client"

# Install dependencies (includes socket.io-client)
npm install socket.io-client@4.5.x

# Check installation
npm list socket.io-client
```

### Step 3: Verify Python ML Setup

```bash
cd "d:\Projects\WILDGUARD 2.0\WILDGUARD\ML"

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify YOLO models exist
ls -la models/
# Should show: yolov8n.pt, best.pt, best (3).pt
```

## Running the System

### Terminal Setup
Open **4 separate terminals** in the project root:

```
Terminal 1: Backend Server
Terminal 2: Frontend Dev Server  
Terminal 3: ML Detection
Terminal 4: Testing (optional)
```

### Terminal 1: Start Backend Server

```bash
cd WILDGUARD\backend
npm start
```

**Expected output:**
```
✅ Server is running on port 5000
✅ Socket.IO initialized
✅ A user connected: socket_id_xxx
```

### Terminal 2: Start React Frontend

```bash
cd WILDGUARD\client
npm start
```

**Expected output:**
```
✅ Compiled successfully!
✅ webpack compiled with ... warning
Open http://localhost:3000 to view it in the browser.
```

### Terminal 3: Start ML Detection

```bash
cd WILDGUARD\ML
python main.py
```

**Expected output:**
```
✅ Loading YOLO models...
✅ Camera initialized
✅ Starting detection loop...
📊 Detection: person (95.2%) at Cam-01
✅ Sent to backend: http://localhost:5000/api/detection/update
```

### Terminal 4 (Optional): Run Tests

```bash
cd WILDGUARD\backend
node test_alert_system.js
```

**Expected output:**
```
╔════════════════════════════════════════════════════════╗
║  WILDGUARD ALERT SYSTEM - TEST SUITE                   ║
╚════════════════════════════════════════════════════════╝

✅ Server Connectivity: PASSED
✅ WebSocket Connection: PASSED
✅ Detection Processing: PASSED
✅ Duplicate Prevention: PASSED
✅ Counter Verification: PASSED
✅ Reset Functionality: PASSED

✅ ALL TESTS PASSED (6/6)
```

## Accessing the Dashboard

### Open Dashboard
```
🌐 http://localhost:3000
```

### Dashboard Components

#### 1. **Analytics Cards** (Top)
```
🚨 Hunters: 0       🐘 Elephants: 0     🐯 Tigers: 0      🔥 Wildfires: 0
```
- Real-time count updates
- Color-coded by threat
- Shows detection type emoji

#### 2. **Live Camera Feed** (Left)
```
┌─────────────────────┐
│  Camera Stream      │
│  📹 Initializing... │
│  Cam-01 • 30 FPS    │
└─────────────────────┘
```

#### 3. **Alert Panel** (Right)
```
┌──────────────────────────────────────┐
│  🔔 Live Alert Panel  🔄 Reset       │
├──────────────────────────────────────┤
│  🚨 HUNTER DETECTED                  │
│  Illegal hunting activity detected   │
│  📍 Cam-01 • 🎯 95% • ⏰ 14:30:45    │
├──────────────────────────────────────┤
│  🐘 ELEPHANT DETECTED                │
│  Wildlife spotted in monitored area  │
│  📍 Cam-02 • 🎯 87% • ⏰ 14:30:40    │
└──────────────────────────────────────┘
```

#### 4. **Event Timeline** (Bottom)
```
📋 Event Timeline
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🚨 HUNTER DETECTED    @ 14:30:45 (95%)
🐘 ELEPHANT DETECTED  @ 14:30:40 (87%)
🐯 TIGER DETECTED     @ 14:30:35 (92%)
🔥 WILDFIRE DETECTED  @ 14:30:30 (98%)
```

## Testing the Alert System

### Test 1: Manual Alert Trigger

Use the test script (Terminal 4):

```bash
cd WILDGUARD\backend
node test_alert_system.js
```

This will:
1. ✅ Verify backend connectivity
2. ✅ Test WebSocket connection
3. ✅ Send test detections (Hunter, Elephant, Tiger, Fire)
4. ✅ Verify duplicate prevention
5. ✅ Check counter accuracy
6. ✅ Test reset functionality

### Test 2: Simulate Real Detections

Manually POST to the detection endpoint:

```bash
# Using curl (Windows: install git bash or use PowerShell)
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

Expected response:
```json
{
  "success": true,
  "alert": {
    "type": "HUNTER",
    "title": "🚨 HUNTER DETECTED",
    "message": "Illegal hunting activity detected in protected area!"
  },
  "counters": {
    "hunters_detected": 1,
    "elephants_detected": 0,
    "tigers_detected": 0,
    "wildfires_detected": 0,
    "total_detections": 1
  }
}
```

### Test 3: Monitor Real-Time Alerts

Watch the dashboard at `http://localhost:3000` while:
1. ML is running detections
2. Backend receives and processes them
3. Alerts appear instantly in dashboard
4. Counters increment in real-time

## Key Endpoints Reference

### Detection Endpoints
```
POST /api/detection/update
├─ Purpose: Receive detections from ML
├─ Source: Python ML module
└─ Frequency: Per detection (real-time)

GET /api/detection/data
├─ Purpose: Get current detection state
├─ Used by: Polling systems
└─ Returns: Current counters
```

### Counter Management
```
GET /counters
├─ Purpose: Get current hunter/elephant/tiger/fire counts
├─ Returns: { hunters_detected, elephants_detected, tigers_detected, wildfires_detected, total_detections }
└─ Used by: Dashboard cards

POST /reset
├─ Purpose: Clear all counters and active detections
├─ Returns: { success: true, data: counters }
└─ Note: ML detection continues running
```

### WebSocket Events
```
Client ← Server:
├─ alert: New detection alert
├─ counters-updated: Counter values changed
├─ system-reset: All counters reset
└─ connect: Client connected

Server → Client:
└─ (automatic) Receives alerts & counter updates
```

## Troubleshooting

### Backend Won't Start
```
Error: EADDRINUSE: address already in use :::5000
```
**Solution**: Kill process on port 5000
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID {PID} /F

# Mac/Linux
lsof -i :5000
kill -9 {PID}
```

### Frontend Won't Connect to Backend
```
Error: Failed to fetch http://localhost:5000/counters
```
**Solution**: 
1. Verify backend is running
2. Check CORS in backend/server.js
3. Verify ports: Backend=5000, Frontend=3000

### WebSocket Not Connecting
```
ERROR: WebSocket disconnected
```
**Solution**:
1. Ensure socket.io is installed: `npm list socket.io`
2. Check backend is running
3. Verify no firewall blocking port 5000
4. Check browser console for errors

### ML Not Sending Detections
```
Error: Cannot connect to http://localhost:5000/api/detection/update
```
**Solution**:
1. Verify backend is running
2. Check ML is not hanging
3. Verify detection format matches schema
4. Check backend logs for errors

### Counters Not Incrementing
```
Detection received but counter stays at 0
```
**Solution**:
1. Check detection `type` field: must be "person", "animal", or "fire"
2. For animals, check `species`: "elephant", "tiger", etc.
3. Verify no duplicates (same type+camera within 5 seconds)
4. Check server logs for processing errors

### Dashboard Shows "OFFLINE"
```
Connection indicator shows 🔴 OFFLINE
```
**Solution**:
1. Verify backend server is running
2. Check network connectivity
3. Verify CORS configuration
4. Wait for auto-reconnect (up to 5 seconds)

## Performance Optimization

### For Large-Scale Deployment

#### Backend Optimization
```javascript
// In server.js, adjust for many connections:
const io = socketIo(server, {
  transports: ['websocket'], // Skip HTTP polling
  maxHttpBufferSize: 1e6,     // 1MB buffer
  cors: { origin: "*" }       // Or specify origins
});
```

#### Frontend Optimization
```javascript
// Reduce chart update frequency
const CHART_UPDATE_INTERVAL = 5000; // 5 seconds instead of 1

// Limit alert history
const MAX_ALERTS = 20;
const MAX_EVENTS = 50;
```

#### ML Optimization
```python
# Skip sending duplicates in main.py
if not is_duplicate_detection():
    send_detection_to_backend(detection)
```

## Security Notes

### For Production Deployment

1. **Enable HTTPS/WSS**
   ```javascript
   const https = require('https');
   const fs = require('fs');
   
   const options = {
     key: fs.readFileSync('private-key.pem'),
     cert: fs.readFileSync('certificate.pem')
   };
   
   const server = https.createServer(options, app);
   ```

2. **Restrict CORS Origins**
   ```javascript
   cors: {
     origin: ["https://yourdomain.com"],
     credentials: true
   }
   ```

3. **Add Authentication**
   ```javascript
   io.use((socket, next) => {
     const token = socket.handshake.auth.token;
     if (isValidToken(token)) {
       next();
     } else {
       next(new Error("Authentication failed"));
     }
   });
   ```

4. **Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   app.use('/api/', rateLimit({
     windowMs: 15 * 60 * 1000, // 15 minutes
     max: 100 // limit each IP to 100 requests per windowMs
   }));
   ```

## Next Steps

1. ✅ System is fully operational
2. 📊 Monitor detections in real-time dashboard
3. 🔧 Customize alert severity/messages in `detectionAlertManager.js`
4. 📱 Add mobile/email notifications (future enhancement)
5. 💾 Implement persistent storage for alerts (future enhancement)

## Support & Documentation

- 📖 Full Documentation: `ALERT_SYSTEM_README.md`
- 🧪 Test Suite: `test_alert_system.js`
- 🔍 ML Integration: `WILDGUARD/ML/main.py`
- 💻 Backend Code: `WILDGUARD/backend/`
- ⚛️ Frontend Code: `WILDGUARD/client/src/`

---

**Status**: ✅ Ready to Deploy
**Version**: 2.0
**Last Updated**: January 22, 2025

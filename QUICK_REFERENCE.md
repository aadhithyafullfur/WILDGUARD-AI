# WILDGUARD 2.0 - Quick Reference Card

One-page guide for developers and operators.

## 🚀 Quick Start (3 Steps)

```bash
# Terminal 1: Backend
cd WILDGUARD/backend
npm install  # (if needed)
npm start    # Runs on port 5000

# Terminal 2: Frontend  
cd WILDGUARD/client
npm install socket.io-client  # (if needed)
npm start                       # Runs on port 3000

# Terminal 3: ML
cd WILDGUARD/ML
python main.py  # Sends detections to backend
```

## 📊 Dashboard
- **URL**: http://localhost:3000
- **Status**: Connection indicator top-right
- **Alerts**: Live panel updates in real-time
- **Counts**: 4 analytics cards update instantly

## 🔧 Key Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/api/detection/update` | Send detection from ML |
| `GET` | `/counters` | Get hunter/elephant/tiger/fire counts |
| `POST` | `/reset` | Clear all counters |
| `WS` | `/` (WebSocket) | Real-time alerts & counters |

## 📤 Send Detection (cURL)

```bash
curl -X POST http://localhost:5000/api/detection/update \
  -H "Content-Type: application/json" \
  -d '{
    "newDetection": {
      "id": '$(date +%s)',
      "type": "person",
      "species": "human",
      "confidence": 95.5,
      "camera": "Cam-01",
      "timestamp": "'$(date '+%Y-%m-%d %H:%M:%S')'"
    }
  }'
```

## 📍 Detection Types

```
type: "person"  + species: "human"   → 🚨 HUNTER
type: "animal"  + species: "elephant" → 🐘 ELEPHANT
type: "animal"  + species: "tiger"    → 🐯 TIGER
type: "fire"    + species: "fire"     → 🔥 WILDFIRE
```

## 📊 Alert Response

```json
{
  "alert": {
    "type": "HUNTER",
    "title": "🚨 HUNTER DETECTED",
    "message": "Illegal hunting activity...",
    "severity": "CRITICAL",
    "detection": {
      "confidence": 95.5,
      "camera": "Cam-01"
    }
  },
  "counters": {
    "hunters_detected": 5,
    "elephants_detected": 12,
    "tigers_detected": 3,
    "wildfires_detected": 1
  }
}
```

## 🔌 WebSocket Events

### Listen for Alerts
```javascript
const socket = io('http://localhost:5000');

socket.on('alert', (alert) => {
  console.log(alert.title);  // "🚨 HUNTER DETECTED"
  console.log(alert.severity);  // "CRITICAL"
});

socket.on('counters-updated', (counters) => {
  console.log(counters.hunters_detected);  // Current count
});

socket.on('system-reset', (counters) => {
  console.log('System reset!');
});
```

## 🧪 Test System

```bash
cd WILDGUARD/backend
node test_alert_system.js
```

Tests 6 features:
1. ✅ Backend connectivity
2. ✅ WebSocket connection
3. ✅ Detection processing
4. ✅ Duplicate prevention
5. ✅ Counter verification
6. ✅ Reset functionality

## 🚨 Common Issues

### Backend Won't Start
```bash
# Port 5000 in use?
netstat -ano | findstr :5000
taskkill /PID {PID} /F
```

### Frontend Can't Connect
```javascript
// Check network tab in browser
// Should see WebSocket connection to ws://localhost:5000
// Check console for errors
```

### Alerts Not Showing
1. Verify backend is running
2. Verify detection payload matches format
3. Check `type` is: "person", "animal", or "fire"
4. Check browser console for errors

### Counters Not Incrementing
1. Verify detection `species` field
2. Check for duplicates (same type+camera within 5s)
3. Monitor server logs

## 📈 Monitor Performance

### Check Server Status
```bash
curl http://localhost:5000/counters
# Returns: { hunters_detected: N, elephants_detected: N, ... }
```

### Check WebSocket Health
1. Open dashboard: http://localhost:3000
2. Look for 🟢 LIVE indicator
3. Check browser console (no errors)
4. Send test detection, verify alert appears

### Check ML Integration
1. Monitor ML terminal for sent detections
2. Monitor backend terminal for received data
3. Verify dashboard updates in real-time

## 🔄 Reset System

```bash
# Via cURL
curl -X POST http://localhost:5000/reset

# Via Dashboard
Click "🔄 Reset System" button
```

**Result**: All counters → 0, ML continues running

## 📁 Key Files

```
WILDGUARD/
├── backend/
│   ├── server.js                    (main server, WebSocket setup)
│   ├── routes/api/detection.js      (detection endpoint)
│   ├── services/
│   │   └── detectionAlertManager.js (alert logic)
│   └── test_alert_system.js         (test suite)
│
├── client/src/
│   ├── App.js                       (router)
│   └── pages/dashboard/
│       └── WildguardDashboard.js    (main dashboard)
│
└── ML/
    └── main.py                      (detection & sending)
```

## 🔐 Security Checklist

- [ ] Change CORS origins from localhost for production
- [ ] Enable HTTPS/WSS for production
- [ ] Add authentication to endpoints
- [ ] Implement rate limiting
- [ ] Validate all detection payloads
- [ ] Add audit logging
- [ ] Use environment variables for secrets

## 💾 Environment Variables

Create `.env` in `backend/`:
```
PORT=5000
MONGODB_URI=mongodb://...
NODE_ENV=development
```

## 📞 Documentation Links

- **Full System**: [ALERT_SYSTEM_README.md](ALERT_SYSTEM_README.md)
- **Setup Guide**: [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **API Details**: [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)
- **Implementation**: [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)

## 🎯 Architecture at a Glance

```
┌─────────────────┐
│  ML Module      │
│  (Python)       │
│  Detections → POST
└────────┬────────┘
         │
         ↓
┌─────────────────────────────────┐
│  Backend Server (Node.js)        │
│  POST /api/detection/update      │
│  ├─ DetectionAlertManager        │
│  ├─ Deduplication                │
│  ├─ Counter tracking             │
│  ├─ Alert creation               │
│  └─ WebSocket broadcast          │
└────────┬────────────────────────┘
         │
         ↓ WebSocket (Socket.IO)
         │
┌─────────────────────────────────┐
│  React Dashboard                 │
│  ├─ Analytics Cards              │
│  ├─ Alert Panel                  │
│  ├─ Event Timeline               │
│  └─ Camera Feed                  │
└─────────────────────────────────┘
```

## 🎓 Code Structure

### Backend Alert Processing
```javascript
// detectionAlertManager.js
processDetection(detection) {
  if (isDuplicate()) return null;      // 5s dedup window
  
  incrementCounter(detection);          // hunters/elephants/tigers/fires
  markDetectionProcessed(detection);   // Mark as processed
  
  const alert = createAlert(detection); // Build alert
  emitAlert(alert);                     // Send via WebSocket
  
  return alert;
}
```

### Frontend Listening
```javascript
// WildguardDashboard.js
useEffect(() => {
  const socket = io('http://localhost:5000');
  
  socket.on('alert', (alert) => {
    setAlerts(prev => [alert, ...prev]);  // Show alert
  });
  
  socket.on('counters-updated', (counters) => {
    setCounters(counters);                // Update cards
  });
}, []);
```

## 🚀 Production Deployment

### Before Going Live

1. **Security**
   - Enable HTTPS/WSS
   - Add authentication
   - Validate all inputs
   - Add rate limiting

2. **Scaling**
   - Use database for counters
   - Implement clustering
   - Use Redis for cache
   - Monitor performance

3. **Operations**
   - Set up logging
   - Add monitoring
   - Create backups
   - Document procedures

4. **Performance**
   - Test with high traffic
   - Optimize queries
   - Cache frequently accessed data
   - Monitor memory/CPU

## ⚡ Performance Tips

```bash
# Reduce WebSocket polling
# In browser, cache counter values
# Only update when changed

# Filter low-confidence detections in ML
if confidence > THRESHOLD:
    send_to_backend()

# Batch multiple detections
# Buffer and send every 10 or 5 seconds
```

## 📱 Mobile Dashboard (Future)

Next steps for mobile support:
```javascript
// Add React Native app
// Reuse WebSocket logic
// Scale UI for mobile
// Add push notifications
```

## 🔗 Related Systems

Integrates with:
- ✅ YOLO ML detection
- ✅ OpenCV camera feeds
- ✅ MongoDB user database
- ✅ Express backend
- ✅ React frontend

## 📞 Emergency Contacts

- Backend Error: Check `/backend` terminal
- Frontend Error: Check browser console
- WebSocket Issue: Check network tab
- Detection Not Sent: Check ML terminal

## ✅ Verification Checklist

- [ ] Backend running on port 5000
- [ ] Frontend running on port 3000
- [ ] ML sending detections
- [ ] Dashboard shows 🟢 LIVE
- [ ] Test detection produces alert
- [ ] Counter increments correctly
- [ ] Reset button clears counts
- [ ] WebSocket auto-reconnects

---

**Quick Reference Version**: 1.0
**Last Updated**: January 22, 2025
**Format**: One-page cheat sheet

Print this page for your desk! 📋

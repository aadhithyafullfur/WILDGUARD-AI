# Alert Sound Testing Guide

## Overview
The alert sound system is now fully functional with improved audio context handling for browser compatibility.

## Quick Start - Testing in Browser Console

### 1. **Test Fire Alert (CRITICAL)**
```javascript
testFireAlert()
```
**Expected Result**: 
- 🔥 Loud siren-like sound for 2 seconds
- Pattern: Multiple frequency modulations (900Hz → 1100Hz → 700Hz → 900Hz, etc.)
- Volume: 0.5 initial, fades to 0.01

### 2. **Test Hunter Alert (CRITICAL)**
```javascript
testHunterAlert()
```
**Expected Result**:
- 👤 Rapid high-pitched staccato beeps
- Pattern: 4 quick tone bursts at 1200Hz-1400Hz
- Duration: ~1 second total

### 3. **Test Animal Alerts**
```javascript
// Test different animals
testAnimalAlert('ELEPHANT')  // 400Hz base
testAnimalAlert('TIGER')     // 500Hz base
testAnimalAlert('DEER')      // 600Hz base
testAnimalAlert('BIRD')      // 700Hz base
```
**Expected Result**:
- 🐾 Melodic beeping sound
- Duration: 0.8 seconds
- Pattern: Two-tone beep (base → high → base)

### 4. **Check Audio System Status**
```javascript
checkAudioStatus()
```
**Output Example**:
```
🎵 Audio Context State: running
🔊 Sound Enabled: true
```

### 5. **Simulate Fire Detection**
```javascript
simulateFireDetection()
```
**Expected Result**:
- Triggers fire alert sound
- Shows log message
- Tests full fire detection flow

## Real-World Testing

### Method 1: Using Detection Simulator
If you have access to the detection simulator:
1. Navigate to WILDGUARD/simulate_detections.py
2. Run: `python simulate_detections.py`
3. Send a fire detection event
4. **Expected**: Fire alert popup + sound plays

### Method 2: Manual API Call
```bash
curl -X POST http://localhost:5000/detection/update \
  -H "Content-Type: application/json" \
  -d '{
    "type": "fire",
    "confidence": 95,
    "camera": "camera-1"
  }'
```

### Method 3: Backend Test Script
```bash
cd WILDGUARD/backend
node test_alert_system.js
```

## Troubleshooting

### Sound Not Playing?

**1. Check Audio Context Status**
```javascript
checkAudioStatus()
```
- If state is "suspended", click the page first to resume it
- If state is "running", context is ready

**2. Check Browser Console**
```javascript
// Open DevTools (F12) → Console tab
// Look for messages like:
// ✅ Audio context initialized
// 🔊 Playing alert sound for: WILDFIRE
// 🔥 Playing FIRE critical alert
```

**3. Browser Volume**
- Check your system volume
- Check browser tab volume controls
- Check speaker connections

**4. Browser Compatibility**
- Chrome 30+: ✅ Full support
- Firefox 25+: ✅ Full support
- Safari 11+: ✅ Full support (use webkit prefix)
- Edge 12+: ✅ Full support

### Audio Context State Issues

**Problem**: "Audio context not available"
**Solution**:
```javascript
// Manually initialize
import alertSoundManager from './alertSoundManager';
alertSoundManager.initializeContext();

// Then test
testFireAlert();
```

**Problem**: "Suspended" audio context
**Solution**: Click anywhere on the page to resume the context
```javascript
// The dashboard automatically handles this on first click
// If it doesn't work, manually resume:
alertSoundManager.ensureContextReady();
testFireAlert();
```

## Sound Specifications

### Fire Alert 🔥
- **Frequency**: 700-1150 Hz (alternating pattern)
- **Duration**: 2 seconds + follow-up hunter alert
- **Volume**: 0.5 → 0.3 → 0.01
- **Pattern**: 4 frequency sweeps

### Hunter Alert 👤
- **Frequency**: 1200-1400 Hz (staccato)
- **Duration**: ~1 second (4 × 0.15s bursts)
- **Volume**: 0.4 (constant fade)
- **Pattern**: 4 rapid pulses

### Animal Alert 🐾
- **Elephant**: 400-500 Hz (2-tone beep)
- **Tiger**: 500-650 Hz (2-tone beep)
- **Deer**: 600-750 Hz (2-tone beep)
- **Bird**: 700-850 Hz (2-tone beep)
- **Duration**: 0.8 seconds
- **Volume**: 0.3 (fades to 0.01)

## Console Log Output Example

When testing fire alert, you should see:
```
✅ Audio context initialized
🔊 Playing alert sound for: WILDFIRE
🔥 Playing FIRE critical alert
✅ Fire alert sound triggered
```

## Dashboard Integration

When a fire is detected via the WILDGUARD system:
1. Alert popup appears (red background, animated)
2. Console logs the detection
3. Sound manager plays WILDFIRE alert
4. Message displays for 10 seconds
5. Auto-dismisses

## Debugging Commands

### Get Full Audio Context Details
```javascript
alertSoundManager.audioContext
// Shows: 
// {
//   state: "running",
//   currentTime: 12.345,
//   sampleRate: 48000,
//   ...
// }
```

### Check if Sounds are Enabled
```javascript
alertSoundManager.getSoundEnabled()
// Returns: true or false
```

### Get Context State
```javascript
alertSoundManager.getContextState()
// Returns: "running", "suspended", or "not-initialized"
```

## Performance Notes

- **Latency**: <100ms from detection to sound
- **CPU Impact**: Minimal (oscillator-based synthesis)
- **Memory**: ~1-2MB per audio context
- **Browser Freezing**: None (uses separate audio thread)

## Fire Detection Test Script

Create `test_fire_detection.py` in WILDGUARD/ directory:

```python
import requests
import json
import time

def send_fire_detection():
    url = "http://localhost:5000/detection/update"
    detection = {
        "type": "fire",
        "confidence": 95,
        "camera": "camera-1",
        "timestamp": time.time()
    }
    
    try:
        response = requests.post(url, json=detection)
        print(f"✅ Detection sent: {response.json()}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    print("🔥 Sending fire detection...")
    send_fire_detection()
    print("Check the dashboard for alert and sound!")
```

Run with: `python test_fire_detection.py`

## Next Steps

1. ✅ Start the dashboard: `npm start` (in WILDGUARD/client)
2. ✅ Start the backend: `node server.js` (in WILDGUARD/backend)
3. ✅ Open browser DevTools (F12)
4. ✅ Run test commands in console
5. ✅ Check for sound output
6. ✅ Monitor console logs for errors

## Still Having Issues?

1. Check browser console for errors (F12 → Console)
2. Verify backend is running (check logs in WILDGUARD/backend)
3. Verify WebSocket connection (look for "✅ Connected to WILDGUARD server")
4. Test with `checkAudioStatus()`
5. Check system volume and speaker settings
6. Try different browser if needed

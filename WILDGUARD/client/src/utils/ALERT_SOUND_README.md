# Alert Sound System - WILDGUARD

## Overview
The alert sound system provides audio notifications when wildlife threats are detected, particularly for critical threats like wildfires and hunters.

## Features

### Sound Types
- **🔥 Fire/Wildfire Alerts**: Urgent, alternating high-low tone siren (critical severity)
- **👤 Hunter Alerts**: Rapid high-pitched alarm (critical severity)  
- **🐘 Animal Alerts**: Melodic beeping tones (varies by species)
  - Elephants: 400Hz base frequency
  - Tigers: 500Hz base frequency
  - Deer: 600Hz base frequency
  - Birds: 700Hz base frequency

### Sound Control
- **Toggle Sound**: Use the 🔊/🔇 button in the dashboard header
- **Sound Status**: Visual indicator shows whether sound is enabled or disabled
- **Browser Compatibility**: Works with modern Web Audio API (Chrome, Firefox, Edge, Safari)

## Technical Details

### File Structure
```
WILDGUARD/client/src/
├── utils/
│   └── alertSoundManager.js     # Sound generation and management
└── pages/
    └── dashboard/
        └── WildguardDashboard.js # Integrated sound playback
```

### Alert Sound Manager
The `alertSoundManager.js` file exports a singleton instance that handles:
- Sound generation using Web Audio API oscillators
- Alert type mapping to appropriate audio patterns
- Volume management (0.3 amplitude with fade out)
- Browser autoplay policy compatibility

### Integration Points
1. **Fire Detections**: Plays critical alert sound when `type === 'WILDFIRE'`
2. **Hunter Detections**: Plays critical alert sound when `type === 'HUNTER'`
3. **Animal Detections**: Plays warning alert sound for ELEPHANT, TIGER, DEER, BIRD
4. **Dashboard State**: Respects user's sound preference via `soundEnabled` state

## Usage

### Enabling/Disabling Sound
Click the sound toggle button in the top-right of the dashboard:
- 🔊 indicates sound is ON
- 🔇 indicates sound is OFF

### Playing Sounds Programmatically
```javascript
import alertSoundManager from '../../utils/alertSoundManager';

// Play alert for specific threat type
alertSoundManager.playAlert('WILDFIRE');  // Fire alert
alertSoundManager.playAlert('HUNTER');     // Hunter alert
alertSoundManager.playAlert('ELEPHANT');   // Animal alert

// Toggle sound
alertSoundManager.toggleSound(false);  // Disable
alertSoundManager.toggleSound(true);   // Enable
```

## Browser Support
- ✅ Chrome 30+
- ✅ Firefox 25+
- ✅ Safari 11+
- ✅ Edge 12+
- ⚠️ Mobile browsers may require user interaction first

## Audio Specifications

### Critical Alert (Fire/Hunter)
- **Duration**: 1.5 seconds
- **Frequency**: 800-1200 Hz alternating (fire) or 1000-1200 Hz (hunter)
- **Volume**: 0.3 (moderate - prevent ear damage while remaining noticeable)
- **Pattern**: Urgency-conveying modulation

### Warning Alert (Animals)
- **Duration**: 0.8 seconds
- **Frequency**: 400-700 Hz (varies by species)
- **Volume**: 0.2 (lower priority than critical alerts)
- **Pattern**: Melodic beeping

## Future Enhancements
- [ ] Custom audio file support (.mp3, .wav)
- [ ] Sound intensity adjustment slider
- [ ] Different alert patterns for different severity levels
- [ ] Text-to-speech notifications
- [ ] Push notifications with sound
- [ ] Sound presets (silent, discrete, loud)

## Troubleshooting

### Sound Not Working
1. **Check browser console** for errors
2. **Verify sound is enabled** via the toggle button
3. **Check browser volume** settings
4. **Ensure user interaction** occurred (browser autoplay policy)
5. **Check Web Audio API** support in browser

### Sound Too Loud/Quiet
- Adjust the `gainNode.gain.setValueAtTime()` values in `alertSoundManager.js`
- Default volume is 0.3 for critical and 0.2 for warning

### Latency Issues
- Web Audio API sounds play with minimal latency (<100ms)
- If experiencing delays, check system resources

## Contributing
To modify alert sounds:
1. Edit `playCriticalAlert()` or `playWarningAlert()` in `alertSoundManager.js`
2. Adjust frequency, duration, and volume parameters
3. Test in `WildguardDashboard.js` with simulation tools
4. Commit changes with clear descriptions

## License
Part of WILDGUARD AI Wildlife Protection System

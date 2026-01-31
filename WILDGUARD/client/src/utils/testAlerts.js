/**
 * Test Alert Sound System
 * This file can be used to test the alert sound system in the browser console
 */

// Test fire alert
window.testFireAlert = () => {
  console.log('🔥 Testing FIRE alert...');
  const alertSoundManager = require('../utils/alertSoundManager').default;
  alertSoundManager.playAlert('WILDFIRE');
};

// Test hunter alert
window.testHunterAlert = () => {
  console.log('👤 Testing HUNTER alert...');
  const alertSoundManager = require('../utils/alertSoundManager').default;
  alertSoundManager.playAlert('HUNTER');
};

// Test animal alerts
window.testAnimalAlert = (type = 'ELEPHANT') => {
  console.log(`🐾 Testing ${type} alert...`);
  const alertSoundManager = require('../utils/alertSoundManager').default;
  alertSoundManager.playAlert(type);
};

// Check audio context status
window.checkAudioStatus = () => {
  const alertSoundManager = require('../utils/alertSoundManager').default;
  console.log('🎵 Audio Context State:', alertSoundManager.getContextState());
  console.log('🔊 Sound Enabled:', alertSoundManager.getSoundEnabled());
};

// Simulate fire detection
window.simulateFireDetection = () => {
  console.log('🚨 Simulating FIRE detection alert...');
  const alertSoundManager = require('../utils/alertSoundManager').default;
  
  // Create mock detection event
  const mockDetection = {
    type: 'FIRE',
    title: '🔥 WILDFIRE DETECTED',
    message: 'Fire detected in protected area - IMMEDIATE ACTION REQUIRED!',
    severity: 'CRITICAL'
  };
  
  console.log('Alert:', mockDetection);
  alertSoundManager.playAlert('WILDFIRE');
};

console.log('✅ Test utilities loaded. Available commands:');
console.log('  - testFireAlert() - Test fire alert sound');
console.log('  - testHunterAlert() - Test hunter alert sound');
console.log('  - testAnimalAlert("TIGER") - Test animal alert (ELEPHANT, TIGER, DEER, BIRD)');
console.log('  - checkAudioStatus() - Check audio context status');
console.log('  - simulateFireDetection() - Simulate fire detection');

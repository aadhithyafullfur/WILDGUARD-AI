/**
 * Alert Sound Manager
 * Handles playing audio alerts for different detection types
 * Uses Web Audio API with proper context handling
 */

class AlertSoundManager {
  constructor() {
    this.audioContext = null;
    this.isEnabled = true;
    this.contextResumed = false;
  }

  /**
   * Initialize audio context on first user interaction
   */
  initializeContext() {
    if (this.audioContext) return;

    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContext();
      
      // Resume context if suspended (required by browsers for autoplay policy)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().then(() => {
          console.log('✅ Audio context resumed');
          this.contextResumed = true;
        }).catch(error => {
          console.error('❌ Failed to resume audio context:', error);
        });
      } else {
        this.contextResumed = true;
      }
      
      console.log('✅ Audio context initialized');
    } catch (error) {
      console.error('❌ Error initializing audio context:', error);
    }
  }

  /**
   * Ensure audio context is ready
   */
  ensureContextReady() {
    if (!this.audioContext) {
      this.initializeContext();
    }

    // Resume if suspended
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch(e => console.error('Resume error:', e));
    }

    return this.audioContext;
  }

  /**
   * Play alert sound based on detection type
   */
  playAlert(alertType) {
    if (!this.isEnabled) {
      console.log('🔇 Sound is disabled');
      return;
    }

    console.log(`🔊 Playing alert sound for: ${alertType}`);

    const context = this.ensureContextReady();
    if (!context) {
      console.error('❌ Audio context not available');
      return;
    }

    try {
      switch (alertType?.toUpperCase()) {
        case 'WILDFIRE':
        case 'FIRE':
          this.playCriticalAlert(context, 'fire');
          break;
        case 'HUNTER':
        case 'PERSON':
          this.playCriticalAlert(context, 'hunter');
          break;
        case 'ELEPHANT':
        case 'TIGER':
        case 'ANIMAL':
        case 'DEER':
        case 'BIRD':
          this.playWarningAlert(context, alertType);
          break;
        default:
          this.playWarningAlert(context, 'alert');
      }
    } catch (error) {
      console.error('❌ Error playing alert sound:', error);
    }
  }

  /**
   * Play critical alert sound with oscillator (fire/hunter)
   */
  playCriticalAlert(context, type) {
    try {
      const now = context.currentTime;
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Set waveform type for better sound
      oscillator.type = 'sine';

      if (type === 'fire') {
        // Fire alert: alternating high-low tones with modulation
        console.log('🔥 Playing FIRE critical alert');
        
        // First tone
        oscillator.frequency.setValueAtTime(900, now);
        oscillator.frequency.linearRampToValueAtTime(1100, now + 0.2);
        
        // Second tone
        oscillator.frequency.setValueAtTime(700, now + 0.25);
        oscillator.frequency.linearRampToValueAtTime(900, now + 0.45);
        
        // Third tone
        oscillator.frequency.setValueAtTime(1100, now + 0.5);
        oscillator.frequency.linearRampToValueAtTime(800, now + 0.7);
        
        // Fourth tone
        oscillator.frequency.setValueAtTime(950, now + 0.75);
        oscillator.frequency.linearRampToValueAtTime(1150, now + 0.95);
        
        // Set volume with fade out
        gainNode.gain.setValueAtTime(0.5, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.5);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 2.0);
        
        oscillator.start(now);
        oscillator.stop(now + 2.0);
        
        // Play second sequence
        setTimeout(() => this.playCriticalAlert(context, 'hunter'), 1200);
        
      } else if (type === 'hunter') {
        // Hunter alert: rapid high-pitched staccato tones
        console.log('👤 Playing HUNTER critical alert');
        
        const duration = 0.15;
        const gap = 0.05;
        
        for (let i = 0; i < 4; i++) {
          const startTime = now + (i * (duration + gap));
          const endTime = startTime + duration;
          
          // Create oscillator for each tone
          const osc = context.createOscillator();
          const gain = context.createGain();
          
          osc.connect(gain);
          gain.connect(context.destination);
          osc.type = 'sine';
          
          osc.frequency.setValueAtTime(1200, startTime);
          osc.frequency.linearRampToValueAtTime(1400, endTime);
          
          gain.gain.setValueAtTime(0.4, startTime);
          gain.gain.exponentialRampToValueAtTime(0.01, endTime);
          
          osc.start(startTime);
          osc.stop(endTime);
        }
      }
    } catch (error) {
      console.error('❌ Error playing critical alert:', error);
    }
  }

  /**
   * Play warning alert sound (melodic beeps for animals)
   */
  playWarningAlert(context, animalType) {
    try {
      const now = context.currentTime;
      console.log(`🎵 Playing WARNING alert for: ${animalType}`);
      
      // Different frequencies for different animals
      const frequencies = {
        'ELEPHANT': { base: 400, high: 500 },
        'TIGER': { base: 500, high: 650 },
        'DEER': { base: 600, high: 750 },
        'BIRD': { base: 700, high: 850 },
        'ANIMAL': { base: 550, high: 700 },
        'ALERT': { base: 550, high: 700 }
      };

      const freq = frequencies[animalType?.toUpperCase()] || frequencies['ALERT'];
      
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.type = 'sine';
      
      // Two tone beep
      oscillator.frequency.setValueAtTime(freq.base, now);
      oscillator.frequency.linearRampToValueAtTime(freq.high, now + 0.15);
      oscillator.frequency.linearRampToValueAtTime(freq.base, now + 0.3);
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.8);
      
      oscillator.start(now);
      oscillator.stop(now + 0.8);
      
    } catch (error) {
      console.error('❌ Error playing warning alert:', error);
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(enabled) {
    this.isEnabled = enabled;
    console.log(`🔊 Sound ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Check if sound is enabled
   */
  getSoundEnabled() {
    return this.isEnabled;
  }

  /**
   * Get audio context state
   */
  getContextState() {
    return this.audioContext ? this.audioContext.state : 'not-initialized';
  }
}

// Create singleton instance
const alertSoundManager = new AlertSoundManager();

// Initialize context on first user interaction (required for browser autoplay policy)
if (typeof document !== 'undefined') {
  const initAudio = () => {
    alertSoundManager.initializeContext();
    document.removeEventListener('click', initAudio);
    document.removeEventListener('keydown', initAudio);
    document.removeEventListener('touchstart', initAudio);
  };
  
  document.addEventListener('click', initAudio, { once: true });
  document.addEventListener('keydown', initAudio, { once: true });
  document.addEventListener('touchstart', initAudio, { once: true });
}

export default alertSoundManager;

/**
 * Alert Sound Manager
 * Handles playing audio alerts for different detection types
 */

class AlertSoundManager {
  constructor() {
    this.audioContexts = {};
    this.isEnabled = true;
  }

  /**
   * Initialize audio contexts for different alert types
   */
  initializeSounds() {
    try {
      // Initialize critical alert sound (for fire and hunters)
      this.audioContexts.critical = this.createCriticalAlertSound();
      // Initialize warning alert sound (for animals)
      this.audioContexts.warning = this.createWarningAlertSound();
    } catch (error) {
      console.error('Error initializing alert sounds:', error);
    }
  }

  /**
   * Create critical alert sound (loud, urgent siren-like tone)
   * Used for: WILDFIRE, HUNTER
   */
  createCriticalAlertSound() {
    return new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
  }

  /**
   * Create warning alert sound (melodic tone)
   * Used for: Animals, Deer, Birds, etc.
   */
  createWarningAlertSound() {
    return new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
  }

  /**
   * Play alert sound based on detection type
   * Supports synthetic audio generation
   */
  playAlert(alertType) {
    if (!this.isEnabled) return;

    try {
      switch (alertType?.toUpperCase()) {
        case 'WILDFIRE':
        case 'FIRE':
          this.playCriticalAlert('fire');
          break;
        case 'HUNTER':
        case 'PERSON':
          this.playCriticalAlert('hunter');
          break;
        case 'ELEPHANT':
        case 'TIGER':
        case 'ANIMAL':
        case 'DEER':
        case 'BIRD':
          this.playWarningAlert(alertType);
          break;
        default:
          this.playWarningAlert('alert');
      }
    } catch (error) {
      console.error('Error playing alert sound:', error);
    }
  }

  /**
   * Play critical alert sound with oscillator (works in all browsers)
   */
  playCriticalAlert(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Fire alert: alternating high-low tones
      if (type === 'fire') {
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.15);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.3);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.45);
      } 
      // Hunter alert: rapid high-pitched tone
      else {
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
      }

      // Set volume
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.5);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 1.5);

      // Play 2 short alerts for fire
      if (type === 'fire') {
        setTimeout(() => {
          this.playCriticalAlert('hunter');
        }, 600);
      }
    } catch (error) {
      console.error('Error playing critical alert:', error);
    }
  }

  /**
   * Play warning alert sound (melodic beeps)
   */
  playWarningAlert(animalType) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Different frequencies for different animals
      const frequencies = {
        'ELEPHANT': 400,
        'TIGER': 500,
        'DEER': 600,
        'BIRD': 700,
        'alert': 550
      };

      const freq = frequencies[animalType?.toUpperCase()] || 550;
      
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(freq + 200, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + 0.2);

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.8);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.8);
    } catch (error) {
      console.error('Error playing warning alert:', error);
    }
  }

  /**
   * Toggle sound on/off
   */
  toggleSound(enabled) {
    this.isEnabled = enabled;
  }

  /**
   * Check if sound is enabled
   */
  getSoundEnabled() {
    return this.isEnabled;
  }
}

// Create singleton instance
const alertSoundManager = new AlertSoundManager();

// Initialize on first interaction (due to browser autoplay policy)
if (typeof window !== 'undefined') {
  document.addEventListener('click', () => {
    if (!alertSoundManager.audioContexts.critical) {
      alertSoundManager.initializeSounds();
    }
  }, { once: true });
}

export default alertSoundManager;

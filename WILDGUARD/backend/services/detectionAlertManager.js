/**
 * Detection Alert Manager
 * Handles detection tracking, deduplication, counting, and alert generation
 * Prevents duplicate alerts and maintains accurate detection counts
 */

class DetectionAlertManager {
  constructor() {
    // Counters for each detection type
    this.counters = {
      hunters: 0,      // person type
      elephants: 0,    // species === 'elephant'
      tigers: 0,       // species === 'tiger'
      deer: 0,         // species === 'deer'
      birds: 0,        // species === 'bird'
      wildfires: 0     // fire type
    };

    // Track active detections to prevent duplicates
    // Key: detection identifier, Value: timestamp of last alert
    this.activeDetections = {};

    // Deduplication window: don't alert for same detection within this time (ms)
    this.DEDUP_WINDOW = 5000; // 5 seconds

    // WebSocket reference
    this.io = null;
  }

  /**
   * Initialize with Socket.IO instance
   */
  initialize(io) {
    this.io = io;
  }

  /**
   * Generate unique detection key for deduplication
   */
  getDetectionKey(detection) {
    // For hunters, use a more specific key to allow individual counting
    if (detection.type?.toLowerCase() === 'person') {
      // Create unique key based on timestamp to allow individual hunter detection counting
      const timestampKey = Math.floor(new Date(detection.timestamp).getTime() / 1000); // Every second
      return `hunter_${detection.camera || 'unknown'}_${timestampKey}`;
    }
    // For other detections, use ID if available
    if (detection.id) {
      return `${detection.id}`;
    }
    // For detections without ID, combine species/type and camera to create unique key
    const typeKey = detection.species || detection.type;
    return `${typeKey}_${detection.camera || 'unknown'}`;
  }

  /**
   * Check if detection should trigger an alert (not a duplicate)
   */
  isDuplicate(detection) {
    const key = this.getDetectionKey(detection);
    const now = Date.now();
    const lastAlertTime = this.activeDetections[key];

    if (!lastAlertTime) {
      return false; // New detection
    }

    // Check if within dedup window
    return now - lastAlertTime < this.DEDUP_WINDOW;
  }

  /**
   * Mark detection as processed
   */
  markDetectionProcessed(detection) {
    const key = this.getDetectionKey(detection);
    this.activeDetections[key] = Date.now();
  }

  /**
   * Process incoming detection and return alert if applicable
   */
  processDetection(detection) {
    // Check for duplicates
    if (this.isDuplicate(detection)) {
      return null; // Don't process duplicate
    }

    const detectionType = detection.type?.toLowerCase();
    const species = detection.species?.toLowerCase();
    let alertType = null;
    let alertMessage = null;
    let alertTitle = null;
    let alertEmoji = null;
    let alertSeverity = 'HIGH';

    // Determine detection category and increment counter
    if (detectionType === 'person') {
      this.counters.hunters++;
      alertType = 'HUNTER';
      alertTitle = '🚨 HUNTER DETECTED';
      alertMessage = 'Illegal hunting activity detected in protected area!';
      alertEmoji = '🚨';
      alertSeverity = 'CRITICAL';
    } else if (detectionType === 'animal') {
      // Check species for specific animal types
      if (species === 'elephant') {
        this.counters.elephants++;
        alertType = 'ELEPHANT';
        alertTitle = '🐘 ELEPHANT DETECTED';
        alertMessage = 'Elephant spotted in monitored area';
        alertEmoji = '🐘';
      } else if (species === 'tiger') {
        this.counters.tigers++;
        alertType = 'TIGER';
        alertTitle = '🐯 TIGER DETECTED';
        alertMessage = 'Tiger spotted in monitored area';
        alertEmoji = '🐯';
      } else if (species === 'deer') {
        this.counters.deer++;
        alertType = 'DEER';
        alertTitle = '🦌 DEER DETECTED';
        alertMessage = 'Deer spotted in monitored area';
        alertEmoji = '🦌';
      } else if (species === 'bird') {
        this.counters.birds++;
        alertType = 'BIRD';
        alertTitle = '🐦 BIRD DETECTED';
        alertMessage = 'Bird spotted in monitored area';
        alertEmoji = '🐦';
      } else {
        // Generic animal detection
        this.counters.elephants++; // Count as other for demo purposes
        alertType = 'ANIMAL';
        alertTitle = `🦁 ${species?.toUpperCase() || 'ANIMAL'} DETECTED`;
        alertMessage = `${species || 'Wildlife'} spotted in monitored area`;
        alertEmoji = '🦁';
      }
    } else if (detectionType === 'fire') {
      this.counters.wildfires++;
      alertType = 'WILDFIRE';
      alertTitle = '🔥 WILDFIRE DETECTED';
      alertMessage = 'Fire detected in protected area - IMMEDIATE ACTION REQUIRED!';
      alertEmoji = '🔥';
      alertSeverity = 'CRITICAL';
    } else {
      return null; // Unknown detection type
    }

    // Mark as processed to prevent duplicates
    this.markDetectionProcessed(detection);

    // Create alert object
    const alert = {
      id: detection.id || Date.now(),
      type: alertType,
      title: alertTitle,
      message: alertMessage,
      emoji: alertEmoji,
      severity: alertSeverity,
      detection: {
        species: detection.species,
        confidence: detection.confidence,
        camera: detection.camera,
        timestamp: detection.timestamp
      },
      createdAt: new Date().toISOString()
    };

    return alert;
  }

  /**
   * Emit alert via WebSocket
   */
  emitAlert(alert) {
    if (this.io) {
      // Broadcast to all connected clients
      this.io.emit('alert', alert);
      this.io.emit('counters-updated', this.getCounters());
    }
  }

  /**
   * Get current counters
   */
  getCounters() {
    return {
      hunters_detected: this.counters.hunters,
      animals_detected: this.counters.elephants + this.counters.tigers + this.counters.deer + this.counters.birds,
      elephants_detected: this.counters.elephants,
      tigers_detected: this.counters.tigers,
      deer_detected: this.counters.deer,
      birds_detected: this.counters.birds,
      wildfires_detected: this.counters.wildfires,
      total_detections: this.counters.hunters + this.counters.elephants + this.counters.tigers + this.counters.deer + this.counters.birds + this.counters.wildfires
    };
  }

  /**
   * Reset all counters and active detections
   */
  reset() {
    this.counters = {
      hunters: 0,
      elephants: 0,
      tigers: 0,
      wildfires: 0
    };
    this.activeDetections = {};

    if (this.io) {
      this.io.emit('system-reset', this.getCounters());
    }

    return this.getCounters();
  }

  /**
   * Get detection statistics for dashboard
   */
  getStats() {
    return {
      counters: this.getCounters(),
      activeDetections: Object.keys(this.activeDetections).length
    };
  }
}

module.exports = DetectionAlertManager;

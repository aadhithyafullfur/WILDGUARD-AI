const express = require('express');
const router = express.Router();

// API endpoint to get detection data
router.get('/data', (req, res) => {
  try {
    // Return enhanced counters with animal breakdown
    const baseCounters = global.alertManager.getCounters();
    const enhancedCounters = {
      hunters_detected: baseCounters.hunters_detected || 0,
      animals_detected: baseCounters.animals_detected || 0,
      elephants_detected: baseCounters.elephants_detected || 0,
      tigers_detected: baseCounters.tigers_detected || 0,
      deer_detected: baseCounters.deer_detected || 0,
      birds_detected: baseCounters.birds_detected || 0,
      wildfires_detected: baseCounters.wildfires_detected || 0,
      total_detections: (baseCounters.hunters_detected || 0) + (baseCounters.animals_detected || 0) + (baseCounters.wildfires_detected || 0)
    };
    res.status(200).json(enhancedCounters);
  } catch (error) {
    console.error('Error fetching detection data:', error);
    res.status(500).json({ success: false, message: 'Error fetching detection data' });
  }
});

// API endpoint to update detection data (from ML model)
router.post('/update', (req, res) => {
  try {
    const detection = req.body.newDetection || req.body;
    
    if (!detection || !detection.type) {
      console.warn('⚠️ No valid detection data provided');
      return res.status(400).json({ success: false, message: 'No detection data provided' });
    }

    // Process detection through alert manager
    const alert = global.alertManager.processDetection(detection);
    
    if (alert) {
      // Alert was generated (not a duplicate)
      console.log(`✅ [NEW ALERT] ${alert.title} - Type: ${alert.type} - Confidence: ${alert.detection.confidence}%`);
      
      return res.status(200).json({ 
        success: true, 
        message: 'Detection processed',
        alert: alert,
        counters: global.alertManager.getCounters()
      });
    } else {
      // Detection was a duplicate, still return success
      console.log('ℹ️ Detection processed (duplicate ignored)');
      return res.status(200).json({ 
        success: true, 
        message: 'Detection processed (duplicate ignored)',
        counters: global.alertManager.getCounters()
      });
    }
    
  } catch (error) {
    console.error('Error updating detection data:', error);
    res.status(500).json({ success: false, message: 'Error updating detection data' });
  }
});

module.exports = router;

module.exports = router;
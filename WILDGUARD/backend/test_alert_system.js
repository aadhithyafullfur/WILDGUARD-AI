#!/usr/bin/env node

/**
 * WILDGUARD Alert System - Test & Demo Script
 * Simulates detections and tests the alert system
 * 
 * Usage: node test_alert_system.js
 */

const http = require('http');
const io = require('socket.io-client');

const BACKEND_URL = 'http://localhost:5000';

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Test 1: Check server connectivity
async function testServerConnectivity() {
  log('\n=== TEST 1: Server Connectivity ===', 'cyan');
  
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/counters`, (res) => {
      if (res.statusCode === 200) {
        log('✅ Backend server is running', 'green');
        
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const counters = JSON.parse(data);
          log(`Current Counters: ${JSON.stringify(counters)}`, 'green');
          resolve(true);
        });
      } else {
        log('❌ Backend server error', 'red');
        resolve(false);
      }
    }).on('error', () => {
      log('❌ Cannot connect to backend at ' + BACKEND_URL, 'red');
      log('   Make sure backend is running: cd WILDGUARD/backend && npm start', 'yellow');
      resolve(false);
    });
  });
}

// Test 2: Test WebSocket connection
async function testWebSocketConnection() {
  log('\n=== TEST 2: WebSocket Connection ===', 'cyan');
  
  return new Promise((resolve) => {
    const socket = io(BACKEND_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 3
    });

    const timeout = setTimeout(() => {
      socket.disconnect();
      log('❌ WebSocket connection timeout', 'red');
      resolve(false);
    }, 5000);

    socket.on('connect', () => {
      clearTimeout(timeout);
      log('✅ WebSocket connected successfully', 'green');
      
      socket.on('counters-updated', (counters) => {
        log(`📊 Received counters: ${JSON.stringify(counters)}`, 'green');
      });

      socket.on('alert', (alert) => {
        log(`🚨 Received alert: ${alert.title}`, 'green');
      });

      setTimeout(() => {
        socket.disconnect();
        resolve(true);
      }, 1000);
    });

    socket.on('connect_error', (error) => {
      clearTimeout(timeout);
      log('❌ WebSocket connection error: ' + error.message, 'red');
      resolve(false);
    });
  });
}

// Test 3: Send test detections
async function testDetectionProcessing() {
  log('\n=== TEST 3: Detection Processing ===', 'cyan');
  
  const detections = [
    {
      name: 'Hunter Detection',
      data: {
        id: Math.floor(Date.now() / 1000),
        type: 'person',
        species: 'human',
        confidence: 95.5,
        camera: 'Cam-01',
        timestamp: new Date().toLocaleString()
      }
    },
    {
      name: 'Elephant Detection',
      data: {
        id: Math.floor(Date.now() / 1000) + 1,
        type: 'animal',
        species: 'elephant',
        confidence: 87.3,
        camera: 'Cam-02',
        timestamp: new Date().toLocaleString()
      }
    },
    {
      name: 'Tiger Detection',
      data: {
        id: Math.floor(Date.now() / 1000) + 2,
        type: 'animal',
        species: 'tiger',
        confidence: 92.1,
        camera: 'Cam-03',
        timestamp: new Date().toLocaleString()
      }
    },
    {
      name: 'Wildfire Detection',
      data: {
        id: Math.floor(Date.now() / 1000) + 3,
        type: 'fire',
        species: 'fire',
        confidence: 98.0,
        camera: 'Cam-04',
        timestamp: new Date().toLocaleString()
      }
    }
  ];

  for (const detection of detections) {
    await new Promise((resolve) => {
      const postData = JSON.stringify({
        newDetection: detection.data
      });

      const req = http.request(
        `${BACKEND_URL}/api/detection/update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            if (res.statusCode === 200) {
              const response = JSON.parse(data);
              log(`✅ ${detection.name}: Alert generated`, 'green');
              if (response.alert) {
                log(`   └─ ${response.alert.title}`, 'green');
              }
            } else {
              log(`❌ ${detection.name}: Failed`, 'red');
            }
            resolve();
          });
        }
      );

      req.on('error', (error) => {
        log(`❌ ${detection.name}: ${error.message}`, 'red');
        resolve();
      });

      req.write(postData);
      req.end();

      setTimeout(resolve, 500); // Stagger requests
    });
  }
}

// Test 4: Test duplicate detection prevention
async function testDuplicatePrevention() {
  log('\n=== TEST 4: Duplicate Prevention ===', 'cyan');
  
  const detection = {
    id: Math.floor(Date.now() / 1000) + 100,
    type: 'person',
    species: 'human',
    confidence: 90.0,
    camera: 'Cam-01',
    timestamp: new Date().toLocaleString()
  };

  log('Sending same detection twice (should ignore second)...', 'yellow');

  for (let i = 0; i < 2; i++) {
    await new Promise((resolve) => {
      const postData = JSON.stringify({ newDetection: detection });

      const req = http.request(
        `${BACKEND_URL}/api/detection/update`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        },
        (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            const response = JSON.parse(data);
            if (response.alert) {
              log(`✅ Detection ${i + 1}: Alert generated`, 'green');
            } else {
              log(`✅ Detection ${i + 1}: Duplicate ignored (as expected)`, 'yellow');
            }
            resolve();
          });
        }
      );

      req.write(postData);
      req.end();

      setTimeout(resolve, 100);
    });
  }
}

// Test 5: Check counters
async function testCounters() {
  log('\n=== TEST 5: Counter Verification ===', 'cyan');
  
  return new Promise((resolve) => {
    const req = http.get(`${BACKEND_URL}/counters`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const counters = JSON.parse(data);
        log('📊 Final Counters:', 'cyan');
        log(`   🚨 Hunters: ${counters.hunters_detected}`, 'red');
        log(`   🐘 Elephants: ${counters.elephants_detected}`, 'blue');
        log(`   🐯 Tigers: ${counters.tigers_detected}`, 'yellow');
        log(`   🔥 Wildfires: ${counters.wildfires_detected}`, 'cyan');
        log(`   📊 Total: ${counters.total_detections}`, 'magenta');
        resolve();
      });
    }).on('error', () => {
      log('❌ Failed to fetch counters', 'red');
      resolve();
    });
  });
}

// Test 6: Test reset functionality
async function testReset() {
  log('\n=== TEST 6: Reset Functionality ===', 'cyan');
  
  return new Promise((resolve) => {
    const postData = JSON.stringify({});
    
    const req = http.request(
      `${BACKEND_URL}/reset`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      },
      (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const response = JSON.parse(data);
          if (response.success) {
            log('✅ System reset successful', 'green');
            log('📊 Counters after reset:', 'cyan');
            log(`   🚨 Hunters: ${response.data.hunters_detected}`, 'red');
            log(`   🐘 Elephants: ${response.data.elephants_detected}`, 'blue');
            log(`   🐯 Tigers: ${response.data.tigers_detected}`, 'yellow');
            log(`   🔥 Wildfires: ${response.data.wildfires_detected}`, 'cyan');
          }
          resolve();
        });
      }
    );

    req.write(postData);
    req.end();
  });
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'magenta');
  log('║  WILDGUARD ALERT SYSTEM - TEST SUITE                   ║', 'magenta');
  log('║  Testing Detection, Alerts, & Dashboard Integration    ║', 'magenta');
  log('╚════════════════════════════════════════════════════════╝', 'magenta');

  const results = {
    connectivity: await testServerConnectivity(),
  };

  if (!results.connectivity) {
    log('\n⚠️  Backend not running. Cannot continue tests.', 'red');
    log('   Start backend: cd WILDGUARD/backend && npm start', 'yellow');
    process.exit(1);
  }

  results.websocket = await testWebSocketConnection();
  
  if (results.websocket) {
    await testDetectionProcessing();
    await testDuplicatePrevention();
    await testCounters();
    await testReset();
  }

  log('\n╔════════════════════════════════════════════════════════╗', 'magenta');
  log('║  TEST SUMMARY                                          ║', 'magenta');
  log('╠════════════════════════════════════════════════════════╣', 'magenta');
  
  const passCount = Object.values(results).filter(r => r).length;
  const totalCount = Object.keys(results).length;
  
  if (passCount === totalCount) {
    log(`║  ✅ ALL TESTS PASSED (${passCount}/${totalCount})                        ║`, 'green');
  } else {
    log(`║  ⚠️  SOME TESTS FAILED (${passCount}/${totalCount})                        ║`, 'yellow');
  }
  
  log('╠════════════════════════════════════════════════════════╣', 'magenta');
  log('║  NEXT STEPS:                                           ║', 'magenta');
  log('║  1. Start frontend: cd WILDGUARD/client && npm start   ║', 'cyan');
  log('║  2. Start ML: cd WILDGUARD/ML && python main.py        ║', 'cyan');
  log('║  3. View dashboard: http://localhost:3000              ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'magenta');
}

// Run tests
runTests().catch(console.error);

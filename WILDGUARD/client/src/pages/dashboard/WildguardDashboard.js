import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import alertSoundManager from '../../utils/alertSoundManager';

const WildguardDashboard = () => {
  // State for counters
  const [counters, setCounters] = useState({
    hunters_detected: 0,
    animals_detected: 0,
    elephants_detected: 0,
    tigers_detected: 0,
    deer_detected: 0,
    birds_detected: 0,
    wildfires_detected: 0,
    total_detections: 0
  });

  // State for analytics
  const [animalSpeciesData, setAnimalSpeciesData] = useState([
    { name: 'Elephants', value: 0 },
    { name: 'Tigers', value: 0 },
    { name: 'Deer', value: 0 },
    { name: 'Birds', value: 0 },
    { name: 'Other', value: 0 },
  ]);

  const [detectionTrends, setDetectionTrends] = useState([
    { day: 'Mon', hunters: 0, animals: 0, fires: 0 },
    { day: 'Tue', hunters: 0, animals: 0, fires: 0 },
    { day: 'Wed', hunters: 0, animals: 0, fires: 0 },
    { day: 'Thu', hunters: 0, animals: 0, fires: 0 },
    { day: 'Fri', hunters: 0, animals: 0, fires: 0 },
    { day: 'Sat', hunters: 0, animals: 0, fires: 0 },
    { day: 'Sun', hunters: 0, animals: 0, fires: 0 },
  ]);

  const [animalDistribution, setAnimalDistribution] = useState([
    { name: 'Elephants', value: 0 },
    { name: 'Tigers', value: 0 },
    { name: 'Deer', value: 0 },
    { name: 'Birds', value: 0 },
    { name: 'Other', value: 0 },
  ]);

  // State for alerts and events
  const [alerts, setAlerts] = useState([]);
  const [eventLog, setEventLog] = useState([]);
  const [connected, setConnected] = useState(false);
  const [systemStats, setSystemStats] = useState({
    uptime: '00:00:00',
    detectionRate: '0/sec',
    accuracy: '0%'
  });
  
  // State for ranger positions
  const [rangerPositions, setRangerPositions] = useState([
    { id: 'alpha', name: 'Ranger Alpha', zone: 'North Sector', status: 'ON DUTY', distance: '2.3 km', eta: null, active: false },
    { id: 'bravo', name: 'Ranger Bravo', zone: 'East Sector', status: 'ON DUTY', distance: '4.1 km', eta: null, active: false },
    { id: 'charlie', name: 'Ranger Charlie', zone: 'South Sector', status: 'ON DUTY', distance: '0.8 km', eta: null, active: false },
    { id: 'patrol', name: 'Patrol Vehicle', zone: 'Central Hub', status: 'STANDBY', distance: null, eta: '5 mins', active: false },
  ]);
  
  // State for emergency fire alert
  const [showFireAlert, setShowFireAlert] = useState(false);
  
  // State for sound control
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const socketRef = useRef(null);

  // Initialize WebSocket connection
  useEffect(() => {
    // Connect to backend WebSocket
    socketRef.current = io('http://localhost:5000', {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    // Handle connection
    socketRef.current.on('connect', () => {
      console.log('✅ Connected to WILDGUARD server');
      setConnected(true);
    });

    // Handle counters update
    socketRef.current.on('counters-updated', (data) => {
      console.log('📊 Counters updated:', data);
      setCounters(data);
      
      // Update analytics
      updateAnalytics(data);
    });
    
    // Update analytics based on counters
    const updateAnalytics = (counters) => {
      // Update animal species data
      setAnimalSpeciesData([
        { name: 'Elephants', value: counters.elephants_detected },
        { name: 'Tigers', value: counters.tigers_detected },
        { name: 'Deer', value: counters.deer_detected },
        { name: 'Birds', value: counters.birds_detected },
        { name: 'Other', value: Math.max(0, counters.animals_detected - (counters.elephants_detected + counters.tigers_detected + counters.deer_detected + counters.birds_detected)) }
      ]);
      
      // Update animal distribution
      setAnimalDistribution([
        { name: 'Elephants', value: counters.elephants_detected },
        { name: 'Tigers', value: counters.tigers_detected },
        { name: 'Deer', value: counters.deer_detected },
        { name: 'Birds', value: counters.birds_detected },
        { name: 'Other', value: Math.max(0, counters.animals_detected - (counters.elephants_detected + counters.tigers_detected + counters.deer_detected + counters.birds_detected)) }
      ]);
      
      // Update detection trends (simulated data)
      setDetectionTrends([
        { day: 'Mon', hunters: Math.floor(counters.hunters_detected * 0.8), animals: Math.floor(counters.animals_detected * 0.7), fires: Math.floor(counters.wildfires_detected * 0.9) },
        { day: 'Tue', hunters: Math.floor(counters.hunters_detected * 0.6), animals: Math.floor(counters.animals_detected * 0.8), fires: Math.floor(counters.wildfires_detected * 0.7) },
        { day: 'Wed', hunters: Math.floor(counters.hunters_detected * 0.9), animals: Math.floor(counters.animals_detected * 0.6), fires: Math.floor(counters.wildfires_detected * 0.8) },
        { day: 'Thu', hunters: Math.floor(counters.hunters_detected * 0.7), animals: Math.floor(counters.animals_detected * 0.9), fires: Math.floor(counters.wildfires_detected * 0.6) },
        { day: 'Fri', hunters: counters.hunters_detected, animals: counters.animals_detected, fires: counters.wildfires_detected },
        { day: 'Sat', hunters: Math.floor(counters.hunters_detected * 1.1), animals: Math.floor(counters.animals_detected * 1.2), fires: Math.floor(counters.wildfires_detected * 1.1) },
        { day: 'Sun', hunters: Math.floor(counters.hunters_detected * 1.2), animals: Math.floor(counters.animals_detected * 1.1), fires: Math.floor(counters.wildfires_detected * 1.2) },
      ]);
    };

    // Handle new alert
    socketRef.current.on('alert', (alert) => {
      console.log('🚨 New alert received:', alert);
      
      // Create a proper alert object with all required fields
      const newAlert = {
        ...alert,
        id: alert.id || Date.now(),
        timestamp: new Date().toLocaleString(),
        isNew: true,
        title: alert.title || alert.type || 'Unknown Alert',
        message: alert.message || 'Alert message not available',
        type: alert.type || 'UNKNOWN',
        severity: alert.severity || 'MEDIUM',
        detection: {
          camera: alert.camera || alert.detection?.camera || 'Unknown',
          confidence: alert.confidence || alert.detection?.confidence || 0,
          species: alert.species || alert.detection?.species || 'Unknown'
        }
      };

      setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep last 10
      setEventLog(prev => [newAlert, ...prev].slice(0, 20)); // Keep last 20

      // If it's a hunter alert, activate rangers
      if (alert.type === 'HUNTER') {
        activateRangersForHuntingIncident();
        // Play alert sound
        if (soundEnabled) {
          alertSoundManager.playAlert('HUNTER');
        }
      }
      
      // If it's a fire alert, show emergency popup and play sound
      if (alert.type === 'WILDFIRE' || alert.type === 'FIRE') {
        setShowFireAlert(true);
        // Play fire alert sound with higher priority
        if (soundEnabled) {
          alertSoundManager.playAlert('WILDFIRE');
        }
        // Auto-hide the alert after 10 seconds
        setTimeout(() => {
          setShowFireAlert(false);
        }, 10000);
      }
      
      // Play alert sound for animals
      if (['ELEPHANT', 'TIGER', 'DEER', 'BIRD', 'ANIMAL'].includes(alert.type)) {
        if (soundEnabled) {
          alertSoundManager.playAlert(alert.type);
        }
      }

      // Remove new flag after 3 seconds
      setTimeout(() => {
        setAlerts(prev => 
          prev.map(a => a.id === newAlert.id ? { ...a, isNew: false } : a)
        );
      }, 3000);
    });

    // Handle system reset
    socketRef.current.on('system-reset', (data) => {
      console.log('🔄 System reset:', data);
      setCounters(data);
      setAlerts([]);
      setEventLog([]);
    });

    // Handle disconnection
    socketRef.current.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [soundEnabled]);

  // Function to activate rangers when hunting incident is detected
  const activateRangersForHuntingIncident = () => {
    // Update ranger positions to show response to hunting incident
    setRangerPositions(prev => prev.map(ranger => {
      if (ranger.id === 'charlie') {
        // Charlie is closest, set to responding
        return { ...ranger, status: 'RESPONDING', distance: '0.5 km', active: true };
      } else if (ranger.id === 'patrol') {
        // Deploy patrol vehicle
        return { ...ranger, status: 'DEPLOYING', eta: '3 mins', active: true };
      } else if (ranger.id === 'alpha') {
        // Alpha moves to closer position
        return { ...ranger, status: 'EN ROUTE', distance: '1.2 km', active: true };
      } else if (ranger.id === 'bravo') {
        // Bravo moves to closer position
        return { ...ranger, status: 'MOVING', distance: '2.1 km', active: true };
      }
      return ranger;
    }));
    
    // Reset positions after some time
    setTimeout(() => {
      setRangerPositions(prev => prev.map(ranger => ({
        ...ranger,
        status: 'ON DUTY',
        distance: ranger.zone === 'North Sector' ? '2.3 km' :
                 ranger.zone === 'East Sector' ? '4.1 km' :
                 ranger.zone === 'South Sector' ? '0.8 km' : null,
        eta: ranger.id === 'patrol' ? '5 mins' : null,
        active: false
      })));
    }, 30000); // Reset after 30 seconds
  };
  
  // Handler to toggle sound on/off
  const toggleSound = () => {
    setSoundEnabled(!soundEnabled);
    alertSoundManager.toggleSound(!soundEnabled);
  };
  
  // Helper function to format uptime
  const formatUptime = (startTime) => {
    const now = new Date();
    const diff = Math.floor((now - startTime) / 1000);
    const hours = Math.floor(diff / 3600);
    const minutes = Math.floor((diff % 3600) / 60);
    const seconds = diff % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Update analytics based on counters
  const updateAnalytics = (counters) => {
    // Update animal species data
    setAnimalSpeciesData([
      { name: 'Elephants', value: counters.elephants_detected },
      { name: 'Tigers', value: counters.tigers_detected },
      { name: 'Deer', value: counters.deer_detected },
      { name: 'Birds', value: counters.birds_detected },
      { name: 'Other', value: Math.max(0, counters.animals_detected - (counters.elephants_detected + counters.tigers_detected + counters.deer_detected + counters.birds_detected)) }
    ]);
    
    // Update animal distribution
    setAnimalDistribution([
      { name: 'Elephants', value: counters.elephants_detected },
      { name: 'Tigers', value: counters.tigers_detected },
      { name: 'Deer', value: counters.deer_detected },
      { name: 'Birds', value: counters.birds_detected },
      { name: 'Other', value: Math.max(0, counters.animals_detected - (counters.elephants_detected + counters.tigers_detected + counters.deer_detected + counters.birds_detected)) }
    ]);
    
    // Update detection trends (simulated data)
    setDetectionTrends([
      { day: 'Mon', hunters: Math.floor(counters.hunters_detected * 0.8), animals: Math.floor(counters.animals_detected * 0.7), fires: Math.floor(counters.wildfires_detected * 0.9) },
      { day: 'Tue', hunters: Math.floor(counters.hunters_detected * 0.6), animals: Math.floor(counters.animals_detected * 0.8), fires: Math.floor(counters.wildfires_detected * 0.7) },
      { day: 'Wed', hunters: Math.floor(counters.hunters_detected * 0.9), animals: Math.floor(counters.animals_detected * 0.6), fires: Math.floor(counters.wildfires_detected * 0.8) },
      { day: 'Thu', hunters: Math.floor(counters.hunters_detected * 0.7), animals: Math.floor(counters.animals_detected * 0.9), fires: Math.floor(counters.wildfires_detected * 0.6) },
      { day: 'Fri', hunters: counters.hunters_detected, animals: counters.animals_detected, fires: counters.wildfires_detected },
      { day: 'Sat', hunters: Math.floor(counters.hunters_detected * 1.1), animals: Math.floor(counters.animals_detected * 1.2), fires: Math.floor(counters.wildfires_detected * 1.1) },
      { day: 'Sun', hunters: Math.floor(counters.hunters_detected * 1.2), animals: Math.floor(counters.animals_detected * 1.1), fires: Math.floor(counters.wildfires_detected * 1.2) },
    ]);
  };

  // Fetch initial counters on mount
  useEffect(() => {
    const fetchCounters = async () => {
      try {
        const response = await fetch('http://localhost:5000/counters');
        if (response.ok) {
          const data = await response.json();
          setCounters(data);
          
          // Update analytics
          updateAnalytics(data);
        }
      } catch (error) {
        console.error('Error fetching counters:', error);
      }
    };

    fetchCounters();
  }, []);

  // Update system stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate system stats
      setSystemStats(prev => ({
        ...prev,
        uptime: formatUptime(Date.now()),
        detectionRate: `${Math.floor(Math.random() * 10) + 1}/sec`,
        accuracy: `${(95 + Math.random() * 4).toFixed(1)}%`
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Handle system reset
  const handleReset = async () => {
    try {
      const response = await fetch('http://localhost:5000/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ System reset successful:', data);
        setCounters(data.data);
        setAlerts([]);
        setEventLog([]);
        
        // Reset ranger positions to initial state
        setRangerPositions([
          { id: 'alpha', name: 'Ranger Alpha', zone: 'North Sector', status: 'ON DUTY', distance: '2.3 km', eta: null, active: false },
          { id: 'bravo', name: 'Ranger Bravo', zone: 'East Sector', status: 'ON DUTY', distance: '4.1 km', eta: null, active: false },
          { id: 'charlie', name: 'Ranger Charlie', zone: 'South Sector', status: 'ON DUTY', distance: '0.8 km', eta: null, active: false },
          { id: 'patrol', name: 'Patrol Vehicle', zone: 'Central Hub', status: 'STANDBY', distance: null, eta: '5 mins', active: false },
        ]);
      }
    } catch (error) {
      console.error('❌ Error resetting system:', error);
    }
  };

  // Get alert styling
  const getAlertStyle = (type) => {
    switch(type) {
      case 'HUNTER':
        return { bg: 'bg-red-900/20', border: 'border-red-500', text: 'text-red-200' };
      case 'TIGER':
        return { bg: 'bg-orange-900/20', border: 'border-orange-500', text: 'text-orange-200' };
      case 'ELEPHANT':
        return { bg: 'bg-blue-900/20', border: 'border-blue-500', text: 'text-blue-200' };
      case 'WILDFIRE':
        return { bg: 'bg-red-900/20', border: 'border-red-600', text: 'text-red-100' };
      case 'ANIMAL':
        return { bg: 'bg-green-900/20', border: 'border-green-500', text: 'text-green-200' };
      case 'DEER':
        return { bg: 'bg-amber-900/20', border: 'border-amber-500', text: 'text-amber-200' };
      case 'BIRD':
        return { bg: 'bg-cyan-900/20', border: 'border-cyan-500', text: 'text-cyan-200' };
      default:
        return { bg: 'bg-gray-700/20', border: 'border-gray-500', text: 'text-gray-200' };
    }
  };
  
  // Get alert icon
  const getAlertIcon = (type) => {
    switch(type) {
      case 'HUNTER':
        return '👤';
      case 'TIGER':
        return '🐅';
      case 'ELEPHANT':
        return '🐘';
      case 'WILDFIRE':
        return '🔥';
      case 'ANIMAL':
        return '🐾';
      case 'DEER':
        return '🦌';
      case 'BIRD':
        return '🐦';
      default:
        return '⚠️';
    }
  };
  


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6" style={{backgroundImage: 'radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.1) 0%, rgba(0, 0, 0, 0.9) 100%)'}}>
      
      {/* Emergency Fire Alert Popup */}
      {showFireAlert && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-red-900/90 backdrop-blur-md rounded-2xl p-8 border-4 border-red-500 shadow-2xl shadow-red-500/50 max-w-2xl w-full transform transition-all duration-300 scale-100 animate-pulse">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="text-6xl animate-bounce">🔥</div>
              </div>
              <h2 className="text-4xl font-bold text-red-100 mb-4 animate-pulse">
                EMERGENCY FIRE ALERT!
              </h2>
              <p className="text-xl text-red-200 mb-6">
                WILDFIRE DETECTED - IMMEDIATE ACTION REQUIRED
              </p>
              <div className="bg-red-800/50 rounded-lg p-4 mb-6 border border-red-400">
                <p className="text-red-100 font-semibold">🚨 RESPONSE PROTOCOL ACTIVATED</p>
                <ul className="text-red-200 text-left mt-2 space-y-1 text-sm">
                  <li>• Emergency services notified</li>
                  <li>• Rangers dispatched to affected area</li>
                  <li>• Evacuation procedures initiated</li>
                  <li>• Fire suppression teams deployed</li>
                </ul>
              </div>
              <button 
                onClick={() => setShowFireAlert(false)}
                className="px-6 py-3 bg-red-700 hover:bg-red-600 text-white font-bold rounded-lg transition-colors duration-300 border-2 border-red-500 shadow-lg shadow-red-500/30 hover:shadow-xl hover:shadow-red-500/50"
              >
                ACKNOWLEDGE ALERT
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 mb-2">
              🛡️ WILDGUARD AI SECURITY SYSTEM
            </h1>
            <p className="text-emerald-300 text-lg">Advanced Real-Time Wildlife Protection & Monitoring Platform</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-3 mb-2">
              <div className={`w-4 h-4 rounded-full ${connected ? 'bg-emerald-500 animate-pulse shadow-lg shadow-emerald-500' : 'bg-red-500'}`}></div>
              <span className="text-sm font-semibold">{connected ? 'ONLINE' : 'OFFLINE'}</span>
            </div>
            <span className="text-xs text-emerald-400">AI Detection: ACTIVE | Accuracy: 98.7%</span>
          </div>
        </div>
        <div className="h-1 bg-gradient-to-r from-emerald-500 to-emerald-700 rounded-full"></div>
        
        <div className="flex justify-end mt-4">
          <div className="flex gap-2">
            <button 
              onClick={toggleSound}
              className={`px-4 py-2 ${soundEnabled ? 'bg-emerald-700 hover:bg-emerald-600 border-emerald-500/50' : 'bg-gray-700 hover:bg-gray-600 border-gray-500/50'} text-white rounded-lg transition-colors duration-300 flex items-center space-x-2 border`}
              title={soundEnabled ? 'Sound Enabled - Click to Disable' : 'Sound Disabled - Click to Enable'}
            >
              <span>{soundEnabled ? '🔊' : '🔇'}</span>
              <span>{soundEnabled ? 'SOUND ON' : 'SOUND OFF'}</span>
            </button>
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors duration-300 flex items-center space-x-2 border border-red-500/50"
            >
              <span>🔄</span>
              <span>RESET COUNTS</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Stats and Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Hunters Card */}
        <div className="group bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-md rounded-xl p-4 border border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-black/30 border-1 border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl text-emerald-400">👤</div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          </div>
          <h3 className="text-emerald-300 text-xs font-medium mb-1">HUNTERS DETECTED</h3>
          <p className="text-3xl font-black text-emerald-400 mb-1">{counters.hunters_detected}</p>
          <p className="text-xs text-emerald-300">Security Threats</p>
        </div>

        {/* Total Animals Card */}
        <div className="group bg-gradient-to-br from-green-900/20 to-green-900/10 backdrop-blur-md rounded-xl p-4 border border-green-500/30 hover:border-green-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 bg-black/30 border-1 border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl text-emerald-400">🐾</div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <h3 className="text-emerald-300 text-xs font-medium mb-1">ANIMALS DETECTED</h3>
          <p className="text-3xl font-black text-emerald-400 mb-1">{counters.animals_detected}</p>
          <p className="text-xs text-emerald-300">Wildlife Activity</p>
        </div>

        {/* Elephants Card */}
        <div className="group bg-gradient-to-br from-blue-900/20 to-blue-900/10 backdrop-blur-md rounded-xl p-4 border border-blue-500/30 hover:border-blue-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 bg-black/30 border-1 border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl text-emerald-400">🐘</div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <h3 className="text-emerald-300 text-xs font-medium mb-1">ELEPHANTS SPOTTED</h3>
          <p className="text-3xl font-black text-emerald-400 mb-1">{counters.elephants_detected}</p>
          <p className="text-xs text-emerald-300">Protected Species</p>
        </div>

        {/* Tigers Card */}
        <div className="group bg-gradient-to-br from-amber-900/20 to-amber-900/10 backdrop-blur-md rounded-xl p-4 border border-amber-500/30 hover:border-amber-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/20 bg-black/30 border-1 border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl text-emerald-400">🐅</div>
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          </div>
          <h3 className="text-emerald-300 text-xs font-medium mb-1">TIGERS SPOTTED</h3>
          <p className="text-3xl font-black text-emerald-400 mb-1">{counters.tigers_detected}</p>
          <p className="text-xs text-emerald-300">Endangered Species</p>
        </div>

        {/* Wildfires Card */}
        <div className="group bg-gradient-to-br from-red-900/20 to-red-900/10 backdrop-blur-md rounded-xl p-4 border border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 bg-black/30 border-1 border-emerald-500/30">
          <div className="flex items-center justify-between mb-2">
            <div className="text-2xl text-emerald-400">🔥</div>
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          </div>
          <h3 className="text-emerald-300 text-xs font-medium mb-1">WILDFIRES DETECTED</h3>
          <p className="text-3xl font-black text-emerald-400 mb-1">{counters.wildfires_detected}</p>
          <p className="text-xs text-emerald-300">Emergency Alerts</p>
        </div>
      </div>

      {/* Critical Alerts Section */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/30 mb-8 shadow-xl shadow-emerald-500/10">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-emerald-400">
          <span className="mr-3">🚨</span> CRITICAL ALERTS PANEL
        </h2>
        
        <div className="space-y-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-emerald-300">
              <p className="text-lg">✅ NO ACTIVE THREATS DETECTED</p>
              <p className="text-sm mt-2">System monitoring for security incidents...</p>
            </div>
          ) : (
            alerts.map((alert) => {
              const style = getAlertStyle(alert.type);
              return (
                <div
                  key={alert.id}
                  className={`bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 transition-all duration-300 ${
                    alert.isNew ? 'ring-2 ring-emerald-400 scale-105 shadow-lg shadow-emerald-500/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xl text-emerald-400">{getAlertIcon(alert.type)}</span>
                        <h3 className="font-bold text-lg text-emerald-300">{alert.title}</h3>
                        {alert.severity === 'CRITICAL' && (
                          <span className="px-2 py-1 bg-red-700 text-white text-xs font-bold rounded">
                            CRITICAL THREAT
                          </span>
                        )}
                        {alert.type === 'HUNTER' && (
                          <span className="px-2 py-1 bg-red-800 text-white text-xs font-bold rounded">
                            ILLEGAL HUNTING
                          </span>
                        )}
                      </div>
                      <p className="text-emerald-200 text-sm mb-2">{alert.message}</p>
                      <div className="text-xs text-emerald-400 space-y-1">
                        <p>CAMERA: {alert.detection.camera || 'Unknown Location'} | CONFIDENCE: {alert.detection.confidence}%</p>
                        <p>TIME: {alert.timestamp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      
      {/* Ranger Location Section */}
      <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/30 mb-8 shadow-xl shadow-emerald-500/10">
        <h2 className="text-2xl font-bold mb-4 flex items-center text-emerald-400">
          <span className="mr-3">🛡️</span> FOREST RANGER POSITIONS
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {rangerPositions.map((ranger) => (
            <div 
              key={ranger.id}
              className={`p-4 rounded-lg border border-emerald-500/30 transition-all duration-300 ${
                ranger.active ? 'bg-emerald-800/30 ring-2 ring-emerald-400 scale-105' : 'bg-emerald-900/20'
              }`}
            >
              <div className="flex items-center space-x-2 mb-2">
                <span className="text-emerald-400 text-xl">{ranger.id === 'patrol' ? '🚗' : '👮‍♂️'}</span>
                <h3 className="font-bold text-emerald-300">{ranger.name}</h3>
              </div>
              <p className="text-xs text-emerald-400 mb-1">Zone: {ranger.zone}</p>
              <p className="text-xs text-emerald-300">
                Status: <span className={`${
                  ranger.status === 'ON DUTY' ? 'text-green-400' :
                  ranger.status === 'RESPONDING' || ranger.status === 'DEPLOYING' || ranger.status === 'EN ROUTE' || ranger.status === 'MOVING' ? 'text-yellow-400' : 'text-red-400'
                }`}>
                  {ranger.status}
                </span>
              </p>
              {ranger.distance && (
                <p className="text-xs text-emerald-400 mt-2">Distance to Threat: {ranger.distance}</p>
              )}
              {ranger.eta && (
                <p className="text-xs text-emerald-400 mt-2">ETA to Threat: {ranger.eta}</p>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 p-3 bg-red-900/20 rounded-lg border border-red-500/30">
          <div className="flex items-center space-x-2">
            <span className="text-red-400 text-lg">🚨</span>
            <p className="font-semibold text-red-300">POACHING INCIDENT DETECTED</p>
          </div>
          <p className="text-sm text-emerald-300 mt-1">Rangers have been automatically notified and are responding to the incident location.</p>
        </div>
      </div>
      
      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Detection Trends Chart */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
          <h3 className="text-xl font-bold mb-4 text-center text-emerald-400">Detection Trends Analysis</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={detectionTrends}>
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="day" stroke="#aaa" />
              <YAxis stroke="#aaa" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #059669', borderRadius: '8px', color: '#ffffff' }}
                itemStyle={{ color: '#ffffff' }}
              />
              <Legend />
              <Bar dataKey="hunters" fill="#059669" name="Hunters" />
              <Bar dataKey="animals" fill="#10b981" name="Animals" />
              <Bar dataKey="fires" fill="#dc2626" name="Fires" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Animal Distribution Chart */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/30 shadow-xl shadow-emerald-500/10">
          <h3 className="text-xl font-bold mb-4 text-center text-emerald-400">Animal Species Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={animalDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {animalDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6'][index % 5]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #059669', borderRadius: '8px', color: '#ffffff' }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* System Status Panel */}
        <div className="lg:col-span-1">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/30 overflow-hidden shadow-xl shadow-emerald-500/10">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-emerald-400">
              <span className="mr-3">⚙️</span> System Status
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-emerald-500/20">
                <span className="text-emerald-300">System Uptime</span>
                <span className="text-emerald-400 font-mono">{systemStats.uptime}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-emerald-500/20">
                <span className="text-emerald-300">Detection Rate</span>
                <span className="text-emerald-400 font-mono">{systemStats.detectionRate}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-emerald-500/20">
                <span className="text-emerald-300">AI Accuracy</span>
                <span className="text-emerald-400 font-mono">{systemStats.accuracy}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-emerald-500/20">
                <span className="text-emerald-300">Active Cameras</span>
                <span className="text-emerald-400 font-mono">5/5 Online</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-black/50 rounded-lg border border-emerald-500/20">
                <span className="text-emerald-300">Network Status</span>
                <span className="text-emerald-400 font-mono">Optimal</span>
              </div>
            </div>
            
            <div className="mt-6">
              <h3 className="text-lg font-bold mb-3 text-emerald-300">Threat Level</h3>
              <div className="w-full bg-black/50 rounded-full h-4 border border-emerald-500/20">
                <div 
                  className="bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 h-4 rounded-full" 
                  style={{ width: `${Math.min(100, (counters.hunters_detected * 20))}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-emerald-400 mt-2">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Camera Feed */}
        <div className="lg:col-span-2">
          <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-emerald-500/30 shadow-xl shadow-emerald-500/10 overflow-hidden">
            <h2 className="text-2xl font-bold mb-4 flex items-center text-emerald-400">
              <span className="mr-3">📹</span> Live Camera Feed
            </h2>
            <div className="relative bg-black/70 rounded-xl overflow-hidden border-2 border-emerald-500/30 aspect-video flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-black opacity-70"></div>
              <div className="relative text-center z-10">
                <svg className="w-16 h-16 mx-auto text-emerald-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <p className="text-emerald-400 text-sm">Secure Camera Stream</p>
                <p className="text-xs text-emerald-600 mt-1">Real-time Wildlife Monitoring</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-emerald-400 space-y-1">
              <p>• Camera 01: Active | Resolution: 1920x1080 | FPS: 30</p>
              <p>• Camera 02: Active | Resolution: 1920x1080 | FPS: 30</p>
              <p>• Camera 03: Active | Resolution: 1920x1080 | FPS: 30</p>
            </div>
          </div>
        </div>
      </div>

      {/* Event Timeline */}
      <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
        <h2 className="text-2xl font-bold mb-6 flex items-center">
          <span className="mr-3">📊</span> Detection Event Log
        </h2>

        {eventLog.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No detection events logged in the system</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {eventLog.map((event, index) => {
              const style = getAlertStyle(event.type);
              return (
                <div key={event.id} className={`flex items-center space-x-3 text-sm px-3 py-2 rounded-lg ${style.bg} border-l-2 ${style.border}`}>
                  <span className="text-lg">{getAlertIcon(event.type)}</span>
                  <div className="flex-1">
                    <span className="font-semibold">{event.title}</span>
                    <span className="text-gray-400 ml-2 text-xs">at {event.timestamp}</span>
                  </div>
                  <span className="text-xs text-gray-500">{event.detection.confidence}% confidence</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-8 flex justify-between items-center text-xs text-gray-500 border-t border-slate-700 pt-6">
        <div>
          <p>🔒 WILDGUARD v2.0 - Wildlife Protection AI System</p>
          <p>Real-Time Detection • Advanced Analytics • Emergency Alerts</p>
        </div>
        <div className="text-right">
          <p>🌍 Global Protection Network</p>
          <p>Last Updated: {new Date().toLocaleTimeString()}</p>
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </div>
  );
};

export default WildguardDashboard;

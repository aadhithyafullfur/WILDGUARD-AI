import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

const Dashboard = () => {
  const [summaryData, setSummaryData] = useState({
    hunters_detected: 0,
    animals_detected: 0,
    wildfires_detected: 0,
    total_alerts: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Connect to Flask backend
    const socket = io('http://localhost:5000');

    socket.on('connect', () => {
      console.log('Connected to detection system');
      setConnected(true);
      socket.emit('request_counters');
    });

    // Handle detection alerts
    socket.on('detection_alert', (alertData) => {
      console.log('New alert:', alertData);
      
      // Map detection types for frontend display
      const displayType = alertData.type === 'person' ? 'hunter' : alertData.type;
      
      // Update counters
      setSummaryData(prev => {
        const newData = {...prev};
        if (displayType === 'hunter') {
          newData.hunters_detected += 1;
        } else if (displayType === 'animal') {
          newData.animals_detected += 1;
        } else if (displayType === 'fire') {
          newData.wildfires_detected += 1;
        }
        newData.total_alerts += 1;
        return newData;
      });

      // Add to recent alerts (keep only last 5)
      setRecentAlerts(prev => {
        const newAlerts = [{
          id: Date.now(),
          type: displayType,
          name: alertData.name || `${displayType.toUpperCase()} DETECTED`,
          message: alertData.name || `${displayType.toUpperCase()} DETECTED`,
          image: alertData.image,
          timestamp: alertData.timestamp || new Date().toLocaleString()
        }, ...prev];
        return newAlerts.slice(0, 5);
      });
    });

    // Handle reset
    socket.on('reset_signal', (resetData) => {
      setSummaryData({
        hunters_detected: resetData.counters.hunters_detected,
        animals_detected: resetData.counters.animals_detected,
        wildfires_detected: resetData.counters.wildfires_detected,
        total_alerts: 0
      });
      setRecentAlerts([]);
    });

    // Handle counters update
    socket.on('counters_update', (counters) => {
      setSummaryData({
        hunters_detected: counters.hunters_detected,
        animals_detected: counters.animals_detected,
        wildfires_detected: counters.wildfires_detected,
        total_alerts: counters.hunters_detected + counters.animals_detected + counters.wildfires_detected
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from detection system');
      setConnected(false);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleReset = async () => {
    try {
      const response = await fetch('http://localhost:5000/reset', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      if (data.success) {
        console.log('System reset successfully');
      }
    } catch (error) {
      console.error('Error resetting system:', error);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'hunter': return 'bg-red-500';
      case 'animal': return 'bg-green-500';
      case 'fire': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeName = (type) => {
    switch(type) {
      case 'hunter': return 'HUNTER';
      case 'person': return 'HUNTER'; // Map person to hunter for display
      case 'animal': return 'ANIMAL';
      case 'fire': return 'FIRE';
      default: return 'UNKNOWN';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
              WILDGUARD AI
            </h1>
            <p className="text-gray-400 mt-2">Real-Time Wildlife Protection System</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm">{connected ? 'SYSTEM ONLINE' : 'CONNECTING...'}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Hunters Detected</p>
              <p className="text-3xl font-bold text-red-400 mt-1">{summaryData.hunters_detected}</p>
            </div>
            <div className="bg-red-500/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Animals Detected</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{summaryData.animals_detected}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Fire Detections</p>
              <p className="text-3xl font-bold text-orange-400 mt-1">{summaryData.wildfires_detected}</p>
            </div>
            <div className="bg-orange-500/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Alerts Section */}
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Recent Detections</h2>
          <button 
            onClick={handleReset}
            className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-400 hover:to-red-500 transition-all duration-300 font-medium"
          >
            Reset System
          </button>
        </div>

        {recentAlerts.length === 0 ? (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h9a1 1 0 001-1z" />
            </svg>
            <p className="text-gray-400">No recent detections. System is monitoring...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentAlerts.map((alert) => (
              <div key={alert.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <div className="flex items-start space-x-4">
                  {/* Alert Type Badge */}
                  <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getTypeColor(alert.type)}`}>
                    {getTypeName(alert.type)}
                  </div>
                  
                  {/* Alert Content */}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{alert.name}</h3>
                    <p className="text-gray-400 text-sm mb-3">{alert.timestamp}</p>
                    
                    {/* Captured Image */}
                    {alert.image && (
                      <div>
                        <p className="text-sm text-gray-400 mb-2">Captured Evidence:</p>
                        <img 
                          src={alert.image} 
                          alt="Detection Evidence" 
                          className="max-w-full h-auto max-h-48 rounded-lg border border-gray-600 object-contain bg-gray-800"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* System Status */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Live camera feed • AI-powered detection • Real-time alerts</p>
      </div>
    </div>
  );
};

export default Dashboard;
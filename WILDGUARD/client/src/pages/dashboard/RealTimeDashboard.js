import React, { useState, useEffect, useRef } from 'react';

const RealTimeDashboard = () => {
  const [summaryData, setSummaryData] = useState({
    hunters_detected: 0,
    animals_detected: 0,
    wildfires_detected: 0,
    total_alerts: 0
  });
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [connected, setConnected] = useState(false);
  const [eventLog, setEventLog] = useState([]); // Track individual detection events
  
  // Track previous values to detect changes
  const prevCounts = useRef({
    hunters: 0,
    animals: 0,
    fires: 0
  });

  // Poll for detection data every 1 second
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5000/counters');
        if (response.ok) {
          const data = await response.json();
          
          // Check for individual detection events
          const newEvents = [];
          
          // Check for new hunter detections
          if (data.hunters_detected > prevCounts.current.hunters) {
            const countIncrease = data.hunters_detected - prevCounts.current.hunters;
            for (let i = 0; i < countIncrease; i++) {
              newEvents.push({
                id: Date.now() + i,
                type: 'hunter',
                name: 'HUNTER DETECTED',
                message: '🚨 ILLEGAL HUNTING ACTIVITY DETECTED!',
                image: 'https://placehold.co/400x300/red/white?text=HUNTER+DETECTED',
                timestamp: new Date().toLocaleString(),
                isNew: true
              });
            }
          }
          
          // Check for new animal detections
          if (data.animals_detected > prevCounts.current.animals) {
            const countIncrease = data.animals_detected - prevCounts.current.animals;
            for (let i = 0; i < countIncrease; i++) {
              newEvents.push({
                id: Date.now() + 1000 + i,
                type: 'animal',
                name: 'ANIMAL SPOTTED',
                message: '🐾 Wildlife activity detected in monitored area',
                image: 'https://placehold.co/400x300/green/white?text=ANIMAL+SPOTTED',
                timestamp: new Date().toLocaleString(),
                isNew: true
              });
            }
          }
          
          // Check for new fire detections
          if (data.wildfires_detected > prevCounts.current.fires) {
            const countIncrease = data.wildfires_detected - prevCounts.current.fires;
            for (let i = 0; i < countIncrease; i++) {
              newEvents.push({
                id: Date.now() + 2000 + i,
                type: 'fire',
                name: 'FIRE DETECTED',
                message: '🔥 Wildfire alert in monitored area',
                image: 'https://placehold.co/400x300/orange/white?text=FIRE+DETECTED',
                timestamp: new Date().toLocaleString(),
                isNew: true
              });
            }
          }
          
          // Add new events to the log
          if (newEvents.length > 0) {
            setEventLog(prev => [...newEvents, ...prev].slice(0, 20)); // Keep last 20 events
            setRecentAlerts(prev => [...newEvents, ...prev].slice(0, 10)); // Keep last 10 alerts
            
            // Flash effect for new alerts
            setTimeout(() => {
              setRecentAlerts(prev => 
                prev.map(alert => ({...alert, isNew: false}))
              );
            }, 3000);
          }
          
          // Update summary data
          setSummaryData({
            hunters_detected: data.hunters_detected,
            animals_detected: data.animals_detected,
            wildfires_detected: data.wildfires_detected,
            total_alerts: data.hunters_detected + data.animals_detected + data.wildfires_detected
          });
          
          // Update previous counts
          prevCounts.current = {
            hunters: data.hunters_detected,
            animals: data.animals_detected,
            fires: data.wildfires_detected
          };
          
          setConnected(true);
        } else {
          setConnected(false);
        }
      } catch (error) {
        console.error('❌ Error fetching data:', error);
        setConnected(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Poll every 1 second for real-time updates
    const interval = setInterval(fetchData, 1000);
    
    return () => clearInterval(interval);
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
        setRecentAlerts([]);
        setEventLog([]);
        prevCounts.current = { hunters: 0, animals: 0, fires: 0 };
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
              WILDGUARD AI - REAL-TIME ALERTS
            </h1>
            <p className="text-gray-400 mt-2">Live Wildlife Protection System</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-sm">{connected ? 'LIVE MONITORING' : 'CONNECTING...'}</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300">
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

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Animals Spotted</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{summaryData.animals_detected}</p>
            </div>
            <div className="bg-green-500/20 p-3 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Fire Alerts</p>
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

      {/* Live Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Alerts */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold flex items-center">
              <span className="mr-2">🔔</span> Live Alerts
            </h2>
            <button 
              onClick={handleReset}
              className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-400 hover:to-red-500 transition-all duration-300 font-medium text-sm"
            >
              Reset System
            </button>
          </div>

          {recentAlerts.length === 0 ? (
            <div className="text-center py-12">
              <div className="animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-gray-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM9 7H4l5-5v5zm6 10V7a1 1 0 00-1-1H5a1 1 0 00-1 1v10a1 1 0 001 1h9a1 1 0 001-1z" />
                </svg>
                <p className="text-gray-400">Monitoring for wildlife activity...</p>
                <p className="text-gray-500 text-sm mt-2">System is actively scanning</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {recentAlerts.map((alert) => (
                <div 
                  key={alert.id} 
                  className={`bg-white/5 rounded-xl p-4 border border-white/10 transform transition-all duration-500 ${
                    alert.isNew ? 'scale-105 ring-2 ring-yellow-400 shadow-lg' : ''
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    {/* Alert Type Badge */}
                    <div className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getTypeColor(alert.type)}`}>
                      {getTypeName(alert.type)}
                    </div>
                    
                    {/* Alert Content */}
                    <div className="flex-1">
                      <h3 className="font-bold text-lg mb-1">{alert.name}</h3>
                      <p className="text-gray-400 text-sm mb-2">{alert.timestamp}</p>
                      <p className={`font-medium ${alert.type === 'hunter' ? 'text-red-300' : alert.type === 'animal' ? 'text-green-300' : 'text-orange-300'}`}>
                        {alert.message}
                      </p>
                      
                      {/* Captured Image */}
                      <div className="mt-3">
                        <p className="text-sm text-gray-400 mb-2">📸 Detection Evidence:</p>
                        <img 
                          src={alert.image} 
                          alt="Detection Evidence" 
                          className="max-w-full h-auto max-h-32 rounded-lg border border-gray-600 object-contain bg-gray-800"
                          onError={(e) => {
                            e.target.src = 'https://placehold.co/300x200/gray/white?text=No+Image';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Event Log */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold mb-6 flex items-center">
            <span className="mr-2">📋</span> Event Timeline
          </h2>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {eventLog.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No detection events yet
              </div>
            ) : (
              eventLog.map((event, index) => (
                <div key={event.id} className="bg-white/5 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(event.type)}`}></div>
                      <span className="text-sm font-medium">{event.name}</span>
                    </div>
                    <span className="text-xs text-gray-400">{event.timestamp}</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 ml-5">{event.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="mt-8 text-center text-sm text-gray-500">
        <p>Live monitoring active • Real-time alerts • Automated detection system</p>
      </div>
    </div>
  );
};

export default RealTimeDashboard;
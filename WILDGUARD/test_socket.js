const io = require('socket.io-client');

// Connect to the Flask backend
const socket = io('http://localhost:5000');

socket.on('connect', () => {
    console.log('✅ Connected to backend');
    
    // Request current counters
    socket.emit('request_counters');
});

socket.on('counters_update', (data) => {
    console.log('📊 Counters update received:', data);
});

socket.on('detection_alert', (data) => {
    console.log('🚨 Detection alert received:', data);
});

socket.on('disconnect', () => {
    console.log('❌ Disconnected from backend');
});

// Keep the script running
setInterval(() => {
    console.log('📡 Still connected...');
}, 5000);

console.log('🔍 Testing Socket.IO connection to WildGuard backend...');
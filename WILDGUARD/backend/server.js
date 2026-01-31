require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const detectionRoutes = require('./routes/api/detection');
const DetectionAlertManager = require('./services/detectionAlertManager');

// Make io available globally so routes can access it
global.io = null;
global.alertManager = new DetectionAlertManager();

const app = express();

// Allowed origins for CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://wildguard-client.vercel.app",
  /\.vercel\.app$/  // Allow all Vercel preview deployments
];

// Enable CORS for all routes
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    // Check if origin matches allowed origins
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });
    
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all origins for now
    }
  },
  credentials: true
}));

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: function(origin, callback) {
      callback(null, true); // Allow all origins for socket.io
    },
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to MongoDB
const connectDB = require('./config/db');

connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/detection', detectionRoutes);

// Counter endpoints for dashboard
app.get('/counters', (req, res) => {
  try {
    res.json(global.alertManager.getCounters());
  } catch (error) {
    console.error('Error fetching counters:', error);
    res.status(500).json({ success: false, message: 'Error fetching counters' });
  }
});

app.post('/reset', (req, res) => {
  try {
    const counters = global.alertManager.reset();
    res.json({ success: true, data: counters });
  } catch (error) {
    console.error('Error resetting system:', error);
    res.status(500).json({ success: false, message: 'Error resetting system' });
  }
});

// Basic route for testing
app.get('/', (req, res) => {
  res.send('WILDGUARD AI Authentication Server is running!');
});

// Handle 404 for undefined routes
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Send current counters to new clients
  socket.emit('counters-updated', global.alertManager.getCounters());
  
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Assign io to global so routes can access it
global.io = io;
global.alertManager.initialize(io);

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} 🚀`);
});

module.exports = app;
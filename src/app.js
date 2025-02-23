const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const config = require('./config');
const errorHandler = require('./middleware/errorHandler');
const WebSocketManager = require('./services/WebSocketManager');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const wsManager = new WebSocketManager();

// Middleware
app.use(cors(config.cors));
app.use(express.static('public'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// WebSocket connection handling
wss.on('connection', (ws, req) => wsManager.handleConnection(ws, req));

// Error handling
app.use(errorHandler);

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down server...');
  wsManager.shutdown();
  server.close(() => {
    console.log('Server shut down complete');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start server
server.listen(config.port, () => {
  console.log(`⚡ Server running on port ${config.port} in ${config.nodeEnv} mode`);
});
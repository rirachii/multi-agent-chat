const WebSocket = require('ws');
const config = require('../config');

class WebSocketManager {
  constructor() {
    this.connections = new Map();
    this.elevenlabsConnections = new Map();
  }

  handleConnection(ws, req) {
    console.log('New client connected');
    const clientId = this.generateClientId();
    this.connections.set(clientId, ws);

    ws.on('message', async (message) => {
      try {
        await this.handleMessage(clientId, ws, message);
      } catch (error) {
        console.error('Error handling message:', error);
        ws.send(JSON.stringify({ error: 'Internal Server Error' }));
      }
    });

    ws.on('close', () => this.handleDisconnect(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));
  }

  async handleMessage(clientId, ws, message) {
    const data = JSON.parse(message);
    const { agentId, text } = data;

    if (!config.elevenLabs.agents[agentId]) {
      return ws.send(JSON.stringify({ error: 'INVALID_AGENT' }));
    }

    const { voiceId, modelId, settings } = config.elevenLabs.agents[agentId];
    
    // Initialize ElevenLabs WebSocket
    const elevenLabsWs = new WebSocket(
      `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?` + 
      `model_id=${modelId}&output_format=pcm_44100`
    );

    this.elevenlabsConnections.set(`${clientId}-${agentId}`, elevenLabsWs);

    elevenLabsWs.on('open', () => {
      elevenLabsWs.send(JSON.stringify({
        text: ' ',
        xi_api_key: config.elevenLabs.apiKey,
        try_trigger_generation: true,
        voice_settings: {
          stability: settings.stability,
          similarity_boost: settings.similarityBoost
        }
      }));
      elevenLabsWs.send(JSON.stringify({ text }));
    });

    elevenLabsWs.on('message', (response) => {
      const resData = JSON.parse(response);
      if (resData.audio) {
        ws.send(JSON.stringify({ agentId, audio: resData.audio }));
      }
      if (resData.isFinal) {
        ws.send(JSON.stringify({ agentId, status: 'finished' }));
        this.cleanupElevenLabsConnection(clientId, agentId);
      }
    });

    elevenLabsWs.on('error', (error) => {
      console.error(`ElevenLabs WebSocket error for ${agentId}:`, error);
      ws.send(JSON.stringify({ agentId, error: 'ELEVENLABS_ERROR' }));
      this.cleanupElevenLabsConnection(clientId, agentId);
    });
  }

  handleDisconnect(clientId) {
    console.log(`Client ${clientId} disconnected`);
    this.connections.delete(clientId);
    
    // Cleanup any ElevenLabs connections for this client
    for (const [key, connection] of this.elevenlabsConnections.entries()) {
      if (key.startsWith(`${clientId}-`)) {
        connection.close();
        this.elevenlabsConnections.delete(key);
      }
    }
  }

  handleError(clientId, error) {
    console.error(`Error for client ${clientId}:`, error);
    this.handleDisconnect(clientId);
  }

  cleanupElevenLabsConnection(clientId, agentId) {
    const key = `${clientId}-${agentId}`;
    const connection = this.elevenlabsConnections.get(key);
    if (connection) {
      connection.close();
      this.elevenlabsConnections.delete(key);
    }
  }

  generateClientId() {
    return `client-${Math.random().toString(36).substr(2, 9)}`;
  }

  shutdown() {
    // Close all connections when shutting down the server
    for (const connection of this.connections.values()) {
      connection.close();
    }
    for (const connection of this.elevenlabsConnections.values()) {
      connection.close();
    }
  }
}

module.exports = WebSocketManager;
require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const { ELEVENLABS_API_KEY } = process.env;

const agents = {
  agent1: { voiceId: process.env.AGENT1_VOICE_ID || 'YOUR_AGENT1_VOICE_ID', modelId: 'v1' },
  agent2: { voiceId: process.env.AGENT2_VOICE_ID || 'YOUR_AGENT2_VOICE_ID', modelId: 'eleven_monolingual_v1' }
};

let agentConnections = {};

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

// Serve static files from the public directory
app.use(express.static('public'));

wss.on('connection', (ws, req) => {
  console.log('New client connected');
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      const { agentId, text } = data;

      if (!agents[agentId]) {
        return ws.send(JSON.stringify({ error: 'INVALID_AGENT' }));
      }

      const { voiceId, modelId } = agents[agentId];
      
      // Initialize ElevenLabs WebSocket for this agent
      const elevenLabsWs = new WebSocket(
        `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?` + 
        `model_id=${modelId}&output_format=pcm_44100`
      );

      elevenLabsWs.on('open', () => {
        elevenLabsWs.send(JSON.stringify({
          text: ' ',
          xi_api_key: ELEVENLABS_API_KEY,
          try_trigger_generation: true,
          voice_settings: { similarity_boost: 0.8, stability: 0.5 }
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
          elevenLabsWs.close();
        }
      });

      elevenLabsWs.on('error', (error) => {
        console.error(`ElevenLabs WebSocket error for ${agentId}:`, error);
        ws.send(JSON.stringify({ agentId, error: 'ELEVENLABS_ERROR' }));
      });

      elevenLabsWs.on('close', () => {
        console.log(`ElevenLabs WebSocket closed for ${agentId}`);
        delete agentConnections[agentId];
      });

      // Store the connection
      agentConnections[agentId] = elevenLabsWs;
    } catch (error) {
      console.error('Error processing message:', error);
      ws.send(JSON.stringify({ error: 'INTERNAL_ERROR' }));
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    // Clean up any existing agent connections
    Object.values(agentConnections).forEach(conn => conn.close());
    agentConnections = {};
  });
});

const PORT = process.env.PORT || 9000;
server.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT}`);
});
require('dotenv').config();

const config = {
  port: process.env.PORT || 9000,
  nodeEnv: process.env.NODE_ENV || 'development',
  elevenLabs: {
    apiKey: process.env.ELEVENLABS_API_KEY,
    agents: {
      agent1: {
        voiceId: process.env.AGENT1_VOICE_ID,
        modelId: 'v1',
        settings: {
          stability: 0.5,
          similarityBoost: 0.8
        }
      },
      agent2: {
        voiceId: process.env.AGENT2_VOICE_ID,
        modelId: 'eleven_monolingual_v1',
        settings: {
          stability: 0.5,
          similarityBoost: 0.8
        }
      }
    }
  },
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST']
  }
};

// Validate required environment variables
const requiredEnvVars = [
  'ELEVENLABS_API_KEY',
  'AGENT1_VOICE_ID',
  'AGENT2_VOICE_ID'
];

const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

module.exports = config;
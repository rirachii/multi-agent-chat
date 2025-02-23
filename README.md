# Multi-Agent Chat Interface

A real-time multi-agent chat interface with ElevenLabs text-to-speech streaming integration. This application allows users to interact with multiple AI agents simultaneously, each with their own unique voice.

## Features

- Real-time WebSocket communication
- Multiple agent support with independent chat windows
- Streaming audio playback using Web Audio API
- ElevenLabs text-to-speech integration
- Clean and responsive UI using Tailwind CSS

## Prerequisites

- Node.js (v14 or higher)
- An ElevenLabs API key
- Voice IDs from ElevenLabs for each agent

## Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/rirachii/multi-agent-chat.git
   cd multi-agent-chat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your ElevenLabs API key and voice IDs:
   ```
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   AGENT1_VOICE_ID=your_agent1_voice_id_here
   AGENT2_VOICE_ID=your_agent2_voice_id_here
   ```

## Running the Application

1. Start the server:
   ```bash
   npm start
   ```
   or for development with auto-reload:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:9000
   ```

## Project Structure

```
multi-agent-chat/
├── src/
│   └── app.js          # Backend server code
├── public/
│   ├── index.html      # Frontend HTML
│   └── app.js          # Frontend React component
├── package.json        # Project dependencies
├── .env.example        # Environment variables template
└── README.md          # Project documentation
```

## Technical Details

### Backend
- Express.js server with WebSocket support
- ElevenLabs streaming API integration
- Multi-agent connection management

### Frontend
- React for UI components
- Web Audio API for streaming audio playback
- Tailwind CSS for styling
- WebSocket client for real-time communication

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
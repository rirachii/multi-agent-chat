const { useState, useEffect, useCallback } = React;

const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const length = binaryString.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return { arrayBuffer: bytes.buffer, length };
};

const createAudioBuffer = (arrayBuffer, length) => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const samples = new Float32Array(length);
  const view = new DataView(arrayBuffer);
  
  for (let i = 0; i < length; i++) {
    const value = view.getInt16(i * 2, true);
    samples[i] = value / 32768.0;
  }

  const audioBuffer = audioContext.createBuffer(1, length, 44100);
  audioBuffer.getChannelData(0).set(samples);
  return { audioBuffer, audioContext };
};

const agents = ['agent1', 'agent2'];

function App() {
  const [messages, setMessages] = useState(agents.reduce((acc, a) => ({ ...acc, [a]: [] }), {}));
  const [input, setInput] = useState(agents.reduce((acc, a) => ({ ...acc, [a]: '' }), {}));
  const [websocket, setWebsocket] = useState(null);
  const [audioQueues, setAudioQueues] = useState(agents.reduce((acc, a) => ({ ...acc, [a]: [] }), {}));
  const [playTimes, setPlayTimes] = useState(agents.reduce((acc, a) => ({ ...acc, [a]: 0 }), {}));
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:9000');

    ws.onopen = () => {
      console.log('Connected to server');
      setIsConnected(true);
      setWebsocket(ws);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.error) {
        console.error('Server error:', data.error);
        return;
      }

      const { agentId, audio, status } = data;
      
      if (status === 'finished') {
        console.log(`${agentId} finished speaking`);
      } else if (audio) {
        setAudioQueues(prev => ({
          ...prev,
          [agentId]: [...prev[agentId], audio]
        }));
      }
    };

    ws.onclose = () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    };

    return () => {
      if (ws) ws.close();
    };
  }, []);

  useEffect(() => {
    agents.forEach(agentId => {
      const playAudio = async () => {
        if (audioQueues[agentId].length === 0) return;

        const [base64] = audioQueues[agentId];
        const { arrayBuffer, length } = base64ToArrayBuffer(base64);
        const { audioBuffer, audioContext } = createAudioBuffer(arrayBuffer, length);

        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);

        const now = audioContext.currentTime;
        const playTime = Math.max(now, playTimes[agentId]);
        source.start(playTime);

        setPlayTimes(prev => ({
          ...prev,
          [agentId]: playTime + audioBuffer.duration
        }));

        setAudioQueues(prev => ({
          ...prev,
          [agentId]: prev[agentId].slice(1)
        }));
      };

      playAudio();
    });
  }, [audioQueues, playTimes]);

  const handleSend = (agentId) => {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
      console.error('WebSocket is not connected');
      return;
    }

    const text = input[agentId].trim();
    if (!text) return;

    websocket.send(JSON.stringify({ agentId, text }));
    
    setMessages(prev => ({
      ...prev,
      [agentId]: [...prev[agentId], { text, sender: 'user' }]
    }));
    
    setInput(prev => ({ ...prev, [agentId]: '' }));
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex space-x-4">
        {agents.map((agentId) => (
          <div key={agentId} className="flex-1 p-4 border rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4">{agentId}</h2>
            
            <div className="h-96 overflow-y-auto mb-4 p-2 border rounded">
              {messages[agentId].map((msg, idx) => (
                <div key={idx} className={`mb-2 p-2 rounded ${
                  msg.sender === 'user' ? 'bg-blue-100 ml-auto' : 'bg-gray-100'
                }`}>
                  {msg.text}
                </div>
              ))}
            </div>

            <div className="flex space-x-2">
              <input
                type="text"
                value={input[agentId]}
                onChange={(e) => setInput(prev => ({ ...prev, [agentId]: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSend(agentId)}
                className="flex-1 p-2 border rounded"
                placeholder={`Message ${agentId}...`}
                disabled={!isConnected}
              />
              <button
                onClick={() => handleSend(agentId)}
                disabled={!isConnected}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.render(<App />, document.getElementById('root'));
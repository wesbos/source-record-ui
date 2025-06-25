import { useEffect, useState } from 'react';
import { useOBSStore } from './store/obsStore';
import { Scene } from './components/Scene';
import { StatusBar } from './components/StatusBar';
import './App.css';
import { ConnectionStringInput } from './components/ConnectionStringInput';
import './components/ConnectionStringInput.css';

export function App() {
  const [connectionString, setConnectionString] = useState(localStorage.getItem('obsConnectionString'));
  const [password, setPassword] = useState(localStorage.getItem('obsPassword'));
  const [isConnecting, setIsConnecting] = useState(false);
  const connect = useOBSStore(state => state.connect);
  const fetchScenes = useOBSStore(state => state.fetchScenes);
  const startPolling = useOBSStore(state => state.startPolling);
  const stopPolling = useOBSStore(state => state.stopPolling);
  const isConnected = useOBSStore(state => state.isConnected);
  const scenes = useOBSStore(state => state.scenes);
  const error = useOBSStore(state => state.error);

  useEffect(() => {
    const init = async () => {
      if (connectionString) {
        setIsConnecting(true);
        try {
          await connect(connectionString, password || undefined);
          await fetchScenes();
          startPolling();
        } catch (error) {
          console.error('Failed to initialize:', error);
        } finally {
          setIsConnecting(false);
        }
      }
    };

    init();

    return () => {
      stopPolling();
    };
  }, [connect, fetchScenes, startPolling, stopPolling, connectionString, password]);

  const handleConnect = (newConnectionString: string, newPassword?: string) => {
    localStorage.setItem('obsConnectionString', newConnectionString);
    if (newPassword) {
      localStorage.setItem('obsPassword', newPassword);
    }
    setConnectionString(newConnectionString);
    setPassword(newPassword || null);
  };

  if (isConnecting) {
    return <div className="app-loading">Connecting to OBS...</div>;
  }

  if (!isConnected) {
    return <ConnectionStringInput onConnect={handleConnect} initialConnectionString={connectionString || 'ws://127.0.0.1:4455'} error={error} />;
  }

  return (
    <div className="app">
      <StatusBar />
      {/* <OBSDebugger /> */}
      {/* <OutputList /> */}
      <div className="scenes-grid">
        {scenes.map(scene => (
          <Scene key={scene.sceneName} sceneName={scene.sceneName} />
        ))}
      </div>
      <footer className="app-footer">
        <a
          href="https://github.com/wesbos/source-record-ui"
          target="_blank"
          rel="noopener noreferrer"
          className="github-link"
        >
          Made by Wes Bos ❤️ × Source on GitHub
        </a>
      </footer>
    </div>
  );
}

export default App;

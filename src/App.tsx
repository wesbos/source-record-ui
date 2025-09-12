import { useEffect, useState } from 'react';
import { useOBSStore } from './store/obsStore';
import { StatusBar } from './components/StatusBar';
import './App.css';
import { ConnectionStringInput } from './components/ConnectionStringInput';
import './components/ConnectionStringInput.css';
import { OBSDebugger } from './components/OBSDebugger';
import { MediaItem } from './components/MediaItem';
import { uniqueSceneSources } from './utils/sources';

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
  const sceneSources = useOBSStore(state => state.sceneSources);
  const error = useOBSStore(state => state.error);
  const recordStatus = useOBSStore((state) => state.recordStatus);
  const recordState = useOBSStore((state) => state.recordState);

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

  // Create combined list of scenes and sources
  const sources = uniqueSceneSources(sceneSources);
  const mediaItems = [
    // Add scenes first
    ...scenes.map(scene => ({
      type: 'scene' as const,
      key: `scene-${scene.sceneName}`,
      name: scene.sceneName,
      source: undefined
    })),
    // Add sources second
    ...sources.map(source => ({
      type: 'source' as const,
      key: `source-${source.sourceUuid}`,
      name: source.sourceName,
      source: source
    }))
  ];



  return (
    <div className="app" data-record-state={recordState.outputState}>
      <StatusBar />
      {/* <p className="white">Record Status: {JSON.stringify(recordStatus)}</p>
      <p className="white">Record State: {JSON.stringify(recordState)}</p>
      <OBSDebugger /> */}
      <div className="scenes-grid">
        {mediaItems.map(item => (
          <MediaItem
            key={item.key}
            type={item.type}
            name={item.name}
            source={item.source}
          />
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

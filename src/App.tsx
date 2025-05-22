import { useEffect } from 'react';
import { useOBSStore } from './store/obsStore';
import { Scene } from './components/Scene';
import { StatusBar } from './components/StatusBar';
import { OBSDebugger } from './components/OBSDebugger';
import { OutputList } from './components/OutputList';
import './App.css';
import { RecordButton } from './components/RecordButton';

export function App() {
  const connect = useOBSStore(state => state.connect);
  const fetchScenes = useOBSStore(state => state.fetchScenes);
  const startPolling = useOBSStore(state => state.startPolling);
  const stopPolling = useOBSStore(state => state.stopPolling);
  const isConnected = useOBSStore(state => state.isConnected);
  const scenes = useOBSStore(state => state.scenes);

  useEffect(() => {
    const init = async () => {
      try {
        await connect();
        await fetchScenes();
        startPolling();
      } catch (error) {
        console.error('Failed to initialize:', error);
      }
    };

    init();

    return () => {
      stopPolling();
    };
  }, [connect, fetchScenes, startPolling, stopPolling]);

  if (!isConnected) {
    return <div className="app-error">Not connected to OBS</div>;
  }

  return (
    <div className="app">
      <StatusBar />
      <OBSDebugger />
      {/* <OutputList /> */}
      <div className="scenes-grid">
        {scenes.map(scene => (
          <Scene key={scene.sceneName} sceneName={scene.sceneName} />
        ))}
      </div>
    </div>
  );
}

export default App;

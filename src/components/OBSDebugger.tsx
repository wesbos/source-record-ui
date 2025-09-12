import { useOBSStore } from '../store/obsStore';
import { getOBS } from '../obs';
import './OBSDebugger.css';

export function OBSDebugger() {
  const isConnected = useOBSStore(state => state.isConnected);

  const makeCall = async (method: string, params?: Record<string, any>) => {
    try {
      const obs = getOBS();
      const response = await obs.call(method, params);
      console.log(`OBS Call: ${method}`, response);
    } catch (error) {
      console.error(`Error calling ${method}:`, error);
    }
  };

  if (!isConnected) {
    return <div className="debugger-error">Not connected to OBS</div>;
  }

  return (
    <div className="obs-debugger">
      <h2>OBS Debugger</h2>
      <div className="debug-buttons">
        <button onClick={() => makeCall('GetSourceFilter', {
          sourceName: 'cam-only',
          filterName: 'Source Record'
        })}>
          GetSourceFilter
        </button>
        <button onClick={() => makeCall('GetSourceActive')}>
          GetSourceActive
        </button>
        <button onClick={() => makeCall('GetInputList')}>
          GetInputList
        </button>
        <button onClick={() => makeCall('GetInputKindList')}>
          GetInputKindList
        </button>
        <button onClick={() => makeCall('GetRecordStatus')}>
          GetRecordStatus
        </button>
        <button onClick={() => makeCall('GetLastReplayBufferReplay')}>
          Get Last Replay
        </button>
        <button onClick={() => makeCall('GetOutputList')}>
          GetOutputList
        </button>
        <button onClick={() => makeCall('GetOutputSettings')}>
          Get Output Settings
        </button>
      </div>
    </div>
  );
}

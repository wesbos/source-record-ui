import { useOBSStore } from '../store/obsStore';
import { RecordButton } from './RecordButton';
import './StatusBar.css';

export function StatusBar() {
  const { isConnected, isStreaming, isRecording, isVirtualCamActive } = useOBSStore();

  return (
    <div className="status-bar">
      <div className="status-item">
        <div className={`status-icon connection ${isConnected ? 'active' : 'inactive'}`} />
        <span className="status-label">OBS</span>
      </div>
      <div className="status-item">
        <div className={`status-icon stream ${isStreaming ? 'active' : 'inactive'}`} />
        <span className="status-label">Stream</span>
      </div>
      <div className="status-item">
        <div className={`status-icon record ${isRecording ? 'active' : 'inactive'}`} />
        <span className="status-label">Record</span>
      </div>
      <div className="status-item">
        <div className={`status-icon virtual-cam ${isVirtualCamActive ? 'active' : 'inactive'}`} />
        <span className="status-label">Virtual Cam</span>
      </div>
      <div className="status-item">
        <RecordButton />
      </div>
    </div>
  );
}

import { useOBSStore } from '../store/obsStore';
import { RecordButton } from './RecordButton';
import './StatusBar.css';

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  const pad = (num: number) => num.toString().padStart(2, '0');

  return `${pad(hours)}:${pad(minutes % 60)}:${pad(seconds % 60)}`;
}

function formatFileSize(bytes: number | undefined): string {
  if (bytes === undefined) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatTimecode(timecode: string | undefined): string {
  if (!timecode) return '00:00:00';
  // Remove milliseconds from timecode
  return timecode.split('.')[0];
}

export function StatusBar() {
  const { isConnected, isStreaming, recordState, isVirtualCamActive } = useOBSStore();

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
        <div className={`status-icon record ${recordState?.outputActive ? 'active' : 'inactive'}`} />
        <span className="status-label">Record</span>
        {recordState?.outputActive && (
          <div className="record-details">
            <span className="record-time">{formatTimecode(recordState.outputTimecode)}</span>
            <span className="record-size">{formatFileSize(recordState.outputBytes)}</span>
          </div>
        )}
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

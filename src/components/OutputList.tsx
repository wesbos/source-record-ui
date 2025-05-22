import { useOBSStore } from '../store/obsStore';
import './OutputList.css';

interface OutputFlags {
  OBS_OUTPUT_VIDEO: boolean;
  OBS_OUTPUT_AUDIO: boolean;
  OBS_OUTPUT_ENCODED: boolean;
  OBS_OUTPUT_MULTI_TRACK: boolean;
  OBS_OUTPUT_SERVICE: boolean;
}

interface OutputProps {
  outputName: string;
  outputType: string;
  outputWidth: number;
  outputHeight: number;
  outputFlags: OutputFlags;
  outputActive: boolean;
}

export function Output({ output }: { output: OutputProps }) {
  const renderFlags = (flags: OutputFlags) => {
    return Object.entries(flags)
      .filter(([_, value]) => value)
      .map(([key]) => key.replace('OBS_OUTPUT_', ''))
      .join(', ');
  };

  return (
    <div className={`output-item ${!output.outputActive ? 'inactive' : ''}`}>
      <div className="output-header">
        <div className="output-title">
          <span className="output-name">{output.outputName}</span>
          {output.outputActive && <span className="active-indicator" />}
        </div>
        <span className="output-type">{output.outputType}</span>
      </div>
      <div className="output-details">
        <div>Dimensions: {output.outputWidth}x{output.outputHeight}</div>
        <div>Flags: {renderFlags(output.outputFlags)}</div>
      </div>
    </div>
  );
}

export function OutputList() {
  const outputs = useOBSStore(state => state.outputs);

  if (outputs.length === 0) {
    return null;
  }

  return (
    <div className="output-list">
      <h2>OBS Outputs</h2>
      <div className="output-grid">
        {outputs.map((output) => (
          <Output key={output.outputName} output={output} />
        ))}
      </div>
    </div>
  );
}

import { getOBS } from "../obs";
import { useOBSStore } from "../store/obsStore";
import './RecordButton.css';

const obs = getOBS();

interface Filter {
  filterName: string;
  filterKind: string;
  filterEnabled: boolean;
}



export function RecordButton() {
  const recordStatus = useOBSStore(state => state.recordStatus);
  const recordState = useOBSStore(state => state.recordState);
  const filters = useOBSStore(state => state.sceneFilters);
  const scenesorSourcesWithRecordFilter = Object.values(filters).flat().filter(filter =>
    filter.filterKind === 'source_record_filter' && filter.filterEnabled
  );


  return (
    <div className="record-buttons">
      {!recordState?.outputState || recordState?.outputState === "OBS_WEBSOCKET_OUTPUT_STOPPED" ? (
        <button
          className="record-button start"
          onClick={async () => {
            try {
              console.info(
                `Starting recording for ${scenesorSourcesWithRecordFilter.length} scenes`
              );
              for (const sourceName in filters) {
                for (const filter of filters[sourceName]) {
                  if (filter.filterKind !== "source_record_filter") continue;
                  const filterName = `Source Record - ${sourceName}`;
                  const filename = `%CCYY-%MM-%DD %I %mm %ss %p/${sourceName}`;

                  if (filter.filterName !== filterName) {
                    await obs.call("SetSourceFilterName", {
                      sourceName: sourceName,
                      filterName: filter.filterName,
                      newFilterName: filterName,
                    });
                  }

                  await obs.call("SetSourceFilterSettings", {
                    sourceName: sourceName,
                    filterName,
                    overlay: true,
                    filterSettings: { filename_formatting: filename },
                  });
                }
              }
              await obs.call("StartRecord");
            } catch (error) {
              console.error("Failed to start recording:", error);
            }
          }}
          title={`Start Recording (${scenesorSourcesWithRecordFilter.length} scenes)`}
        >
          Start Recording ({scenesorSourcesWithRecordFilter.length} sources)
        </button>
      ) : (
        <button
          className="record-button stop"
          onClick={async () => {
            try {
              await obs.call("StopRecord");
            } catch (error) {
              console.error("Failed to stop recording:", error);
            }
          }}
          title="Stop Recording"
          disabled={recordState.outputState === "OBS_WEBSOCKET_OUTPUT_STOPPING"}
        >
          {recordState.outputState === "OBS_WEBSOCKET_OUTPUT_STOPPING" && "Stopping..."}
          {recordState.outputState === "OBS_WEBSOCKET_OUTPUT_STOPPED" && "Stopped"}
          {recordState.outputState === "OBS_WEBSOCKET_OUTPUT_PAUSED" && "Paused"}
          {recordState.outputState === "OBS_WEBSOCKET_OUTPUT_RESUMED" && "Resumed"}
          {recordState.outputState === "OBS_WEBSOCKET_OUTPUT_STARTED" && "Stop Recording"}
        </button>
      )}
    </div>
  );
}

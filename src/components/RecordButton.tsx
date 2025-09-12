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
  const { recordState } = useOBSStore();
  const filters = useOBSStore(state => state.sceneFilters);
  const scenesWithRecordFilter = Object.values(filters).flat().filter(filter =>
    filter.filterKind === 'source_record_filter' && filter.filterEnabled
  );

  return (
    <div className="record-buttons">
      {!recordState?.outputActive ? (
        <button
          className="record-button start"
          onClick={async () => {
            try {
              console.info(`Starting recording for ${scenesWithRecordFilter.length} scenes`);
              for (const sceneName in filters) {
                for (const filter of filters[sceneName]) {
                  if (filter.filterKind !== 'source_record_filter') continue;
                  const filterName = `Source Record - ${sceneName}`;
                  const filename = `%CCYY-%MM-%DD %I %mm %ss %p/${sceneName}`;

                  if (filter.filterName !== filterName) {
                    await obs.call('SetSourceFilterName', {
                      sourceName: sceneName,
                      filterName: filter.filterName,
                      newFilterName: filterName
                    });
                  }

                  await obs.call('SetSourceFilterSettings', {
                    sourceName: sceneName,
                    filterName: filter.filterName,
                    overlay: true,
                    filterSettings: { filename_formatting: filename }
                  });
                }
              }
              await obs.call('StartRecord');
            } catch (error) {
              console.error('Failed to start recording:', error);
            }
          }}
          title={`Start Recording (${scenesWithRecordFilter.length} scenes)`}
        >
          Start Recording ({scenesWithRecordFilter.length} sources)
        </button>
      ) : (
        <button
          className="record-button stop"
          onClick={async () => {
            try {
              await obs.call('StopRecord');
            } catch (error) {
              console.error('Failed to stop recording:', error);
            }
          }}
          title="Stop Recording"
        >
          Stop Recording
        </button>
      )}
    </div>
  );
}

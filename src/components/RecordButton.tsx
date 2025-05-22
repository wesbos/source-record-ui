import { getOBS } from "../obs";
import { useOBSStore } from "../store/obsStore";

const obs = getOBS();

async function prepareRecord(filters: Record<string, Filter[]>) {
  // loop over every scene, and then each filter inside that scene. Set the filter name and the recording output filename to be that of the scene name.
  for (const sceneName in filters) {
    console.info(`Processing scene ${sceneName}`);
    for (const filter of filters[sceneName]) {
      console.group(`Processing filter ${filter.filterName}`);
      if (filter.filterKind !== 'source_record_filter') return;
      console.info(`Setting filter name and recording output filename to ${sceneName}`);
      const filterName = `Source Record - ${sceneName}`;
      const filename = `%CCYY-%MM-%DD %I %mm %ss %p/${sceneName}`;

      if (filter.filterName !== filterName) {
        console.log(`Setting filter name to ${filterName}`);
        await obs.call('SetSourceFilterName', {
          sourceName: sceneName,
          filterName: filter.filterName,
          newFilterName: filterName
        });
      } else {
        console.log(`Filter name is already set to ${filterName}, skipping`);
      }
      console.log(`Setting recording output filename to ${filename}`);
      await obs.call('SetSourceFilterSettings', {
        sourceName: sceneName,
        filterName: filter.filterName,
        overlay: true,
        filterSettings: {
          filename_formatting: filename
        }
      });
      console.groupEnd();
    }
  }
  obs.call('StartRecord');
}

export function RecordButton() {
  const obs = getOBS();
  // Find every Scene with a source record filter on it.
  // const scenes = useOBSStore(state => state.scenes);
  const filters = useOBSStore(state => state.sceneFilters);

  // const scenesWithRecordFilter = scenes.filter(scene => {
  //   const sceneFilters = filters[scene.sceneName];
  //   return sceneFilters.some(filter => filter.filterKind === 'source_record_filter');
  // });
  const scenesWithRecordFilter = Object.values(filters).flat().filter(filter => filter.filterKind === 'source_record_filter' && filter.filterEnabled);
  return <>
    <button onClick={() => prepareRecord(filters)}>Record {scenesWithRecordFilter.length} scenes</button>
    <button onClick={() => obs.call('StopRecord')}>Stop</button>
  </>
}

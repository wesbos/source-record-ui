import { useOBSStore } from "../store/obsStore";
import { uniqueSceneSources } from "../utils/sources";
import { MediaItem } from "./MediaItem";

function useSceneSources() {
  // grab all scene sources from the store
  const sceneSources = useOBSStore((state) => state.sceneSources);
  // flatten the scene sources
  return uniqueSceneSources(sceneSources);
}

export function Sources() {
  const sceneSources = useSceneSources();
  console.log(sceneSources);
  return (
    <div className="scenes-grid sources-grid" style={{ background: "white" }}>
      <h2 className="sources-title">Sources</h2>
      {sceneSources.map((source) => (
        <MediaItem
          key={source.sourceUuid}
          type="source"
          name={source.sourceName}
          source={source}
        />
      ))}
    </div>
  );
}

import { Source, useOBSStore } from "../store/obsStore";
import { Filters, getSourceIcon } from "./Scene";
import { uniqueSceneSources } from "../utils/sources";

function useSceneSources() {
  // grab all scene sources from the store
  const sceneSources = useOBSStore((state) => state.sceneSources);
  // flatten the scene sources
  return uniqueSceneSources(sceneSources);
}

function Preview({ source }: { source: Source }) {
  const previews = useOBSStore((state) => state.scenePreviews);
  return (
    <img src={previews[source.sourceName]} alt={`${source.sourceName} preview`} className="source-preview" />
  );
}

export function Sources() {
  const sceneSources = useSceneSources();
  console.log(sceneSources);
  return (
    <div className="scenes-grid sources-grid" style={{ background: "white" }}>
      <h2>Sources</h2>
      {sceneSources.map((source) => (
        <div className="scene" key={source.sourceUuid}>
          <h3>
            <Preview source={source} />
            <img
              src={getSourceIcon(source.inputKind)}
              alt={`${source.inputKind} icon`}
              className="source-icon"
            />
            {source.sourceName}
          </h3>
          <Filters sourceName={source.sourceName} />
        </div>
      ))}
    </div>
  );
}

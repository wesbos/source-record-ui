import { useOBSStore } from "../store/obsStore";
import "./Scene.css";
import { getOBS } from "../obs";
import { MediaItem } from "./MediaItem";

interface SceneProps {
  sceneName: string;
}

export function Filters({ sourceName }: { sourceName: string }) {
  const obs = getOBS();
  const sceneFilters = useOBSStore(state => state.sceneFilters);
  const filters = sceneFilters[sourceName] || [];
  return (
    <ul className="filter-list">
      {filters.map((filter) => (
        <li key={filter.filterName} className="filter-item">
          <span className="filter-name">{filter.filterName}</span>
          <button
            className={`filter-enabled ${
              filter.filterEnabled ? "active" : "inactive"
            }`}
            onClick={() => {
              obs.call("SetSourceFilterEnabled", {
                sourceName,
                filterName: filter.filterName,
                filterEnabled: !filter.filterEnabled,
              });
            }}
          >
            {filter.filterEnabled ? "Enabled" : "Disabled"}
          </button>
          {/* <pre>{JSON.stringify(filter, null, 2)}</pre> */}
        </li>
      ))}
    </ul>
  );
}

export function Scene({ sceneName }: SceneProps) {
  return <MediaItem type="scene" name={sceneName} />;
}

// Re-export utilities for backwards compatibility
export { getSourceIcon } from "../utils/scene";
export type { InputKind } from "../utils/scene";
export { Preview } from "./Preview";

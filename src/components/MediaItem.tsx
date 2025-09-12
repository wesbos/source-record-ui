import { Source, useOBSStore } from "../store/obsStore";
import { Output } from "./OutputList";
import { Filters } from "./Scene";
import { Preview } from "./Preview";
import { getSourceIcon, InputKind } from "../utils/scene";

interface SourceWithInputKind extends Source {
  inputKind: InputKind;
}

interface MediaItemProps {
  type: 'scene' | 'source';
  name: string;
  source?: Source; // Only provided when type is 'source'
}

export function MediaItem({ type, name, source }: MediaItemProps) {
  const sceneFilters = useOBSStore(state => state.sceneFilters);
  const sceneSources = useOBSStore(state => state.sceneSources);
  const error = useOBSStore(state => state.error);

  const filters = sceneFilters[name] || [];
  const sources = type === 'scene' ? (sceneSources[name] || []) : [];

  // Find outputs that match the name of filters applied to this item. Usually this is one, but can be more.
  const outputs = useOBSStore((state) => state.outputs).filter((output) =>
    filters.some((filter) => filter.filterName === output.outputName)
  );

  if (error) {
    return <div className="scene-error">{error}</div>;
  }

  return (
    <div className="scene">
      <Preview sourceName={name} />
      <div className="scene-content">
        <div className="scene-sources">
          <h3>
            {type === 'source' && source && (
              <img
                src={getSourceIcon(source.inputKind as InputKind)}
                alt={`${source.inputKind} icon`}
                className="source-icon"
              />
            )}
            <span className="source-name">{name}</span>
            <span className="light">[{type}]</span>
          </h3>

          {sources && (
            <ul className="source-list">
              {sources.map((sceneSource) => {
                const sourceWithKind = sceneSource as SourceWithInputKind;
                return (
                  <li key={sceneSource.sourceUuid} className="source-item">
                    <img
                      src={getSourceIcon(sourceWithKind.inputKind)}
                      alt={`${sourceWithKind.inputKind} icon`}
                      className="source-icon"
                    />
                    <span className="source-name">{sceneSource.sourceName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="scene-filters">
          <Filters sourceName={name} />
        </div>

        {type === 'scene' && outputs.map((output) => (
          <Output key={output.outputName} output={output} />
        ))}
      </div>
    </div>
  );
}

import { useEffect } from 'react';
import { useOBSStore } from '../store/obsStore';
import './Scene.css';
import { Output } from './OutputList';
import { getOBS } from '../obs';

interface SceneProps {
  sceneName: string;
}

export function Scene({ sceneName }: SceneProps) {
  const obs = getOBS();

  const {
    sceneFilters,
    scenePreviews,
    sceneSources,
    error,
    fetchSceneFilters,
    fetchScenePreview
  } = useOBSStore();




  useEffect(() => {
    const init = async () => {
      try {
        await Promise.all([
          fetchSceneFilters(sceneName),
          fetchScenePreview(sceneName)
        ]);
      } catch (err) {
        console.error(`Failed to initialize scene ${sceneName}:`, err);
      }
    };

    init();
  }, [sceneName, fetchSceneFilters, fetchScenePreview]);

  const filters = sceneFilters[sceneName] || [];
  const previewUrl = scenePreviews[sceneName] || null;
  const sources = sceneSources[sceneName] || [];
  // Find outputs that match the name of filters applied to this scene. Usually this is one, but can be more.
  const outputs = useOBSStore(state => state.outputs).filter(output => filters.some(filter => filter.filterName === output.outputName));

  if (error) {
    return <div className="scene-error">{error}</div>;
  }

  return (
    <div className="scene">
      <h2 className="scene-title">{sceneName}</h2>
      {previewUrl && (
        <div className="scene-preview">
          <img src={previewUrl} alt={`Preview of ${sceneName}`} />
        </div>
      )}
      <div className="scene-content">
        <div className="scene-sources">
          <h3>Sources</h3>
          <ul className="source-list">
            {sources.map((source) => (
              <li key={source.sourceId} className="source-item">
                <span className="source-name">{source.sourceName}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="scene-filters">
          <h3>Filters</h3>
          <ul className="filter-list">
            {filters.map((filter) => (
              <li key={filter.filterName} className="filter-item">
                <span className="filter-name">{filter.filterName}</span>
                <button className={`filter-enabled ${filter.filterEnabled ? 'active' : 'inactive'}`}
                  onClick={() => {
                    obs.call('SetSourceFilterEnabled', {
                      sourceName: sceneName,
                      filterName: filter.filterName,
                      filterEnabled: !filter.filterEnabled
                    });
                  }}
                >
                  {filter.filterEnabled ? 'Enabled' : 'Disabled'}
                </button>
                {/* <pre>{JSON.stringify(filter, null, 2)}</pre> */}
              </li>
            ))}
          </ul>
        </div>
        {outputs.map(output => <Output key={output.outputName} output={output} />)}
      </div>
    </div>
  );
}

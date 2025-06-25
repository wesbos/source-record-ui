import { useEffect } from 'react';
import { useOBSStore } from '../store/obsStore';
import './Scene.css';
import { Output } from './OutputList';
import { getOBS } from '../obs';

// Import source icons
import brushIcon from '../assets/sources/brush.svg';
import cameraIcon from '../assets/sources/camera.svg';
import defaultIcon from '../assets/sources/default.svg';
import globeIcon from '../assets/sources/globe.svg';
import imageIcon from '../assets/sources/image.svg';
import mediaIcon from '../assets/sources/media.svg';
import microphoneIcon from '../assets/sources/microphone.svg';
import slideshowIcon from '../assets/sources/slideshow.svg';
import textIcon from '../assets/sources/text.svg';
import windowIcon from '../assets/sources/window.svg';
import windowaudioIcon from '../assets/sources/windowaudio.svg';

interface SceneProps {
  sceneName: string;
}

interface SourceWithInputKind {
  sourceId: number;
  sourceName: string;
  inputKind: string;
}

// Function to get the appropriate icon for a source type
function getSourceIcon(inputKind: string): string {
  const iconMap: Record<string, string> = {
    'image_source': imageIcon,
    'color_source_v3': brushIcon,
    'slideshow_v2': slideshowIcon,
    'av_capture_input_v2': cameraIcon,
    'macos-avcapture': cameraIcon,
    'macos-avcapture-fast': cameraIcon,
    'screen_capture': windowIcon,
    'sck_audio_capture': microphoneIcon,
    'display_capture': windowIcon,
    'window_capture': windowIcon,
    'coreaudio_input_capture': microphoneIcon,
    'coreaudio_output_capture': windowaudioIcon,
    'syphon-input': windowIcon,
    'browser_source': globeIcon,
    'ffmpeg_source': mediaIcon,
    'text_ft2_source_v2': textIcon,
  };

  return iconMap[inputKind] || defaultIcon;
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
  console.log(sources);
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
                                                {sources.map((source) => {
              const sourceWithKind = source as SourceWithInputKind;
              return (
                <li key={source.sourceId} className="source-item">
                  <img
                    src={getSourceIcon(sourceWithKind.inputKind)}
                    alt={`${sourceWithKind.inputKind} icon`}
                    className="source-icon"
                  />
                  <span className="source-name">{source.sourceName}</span>
                </li>
              );
            })}
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

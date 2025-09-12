import { useEffect } from "react";
import { Source, useOBSStore } from "../store/obsStore";
import "./Scene.css";
import { Output } from "./OutputList";
import { getOBS } from "../obs";

// Import source icons
import brushIcon from "../assets/sources/brush.svg";
import cameraIcon from "../assets/sources/camera.svg";
import defaultIcon from "../assets/sources/default.svg";
import globeIcon from "../assets/sources/globe.svg";
import imageIcon from "../assets/sources/image.svg";
import mediaIcon from "../assets/sources/media.svg";
import microphoneIcon from "../assets/sources/microphone.svg";
import slideshowIcon from "../assets/sources/slideshow.svg";
import textIcon from "../assets/sources/text.svg";
import windowIcon from "../assets/sources/window.svg";
import windowaudioIcon from "../assets/sources/windowaudio.svg";

interface SceneProps {
  sceneName: string;
}

type InputKind = 'image_source' | 'color_source_v3' | 'slideshow_v2' | 'av_capture_input_v2' | 'macos-avcapture' | 'macos-avcapture-fast' | 'screen_capture' | 'sck_audio_capture' | 'display_capture' | 'window_capture' | 'coreaudio_input_capture' | 'coreaudio_output_capture' | 'syphon-input' | 'browser_source' | 'ffmpeg_source' | 'text_ft2_source_v2';

interface SourceWithInputKind extends Source {
  inputKind: InputKind;
}

// Function to get the appropriate icon for a source type
export function getSourceIcon(inputKind: InputKind): string {
  const iconMap: Record<InputKind, string> = {
    image_source: imageIcon,
    color_source_v3: brushIcon,
    slideshow_v2: slideshowIcon,
    av_capture_input_v2: cameraIcon,
    "macos-avcapture": cameraIcon,
    "macos-avcapture-fast": cameraIcon,
    screen_capture: windowIcon,
    sck_audio_capture: microphoneIcon,
    display_capture: windowIcon,
    window_capture: windowIcon,
    coreaudio_input_capture: microphoneIcon,
    coreaudio_output_capture: windowaudioIcon,
    "syphon-input": windowIcon,
    browser_source: globeIcon,
    ffmpeg_source: mediaIcon,
    text_ft2_source_v2: textIcon,
  };

  return iconMap[inputKind] || defaultIcon;
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
  const sceneFilters = useOBSStore(state => state.sceneFilters);
  const scenePreviews = useOBSStore(state => state.scenePreviews);
  const sceneSources = useOBSStore(state => state.sceneSources);
  const error = useOBSStore(state => state.error);


  const filters = sceneFilters[sceneName] || [];
  const previewUrl = scenePreviews[sceneName] || null;
  const sources = sceneSources[sceneName] || [];
  // Find outputs that match the name of filters applied to this scene. Usually this is one, but can be more.
  const outputs = useOBSStore((state) => state.outputs).filter((output) =>
    filters.some((filter) => filter.filterName === output.outputName)
  );

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
            {sources.map((source) => {
              const sourceWithKind = source as SourceWithInputKind;
              return (
                <li key={source.sourceUuid} className="source-item">
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
          <Filters sourceName={sceneName} />
        </div>
        {outputs.map((output) => (
          <Output key={output.outputName} output={output} />
        ))}
      </div>
    </div>
  );
}

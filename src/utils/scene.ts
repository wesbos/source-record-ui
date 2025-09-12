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

export type InputKind = 'image_source' | 'color_source_v3' | 'slideshow_v2' | 'av_capture_input_v2' | 'macos-avcapture' | 'macos-avcapture-fast' | 'screen_capture' | 'sck_audio_capture' | 'display_capture' | 'window_capture' | 'coreaudio_input_capture' | 'coreaudio_output_capture' | 'syphon-input' | 'browser_source' | 'ffmpeg_source' | 'text_ft2_source_v2';

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

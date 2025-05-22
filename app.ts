import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';

const obs = new OBSWebSocket();

const connection = await obs.connect('ws://127.0.0.1:4455', undefined, {
  eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters,
  rpcVersion: 1
});

obs.on('SourceFilterEnableStateChanged', (data) => {
  console.log('SourceFilterEnableStateChanged');
  console.log(data);
});


// https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#requests
const sceneList = await obs.call('GetSceneList');


for (const scene of sceneList.scenes) {
  const sourceFilters = await obs.call('GetSourceFilterList', {
    sourceName: scene.sceneName
  });
  const preview = await obs.call('GetSourceScreenshot', {
    sourceName: scene.sceneName,
    imageFormat: 'png',
    imageWidth: 1920,
    imageHeight: 1080
  });

  const previewUrl = `data:image/png;base64,${preview.imageData}`;

  console.log(previewUrl);
}


console.log(sourceFilters);

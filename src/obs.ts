import OBSWebSocket, { EventSubscription } from 'obs-websocket-js';

let obs: OBSWebSocket | null = null;
let isConnected = false;
let connectPromise: Promise<OBSWebSocket> | null = null;

export function getOBS(): OBSWebSocket {
  if (!obs) {
    obs = new OBSWebSocket();
  }
  return obs;
}

export async function connectOBS(connectionString: string, password?: string): Promise<OBSWebSocket> {
  if (isConnected && obs) {
    return obs;
  }
  if (connectPromise) {
    return connectPromise;
  }
  obs = getOBS();
  connectPromise = obs.connect(connectionString, password, {
    eventSubscriptions: EventSubscription.All | EventSubscription.InputVolumeMeters,
    rpcVersion: 1
  })
    .then(() => {
      isConnected = true;
      return obs!;
    })
    .catch((err) => {
      isConnected = false;
      connectPromise = null;
      throw err;
    });
  return connectPromise;
}

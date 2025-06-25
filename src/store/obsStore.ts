import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { connectOBS, getOBS } from '../obs';
import { SceneItem, Filter, SceneListResponse, SourceFilterListResponse, SourceScreenshotResponse } from '../types/obs';

interface Source {
  sourceName: string;
  sourceType: string;
  sourceWidth: number;
  sourceHeight: number;
  sourceId: number;
}

interface Output {
  outputName: string;
  outputType: string;
  outputWidth: number;
  outputHeight: number;
  outputFlags: number;
}

interface RecordState {
  outputActive: boolean;
  outputPaused: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
}

interface OBSState {
  scenes: SceneItem[];
  sceneFilters: Record<string, Filter[]>;
  scenePreviews: Record<string, string>;
  sceneSources: Record<string, Source[]>;
  outputs: Output[];
  error: string | null;
  isConnected: boolean;
  isPolling: boolean;
  isStreaming: boolean;
  recordState: RecordState;
  isVirtualCamActive: boolean;

  // Actions
  connect: (connectionString: string, password?: string) => Promise<void>;
  fetchScenes: () => Promise<void>;
  fetchSceneFilters: (sceneName: string) => Promise<void>;
  fetchScenePreview: (sceneName: string) => Promise<void>;
  fetchSceneSources: (sceneName: string) => Promise<void>;
  fetchOutputs: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
  setError: (error: string | null) => void;
}

let pollingInterval: NodeJS.Timeout | null = null;
let recordStatusInterval: NodeJS.Timeout | null = null;

export const useOBSStore = create<OBSState>()(
  devtools(
    (set, get) => ({
      scenes: [],
      sceneFilters: {},
      scenePreviews: {},
      sceneSources: {},
      outputs: [],
      error: null,
      isConnected: false,
      isPolling: false,
      isStreaming: false,
      recordState: {
        outputActive: false,
        outputPaused: false,
        outputTimecode: '',
        outputDuration: 0,
        outputBytes: 0
      },
      isVirtualCamActive: false,

      connect: async (connectionString: string, password?: string) => {
        try {
          await connectOBS(connectionString, password);
          const obs = getOBS();

          // Set up global event listeners
          obs.on('SceneListChanged', (data) => {
            set({ scenes: data.scenes as SceneItem[] }, false, 'SceneListChanged');
          });


          const filterEvents = [
            'SourceFilterListReindexed',
            'SourceFilterCreated',
            'SourceFilterRemoved',
            'SourceFilterNameChanged',
            'SourceFilterSettingsChanged',
            'SourceFilterEnableStateChanged'
          ];

          filterEvents.forEach(event => {
            obs.on(event, (data) => {
              get().fetchSceneFilters(data.sourceName);
            });
          });

          // Add source change listener
          obs.on('SceneItemAdded', async (data) => {
            await get().fetchSceneSources(data.sceneName);
          });

          obs.on('SceneItemRemoved', async (data) => {
            await get().fetchSceneSources(data.sceneName);
          });

          // Add status event listeners
          obs.on('StreamStateChanged', (data) => {
            set({ isStreaming: data.outputActive }, false, 'StreamStateChanged');
          });

          obs.on('RecordStateChanged', (data) => {
            set({ recordState: data }, false, 'RecordStateChanged');
          });

          obs.on('RecordStateChanged', (data) => {
            console.info(`Record file changed:`, data);
          });

          obs.on('VirtualcamStateChanged', (data) => {
            set({ isVirtualCamActive: data.outputActive }, false, 'VirtualcamStateChanged');
          });

          // Get initial states
          const [streamState, recordState, virtualCamState] = await Promise.all([
            obs.call('GetStreamStatus'),
            obs.call('GetRecordStatus'),
            obs.call('GetVirtualCamStatus')
          ]);

          set({
            isConnected: true,
            error: null,
            isStreaming: streamState.outputActive,
            recordState,
            isVirtualCamActive: virtualCamState.outputActive
          }, false, 'Connected');

        } catch (error: any) {
          set({ error: error.message || 'Failed to connect to OBS', isConnected: false }, false, 'ConnectionError');
          throw error;
        }
      },

      fetchScenes: async () => {
        try {
          const obs = getOBS();
          const sceneList = await obs.call('GetSceneList') as unknown as SceneListResponse;
          set({ scenes: sceneList.scenes, error: null }, false, 'FetchedScenes');

          // Fetch sources for each scene
          await Promise.all(
            sceneList.scenes.map(scene => get().fetchSceneSources(scene.sceneName))
          );
        } catch (error) {
          set({ error: 'Failed to fetch scenes' }, false, 'FetchScenesError');
          throw error;
        }
      },

      fetchSceneFilters: async (sceneName: string) => {
        try {
          const obs = getOBS();
          const response = await obs.call('GetSourceFilterList', {
            sourceName: sceneName
          }) as unknown as SourceFilterListResponse;

          set((state) => ({
            sceneFilters: {
              ...state.sceneFilters,
              [sceneName]: response.filters
            },
            error: null
          }), false, `FetchedFilters_${sceneName}`);
        } catch (error) {
          set({ error: `Failed to fetch filters for ${sceneName}` }, false, `FetchFiltersError_${sceneName}`);
          throw error;
        }
      },

      fetchScenePreview: async (sceneName: string) => {
        try {
          const obs = getOBS();
          const preview = await obs.call('GetSourceScreenshot', {
            sourceName: sceneName,
            imageFormat: 'png',
            imageWidth: Math.floor(1920 / 4),
            imageHeight: Math.floor(1080 / 4)
          }) as unknown as SourceScreenshotResponse;

          set((state) => ({
            scenePreviews: {
              ...state.scenePreviews,
              [sceneName]: preview.imageData
            },
            error: null
          }), false, `FetchedPreview_${sceneName}`);
        } catch (error) {
          set({ error: `Failed to fetch preview for ${sceneName}` }, false, `FetchPreviewError_${sceneName}`);
          throw error;
        }
      },

      fetchSceneSources: async (sceneName: string) => {
        try {
          const obs = getOBS();
          const response = await obs.call('GetSceneItemList', {
            sceneName
          });

          set((state) => ({
            sceneSources: {
              ...state.sceneSources,
              [sceneName]: response.sceneItems
            },
            error: null
          }), false, `FetchedSources_${sceneName}`);
        } catch (error) {
          set({ error: `Failed to fetch sources for ${sceneName}` }, false, `FetchSourcesError_${sceneName}`);
          throw error;
        }
      },

      fetchOutputs: async () => {
        try {
          const obs = getOBS();
          const response = await obs.call('GetOutputList');
          set({ outputs: response.outputs, error: null }, false, 'FetchedOutputs');
        } catch (error) {
          set({ error: 'Failed to fetch outputs' }, false, 'FetchOutputsError');
          throw error;
        }
      },

      startPolling: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
        }
        if (recordStatusInterval) {
          clearInterval(recordStatusInterval);
        }

        const poll = async () => {
          const state = get();
          if (!state.isConnected) return;

          try {
            // TODO: use Batching https://github.com/obsproject/obs-websocket/blob/master/docs/generated/protocol.md#requestbatchexecutiontype
            await Promise.all([
              ...state.scenes.map(scene =>
                state.fetchScenePreview(scene.sceneName)
              ),
              state.fetchOutputs()
            ]);
          } catch (error) {
            console.error('Polling error:', error);
          }
        };

        const pollRecordStatus = async () => {
          const state = get();
          if (!state.isConnected) return;

          try {
            const obs = getOBS();
            const recordState = await obs.call('GetRecordStatus');
            set({ recordState }, false, 'PolledRecordStatus');
          } catch (error) {
            console.error('Record status polling error:', error);
          }
        };

        // Initial polls
        poll();
        pollRecordStatus();

        // Set up intervals
        pollingInterval = setInterval(poll, 33);
        recordStatusInterval = setInterval(pollRecordStatus, 1000);
        set({ isPolling: true }, false, 'StartedPolling');
      },

      stopPolling: () => {
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        if (recordStatusInterval) {
          clearInterval(recordStatusInterval);
          recordStatusInterval = null;
        }
        set({ isPolling: false }, false, 'StoppedPolling');
      },

      setError: (error: string | null) => set({ error }, false, 'SetError')
    }),
    {
      name: 'OBS Store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);

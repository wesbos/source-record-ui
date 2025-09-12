import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { connectOBS, getOBS } from '../obs';
import { SceneItem, Filter, SceneListResponse, SourceFilterListResponse, SourceScreenshotResponse } from '../types/obs';
import { RequestBatchRequest } from 'obs-websocket-js';
import { uniqueSceneSources } from '../utils/sources';

export interface Source {
  sourceName: string;
  sourceType: string;
  sourceWidth: number;
  sourceHeight: number;
  sourceUuid: string;
  inputKind: string;
}

interface OutputFlags {
  OBS_OUTPUT_VIDEO: boolean;
  OBS_OUTPUT_AUDIO: boolean;
  OBS_OUTPUT_ENCODED: boolean;
  OBS_OUTPUT_MULTI_TRACK: boolean;
  OBS_OUTPUT_SERVICE: boolean;
}

interface Output {
  outputName: string;
  outputType: string;
  outputWidth: number;
  outputHeight: number;
  outputFlags: OutputFlags;
  outputActive: boolean;
}

type OBS_OUTPUT_STATE =
  | "OBS_WEBSOCKET_OUTPUT_STARTING"
  | "OBS_WEBSOCKET_OUTPUT_STARTED"
  | "OBS_WEBSOCKET_OUTPUT_STOPPING"
  | "OBS_WEBSOCKET_OUTPUT_STOPPED"
  | "OBS_WEBSOCKET_OUTPUT_PAUSED"
  | "OBS_WEBSOCKET_OUTPUT_RESUMED";

interface RecordStatus {
  outputActive: boolean;
  outputPaused: boolean;
  outputTimecode: string;
  outputDuration: number;
  outputBytes: number;
}

interface RecordState {
  outputState: OBS_OUTPUT_STATE;
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
  recordStatus: RecordStatus;
  isVirtualCamActive: boolean;

  // Actions
  connect: (connectionString: string, password?: string) => Promise<void>;
  fetchScenes: () => Promise<void>;
  fetchSceneFilters: (sourceNames: string[]) => Promise<void>;
  fetchScenePreview: (sourceNames: string[]) => Promise<void>;
  fetchSceneSources: (sceneNames: string[]) => Promise<void>;
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
        outputState: undefined
      },
      recordStatus: {
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
              console.debug(event, data);
              get().fetchSceneFilters([data.sourceName]);
            });
          });

          // Add source change listener
          obs.on('SceneItemCreated', async (data) => {
            console.debug('SceneItemAdded', data);
            await get().fetchSceneSources([data.sceneName]);
          });

          obs.on('SceneItemRemoved', async (data) => {
            console.debug('SceneItemRemoved', data);
            await get().fetchSceneSources([data.sceneName]);
          });

          // Add status event listeners
          obs.on('StreamStateChanged', (data) => {
            console.debug('StreamStateChanged', data);
            set({ isStreaming: data.outputActive }, false, 'StreamStateChanged');
          });

          obs.on('RecordStateChanged', (data) => {
            console.debug('RecordStateChanged', data);
            set({ recordState: data }, false, 'RecordStateChanged');
          });

          obs.on('VirtualcamStateChanged', (data) => {
            console.debug('VirtualcamStateChanged', data);
            set({ isVirtualCamActive: data.outputActive }, false, 'VirtualcamStateChanged');
          });

          // Get initial states. TODO Batch this instead of three calls
          const [streamState, recordStatus, virtualCamState] = await Promise.all([
            obs.call('GetStreamStatus'),
            obs.call('GetRecordStatus'),
            obs.call('GetVirtualCamStatus')
          ]);

          set({
            isConnected: true,
            error: null,
            isStreaming: streamState.outputActive,
            recordStatus,
            isVirtualCamActive: virtualCamState.outputActive
          }, false, 'Connected');

        } catch (error: any) {
          set({ error: error.message || 'Failed to connect to OBS', isConnected: false }, false, 'ConnectionError');
          throw error;
        }
      },

      fetchScenes: async () => {
        console.debug('Fetching scenes');
        try {
          const obs = getOBS();
          const sceneList = await obs.call('GetSceneList') as unknown as SceneListResponse;
          set({ scenes: sceneList.scenes, error: null }, false, 'FetchedScenes');

          // Fetch sources + filters for all scenes in batch. This usually happens on initial load and then we only listen for changes scene-by-scene.
          const sceneNames = sceneList.scenes.map(scene => scene.sceneName);
          await get().fetchSceneSources(sceneNames);
          const sources = uniqueSceneSources(get().sceneSources);
          const sourceNames = sources.map(source => source.sourceName);
          // then get the fillter for all scenes AND sources
          await get().fetchSceneFilters([...sceneNames, ...sourceNames]);

        } catch (error) {
          set({ error: 'Failed to fetch scenes' }, false, 'FetchScenesError');
          throw error;
        }
      },

      fetchSceneFilters: async (sourceNames: string[]) => {
        if (!sourceNames?.length) return;
        console.debug('Fetching filters for sources', sourceNames);
        try {
          const obs = getOBS();
          // Create batch request for multiple source filters
          const request: RequestBatchRequest[] = sourceNames.map((sourceName) => ({
            requestType: 'GetSourceFilterList',
            requestId: sourceName, // This is so we can line them up with the source names in the response
            requestData: {
              sourceName
            }
          }));

          const responses = await obs.callBatch(request, {
            // Parallel execution is disabled as the data is returned in a random order: https://github.com/obsproject/obs-websocket/issues/1317
            // executionType: 2 // Parallel
          });

          // Line them up with the source names and create the filters object
          const filtersWithSourceNames = Object.fromEntries(
            responses.map((response) => [
              response.requestId,
              (response.responseData as unknown as SourceFilterListResponse)?.filters || []
            ])
          );

          set((state) => ({
            sceneFilters: {
              ...state.sceneFilters,
              ...filtersWithSourceNames
            },
            error: null
          }), false, `FetchedFilters_${sourceNames.join(',')}`);
        } catch (error) {
          set({ error: `Failed to fetch filters for ${sourceNames.join(', ')}` }, false, `FetchFiltersError_${sourceNames.join(',')}`);
          throw error;
        }
      },

      fetchScenePreview: async (sourceNames: string[]) => {
        if (!sourceNames?.length) return;
        // console.debug('Fetching preview for sources', sourceNames);
        try {
          const obs = getOBS();
          // If they pass in an array of scene names, we need to use the batch request aPI
          // assemble the request
          const request: RequestBatchRequest[] = sourceNames.map((sourceName) => ({
            requestType: 'GetSourceScreenshot',
            requestId: sourceName, // This is so we can line them up with the source names in the response
            requestData: {
              sourceName,
              imageFormat: 'png',
              imageWidth: Math.floor(1920 / 8),
              imageHeight: Math.floor(1080 / 8)
            }
          }));
          const previews = await obs.callBatch(request, {
            // Parallel execution is disabled as the data is returned in a random order: https://github.com/obsproject/obs-websocket/issues/1317
            // executionType: 2 // Parallel
          });
          // line them up with the source names
          const previewsWithSourceNames = Object.fromEntries(previews.map((response, i) => [response.requestId, response.responseData?.imageData as string]));
          set(() => ({
            scenePreviews: previewsWithSourceNames,
            error: null
          }), false, `FetchedPreview_${sourceNames}`);
          return;

        } catch (error) {
          set({ error: `Failed to fetch preview for ${sourceNames}` }, false, `FetchPreviewError_${sourceNames}`);
          throw error;
        }
      },

      fetchSceneSources: async (sceneNames: string[]) => {
        if (!sceneNames?.length) return;
        console.debug('Fetching sources for scenes', sceneNames);
        try {
          const obs = getOBS();
          // Create batch request for multiple scene sources
          const request: RequestBatchRequest[] = sceneNames.map((sceneName) => ({
            requestType: 'GetSceneItemList',
            requestId: sceneName, // This is so we can line them up with the scene names in the response
            requestData: {
              sceneName
            }
          }));

          const responses = await obs.callBatch(request);

          // Line them up with the scene names and create the sources object
          const sourcesWithSceneNames = Object.fromEntries(
            responses.map((response) => [
              response.requestId,
              (response.responseData as unknown as { sceneItems: Source[] })?.sceneItems || []
            ])
          );

          set((state) => ({
            sceneSources: {
              ...state.sceneSources,
              ...sourcesWithSceneNames
            },
            error: null
          }), false, `FetchedSources_${sceneNames.join(',')}`);
        } catch (error) {
          set({ error: `Failed to fetch sources for ${sceneNames.join(', ')}` }, false, `FetchSourcesError_${sceneNames.join(',')}`);
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
            const sceneNames = state.scenes.map(scene => scene.sceneName);
            const sourceNames = uniqueSceneSources(state.sceneSources).map(source => source.sourceName);
            await state.fetchScenePreview([...sceneNames, ...sourceNames]);
            // Recursively call the poll function again as soon as possible
            setTimeout(poll, 33);
            // poll();
          } catch (error) {
            console.error('Polling error:', error);
          }
        };

        const pollRecordStatus = async () => {
          const state = get();
          if (!state.isConnected) return;

          try {
            const obs = getOBS();
            const recordStatus = await obs.call('GetRecordStatus');
            set({ reecordStatus }, false, 'PolledRecordStatus');
            setTimeout(pollRecordStatus, 1000);
          } catch (error) {
            console.error('Record status polling error:', error);
          }
        };

        // Initial polls
        poll();
        pollRecordStatus();
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

export interface SceneItem {
  sceneName: string;
  sceneIndex: number;
}

export interface SceneListResponse {
  currentProgramSceneName: string;
  currentProgramSceneUuid: string;
  currentPreviewSceneName: string;
  currentPreviewSceneUuid: string;
  scenes: SceneItem[];
}

export interface Filter {
  filterEnabled: boolean;
  filterIndex: number;
  filterKind: string;
  filterName: string;
  filterSettings: Record<string, unknown>;
}

export interface SourceFilterListResponse {
  filters: Filter[];
}

export interface SourceScreenshotResponse {
  imageData: string;
  imageFormat: string;
}

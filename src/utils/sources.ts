import { Source } from "../store/obsStore";

export function uniqueSceneSources(sceneSources: Record<string, Source[]>) {
  const flattenedSceneSources = Object.values(sceneSources).flat();
  const uniqueSceneSources = flattenedSceneSources.filter(
    (source, index, self) =>
      index === self.findIndex((t) => t.sourceUuid === source.sourceUuid)
  );
  return uniqueSceneSources;
}

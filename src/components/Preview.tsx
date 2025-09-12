import { useOBSStore } from "../store/obsStore";

export function Preview({ sourceName }: { sourceName: string }) {
  const previews = useOBSStore((state) => state.scenePreviews);
  return (
    <img src={previews[sourceName]} alt={`${sourceName} preview`} className="source-preview" />
  );
}

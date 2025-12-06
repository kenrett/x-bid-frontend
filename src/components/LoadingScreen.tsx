import { Page } from "./Page";

export function LoadingScreen({ item }: { item: string }) {
  return (
    <Page>
      <p className="text-gray-400 text-lg">{`Loading ${item}...`}</p>
    </Page>
  );
}

import { Page } from "./Page";

export function LoadingScreen({ item }: { item: string }) {
  return (
    <Page>
      <p className="text-[color:var(--sf-mutedText)] text-lg">{`Loading ${item}...`}</p>
    </Page>
  );
}

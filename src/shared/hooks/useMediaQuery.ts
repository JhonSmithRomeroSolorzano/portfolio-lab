import { useMemo, useSyncExternalStore } from "react";

const serverSnapshot = () => false;

/** One lazy browser source per hook/query, shared by subscription and snapshots. */
export function useMediaQuery(query: string) {
  const source = useMemo(() => {
    let media: MediaQueryList | undefined;
    // Creating the store is SSR-safe; only browser snapshots/subscriptions read it.
    const current = () => (media ??= window.matchMedia(query));
    return {
      subscribe(onChange: () => void) {
        const media = current();
        media.addEventListener("change", onChange);
        return () => media.removeEventListener("change", onChange);
      },
      snapshot: () => current().matches,
    };
  }, [query]);
  return useSyncExternalStore(
    source.subscribe,
    source.snapshot,
    serverSnapshot,
  );
}

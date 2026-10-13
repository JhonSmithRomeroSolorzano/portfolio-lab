import { useSyncExternalStore } from "react";

const subscribe = () => () => {};
/** Match the static render until hydration has attached interactive controls. */
export function useClientReady() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}

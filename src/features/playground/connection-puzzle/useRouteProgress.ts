import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadProgress,
  ROUTE_PROGRESS_KEY,
  saveProgress,
} from "./route-progress";
import {
  createRouteVisit,
  hasRouteUpdate,
  reconcileRouteVisit,
  routeTransition,
  settleRouteSave,
  type RouteAction,
} from "./route-transitions";

/** Own browser IO; the feature-local transition layer owns visit state policy. */
export function useRouteProgress() {
  const [visit, setVisit] = useState(() => createRouteVisit(loadProgress()));
  const { saved, history, hint, notice } = visit;
  const { progress } = saved;
  const knownSave = useRef(progress);

  const refresh = useCallback(() => {
    const incoming = loadProgress();
    const previous = knownSave.current;
    const changed = hasRouteUpdate(previous, incoming);
    if (changed) knownSave.current = incoming.progress;
    setVisit((current) => reconcileRouteVisit(current, previous, incoming));
    return changed;
  }, []);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== null && event.key !== ROUTE_PROGRESS_KEY) return;
      try {
        if (event.storageArea !== window.localStorage) return;
      } catch {
        return;
      }
      refresh();
    };
    window.addEventListener("storage", sync);
    window.addEventListener("focus", refresh);
    refresh();
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener("focus", refresh);
    };
  }, [refresh, progress]);

  function act(action: RouteAction) {
    const next = routeTransition(visit, action);
    if (!next) return false;
    // A suspended tab may receive its storage event after the next interaction.
    if (refresh()) {
      setVisit((current) => ({
        ...current,
        notice:
          "Progress changed in another tab. The latest save is loaded; try your action again.",
      }));
      return false;
    }
    const stored = saveProgress(next.saved.progress);
    if (stored) knownSave.current = next.saved.progress;
    setVisit(settleRouteSave(next, stored));
    return true;
  }

  return {
    ...saved,
    notice,
    hint,
    canUndo: history[progress.level].length > 0,
    select: (level: number) => {
      act({ type: "select", level });
    },
    reset: () => {
      act({ type: "reset" });
    },
    turn: (index: number) => {
      act({ type: "turn", index });
    },
    undo: () => act({ type: "undo" }),
    giveHint: () => {
      act({ type: "hint" });
    },
  };
}

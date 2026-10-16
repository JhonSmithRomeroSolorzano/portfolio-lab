import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";
import { useClientReady } from "../../shared/hooks/useClientReady";
import { ExperimentBoundary } from "./ExperimentBoundary";

type Props = {
  id: string;
  title: string;
  titleId?: string;
  load: () => Promise<ComponentType>;
  entryAliases?: readonly string[];
};

const NO_ALIASES: readonly string[] = [];

/** Keep career content independent of the optional interactive downloads. */
export function DeferredExperiment({
  id,
  title,
  titleId,
  load,
  entryAliases = NO_ALIASES,
}: Props) {
  const ready = useClientReady();
  const container = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const started = useRef(false);
  const anchorUninterrupted = useRef(true);
  const [Experiment, setExperiment] = useState<ComponentType>();
  const [failed, setFailed] = useState(false);

  const request = useCallback(() => {
    if (started.current) return;
    started.current = true;
    if (container.current?.contains(document.activeElement)) {
      document.getElementById(id)?.focus({ preventScroll: true });
    }
    setRequested(true);
  }, [id]);

  useEffect(() => {
    const enter = () => {
      const hash = window.location.hash;
      if (hash === `#${id}` || entryAliases.includes(hash)) {
        request();
      }
    };
    enter();
    window.addEventListener("hashchange", enter);
    if (typeof IntersectionObserver === "undefined") {
      request();
      return () => window.removeEventListener("hashchange", enter);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          request();
          observer.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    if (container.current) observer.observe(container.current);
    return () => {
      observer.disconnect();
      window.removeEventListener("hashchange", enter);
    };
  }, [id, entryAliases, request]);

  useLayoutEffect(() => {
    const target = document.getElementById(id);
    const ownsLanding = () =>
      anchorUninterrupted.current &&
      window.location.hash === `#${id}` &&
      document.activeElement === target;
    if (!Experiment || !target || !ownsLanding()) return;

    let frame = 0;
    const align = () => {
      frame = 0;
      if (ownsLanding())
        target.scrollIntoView({ behavior: "instant", block: "start" });
      else observer?.disconnect();
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(align);
    };
    // Neighboring lazy content can move the destination after this component
    // mounts. Align after layout, while the visitor still owns this landing.
    const observer =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(schedule);
    observer?.observe(target.closest("main") ?? target);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
    };
  }, [Experiment, id]);

  useEffect(() => {
    if (!requested) return;
    const interrupt = () => {
      anchorUninterrupted.current = false;
    };
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    inputs.forEach((type) =>
      window.addEventListener(type, interrupt, { passive: true }),
    );
    let current = true;
    load().then(
      (component) => {
        if (current) setExperiment(() => component);
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
      inputs.forEach((type) => window.removeEventListener(type, interrupt));
    };
  }, [requested, load]);

  return (
    <div ref={container} className="deferred-experiment" data-experiment={id}>
      {Experiment ? (
        <ExperimentBoundary title={title} titleId={titleId}>
          <Experiment />
        </ExperimentBoundary>
      ) : (
        <div className="experiment-placeholder">
          {titleId && <h3 id={titleId}>{title}</h3>}
          <p role="status">
            {failed
              ? `${title} couldn’t load. Check your connection and reload to try again.`
              : requested
                ? `Loading ${title}…`
                : !ready
                  ? `${title} becomes interactive when JavaScript loads. Your résumé and contact links are ready above.`
                  : `${title} is ready to explore.`}
          </p>
          {failed ? (
            <button
              type="button"
              onClick={() => {
                window.location.hash = id;
                window.location.reload();
              }}
            >
              Reload page
            </button>
          ) : (
            !requested &&
            ready && (
              <button type="button" onClick={request}>
                Load {title}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

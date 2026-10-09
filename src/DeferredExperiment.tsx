import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
} from "react";

type Props = {
  id: string;
  title: string;
  titleId?: string;
  load: () => Promise<ComponentType>;
};

/** Keep career content independent of the optional interactive downloads. */
export function DeferredExperiment({ id, title, titleId, load }: Props) {
  const container = useRef<HTMLDivElement>(null);
  const [requested, setRequested] = useState(false);
  const started = useRef(false);
  const anchorUninterrupted = useRef(true);
  const [Experiment, setExperiment] = useState<ComponentType>();
  const [failed, setFailed] = useState(false);

  function request() {
    if (started.current) return;
    started.current = true;
    if (container.current?.contains(document.activeElement)) {
      document.getElementById(id)?.focus({ preventScroll: true });
    }
    setRequested(true);
  }

  useEffect(() => {
    const enter = () => {
      const hash = window.location.hash;
      if (hash === `#${id}` || (id === "signal-lab" && hash === "#lab")) {
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
  }, [id]);

  useLayoutEffect(() => {
    const target = document.getElementById(id);
    if (
      Experiment &&
      anchorUninterrupted.current &&
      window.location.hash === `#${id}` &&
      document.activeElement === target
    ) {
      target?.scrollIntoView({ behavior: "instant", block: "start" });
    }
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
        <Experiment />
      ) : (
        <div className="experiment-placeholder">
          {titleId && <h3 id={titleId}>{title}</h3>}
          <p role="status">
            {failed
              ? `${title} couldn’t load. Check your connection and reload to try again.`
              : requested
                ? `Loading ${title}…`
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
            !requested && (
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

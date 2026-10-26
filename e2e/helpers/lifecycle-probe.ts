/** Test-only counters. Weak keys avoid keeping queried targets/observers alive. */
export function installLifecycleProbe() {
  const counts: Record<string, number> = {};
  const bump = (key: string, delta: number) => {
    counts[key] = (counts[key] ?? 0) + delta;
    if (counts[key] === 0) delete counts[key];
  };
  const targets = new WeakMap<
    EventTarget,
    Map<string, Set<EventListenerOrEventListenerObject>>
  >();
  const nativeAdd = EventTarget.prototype.addEventListener;
  const nativeRemove = EventTarget.prototype.removeEventListener;
  function category(target: EventTarget) {
    return target === window
      ? "window"
      : target === document
        ? "document"
        : target instanceof MediaQueryList
          ? "media"
          : undefined;
  }
  // The app's persistent subscriptions use neither once nor AbortSignal. Keep
  // native semantics for those forms and explicitly report the coverage gap.
  let automaticListeners = 0;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    nativeAdd.call(this, type, listener, options);
    const scope = category(this);
    if (!scope || !listener) return;
    if (typeof options === "object" && (options.once || options.signal)) {
      automaticListeners++;
      return;
    }
    const capture =
      typeof options === "boolean" ? options : (options?.capture ?? false);
    const key = `${scope}:${type}:${capture}`;
    let subscriptions = targets.get(this);
    if (!subscriptions) targets.set(this, (subscriptions = new Map()));
    let listeners = subscriptions.get(key);
    if (!listeners) subscriptions.set(key, (listeners = new Set()));
    if (!listeners.has(listener)) {
      listeners.add(listener);
      bump(key, 1);
    }
  };
  EventTarget.prototype.removeEventListener = function (
    type,
    listener,
    options,
  ) {
    nativeRemove.call(this, type, listener, options);
    const scope = category(this);
    if (!scope || !listener) return;
    const capture =
      typeof options === "boolean" ? options : (options?.capture ?? false);
    const key = `${scope}:${type}:${capture}`;
    if (targets.get(this)?.get(key)?.delete(listener)) bump(key, -1);
  };
  for (const name of [
    "ResizeObserver",
    "IntersectionObserver",
    "MutationObserver",
  ] as const) {
    const Native = window[name];
    if (!Native) continue;
    const observers = new WeakMap<
      object,
      { targets: WeakSet<object>; size: number }
    >();
    const prototype = Native.prototype as unknown as {
      observe(target: object, ...args: unknown[]): void;
      unobserve?: (target: object) => void;
      disconnect(): void;
    };
    const observe = prototype.observe,
      unobserve = prototype.unobserve,
      disconnect = prototype.disconnect;
    prototype.observe = function (target, ...args) {
      Reflect.apply(observe, this, [target, ...args]);
      let state = observers.get(this);
      if (!state)
        observers.set(this, (state = { targets: new WeakSet(), size: 0 }));
      if (!state.targets.has(target)) {
        state.targets.add(target);
        if (state.size++ === 0) bump(`${name}:active`, 1);
        bump(`${name}:targets`, 1);
      }
    };
    if (unobserve)
      prototype.unobserve = function (target) {
        Reflect.apply(unobserve, this, [target]);
        const state = observers.get(this);
        if (state?.targets.delete(target)) {
          bump(`${name}:targets`, -1);
          if (--state.size === 0) bump(`${name}:active`, -1);
        }
      };
    prototype.disconnect = function () {
      Reflect.apply(disconnect, this, []);
      const state = observers.get(this);
      if (state?.size) {
        bump(`${name}:active`, -1);
        bump(`${name}:targets`, -state.size);
        state.size = 0;
        state.targets = new WeakSet();
      }
    };
  }
  const frames = new Set<number>(),
    intervals = new Set<number>();
  const request = window.requestAnimationFrame.bind(window),
    cancel = window.cancelAnimationFrame.bind(window);
  window.requestAnimationFrame = (callback) => {
    const id = request((time) => {
      frames.delete(id);
      callback(time);
    });
    frames.add(id);
    return id;
  };
  window.cancelAnimationFrame = (id) => {
    frames.delete(id);
    cancel(id);
  };
  const start = window.setInterval.bind(window),
    stop = window.clearInterval.bind(window);
  window.setInterval = ((...args: Parameters<typeof window.setInterval>) => {
    const id = start(...args);
    intervals.add(id);
    return id;
  }) as typeof window.setInterval;
  window.clearInterval = (id) => {
    if (typeof id === "number") intervals.delete(id);
    stop(id);
  };
  let paints = 0;
  for (const method of [
    "clearRect",
    "fillRect",
    "stroke",
    "fill",
    "putImageData",
  ] as const) {
    const native = CanvasRenderingContext2D.prototype[method];
    Object.defineProperty(CanvasRenderingContext2D.prototype, method, {
      configurable: true,
      writable: true,
      value: function (this: CanvasRenderingContext2D, ...args: unknown[]) {
        if (
          this.canvas.closest("#jet-engine, #gravity-loom, #signal-sculpture")
        )
          paints++;
        return Reflect.apply(native, this, args);
      },
    });
  }
  const probe = {
    snapshot: () => ({
      resources: Object.fromEntries(
        Object.entries(counts).sort(([a], [b]) => a.localeCompare(b)),
      ),
      pendingFrames: frames.size,
      intervals: intervals.size,
      paints,
      automaticListeners,
    }),
  };
  Object.defineProperty(window, "__lifecycleProbe", { value: probe });
}

export type LifecycleSnapshot = {
  resources: Record<string, number>;
  pendingFrames: number;
  intervals: number;
  paints: number;
  automaticListeners: number;
};
export function readLifecycleSnapshot(): LifecycleSnapshot {
  return (
    window as unknown as {
      __lifecycleProbe: {
        snapshot(): LifecycleSnapshot;
      };
    }
  ).__lifecycleProbe.snapshot();
}

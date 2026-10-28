/** Coalesce environmental redraws; explicit controls and animation stay immediate. */
export function observeCanvas(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  redraw: (width: number, height: number) => void,
  maxRatio = 2,
) {
  let width = 0,
    height = 0,
    ratio = 0,
    theme: string | undefined,
    frame = 0,
    disposed = false;
  function refresh() {
    frame = 0;
    if (disposed) return;
    const box = canvas.getBoundingClientRect(),
      nextWidth = Math.max(1, box.width),
      nextHeight = Math.max(1, box.height),
      nextRatio = Math.min(window.devicePixelRatio || 1, maxRatio),
      nextTheme = document.documentElement.dataset.theme;
    if (
      width === nextWidth &&
      height === nextHeight &&
      ratio === nextRatio &&
      theme === nextTheme
    )
      return;
    const resized =
      width !== nextWidth || height !== nextHeight || ratio !== nextRatio;
    width = nextWidth;
    height = nextHeight;
    ratio = nextRatio;
    theme = nextTheme;
    if (resized) {
      const backingWidth = Math.round(width * ratio),
        backingHeight = Math.round(height * ratio);
      if (canvas.width !== backingWidth) canvas.width = backingWidth;
      if (canvas.height !== backingHeight) canvas.height = backingHeight;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    }
    redraw(width, height);
  }
  function schedule() {
    if (!disposed && !frame) frame = requestAnimationFrame(refresh);
  }
  const size =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver(schedule);
  const appearance = new MutationObserver(schedule);
  size?.observe(canvas);
  appearance.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  window.addEventListener("resize", schedule);
  refresh();
  return () => {
    disposed = true;
    cancelAnimationFrame(frame);
    size?.disconnect();
    appearance.disconnect();
    window.removeEventListener("resize", schedule);
  };
}

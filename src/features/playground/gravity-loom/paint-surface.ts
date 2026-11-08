/** One visible, renderer-owned canvas; renew its context only at palette boundaries. */
export function createLoomPaintSurface(host: HTMLElement) {
  let canvas: HTMLCanvasElement | undefined;
  let retiring: HTMLCanvasElement | undefined;
  let context: CanvasRenderingContext2D | undefined;
  let palette: string | undefined;
  let paintedRevision = -1;
  let disposed = false;

  function release(node: HTMLCanvasElement | undefined) {
    if (!node) return;
    node.remove();
    node.width = 0;
    node.height = 0;
  }
  function allocate() {
    // Keep element attributes/styles across epochs, never pixels or context state.
    const next = canvas
      ? (canvas.cloneNode(false) as HTMLCanvasElement)
      : host.ownerDocument.createElement("canvas");
    const nextContext = next.getContext("2d");
    if (!nextContext) {
      release(next);
      return false;
    }
    next.setAttribute("aria-hidden", "true");
    // Connected before text is drawn so WebKit resolves the label font. Both
    // children exist only during this synchronous palette-boundary repaint.
    host.append(next);
    retiring = canvas;
    canvas = next;
    context = nextContext;
    return true;
  }
  if (!allocate()) return undefined;

  return {
    prepare(
      paintPalette: string,
      revision: number,
      width: number,
      height: number,
      ratio: number,
    ) {
      if (disposed || revision === paintedRevision) return undefined;
      if (palette !== undefined && palette !== paintPalette && !allocate())
        return null;
      palette = paintPalette;
      const backingWidth = Math.round(width * ratio),
        backingHeight = Math.round(height * ratio);
      if (canvas!.width !== backingWidth) canvas!.width = backingWidth;
      if (canvas!.height !== backingHeight) canvas!.height = backingHeight;
      context!.setTransform(ratio, 0, 0, ratio, 0, 0);
      return context!;
    },
    finish(revision: number) {
      release(retiring);
      retiring = undefined;
      paintedRevision = revision;
    },
    dispose() {
      disposed = true;
      release(canvas);
      release(retiring);
      canvas = retiring = undefined;
      context = undefined;
    },
  };
}

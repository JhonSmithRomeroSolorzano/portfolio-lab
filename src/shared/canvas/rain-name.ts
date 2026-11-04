export const RAIN_NAME_CHANGE = "portfolio:rain-name-change";

/** Geometry/illumination only. The background owns all glyphs and animation. */
export type RainNameStencil = {
  heading: HTMLHeadingElement;
  width: number;
  height: number;
  padding: number;
  integral: Uint32Array;
  mask: HTMLCanvasElement;
  reveal: boolean;
  activate(active: boolean): void;
  complete(): void;
};

let current: RainNameStencil | undefined;

export function currentRainName() {
  return current;
}

export function notifyRainName() {
  window.dispatchEvent(new Event(RAIN_NAME_CHANGE));
}

export function registerRainName(stencil: RainNameStencil) {
  current = stencil;
  notifyRainName();
  return () => {
    if (current !== stencil) return;
    stencil.activate(false);
    current = undefined;
    notifyRainName();
    stencil.mask.width = stencil.mask.height = 1;
  };
}

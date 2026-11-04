import type { RainNameStencil } from "../../shared/canvas/rain-name";

/** One static alpha bitmap, never a rain renderer or an animation loop. */
export function createNameStencil(
  heading: HTMLHeadingElement,
  reveal: boolean,
  complete: () => void,
): RainNameStencil | undefined {
  if (!CSS.supports("mask-composite", "exclude")) return;
  const panel = heading.closest<HTMLElement>(".workbench-intro");
  const box = heading.getBoundingClientRect();
  if (
    !panel ||
    !box.width ||
    !box.height ||
    box.width > 2048 ||
    box.height > 512
  )
    return;
  const padding = 24;
  const width = Math.ceil(box.width);
  const height = Math.ceil(box.height) + padding * 2;
  const mask = document.createElement("canvas");
  mask.width = width;
  mask.height = height;
  const context = mask.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  const css = getComputedStyle(heading);
  context.fillStyle = "#000";
  context.textBaseline = "alphabetic";
  context.font = `${css.fontWeight} ${css.fontSize} ${css.fontFamily}`;
  for (const letter of heading.querySelectorAll<HTMLElement>(".name-letter")) {
    const ink = letter.querySelector<HTMLElement>(".name-letter-ink")!;
    const baseline = letter.querySelector<HTMLElement>(".name-baseline")!;
    context.fillText(
      ink.textContent!,
      ink.getBoundingClientRect().left - box.left,
      baseline.getBoundingClientRect().top - box.top + padding,
    );
  }
  const pixels = context.getImageData(0, 0, width, height).data;
  const integral = new Uint32Array((width + 1) * (height + 1));
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      row += pixels[(y * width + x) * 4 + 3];
      integral[(y + 1) * (width + 1) + x + 1] =
        integral[y * (width + 1) + x + 1] + row;
    }
  }
  const url = `url("${mask.toDataURL()}")`;
  return {
    heading,
    width,
    height,
    padding,
    integral,
    mask,
    reveal,
    complete,
    activate(active) {
      if (active) {
        const bounds = panel.getBoundingClientRect();
        const title = heading.getBoundingClientRect();
        panel.style.setProperty("--name-cutout", url);
        panel.style.setProperty("--name-cutout-size", `${width}px ${height}px`);
        panel.style.setProperty(
          "--name-cutout-position",
          `${title.left - bounds.left}px ${title.top - bounds.top - padding}px`,
        );
        panel.dataset.nameSurface = "cutout";
        heading.dataset.nameRenderer = "background";
      } else {
        delete panel.dataset.nameSurface;
        delete heading.dataset.nameRenderer;
        for (const property of [
          "--name-cutout",
          "--name-cutout-size",
          "--name-cutout-position",
        ])
          panel.style.removeProperty(property);
      }
    },
  };
}

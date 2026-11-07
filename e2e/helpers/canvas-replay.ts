import type { Page } from "@playwright/test";

type CanvasMethod =
  | "clearRect"
  | "beginPath"
  | "moveTo"
  | "lineTo"
  | "stroke"
  | "arc"
  | "fill"
  | "fillText"
  | "setTransform";

export type CanvasFrame = {
  width: number;
  height: number;
  theme?: string;
  commands: {
    method: CanvasMethod;
    args: unknown[];
    state?: {
      transform: [number, number, number, number, number, number];
      values: Record<string, unknown>;
      lineDash: number[];
    };
  }[];
};

type ReplayWindow = Window & {
  __canvasReplay?: { frames: CanvasFrame[]; overflow: boolean };
};

/** Diagnostic source capture only; never installed by the original pixel test. */
export async function captureCanvasCommands(page: Page) {
  await page.addInitScript(() => {
    const capture = { frames: [] as CanvasFrame[], overflow: false };
    (window as ReplayWindow).__canvasReplay = capture;
    let frame: CanvasFrame | undefined;
    const methods: CanvasMethod[] = [
      "clearRect",
      "beginPath",
      "moveTo",
      "lineTo",
      "stroke",
      "arc",
      "fill",
      "fillText",
      "setTransform",
    ];
    const host = CanvasRenderingContext2D.prototype as unknown as Record<
      CanvasMethod,
      (...args: unknown[]) => unknown
    >;
    for (const method of methods) {
      const native = host[method];
      host[method] = function (
        this: CanvasRenderingContext2D,
        ...args: unknown[]
      ) {
        if (this.canvas.closest("#gravity-loom")) {
          if (method === "clearRect") {
            frame = undefined;
            if (capture.frames.length < 32) {
              frame = {
                width: this.canvas.width,
                height: this.canvas.height,
                theme: document.documentElement.dataset.theme,
                commands: [],
              };
              capture.frames.push(frame);
            } else capture.overflow = true;
          }
          if (frame && frame.commands.length < 4096) {
            const command: CanvasFrame["commands"][number] = { method, args };
            if (["clearRect", "stroke", "fill", "fillText"].includes(method)) {
              const t = this.getTransform();
              const values: Record<string, unknown> = {};
              for (const key of [
                "fillStyle",
                "strokeStyle",
                "lineCap",
                "lineJoin",
                "lineWidth",
                "miterLimit",
                "globalAlpha",
                "globalCompositeOperation",
                "shadowBlur",
                "shadowColor",
                "shadowOffsetX",
                "shadowOffsetY",
                "filter",
                "font",
                "textAlign",
                "textBaseline",
                "direction",
                "lineDashOffset",
              ] as const)
                values[key] = this[key];
              command.state = {
                transform: [t.a, t.b, t.c, t.d, t.e, t.f],
                values,
                lineDash: this.getLineDash(),
              };
            }
            frame.commands.push(command);
          } else if (frame) capture.overflow = true;
        }
        return Reflect.apply(native, this, args);
      };
    }
  });
}

export async function readCanvasCommands(page: Page) {
  return page.evaluate(() => {
    const capture = (window as ReplayWindow).__canvasReplay;
    if (!capture) throw new Error("Canvas capture was not installed");
    const canvas = document.querySelector<HTMLCanvasElement>(
      "#gravity-loom canvas",
    );
    if (!canvas) throw new Error("Loom canvas is unavailable");
    return {
      ...capture,
      pixels: canvas.toDataURL(),
      box: canvas.getBoundingClientRect().toJSON(),
    };
  });
}

/** Compare only inputs consumed by each operation; retain all raw state separately. */
export function drawingInputs(frame: CanvasFrame) {
  return frame.commands
    .filter((command) => command.method !== "setTransform")
    .map((command) => {
      if (!command.state) return command;
      const { transform, values, lineDash } = command.state;
      const keys =
        command.method === "clearRect"
          ? []
          : [
              "globalAlpha",
              "globalCompositeOperation",
              "shadowBlur",
              "shadowColor",
              "shadowOffsetX",
              "shadowOffsetY",
              "filter",
              ...(command.method === "stroke"
                ? [
                    "strokeStyle",
                    "lineCap",
                    "lineJoin",
                    "lineWidth",
                    "miterLimit",
                    "lineDashOffset",
                  ]
                : ["fillStyle"]),
              ...(command.method === "fillText"
                ? ["font", "textAlign", "textBaseline", "direction"]
                : []),
            ];
      return {
        method: command.method,
        args: command.args,
        transform,
        values: Object.fromEntries(keys.map((key) => [key, values[key]])),
        ...(command.method === "stroke" ? { lineDash } : {}),
      };
    });
}

/** Run frozen commands on a blank page, without application code or observers. */
export async function replayCanvasCommands(
  page: Page,
  frames: CanvasFrame[],
  beforeIndex: number,
  afterIndex: number,
  freshCanvas: boolean,
) {
  return page.evaluate(
    ({ frames, beforeIndex, afterIndex, freshCanvas }) => {
      let canvas = document.createElement("canvas");
      document.body.append(canvas);
      let ctx = canvas.getContext("2d")!;
      let before = "",
        after = "";
      for (let index = 0; index < frames.length; index++) {
        const frame = frames[index];
        if (freshCanvas) {
          canvas.remove();
          canvas = document.createElement("canvas");
          document.body.append(canvas);
          ctx = canvas.getContext("2d")!;
        }
        if (canvas.width !== frame.width) canvas.width = frame.width;
        if (canvas.height !== frame.height) canvas.height = frame.height;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        for (const command of frame.commands) {
          if (command.state) {
            ctx.setTransform(...command.state.transform);
            Object.assign(ctx, command.state.values);
            ctx.setLineDash(command.state.lineDash);
          }
          const host = ctx as unknown as Record<
            CanvasMethod,
            (...args: unknown[]) => unknown
          >;
          Reflect.apply(host[command.method], ctx, command.args);
        }
        if (index === beforeIndex) before = canvas.toDataURL();
        if (index === afterIndex) after = canvas.toDataURL();
      }
      return { before, after };
    },
    { frames, beforeIndex, afterIndex, freshCanvas },
  );
}

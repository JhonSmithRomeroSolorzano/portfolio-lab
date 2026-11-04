import { useEffect, useRef } from "react";
import { motionQuery } from "../../shared/motion/motion-preference";
import {
  notifyRainName,
  registerRainName,
} from "../../shared/canvas/rain-name";
import type { RainNameStencil } from "../../shared/canvas/rain-name";
import { createNameStencil } from "./name-rain-stencil";

function letters(text: string, offset: number) {
  return Array.from(text, (letter, index) =>
    letter === " " ? (
      letter
    ) : (
      <span
        className={`name-letter${letter === "." ? " heading-dot" : ""}`}
        aria-hidden="true"
        key={offset + index}
      >
        <span className="name-letter-ink">
          {letter}
          <span className="name-baseline" />
        </span>
      </span>
    ),
  );
}

/** Supplies a static name stencil to the ONE existing background rain engine. */
export function NameEntrance() {
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const heading = title.current;
    if (!heading) return;
    let disposed = false;
    let ready = false;
    let built = false;
    let frame = 0;
    let width = 0;
    let height = 0;
    let stencil: RainNameStencil | undefined;
    let unregister: (() => void) | undefined;
    const settle = () => {
      if (built) return;
      built = true;
      if (stencil) {
        stencil.reveal = false;
        notifyRainName();
      }
    };
    function refresh() {
      frame = 0;
      if (disposed || !ready) return;
      const box = heading!.getBoundingClientRect();
      width = box.width;
      height = box.height;
      unregister?.();
      stencil = createNameStencil(heading!, !built, () => {
        built = true;
      });
      unregister = stencil ? registerRainName(stencil) : undefined;
      if (!stencil) heading!.dataset.nameEntrance = "complete";
    }
    const schedule = () => {
      if (!ready) return;
      built = true;
      if (!frame) frame = requestAnimationFrame(refresh);
    };
    const resize =
      typeof ResizeObserver === "undefined"
        ? undefined
        : new ResizeObserver(() => {
            const box = heading.getBoundingClientRect();
            if (ready && (box.width !== width || box.height !== height))
              schedule();
          });
    resize?.observe(heading);
    window.addEventListener("resize", schedule);
    window.addEventListener("keydown", settle);
    window.addEventListener("pointerdown", settle);
    window.addEventListener("hashchange", settle);
    if (
      motionQuery().matches ||
      document.hidden ||
      (location.hash && !["#workbench", "#about"].includes(location.hash))
    )
      built = true;
    const deadline = window.setTimeout(settle, 600);
    void document.fonts.ready.then(() => {
      if (disposed) return;
      clearTimeout(deadline);
      ready = true;
      refresh();
    });
    return () => {
      disposed = true;
      clearTimeout(deadline);
      cancelAnimationFrame(frame);
      unregister?.();
      resize?.disconnect();
      window.removeEventListener("resize", schedule);
      window.removeEventListener("keydown", settle);
      window.removeEventListener("pointerdown", settle);
      window.removeEventListener("hashchange", settle);
    };
  }, []);

  return (
    <h1 id="intro-title" ref={title} aria-label="Jhon Smith Romero.">
      <span className="intro-given-name">{letters("Jhon Smith", 0)}</span>{" "}
      {letters("Romero.", 10)}
    </h1>
  );
}

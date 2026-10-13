import { useRef, useState } from "react";
import { CURVES } from "./curves";

export function MotionRecipe({
  curve,
  duration,
}: {
  curve: number;
  duration: number;
}) {
  const code = `.motion-example {
  position: relative;
  width: min(100%, 24rem);
  height: 44px;
}
.motion-example__item {
  position: absolute;
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #6350a5;
  animation: portfolio-travel ${duration}ms ${CURVES[curve].easing} forwards;
}
@keyframes portfolio-travel {
  from { left: 0; transform: rotate(0deg); }
  to { left: calc(100% - 44px); transform: rotate(180deg); }
}
@media (prefers-reduced-motion: reduce) {
  .motion-example__item {
    animation: none;
    left: calc(100% - 44px);
    transform: rotate(180deg);
  }
}`;
  const text = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<
    "idle" | "copying" | "copied" | "manual"
  >("idle");
  async function copy() {
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(code);
      setStatus("copied");
    } catch {
      setStatus("manual");
      text.current?.focus();
      text.current?.select();
    }
  }
  return (
    <details className="motion-recipe">
      <summary>Take this motion with you</summary>
      <p>
        {CURVES[curve].name}, {(duration / 1000).toFixed(1)} seconds. Add this
        markup and CSS to your page. It plays once and respects reduced motion.
      </p>
      <pre>
        <code>
          {
            '<div class="motion-example">\n  <div class="motion-example__item"></div>\n</div>'
          }
        </code>
      </pre>
      <label htmlFor="motion-recipe">Reusable animation CSS</label>
      <textarea
        ref={text}
        id="motion-recipe"
        value={code}
        readOnly
        rows={8}
        spellCheck={false}
      />
      <button onClick={copy} disabled={status === "copying"}>
        {status === "copying" ? "Copying…" : "Copy CSS"}
      </button>
      <p role="status">
        {status === "copied"
          ? "CSS copied. Ready for your project."
          : status === "manual"
            ? "Clipboard unavailable. The CSS is selected; copy it manually."
            : ""}
      </p>
    </details>
  );
}

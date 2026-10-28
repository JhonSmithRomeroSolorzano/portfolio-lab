import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "../../shared/hooks/useReducedMotion";

export const stackFlowSteps = [
  {
    node: "frontend",
    label: "Browser prepares a request",
    activity: "Request ready",
  },
  { node: "", label: "Request → backend", activity: "" },
  {
    node: "backend",
    label: "Backend validates the request",
    activity: "Validating",
  },
  { node: "", label: "Query → data", activity: "" },
  { node: "data", label: "Data looks up the record", activity: "Reading" },
  { node: "", label: "Result → backend", activity: "" },
  {
    node: "backend",
    label: "Backend builds the response",
    activity: "Processing",
  },
  { node: "", label: "Response → browser", activity: "" },
  {
    node: "frontend",
    label: "Browser renders the response",
    activity: "Rendered",
  },
] as const;

export const STACK_FLOW_STEP_MS = 1400;

/** Automatic decorative flow, active only while visible and not being explored by keyboard. */
export function useStackFlow() {
  const target = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();
  const [inView, setInView] = useState(false);
  const [visible, setVisible] = useState(false);
  const [keyboardFocus, setKeyboardFocus] = useState(false);
  const [step, setStep] = useState(0);
  const [tour, setTour] = useState(0);
  const playing = inView && visible && !keyboardFocus && !reducedMotion;

  useEffect(() => {
    const visibility = () => setVisible(!document.hidden);
    visibility();
    document.addEventListener("visibilitychange", visibility);
    const observer =
      typeof IntersectionObserver === "undefined"
        ? undefined
        : new IntersectionObserver((entries) => {
            // This observer owns one drawing. Older entries in a delivered
            // batch must not keep its interval alive after it leaves view.
            const latest = entries[entries.length - 1];
            if (latest)
              setInView(latest.isIntersecting && latest.intersectionRatio > 0);
          });
    if (target.current) observer?.observe(target.current);
    return () => {
      observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);

  useEffect(() => {
    if (!playing) return;
    setStep(0);
    setTour((current) => current + 1);
    const timer = window.setInterval(() => {
      setStep((current) => (current + 1) % stackFlowSteps.length);
    }, STACK_FLOW_STEP_MS);
    return () => window.clearInterval(timer);
  }, [playing]);

  return {
    target,
    step,
    tour,
    playing,
    reducedMotion,
    setKeyboardFocus,
  };
}

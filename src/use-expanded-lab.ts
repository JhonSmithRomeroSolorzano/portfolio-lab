import { useEffect, useRef, useState } from "react";

export function useExpandedLab() {
  const [expanded, setExpanded] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!expanded || !shell.current) return;
    const container = shell.current;
    const previousOverflow = document.body.style.overflow;
    const background = [
      ...document.querySelectorAll<HTMLElement>(
        ".identity-rail, main > section:not(#lab), .site-footer, .skip-link",
      ),
    ];
    const previousInert = background.map((node) => node.inert);
    background.forEach((node) => {
      node.inert = true;
    });
    document.body.style.overflow = "hidden";
    toggle.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setExpanded(false);
      }
      if (event.key !== "Tab") return;
      const items = [
        ...container.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex="0"]',
        ),
      ].filter(
        (node) => node.getClientRects().length > 0 && !node.closest("[hidden]"),
      );
      const first = items[0],
        last = items.at(-1);
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !container.contains(document.activeElement))
      ) {
        event.preventDefault();
        last?.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !container.contains(document.activeElement))
      ) {
        event.preventDefault();
        first?.focus();
      }
    };
    container.addEventListener("keydown", onKey);
    return () => {
      container.removeEventListener("keydown", onKey);
      background.forEach((node, i) => {
        node.inert = previousInert[i];
      });
      document.body.style.overflow = previousOverflow;
      toggle.current?.focus({ preventScroll: true });
    };
  }, [expanded]);
  return { expanded, setExpanded, shell, toggle };
}

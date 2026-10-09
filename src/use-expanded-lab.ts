import { useEffect, useRef, useState } from "react";

export function useExpandedLab() {
  const [expanded, setExpanded] = useState(false);
  const shell = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!expanded || !shell.current) return;
    const container = shell.current;
    const previousOverflow = document.body.style.overflow;
    // Inert every branch outside the dialog, including other collection pieces.
    const background: HTMLElement[] = [];
    let branch: HTMLElement = container;
    while (branch.parentElement) {
      const parent = branch.parentElement;
      background.push(
        ...Array.from(parent.children).filter(
          (node): node is HTMLElement =>
            node instanceof HTMLElement && node !== branch,
        ),
      );
      if (parent === document.body) break;
      branch = parent;
    }
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
      // WebKit may skip buttons with the host's default keyboard preference.
      // Own every Tab step so the modal has the same complete cycle on all hosts.
      event.preventDefault();
      if (!items.length) return;
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next =
        index < 0
          ? event.shiftKey
            ? items.length - 1
            : 0
          : (index + (event.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next].focus();
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

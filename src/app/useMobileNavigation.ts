import { useEffect, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
import { useClientReady } from "../shared/hooks/useClientReady";
import { isPlainNavigation } from "./portfolio-motion";

export function useMobileNavigation(nav: RefObject<HTMLElement | null>) {
  const ready = useClientReady();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const menu = nav.current;
    const trigger = button.current;
    if (!menu || !trigger) return;
    const doc = menu.ownerDocument;
    menu.querySelector<HTMLAnchorElement>("a")?.focus();
    function dismissOutside(event: Event) {
      const target = event.target as Node | null;
      if (target && !menu!.contains(target) && !trigger!.contains(target))
        setOpen(false);
    }
    function escape(event: KeyboardEvent) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      setOpen(false);
      if (trigger!.getClientRects().length) {
        event.preventDefault();
        trigger!.focus();
      }
    }
    doc.addEventListener("pointerdown", dismissOutside);
    doc.addEventListener("focusin", dismissOutside);
    doc.addEventListener("keydown", escape);
    return () => {
      doc.removeEventListener("pointerdown", dismissOutside);
      doc.removeEventListener("focusin", dismissOutside);
      doc.removeEventListener("keydown", escape);
    };
  }, [open, nav]);

  function navigate(event: MouseEvent<HTMLElement>) {
    if (!open || !isPlainNavigation(event)) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (!link) return;
    // Move focus before hiding the active link; native anchors still own URL/scroll.
    document.getElementById(link.hash.slice(1))?.focus({ preventScroll: true });
    setOpen(false);
  }

  function toggle() {
    if (open) button.current?.focus({ preventScroll: true });
    setOpen((value) => !value);
  }

  return {
    ready,
    open,
    button,
    navigate,
    toggle,
  };
}

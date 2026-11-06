import { useEffect, useRef, useState } from "react";
import type { MouseEvent, RefObject } from "react";
import { useClientReady } from "../shared/hooks/useClientReady";
import { isPlainNavigation } from "./portfolio-motion";

function clearPointerFocus(event: FocusEvent) {
  delete (event.currentTarget as HTMLElement).dataset.pointerNavigation;
}

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
    // Reopen at the first link without scrolling the reading position underneath.
    menu.scrollTop = 0;
    menu.querySelector<HTMLAnchorElement>("a")?.focus({ preventScroll: true });
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
        trigger!.focus({ preventScroll: true });
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
    if (!isPlainNavigation(event)) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>(
      "a[href]",
    );
    if (!link) return;
    // Hand off focus without scrolling before the native anchor journey, even
    // when desktop links are always visible. WebKit's later focus adjustment
    // must not start a competing scroll. Native anchors still own URL/history.
    const target = document.getElementById(link.hash.slice(1));
    if (target) {
      if (event.detail > 0) {
        target.dataset.pointerNavigation = "true";
        target.addEventListener("blur", clearPointerFocus, { once: true });
      } else delete target.dataset.pointerNavigation;
      target.focus({ preventScroll: true });
    }
    if (open) setOpen(false);
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

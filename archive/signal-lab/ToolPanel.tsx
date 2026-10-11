import type { ReactNode } from "react";
/** The workspace owns visibility; a selected experiment has no nested disclosure. */
export function ToolPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="tool-panel">
      <h3 className="tool-title">{title}</h3>
      {children}
    </section>
  );
}

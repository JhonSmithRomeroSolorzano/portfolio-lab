import { useEffect, useState } from "react";

/** Visual metrics update immediately; assistive feedback waits for a pause. */
export function ResultAnnouncement({ message }: { message: string }) {
  const [settled, setSettled] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(message), 350);
    return () => window.clearTimeout(timer);
  }, [message]);
  return (
    <p
      className="visually-hidden"
      role="status"
      aria-label="Simulation result"
      aria-atomic="true"
    >
      {settled}
    </p>
  );
}

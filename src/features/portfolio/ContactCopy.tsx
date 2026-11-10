import { useRef, useState } from "react";
import { useClientReady } from "../../shared/hooks/useClientReady";
import { verifiedContactDetails } from "./data/profile";

const contactText = verifiedContactDetails
  .filter(({ kind }) => kind === "email" || kind === "phone")
  .map(({ label }) => label)
  .join("\n");

export function ContactCopy() {
  const ready = useClientReady();
  const button = useRef<HTMLButtonElement>(null);
  const [status, setStatus] = useState<
    "idle" | "copying" | "copied" | "manual"
  >("idle");

  async function copy() {
    setStatus("copying");
    try {
      await navigator.clipboard.writeText(contactText);
      setStatus("copied");
    } catch {
      setStatus("manual");
    }
  }

  return (
    <div className="contact-copy">
      <button
        ref={button}
        disabled={!ready || status === "copying"}
        onClick={copy}
      >
        {status === "copying" ? "Copying…" : "Copy contact details"}
      </button>
      <p role="status">
        {status === "copied"
          ? "Email and phone copied."
          : status === "manual"
            ? "Clipboard unavailable. Copy the email and phone below."
            : !ready
              ? "Use the contact links above, or enable JavaScript to copy both details."
              : ""}
      </p>
      {status === "manual" && (
        <textarea
          aria-label="Contact details to copy"
          readOnly
          rows={2}
          value={contactText}
          spellCheck={false}
          ref={(field) => {
            // A delayed denial must not pull focus away from another task.
            if (field && document.activeElement === button.current) {
              field.focus();
              field.select();
            }
          }}
        />
      )}
    </div>
  );
}

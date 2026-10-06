export function BrandMark() {
  return (
    <svg
      className="brand-mark"
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <rect className="brand-tile" width="64" height="64" rx="10" />
      <g
        className="brand-letters"
        strokeWidth="3.5"
        strokeLinecap="square"
        strokeLinejoin="round"
      >
        <path d="M10 19h11v19c0 7-11 7-11 0" />
        <path d="M38 21c-8-6-16 3-8 9l5 3c8 6 0 15-8 9" />
        <path d="M44 44V19h5c11 0 11 14 0 14h-5m6 0 7 11" />
      </g>
      <path className="brand-rule" d="M10 52h44" strokeWidth="2" />
    </svg>
  );
}

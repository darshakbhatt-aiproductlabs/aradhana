export function OmMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="32" cy="32" r="30" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
      <path
        d="M18 38c2.2-8 8.4-13.5 16.8-13.5 6.4 0 10.8 3.4 10.8 8.2 0 6.4-7.2 8.6-13.2 11.4 4.8.4 9.6 1.6 13.6 4.4"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M28.5 24.5c4.8-6.6 12.4-8.6 18.2-5.2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="44.5" cy="16.5" r="3.1" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M20 31.5c3.4-1.6 6.2.4 6.6 3.8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Ornament({ className = "" }: { className?: string }) {
  return (
    <div className={`divider-ornament ${className}`}>
      <svg width="40" height="14" viewBox="0 0 40 14" fill="none" aria-hidden>
        <path d="M0 7 L12 7 M28 7 L40 7" stroke="currentColor" strokeWidth="0.8" />
        <path d="M14 7 L20 1 L26 7 L20 13 Z" stroke="currentColor" strokeWidth="0.8" fill="none" />
        <circle cx="20" cy="7" r="1.4" fill="currentColor" />
      </svg>
    </div>
  );
}

/** The EG monogram: two strokes, one line. Also the favicon and the preloader's end state. */
export function Mark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden={title ? undefined : "true"} role={title ? "img" : undefined}>
      {title ? <title>{title}</title> : null}
      <path d="M8 10h14M8 10v28h14M8 24h10" fill="none" stroke="var(--spot)" strokeWidth="4.5" strokeLinecap="square" />
      <path d="M40 14a10.5 10.5 0 1 0 0 20v-8h-7" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="square" />
    </svg>
  );
}

/** A registration mark: circle, inner circle, cross. */
export function RegMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" className={className} aria-hidden="true">
      <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <circle cx="14" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M14 0v28M0 14h28" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

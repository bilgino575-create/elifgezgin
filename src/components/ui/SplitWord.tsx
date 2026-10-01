/** A word whose letters drift apart on hover (CSS, see type.css .split). Screen readers get the whole word. */
export default function SplitWord({ text }: { text: string }) {
  const chars = Array.from(text);
  const mid = (chars.length - 1) / 2;
  return (
    <span className="split" aria-label={text} role="text">
      {chars.map((ch, i) => (
        <span className="ch" key={i} aria-hidden="true" style={{ "--k": (i - mid).toFixed(2) } as React.CSSProperties}>
          {ch === " " ? " " : ch}
        </span>
      ))}
    </span>
  );
}

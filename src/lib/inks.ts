/** The five inks, in the order the site cycles through them. */
export const INKS = ["#2b3cff", "#ff2e88", "#ffd400", "#00c8ff", "#19e68c"] as const;
/** Text colour that passes AA on each ink (white only on ultramarine; near-black on the rest). */
export const ON_INK = ["#ffffff", "#0a0a12", "#0a0a12", "#0a0a12", "#0a0a12"] as const;
export function inkVars(i: number): Record<string, string> {
  return { "--c": INKS[i % INKS.length], "--on": ON_INK[i % ON_INK.length] };
}

/** Two-letter mark for a tool token: "After Effects" → "Ae", "Figma" → "Fg". Never a trademarked logo. */
export function toolMark(tool: string): string {
  const words = tool.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0].toLowerCase()).slice(0, 2);
  const w = words[0];
  const consonant = w.slice(1).split("").find((c) => !/[aeiouıöü]/i.test(c)) ?? w[1] ?? "";
  return (w[0] + consonant.toLowerCase()).slice(0, 2);
}

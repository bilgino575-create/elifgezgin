"use client";

import { store, useStore } from "@/lib/store";

export function SkillIndex({ skills }: { skills: { id: string; name: string; description: string; level?: string }[] }) {
  const hover = useStore((s) => s.hoverSkill);
  const current = skills.find((s) => s.id === hover) ?? null;
  return (
    <div>
      <ol className="index">
        {skills.map((s, i) => (
          <li key={s.id} data-active={hover === s.id}>
            <button
              type="button"
              onPointerEnter={() => store.set({ hoverSkill: s.id })}
              onPointerLeave={() => store.set({ hoverSkill: null })}
              onFocus={() => store.set({ hoverSkill: s.id })}
              onBlur={() => store.set({ hoverSkill: null })}
              onClick={() => store.set({ hoverSkill: hover === s.id ? null : s.id })}
              aria-expanded={hover === s.id}
              aria-controls="skill-desc"
            >
              <span className="n">{String(i + 1).padStart(2, "0")}</span>
              <span className="t">{s.name}</span>
              <span className="c">{s.level ?? ""}</span>
            </button>
          </li>
        ))}
      </ol>
      <p id="skill-desc" className="meta mt-4 min-h-[3lh]" aria-live="polite">
        {current ? current.description : ""}
      </p>
    </div>
  );
}

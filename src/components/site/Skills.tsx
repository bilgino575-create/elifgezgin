import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t } from "@/i18n/dict";
import { Section } from "./Track";
import { SkillIndex } from "@/components/ui/SkillsClient";
import { inkVars, toolMark } from "@/lib/inks";

export default function Skills({ lang }: { lang: Lang }) {
  const d = t(lang);
  const skills = site.skills.map((s) => ({
    id: s.id,
    name: L(s.name, lang),
    description: L(s.description, lang),
    level: s.level ? L(s.level, lang) : undefined,
  }));
  return (
    <Section id="beceriler" wide scrim>
      <p className="eyebrow mb-4">{d.skills.eyebrow}</p>
      <h2 id="beceriler-title" className="display h2">
        {d.skills.title}
      </h2>

      <div className="gl-only mt-6">
        <SkillIndex skills={skills} />
      </div>

      <ul className="skill-list html-only mt-10">
        {skills.map((s, i) => (
          <li key={s.id} className="skill" style={inkVars(i) as React.CSSProperties}>
            <h3>{s.name}</h3>
            {s.level ? <p className="meta">{s.level}</p> : null}
            <p>{s.description}</p>
          </li>
        ))}
      </ul>

      <h3 className="eyebrow mt-10 mb-3">{d.skills.tools}</h3>
      <ul className="tokens" aria-label={d.skills.tools}>
        {site.tools.map((tool, i) => (
          <li key={tool} className="token" style={inkVars(i + 2) as React.CSSProperties}>
            <b aria-hidden="true">{toolMark(tool)}</b>
            {tool}
          </li>
        ))}
      </ul>
      <p className="meta mt-3 gl-only">{d.skills.toolsText}</p>
    </Section>
  );
}

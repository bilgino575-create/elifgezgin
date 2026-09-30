import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t } from "@/i18n/dict";
import { Section } from "./Track";
import { SkillIndex } from "@/components/ui/SkillsClient";

export default function Skills({ lang }: { lang: Lang }) {
  const d = t(lang);
  const skills = site.skills.map((s) => ({
    id: s.id,
    name: L(s.name, lang),
    description: L(s.description, lang),
    level: s.level ? L(s.level, lang) : undefined,
  }));
  return (
    <Section id="beceriler" wide>
      <p className="eyebrow mb-4">{d.skills.eyebrow}</p>
      <h2 id="beceriler-title" className="display h2">
        {d.skills.title}
      </h2>

      <div className="gl-only mt-6">
        <SkillIndex skills={skills} />
      </div>

      <ul className="swatches html-only mt-10">
        {skills.map((s, i) => (
          <li key={s.id} className="swatch">
            <div className="band" style={{ opacity: 1 - i * 0.09 }} />
            <div>
              <h3>{s.name}</h3>
              {s.level ? <p className="meta">{s.level}</p> : null}
              <p>{s.description}</p>
            </div>
          </li>
        ))}
      </ul>

      <h3 className="eyebrow mt-10 mb-3">{d.skills.tools}</h3>
      <ul className="stamps" aria-label={d.skills.tools}>
        {site.tools.map((tool) => (
          <li key={tool} className="stamp">
            {tool}
          </li>
        ))}
      </ul>
      <p className="meta mt-3 gl-only">{d.skills.toolsText}</p>
    </Section>
  );
}

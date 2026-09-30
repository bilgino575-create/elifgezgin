import { site, L } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t } from "@/i18n/dict";
import { Section } from "./Track";
import { CopyEmail, ContactForm } from "@/components/ui/ContactClient";
import { Mark } from "./Mark";

const SOCIAL_LABEL: Record<string, string> = { behance: "Behance", instagram: "Instagram", linkedin: "LinkedIn", dribbble: "Dribbble" };

export default function Contact({ lang }: { lang: Lang }) {
  const d = t(lang);
  const hasEmail = !!site.email;
  return (
    <Section id="iletisim" wide scrim>
      <p className="eyebrow mb-4">{d.contact.eyebrow}</p>
      <h2 id="iletisim-title" className="display h2">
        {d.contact.title}
      </h2>

      <div className="html-only mt-10 grid gap-6 sm:grid-cols-2">
        <div className="card foil" aria-label={d.contact.front}>
          <Mark className="h-9 w-9" />
          <div>
            <p className="name">{site.name}</p>
            <p className="mt-2 font-semibold">{L(site.title, lang)}</p>
          </div>
        </div>
        <div className="card" aria-label={d.contact.back} style={{ background: "var(--stage-2)", color: "var(--fg)", border: "1px solid var(--line)" }}>
          <p className="font-semibold">{site.name}</p>
          <div className="lines" style={{ color: "var(--fg)" }}>
            {hasEmail ? <a href={`mailto:${site.email}`}>{site.email}</a> : null}
            {site.social.map((s) => (
              <a key={s.id} href={s.url} rel="me noopener" target="_blank">
                {SOCIAL_LABEL[s.id]}
              </a>
            ))}
            {!hasEmail && !site.social.length ? <span className="meta">{L(site.availability, lang)}</span> : null}
          </div>
        </div>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        {hasEmail ? <CopyEmail email={site.email} label={d.contact.copy} copied={d.contact.copied} /> : null}
        {site.social.map((s) => (
          <a key={s.id} className="btn btn-ghost" href={s.url} rel="me noopener" target="_blank">
            {SOCIAL_LABEL[s.id]}
          </a>
        ))}
      </div>

      {hasEmail ? (
        <ContactForm
          email={site.email}
          labels={{ title: d.contact.formTitle, name: d.contact.name, message: d.contact.message, send: d.contact.send, hint: d.contact.formHint }}
        />
      ) : null}
    </Section>
  );
}

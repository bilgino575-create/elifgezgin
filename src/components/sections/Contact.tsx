import type { Lang } from "@/lib/content";
import { L, site, works } from "@/lib/content";
import { home, otherLang, t, workPath } from "@/lib/i18n";
import Stop from "./Stop";
import CopyEmail from "@/components/ui/CopyEmail";

const SOCIAL_LABEL: Record<string, string> = { behance: "Behance", instagram: "Instagram", linkedin: "LinkedIn", dribbble: "Dribbble" };

/** 07 İLETİŞİM — four lines of type at four widths, the address if there is one, and the end of the route. */
export default function Contact({ lang }: { lang: Lang }) {
  const d = t(lang);
  const year = new Date().getFullYear();
  const art = (
    <div className="fb-contact" aria-hidden="true">
      <i className="ring" />
      <i className="ring ring-2" />
    </div>
  );
  return (
    <Stop id="iletisim" lang={lang} art={art}>
      <div className="contact">
        <h2 className="giant contact-lines">
          <span className="line narrow">{d.contact.line1}</span>
          <span className="line wide">{d.contact.line2}</span>
          <span className="line serif">{d.contact.line3}</span>
          <span className="line narrow">{d.contact.line4}</span>
        </h2>
        <p className="lead contact-avail">{L(site.availability, lang)}</p>
        {site.email ? (
          <p className="contact-email">
            <a className="cta big" href={`mailto:${site.email}`} data-magnet>
              {site.email}
            </a>
            <CopyEmail email={site.email} label={d.contact.copy} done={d.contact.copied} />
          </p>
        ) : null}
        {site.social.length ? (
          <ul className="social meta">
            {site.social.map((s) => (
              <li key={s.id}>
                <a href={s.url} target="_blank" rel="noopener noreferrer" data-magnet>
                  {SOCIAL_LABEL[s.id]}
                </a>
              </li>
            ))}
          </ul>
        ) : null}
        {!site.email && !site.social.length ? <p className="meta muted contact-soon">{d.contact.soon}</p> : null}
        {/* every work, so each one has a way in from the route whatever stop it stands at */}
        {works.length ? (
          <nav className="works-index meta" aria-label={d.nav.work}>
            <span className="muted">{d.nav.work}</span>
            <ol>
              {works.map((w) => (
                <li key={w.slug}>
                  <a href={workPath(lang, w.slug)} data-magnet>
                    {L(w.title, lang)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
        <footer className="foot meta">
          <span>
            © <span className="num">{year}</span> {site.name}
          </span>
          <a href={home(otherLang(lang))} hrefLang={otherLang(lang)} data-magnet>
            {d.nav.switchLabel}
          </a>
          <span className="muted">{d.footer.made}</span>
        </footer>
      </div>
    </Stop>
  );
}

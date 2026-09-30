import { site } from "@/lib/content";
import type { Lang } from "@/lib/content";
import { t } from "@/i18n/dict";

export default function Footer({ lang }: { lang: Lang }) {
  const d = t(lang);
  return (
    <footer className="footer">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <p>
          © {new Date().getFullYear()} {site.name}. {d.footer.rights}
        </p>
        <p>{d.footer.made}</p>
      </div>
    </footer>
  );
}

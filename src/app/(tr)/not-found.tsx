import Link from "next/link";
import { t } from "@/lib/i18n";

export default function NotFound() {
  const d = t("tr");
  return (
    <main className="lost">
      <p className="meta">404</p>
      <h1 className="display">{d.notFound.title}</h1>
      <p className="lead">{d.notFound.text}</p>
      <Link href="/" className="cta">
        {d.notFound.home} <span aria-hidden="true">→</span>
      </Link>
    </main>
  );
}

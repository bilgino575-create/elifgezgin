import type { Lang } from "@/lib/content";
import { works } from "@/lib/content";
import { t } from "@/lib/i18n";
import { personLd } from "@/lib/meta";
import Journey from "@/components/Journey";
import Loader from "@/components/ui/Loader";
import Navigation from "@/components/ui/Navigation";
import RouteIndex from "@/components/ui/RouteIndex";
import CustomCursor from "@/components/ui/CustomCursor";
import Hero from "@/components/sections/Hero";
import Typography from "@/components/sections/Typography";
import Branding from "@/components/sections/Branding";
import Poster from "@/components/sections/Poster";
import DigitalArt from "@/components/sections/DigitalArt";
import About from "@/components/sections/About";
import Contact from "@/components/sections/Contact";

/** The journey: seven stops over one world. Server-rendered HTML first; the stage arrives after first paint. */
export default function Home({ lang }: { lang: Lang }) {
  const d = t(lang);
  const at = (n: number) => works.filter((w) => w.stop === n);
  return (
    <>
      <a className="skip" href="#durak-1">
        {d.skip}
      </a>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd(lang)) }} />
      <Loader lang={lang} />
      <Navigation lang={lang} onHome />
      <main id="main">
        <Journey>
          <Hero lang={lang} />
          <Typography lang={lang} works={at(2)} />
          <Branding lang={lang} works={at(3)} />
          <Poster lang={lang} works={at(4)} />
          <DigitalArt lang={lang} works={at(5)} />
          <About lang={lang} />
          <Contact lang={lang} />
        </Journey>
      </main>
      <RouteIndex lang={lang} />
      <CustomCursor lang={lang} />
    </>
  );
}

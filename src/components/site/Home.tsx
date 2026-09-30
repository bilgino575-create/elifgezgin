import type { Lang } from "@/lib/content";
import Track from "./Track";
import { glProbeScript } from "@/lib/gl";
import Hero from "./Hero";
import Works from "./Works";
import Skills from "./Skills";
import Process from "./Process";
import About from "./About";
import Contact from "./Contact";
import Ending from "./Ending";

export default function Home({ lang }: { lang: Lang }) {
  return (
    <Track>
      {/* runs before the sections parse: the 3D layout is in place before first paint (no layout shift on hydration) */}
      <script dangerouslySetInnerHTML={{ __html: glProbeScript }} />
      <Hero lang={lang} />
      <Works lang={lang} />
      <Skills lang={lang} />
      <Process lang={lang} />
      <About lang={lang} />
      <Contact lang={lang} />
      <Ending lang={lang} />
    </Track>
  );
}

import type { Lang } from "@/lib/content";
import Track from "./Track";
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

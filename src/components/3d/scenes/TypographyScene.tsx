"use client";

import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, MeshStandardMaterial } from "three";
import type { Lang } from "@/lib/content";
import { L, upper, works } from "@/lib/content";
import { store } from "@/lib/store";
import { STOPS } from "@/lib/stops";
import { chrome } from "../materials";
import ExtrudedText from "../text/ExtrudedText";
import { rig } from "../rig";
import { useStopGroup, useProjectHandlers, damp, holdProgress } from "./common";

const FONT = "/fonts/archivo-black.ttf";

/**
 * 02 TİPOGRAFİ. The typographic identity as a chrome word turning toward
 * the hand (its reflections are the stop's cream, cobalt and orange), and
 * a ring of letters orbiting it, each a word of the system. Cream void.
 */
export default function TypographyScene({ lang }: { lang: Lang }) {
  const j = 1;
  const group = useRef<Group>(null);
  const word = useRef<Group>(null);
  const ring = useRef<Group>(null);
  const work = useMemo(() => works.find((w) => w.stop === 2), []);
  const title = work ? upper(L(work.title, lang), lang) : "SES";
  const chromeMat = useMemo(() => chrome({ roughness: 0.04, env: 1.9 }), []);
  const letterMat = useMemo(() => new MeshStandardMaterial({ color: "#ff5a1f", roughness: 0.35, metalness: 0.2, envMapIntensity: 0.8 }), []);
  const letterMat2 = useMemo(() => new MeshStandardMaterial({ color: "#1f3bff", roughness: 0.35, metalness: 0.2, envMapIntensity: 0.8 }), []);
  useEffect(() => () => {
    chromeMat.dispose();
    letterMat.dispose();
    letterMat2.dispose();
  }, [chromeMat, letterMat, letterMat2]);
  useStopGroup(j, group);
  const handlers = useProjectHandlers(lang, work?.slug ?? "");
  const ringWord = useMemo(() => Array.from(upper(lang === "en" ? "silence·sound·width" : "sessizlik·ses·genişlik", lang)), [lang]);
  const touch = store.get().touch;
  const w = STOPS[j].world;
  const oy = touch ? 1.15 : 0.2;

  useFrame(() => {
    const s = store.get();
    const g = word.current;
    if (g) {
      const yawT = s.pointer && !s.reduced ? s.px * 0.5 : 0;
      const pitchT = s.pointer && !s.reduced ? -s.py * 0.22 : 0;
      g.rotation.y = damp(g.rotation.y, yawT + (s.reduced ? 0 : Math.sin(rig.time * 0.3) * 0.08), 0.35, rig.dt);
      g.rotation.x = damp(g.rotation.x, pitchT, 0.35, rig.dt);
      const k = holdProgress(j);
      g.position.y = w[1] + oy + (s.reduced ? 0 : Math.sin(rig.time * 0.6) * 0.08) - (1 - Math.min(1, k * 4)) * 0.4;
    }
    const r = ring.current;
    if (r && !s.reduced) r.rotation.y = rig.time * 0.09;
  });

  const n = ringWord.length;
  const radius = touch ? 2.2 : 3.2;
  // the word keeps to the left of the frame, the project's words take the right;
  // on phones the words sit below, so the word rises and the ring circles above it
  const ox = touch ? 0 : -2.55;
  return (
    <group ref={group}>
      <group ref={word} name="word" position={[w[0] + ox, w[1] + oy, w[2]]} {...(work ? handlers : {})}>
        <ExtrudedText text={title} size={touch ? 1.1 : 1.2} depth={0.5} bevel={0.05} weight={900} stretch="expanded" material={chromeMat} />
      </group>
      <group ref={ring} name="ring" position={[w[0] + ox, w[1] + (touch ? 2.5 : -1.6), w[2]]}>
        {ringWord.map((ch, i) => {
          const a = (i / n) * Math.PI * 2;
          const x = Math.cos(a) * radius;
          const z = Math.sin(a) * radius;
          return (
            <Text key={i} position={[x, (i % 3) * 0.3 - 0.3, z]} rotation={[0, -a + Math.PI / 2, 0]} fontSize={touch ? 0.42 : 0.55} font={FONT} characters={ringWord.join("")} material={i % 2 ? letterMat2 : letterMat} anchorX="center" anchorY="middle">
              {ch}
            </Text>
          );
        })}
      </group>
    </group>
  );
}

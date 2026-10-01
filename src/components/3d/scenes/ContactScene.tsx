"use client";

import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import { Group, Mesh } from "three";
import { store } from "@/lib/store";
import { STOPS } from "@/lib/stops";
import { chrome, neon } from "../materials";
import { rig } from "../rig";
import { useStopGroup, damp } from "./common";

/**
 * 07 İLETİŞİM. Electric blue void; a chrome knot turning slowly behind the
 * words, reflecting white, cyan and pink; three neon beads circling it.
 * The hand's light moves over the chrome.
 */
export default function ContactScene() {
  const j = 6;
  const group = useRef<Group>(null);
  const knot = useRef<Mesh>(null);
  const beads = useRef<Group>(null);
  useStopGroup(j, group);
  const w = STOPS[j].world;
  const touch = store.get().touch;
  const mat = useMemo(() => chrome({ roughness: 0.05, env: 1.8 }), []);
  const beadMats = useMemo(() => [neon("#19e3ff", 2.5), neon("#ff2e88", 2.5), neon("#f7f6f2", 1.8)], []);
  useEffect(() => () => {
    mat.dispose();
    beadMats.forEach((m) => m.dispose());
  }, [mat, beadMats]);
  useFrame(() => {
    const s = store.get();
    const k = knot.current;
    if (k) {
      const tgtY = (s.reduced ? 0.4 : rig.time * 0.1) + (s.pointer && !s.reduced ? s.px * 0.35 : 0);
      k.rotation.y = damp(k.rotation.y, tgtY, 0.6, rig.dt);
      k.rotation.x = damp(k.rotation.x, 0.5 + (s.pointer && !s.reduced ? -s.py * 0.25 : 0), 0.6, rig.dt);
      k.position.y = w[1] + 0.4 + (s.reduced ? 0 : Math.sin(rig.time * 0.35) * 0.15);
    }
    const b = beads.current;
    if (b && !s.reduced) b.rotation.y = -rig.time * 0.25;
  });
  return (
    <group ref={group}>
      <mesh ref={knot} name="knot" position={[w[0], w[1] + (touch ? 3.2 : 0.4), w[2] - (touch ? 13 : 3.5)]} material={mat}>
        <torusKnotGeometry args={[touch ? 1.15 : 2.3, touch ? 0.32 : 0.58, 220, 32, 2, 3]} />
      </mesh>
      <group ref={beads} position={[w[0], w[1] + (touch ? 3.2 : 0.4), w[2] - (touch ? 13 : 3.5)]}>
        {beadMats.map((m, i) => {
          const a = (i / 3) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 4.2, Math.sin(a * 1.7) * 1.1, Math.sin(a) * 4.2]} material={m}>
              <sphereGeometry args={[0.14 + i * 0.04, 24, 16]} />
            </mesh>
          );
        })}
      </group>
      <pointLight position={[w[0] + 5, w[1] + 5, w[2] + 4]} intensity={12} distance={20} color="#19e3ff" decay={2} />
      <pointLight position={[w[0] - 5, w[1] - 2, w[2] + 3]} intensity={8} distance={20} color="#19e3ff" decay={2} />
    </group>
  );
}

"use client";

import { useEffect } from "react";
import { loading, store } from "@/lib/store";

/** Placeholder until the studio is built: marks the scene as loaded. */
export default function Scene() {
  useEffect(() => {
    loading.done("scene");
    store.set({ deboss: false });
  }, []);
  return (
    <>
      <color attach="background" args={["#f6f5f1"]} />
    </>
  );
}

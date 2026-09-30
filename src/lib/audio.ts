"use client";

/**
 * Synthesized studio sounds: a soft paper rustle (filtered pink noise with a
 * short envelope) and a letterpress "thunk" (a low sine thump with a noise
 * click). Nothing is downloaded. Muted by default; the context is created
 * only after the visitor opts in.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let enabled = false;

function pink(c: AudioContext): AudioBuffer {
  const buf = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179;
    b1 = 0.99332 * b1 + w * 0.0750759;
    b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856;
    b4 = 0.55 * b4 + w * 0.5329522;
    b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11;
    b6 = w * 0.115926;
  }
  return buf;
}

function ensure() {
  if (ctx) return ctx;
  ctx = new AudioContext();
  master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  noise = pink(ctx);
  return ctx;
}

export const audio = {
  get enabled() {
    return enabled;
  },
  async toggle(): Promise<boolean> {
    enabled = !enabled;
    const c = ensure();
    if (enabled) {
      if (c.state === "suspended") await c.resume();
      master!.gain.setTargetAtTime(0.8, c.currentTime, 0.3);
    } else {
      master!.gain.setTargetAtTime(0, c.currentTime, 0.2);
    }
    return enabled;
  },
  /** Paper rustle; `amount` 0..1 scales loudness and length. */
  rustle(amount = 0.5) {
    if (!enabled || !ctx || !master || !noise) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.playbackRate.value = 0.8 + Math.random() * 0.5;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1800 + Math.random() * 1200;
    bp.Q.value = 0.7;
    const g = ctx.createGain();
    const len = 0.12 + amount * 0.25;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.06 + amount * 0.1, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0005, t + len);
    src.connect(bp).connect(g).connect(master);
    src.start(t, Math.random() * 2);
    src.stop(t + len + 0.05);
  },
  /** The letterpress thunk. */
  thunk() {
    if (!enabled || !ctx || !master || !noise) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(140, t);
    o.frequency.exponentialRampToValueAtTime(55, t + 0.12);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5, t + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0005, t + 0.22);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.25);
    const src = ctx.createBufferSource();
    src.buffer = noise;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 900;
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.25, t);
    g2.gain.exponentialRampToValueAtTime(0.0005, t + 0.05);
    src.connect(lp).connect(g2).connect(master);
    src.start(t, Math.random());
    src.stop(t + 0.06);
  },
};

/**
 * A minimal WebM (Matroska) writer for one VP9 video track, used inside the
 * capture page. EBML elements are written with known sizes; one cluster per
 * ~5 s. Enough for a muted, looping <video>. Runs in the browser (no Node
 * APIs) — this module's source is injected into the page as a string.
 */
export const WEBM_SOURCE = String.raw`
(() => {
  const enc = new TextEncoder();
  const vint = (n) => {
    // EBML variable-size integer, 1–8 bytes
    let len = 1;
    while (n >= Math.pow(2, 7 * len) - 1 && len < 8) len++;
    const out = new Uint8Array(len);
    let v = n;
    for (let i = len - 1; i >= 0; i--) { out[i] = v & 0xff; v = Math.floor(v / 256); }
    out[0] |= 0x80 >> (len - 1);
    return out;
  };
  const uint = (n, bytes) => {
    if (!bytes) { bytes = 1; while (n >= Math.pow(2, 8 * bytes) && bytes < 8) bytes++; }
    const out = new Uint8Array(bytes);
    let v = n;
    for (let i = bytes - 1; i >= 0; i--) { out[i] = v & 0xff; v = Math.floor(v / 256); }
    return out;
  };
  const float = (x) => { const b = new ArrayBuffer(8); new DataView(b).setFloat64(0, x); return new Uint8Array(b); };
  const idBytes = (id) => { const b = []; let v = id; while (v > 0) { b.unshift(v & 0xff); v = Math.floor(v / 256); } return new Uint8Array(b); };
  const cat = (parts) => { let n = 0; for (const p of parts) n += p.length; const out = new Uint8Array(n); let o = 0; for (const p of parts) { out.set(p, o); o += p.length; } return out; };
  const el = (id, payload) => cat([idBytes(id), vint(payload.length), payload]);
  const str = (id, s) => el(id, enc.encode(s));

  function mux({ width, height, fps, chunks }) {
    // chunks: [{ data: Uint8Array, timestamp (µs), key: boolean }]
    const durationMs = (chunks.length / fps) * 1000;
    const header = el(0x1a45dfa3, cat([
      el(0x4286, uint(1)), el(0x42f7, uint(1)), el(0x42f2, uint(4)), el(0x42f3, uint(8)),
      str(0x4282, "webm"), el(0x4287, uint(4)), el(0x4285, uint(2)),
    ]));
    const info = el(0x1549a966, cat([el(0x2ad7b1, uint(1000000)), el(0x4489, float(durationMs)), str(0x4d80, "elifgezgin capture"), str(0x5741, "elifgezgin capture")]));
    const video = el(0xe0, cat([el(0xb0, uint(width)), el(0xba, uint(height))]));
    const track = el(0xae, cat([el(0xd7, uint(1)), el(0x73c5, uint(1)), el(0x83, uint(1)), el(0x9c, uint(0)), str(0x86, "V_VP9"), video]));
    const tracks = el(0x1654ae6b, track);
    const clusters = [];
    let clusterStart = 0;
    let blocks = [];
    const flush = () => {
      if (!blocks.length) return;
      clusters.push(el(0x1f43b675, cat([el(0xe7, uint(clusterStart)), ...blocks])));
      blocks = [];
    };
    for (const c of chunks) {
      const tMs = Math.round(c.timestamp / 1000);
      if (tMs - clusterStart >= 5000 && c.key) { flush(); clusterStart = tMs; }
      const rel = tMs - clusterStart;
      const head = new Uint8Array([0x81, (rel >> 8) & 0xff, rel & 0xff, c.key ? 0x80 : 0x00]);
      blocks.push(el(0xa3, cat([head, c.data])));
    }
    flush();
    const segmentPayload = cat([info, tracks, ...clusters]);
    const segment = cat([idBytes(0x18538067), vint(segmentPayload.length), segmentPayload]);
    return cat([header, segment]);
  }
  window.__muxWebm = mux;
})();
`;

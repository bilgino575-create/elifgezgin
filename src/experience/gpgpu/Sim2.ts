import {
  BufferGeometry,
  ClampToEdgeWrapping,
  DataTexture,
  Float32BufferAttribute,
  FloatType,
  GLSL3,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  WebGLRenderTarget,
  type WebGLRenderer,
} from "three";

/**
 * Position + velocity ping-pong with multiple render targets: one fragment
 * pass writes both textures. Rest positions live in a static DataTexture.
 * No allocation after construction; `step` swaps buffers.
 */
const VERT = /* glsl */ `
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const tri = new BufferGeometry();
tri.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
tri.setAttribute("uv", new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

function mrt(w: number, h: number) {
  return new WebGLRenderTarget(w, h, {
    count: 2,
    type: FloatType,
    format: RGBAFormat,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    wrapS: ClampToEdgeWrapping,
    wrapT: ClampToEdgeWrapping,
    depthBuffer: false,
    stencilBuffer: false,
    generateMipmaps: false,
  });
}

export class Sim2 {
  private a: WebGLRenderTarget;
  private b: WebGLRenderTarget;
  private scene = new Scene();
  private cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: Mesh;
  private seeded = false;
  readonly material: ShaderMaterial;
  readonly rest: DataTexture;
  readonly init: DataTexture;
  constructor(readonly w: number, readonly h: number, rest: Float32Array, initPos: Float32Array, frag: string, uniforms: Record<string, { value: unknown }>) {
    this.a = mrt(w, h);
    this.b = mrt(w, h);
    this.rest = new DataTexture(rest, w, h, RGBAFormat, FloatType);
    this.rest.minFilter = this.rest.magFilter = NearestFilter;
    this.rest.needsUpdate = true;
    this.init = new DataTexture(initPos, w, h, RGBAFormat, FloatType);
    this.init.minFilter = this.init.magFilter = NearestFilter;
    this.init.needsUpdate = true;
    this.material = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: frag,
      glslVersion: GLSL3,
      depthTest: false,
      depthWrite: false,
      uniforms: { uPos: { value: this.init }, uVel: { value: null }, uRest: { value: this.rest }, uDt: { value: 0.016 }, uSeeded: { value: 0 }, ...uniforms },
    });
    this.quad = new Mesh(tri, this.material);
    this.scene.add(this.quad);
  }
  get position() {
    return this.seeded ? this.a.textures[0] : this.init;
  }
  step(renderer: WebGLRenderer, dt: number) {
    const prevRT = renderer.getRenderTarget();
    const prevAuto = renderer.autoClear;
    renderer.autoClear = false;
    const u = this.material.uniforms;
    u.uPos.value = this.seeded ? this.a.textures[0] : this.init;
    u.uVel.value = this.seeded ? this.a.textures[1] : null;
    u.uSeeded.value = this.seeded ? 1 : 0;
    u.uDt.value = Math.min(dt, 1 / 30);
    renderer.setRenderTarget(this.b);
    renderer.render(this.scene, this.cam);
    renderer.setRenderTarget(prevRT);
    renderer.autoClear = prevAuto;
    const t = this.a;
    this.a = this.b;
    this.b = t;
    this.seeded = true;
  }
  reset() {
    this.seeded = false;
  }
  dispose() {
    this.a.dispose();
    this.b.dispose();
    this.rest.dispose();
    this.init.dispose();
    this.material.dispose();
  }
}

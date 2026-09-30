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
 * A small ping-pong simulation: one RGBA float state texture per particle,
 * stepped by a fragment shader. Used by the portrait's spring-back dots.
 */
const VERT = /* glsl */ `
out vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;
const tri = new BufferGeometry();
tri.setAttribute("position", new Float32BufferAttribute([-1, -1, 0, 3, -1, 0, -1, 3, 0], 3));
tri.setAttribute("uv", new Float32BufferAttribute([0, 0, 2, 0, 0, 2], 2));

export class Sim {
  private a: WebGLRenderTarget;
  private b: WebGLRenderTarget;
  private scene = new Scene();
  private cam = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
  private quad: Mesh;
  material: ShaderMaterial;
  readonly rest: DataTexture;
  constructor(
    readonly w: number,
    readonly h: number,
    init: Float32Array,
    frag: string,
    uniforms: Record<string, { value: unknown }>
  ) {
    const mk = () =>
      new WebGLRenderTarget(w, h, { type: FloatType, format: RGBAFormat, minFilter: NearestFilter, magFilter: NearestFilter, wrapS: ClampToEdgeWrapping, wrapT: ClampToEdgeWrapping, depthBuffer: false, stencilBuffer: false, generateMipmaps: false });
    this.a = mk();
    this.b = mk();
    this.rest = new DataTexture(init, w, h, RGBAFormat, FloatType);
    this.rest.minFilter = this.rest.magFilter = NearestFilter;
    this.rest.needsUpdate = true;
    this.material = new ShaderMaterial({ vertexShader: VERT, fragmentShader: frag, glslVersion: GLSL3, depthTest: false, depthWrite: false, uniforms: { uState: { value: this.rest }, uRest: { value: this.rest }, uDt: { value: 0.016 }, ...uniforms } });
    this.quad = new Mesh(tri, this.material);
    this.scene.add(this.quad);
    this.seeded = false;
  }
  private seeded: boolean;
  get texture() {
    return this.seeded ? this.a.texture : this.rest;
  }
  step(renderer: WebGLRenderer, dt: number) {
    const prevRT = renderer.getRenderTarget();
    const prevAuto = renderer.autoClear;
    renderer.autoClear = false;
    this.material.uniforms.uState.value = this.seeded ? this.a.texture : this.rest;
    this.material.uniforms.uDt.value = Math.min(dt, 1 / 30);
    renderer.setRenderTarget(this.b);
    renderer.render(this.scene, this.cam);
    renderer.setRenderTarget(prevRT);
    renderer.autoClear = prevAuto;
    const t = this.a;
    this.a = this.b;
    this.b = t;
    this.seeded = true;
  }
  dispose() {
    this.a.dispose();
    this.b.dispose();
    this.rest.dispose();
    this.material.dispose();
  }
}

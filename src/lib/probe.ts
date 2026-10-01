/**
 * Runs inline in <head> before paint. Decides, without React:
 *  - html.js (the document is scripted; the stop layers stack as pages)
 *  - html.gl / html.nogl (a WebGL2 context can be made without a major performance caveat and the
 *    renderer is not software — SwiftShader, llvmpipe, remote desktops; `?nogl` forces the 2D journey,
 *    `?gl=1` forces the stage)
 *  - html.touch / html.fine (primary input)
 *  - html.reduced (prefers-reduced-motion)
 *  - --vh (a stable viewport unit on phones)
 *  - window.__tier (a first guess at the quality tier, refined by the stage)
 * Everything here is cheap and synchronous so the first paint already has the right layout.
 */
export const probeScript = `(function(){
var h=document.documentElement,c=h.classList,q=location.search;
c.remove('nojs');c.add('js');
var touch=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window&&navigator.maxTouchPoints>0);
c.add(touch?'touch':'fine');
if(matchMedia('(prefers-reduced-motion:reduce)').matches)c.add('reduced');
var gl=false;
var force=/[?&]gl=1/.test(q);
if(!/[?&]nogl/.test(q)){try{var cv=document.createElement('canvas');var g=cv.getContext('webgl2',{failIfMajorPerformanceCaveat:!force});gl=!!g;
if(g){var ri=g.getExtension('WEBGL_debug_renderer_info');var r=String((ri&&g.getParameter(ri.UNMASKED_RENDERER_WEBGL))||g.getParameter(g.RENDERER)||'');
if(!force&&/swiftshader|llvmpipe|lavapipe|softpipe|software|mesa offscreen|vmware|virtualbox|microsoft basic|\bwarp\b|citrix|rdp|parallels/i.test(r))gl=false;
var l=g.getExtension('WEBGL_lose_context');l&&l.loseContext();}}catch(e){gl=false}}
c.add(gl?'gl':'nogl');
var m=/[?&]tier=(ultra|high|mid|low)/.exec(q);
var mem=navigator.deviceMemory||8,cores=navigator.hardwareConcurrency||8;
var tier=m?m[1]:(touch?(mem>=6&&cores>=6?'mid':'low'):(mem>=8&&cores>=8?'high':'mid'));
window.__tier=tier;
h.style.setProperty('--vh',(window.innerHeight*0.01)+'px');
})();`;

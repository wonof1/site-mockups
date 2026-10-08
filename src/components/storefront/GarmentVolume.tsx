"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useMotionValue } from "framer-motion";

const WIDTH = 280, HEIGHT = 360;
const spring = { type: "spring" as const, stiffness: 115, damping: 24, mass: .85 };
type Props = { src: string; size: number[]; collars: number[][]; angle: number; reduced: boolean };

// Reuse downloaded geometry across colours and return navigation.
const meshes = new Map<string, Promise<ArrayBuffer>>();
function loadMesh(style: string) {
  let mesh = meshes.get(style);
  if (!mesh) {
    mesh = fetch(`/storefront/clothing-rail/meshes/${style}.bin.gz`)
      .then(response => {
        if (!response.ok || !response.body) throw new Error("Garment mesh unavailable");
        return new Response(response.body.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer();
      }).catch(error => { meshes.delete(style); throw error; });
    meshes.set(style, mesh);
  }
  return mesh;
}

const vertexShader = `
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
attribute float face;
uniform float angle;
varying vec2 vUV;
varying vec3 vNormal;
varying float vFace;
void main() {
  float c = cos(angle), s = sin(angle);
  mat3 turn = mat3(c, 0., -s, 0., 1., 0., s, 0., c);
  vec3 p = turn * vec3(position.x - 140., position.y - 27., position.z);
  float perspective = 900. / (900. - p.z);
  gl_Position = vec4((p.x * perspective + 140.) / 140. - 1.,
    1. - (p.y * perspective + 27.) / 180., -p.z / 320., 1.);
  vNormal = turn * normal; vUV = uv; vFace = face;
}`;
const fragmentShader = `
precision mediump float;
uniform sampler2D front;
uniform sampler2D back;
uniform float paired;
varying vec2 vUV;
varying vec3 vNormal;
varying float vFace;
void main() {
  float side = mod(vFace, 3.);
  bool rear = side > .5 && side < 1.5;
  vec2 coord = rear && paired > .5 ? vec2(1.-vUV.x,vUV.y) : vUV;
  vec4 cloth = rear && paired > .5 ? texture2D(back,coord) : texture2D(front,coord);
  vec4 plain = texture2D(front,vec2(.38,.60));
  // Unphotographed side seams inherit the textile, never white/alpha pixels.
  vec3 base = mix(plain.rgb, cloth.rgb, smoothstep(.05,.95,cloth.a));
  if (rear && paired < .5) base = texture2D(front,vec2(.38,clamp(vUV.y,.45,.72))).rgb;
  vec3 n = normalize(vNormal);
  if (!gl_FrontFacing) n = -n;
  float key = max(0.,dot(n,normalize(vec3(-.55,-.6,1.))));
  float fill = max(0.,dot(n,normalize(vec3(.7,.1,-.4))));
  float light = .80 + .18*key + .06*fill;
  if(!gl_FrontFacing) light *= .48;
  float weave = .994 + .006*sin(vUV.x*2400.)*sin(vUV.y*2800.);
  gl_FragColor = vec4(base*light*weave,1.);
}`;

/** Hollow torso and sleeve meshes rotate together, using the product photographs as textures. */
function createVolume(canvas: HTMLCanvasElement, image: HTMLImageElement, size: number[], collars: number[][], mesh: ArrayBuffer) {
  const context = canvas.getContext("webgl", { alpha: true, antialias: true, premultipliedAlpha: false });
  if (!context) throw new Error("WebGL unavailable");
  const gl: WebGLRenderingContext = context;
  const shaders: WebGLShader[] = [], buffers: WebGLBuffer[] = [], textures: WebGLTexture[] = [];
  const program = gl.createProgram()!;
  function dispose() {
    buffers.forEach(b => gl.deleteBuffer(b)); textures.forEach(t => gl.deleteTexture(t));
    shaders.forEach(s => gl.deleteShader(s)); gl.deleteProgram(program);
    gl.getExtension("WEBGL_lose_context")?.loseContext();
  }
  try {
    for (const [kind, source] of [[gl.VERTEX_SHADER, vertexShader], [gl.FRAGMENT_SHADER, fragmentShader]] as const) {
      const shader = gl.createShader(kind)!; shaders.push(shader);
      gl.shaderSource(shader, source); gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || "Garment shader failed");
      gl.attachShader(program, shader);
    }
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error("Garment program failed");
    gl.useProgram(program);
    const views = [0, 1].map(face => {
      const texture = document.createElement("canvas"); texture.width = WIDTH * 2; texture.height = HEIGHT * 2;
      const ctx = texture.getContext("2d")!;
      ctx.scale(2, 2);
      const paired = collars.length === 2;
      const [x, y] = collars[paired ? face : 0];
      const scale = WIDTH * (paired ? 1.64 : .98) / size[0];
      const offset = paired ? face * image.naturalWidth / 2 : 0;
      const sourceWidth = paired ? image.naturalWidth / 2 : image.naturalWidth;
      ctx.drawImage(image, offset, 0, sourceWidth, image.naturalHeight,
        WIDTH / 2 - x * scale + (paired ? face * size[0] / 2 * scale : 0),
        27 - y * scale, size[0] / (paired ? 2 : 1) * scale, size[1] * scale);
      return texture;
    });
    const header = new Uint32Array(mesh, 0, 4);
    const packed = new Int16Array(mesh, 16, header[0] * 9);
    const vertices = Float32Array.from(packed, (value, i) => value / (i % 9 < 3 ? 50 : 10000));
    const indices = new Uint32Array(mesh, header[2], header[1]);
    if (!gl.getExtension("OES_element_index_uint")) throw new Error("Indexed garment meshes unavailable");
    const indexBuffer = gl.createBuffer()!; buffers.push(indexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    const buffer = gl.createBuffer()!; buffers.push(buffer); gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    let offset = 0;
    for (const [name, count] of [["position", 3], ["normal", 3], ["uv", 2], ["face", 1]] as const) {
      const attribute = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(attribute); gl.vertexAttribPointer(attribute, count, gl.FLOAT, false, 36, offset * 4); offset += count;
    }
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
    gl.uniform1f(gl.getUniformLocation(program, "paired"), collars.length === 2 ? 1 : 0);
    views.forEach((view, i) => {
      const texture = gl.createTexture()!; textures.push(texture);
      gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, view);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(program, i ? "back" : "front"), i);
    });
    const angleUniform = gl.getUniformLocation(program, "angle");
    gl.frontFace(gl.CW); gl.enable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = WIDTH * ratio; canvas.height = HEIGHT * ratio;
    gl.viewport(0, 0, canvas.width, canvas.height);
    return { dispose, draw(degrees: number) {
      gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.uniform1f(angleUniform, degrees * Math.PI / 180); gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_INT, 0);
    } };
  } catch (error) { dispose(); throw error; }
}

export function GarmentVolume({ src, size, collars, angle: target, reduced }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const angle = useMotionValue(target);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const animation = animate(angle, target, reduced ? { duration: 0 } : spring);
    return () => animation.stop();
  }, [angle, target, reduced]);
  useEffect(() => {
    let cancelled = false, frame = 0;
    let renderer: ReturnType<typeof createVolume> | undefined;
    let unsubscribe: (() => void) | undefined;
    const image = new Image(); image.src = src;
    setReady(false);
    const style = src.includes('court-tee') ? 'court' : src.includes('tee') ? 'tee' : src.includes('quarter-zip') ? 'quarter' : src.includes('-5.') ? 'sweat-short' : 'sweat';
    Promise.all([image.decode(), loadMesh(style)]).then(([,mesh]) => {
      if (cancelled || !canvas.current) return;
      try {
        renderer = createVolume(canvas.current, image, size, collars, mesh);
        renderer.draw(angle.get()); setReady(true);
        unsubscribe = angle.on("change", () => {
          cancelAnimationFrame(frame);
          frame = requestAnimationFrame(() => renderer?.draw(angle.get()));
        });
      } catch { /* Keep the ordinary product image when WebGL is unavailable. */ }
    }).catch(() => {});
    const lost = (event: Event) => { event.preventDefault(); setReady(false); };
    const element = canvas.current; element?.addEventListener("webglcontextlost", lost);
    return () => { cancelled = true; cancelAnimationFrame(frame); unsubscribe?.(); renderer?.dispose(); element?.removeEventListener("webglcontextlost", lost); };
  }, [src, size, collars, angle]);
  const paired = collars.length === 2;
  const imageWidth = WIDTH * (paired ? 1.64 : .98), scale = imageWidth / size[0];
  const [x, y] = collars[0];
  return <span className="rail-volume" data-ready={ready}>
    <canvas ref={canvas} aria-hidden="true" />
    <span className="rail-volume-fallback" style={{ transform: `rotateY(${target}deg)` }}><img src={src} alt="" draggable={false} style={{ width: `${imageWidth / WIDTH * 100}%`, left: `${(WIDTH / 2 - x * scale) / WIDTH * 100}%`, top: `${(27 - y * scale) / HEIGHT * 100}%`, clipPath: paired ? "inset(0 50% 0 0)" : undefined }} /></span>
  </span>;
}

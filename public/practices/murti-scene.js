import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let renderer, scene, camera, controls, root, fxRoot, kalash, sanctumRoot;
let current = null;
let canvasEl = null;
let running = false;
let lastT = 0;
let clockT = 0;
let reduced = false;
let loadGen = 0;

const drops = [];
const petals = [];
const smokes = [];
const marks = [];
const mists = [];
let aartiLamp = null;
let aartiT = 0;
let kalashAnim = null;
let wetSim = null;
let applicator = null;
let revealAnim = null;
let sunLight = null;
let fillLight = null;
let hemLight = null;
let diyaMap = null;
let flameMap = null;
let flameFallback = null;
let dropSpriteMat = null;
let milkSpriteMat = null;
let oilSpriteMat = null;
let mistMat = null;
let sparkMat = null;

const mats = {};
const _v = new THREE.Vector3();

const WET_VERT = [
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
  "}",
].join("\n");

const WET_FRAG = [
  "uniform sampler2D uWet;",
  "uniform float uKind;",
  "varying vec2 vUv;",
  "void main() {",
  "  vec4 w = texture2D(uWet, vUv);",
  "  if (w.a < 0.02) discard;",
  "  float spec = pow(w.r, 2.4);",
  "  vec3 dark = mix(vec3(0.12, 0.16, 0.2), vec3(0.46, 0.4, 0.32), uKind);",
  "  vec3 gloss = mix(vec3(0.82, 0.92, 0.98), vec3(0.97, 0.94, 0.88), uKind);",
  "  vec3 col = mix(dark, gloss, spec);",
  "  gl_FragColor = vec4(col, w.a * 0.42 + spec * 0.22);",
  "}",
].join("\n");

function bodyMap(spec) {
  spec = spec || {};
  const cx = spec.crownX != null ? spec.crownX : 0.5;
  return {
    pose: spec.pose || "standing",
    crownX: cx,
    crown: spec.crown != null ? spec.crown : 0.08,
    browX: spec.browX != null ? spec.browX : cx,
    brow: spec.brow != null ? spec.brow : 0.24,
    feetX: spec.feetX != null ? spec.feetX : cx,
    feetY: spec.feetY != null ? spec.feetY : 0.9,
  };
}

function uvToLocal(u, v, width, height, y0, z) {
  return new THREE.Vector3((u - 0.5) * width, y0 + (0.5 - v) * height, z);
}

function mat(name, opts) {
  if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial(opts);
  return mats[name];
}

function readyMats() {
  mat("bronze", { color: 0xb07840, metalness: 0.62, roughness: 0.38 });
  mat("gold", { color: 0xc49a4a, metalness: 0.72, roughness: 0.3 });
  mat("marble", { color: 0xf0e6d6, metalness: 0.04, roughness: 0.32 });
  mat("sand", { color: 0xc4a07a, metalness: 0.04, roughness: 0.82 });
  mat("cream", { color: 0xf3ece0, metalness: 0.04, roughness: 0.42 });
  mat("water", { color: 0x8ec8ea, roughness: 0.08, metalness: 0.04, transparent: true, opacity: 0.5 });
  mat("milk", { color: 0xf7f2e8, roughness: 0.16, metalness: 0.04, transparent: true, opacity: 0.82 });
  mat("kumkum", { color: 0xc4452d, roughness: 0.55, metalness: 0.05 });
  mat("chandan", { color: 0xe8d09a, roughness: 0.48, metalness: 0.04 });
  mat("bhasma", { color: 0xe8e2d6, roughness: 0.62, metalness: 0.02 });
  mat("petal", { color: 0xf2b7a0, roughness: 0.5, metalness: 0.04 });
  mat("leaf", { color: 0x6a9a4a, roughness: 0.55, metalness: 0.04 });
  mat("flame", { color: 0xffc14a, emissive: 0xff9a1a, emissiveIntensity: 1.6, roughness: 0.4 });
}

function mesh(geo, m, x, y, z, sx, sy, sz) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x || 0, y || 0, z || 0);
  if (sx != null) o.scale.set(sx, sy ?? sx, sz ?? sx);
  o.castShadow = true;
  o.receiveShadow = true;
  return o;
}

function dummy(x, y, z) {
  const a = new THREE.Object3D();
  a.position.set(x || 0, y || 0, z || 0);
  return a;
}

function lathe(pts, m, x, y, z, seg) {
  return mesh(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg || 36), m, x, y, z);
}

function worldOf(obj) {
  obj.getWorldPosition(_v);
  return _v.clone();
}

function radialTex(stops, size) {
  const s = size || 256;
  const c = document.createElement("canvas");
  c.width = s;
  c.height = s;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(s / 2, s / 2, 2, s / 2, s / 2, s / 2);
  stops.forEach((st) => g.addColorStop(st[0], st[1]));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function ensureFxMats() {
  if (dropSpriteMat) return;
  const dropTex = radialTex([
    [0, "rgba(255,255,255,0.95)"],
    [0.22, "rgba(210,236,250,0.8)"],
    [0.55, "rgba(150,206,236,0.28)"],
    [1, "rgba(120,180,220,0)"],
  ], 64);
  dropSpriteMat = new THREE.SpriteMaterial({
    map: dropTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.9, toneMapped: false,
  });
  const milkTex = radialTex([
    [0, "rgba(255,255,250,0.95)"],
    [0.3, "rgba(246,240,224,0.75)"],
    [0.7, "rgba(236,226,204,0.2)"],
    [1, "rgba(236,226,204,0)"],
  ], 64);
  milkSpriteMat = new THREE.SpriteMaterial({
    map: milkTex, transparent: true, depthWrite: false, opacity: 0.88, toneMapped: false,
  });
  const oilTex = radialTex([
    [0, "rgba(255,220,150,0.9)"],
    [0.4, "rgba(140,90,30,0.55)"],
    [1, "rgba(80,50,16,0)"],
  ], 64);
  oilSpriteMat = new THREE.SpriteMaterial({
    map: oilTex, transparent: true, depthWrite: false, opacity: 0.8, toneMapped: false,
  });
  const mistTex = radialTex([
    [0, "rgba(230,245,255,0.45)"],
    [0.45, "rgba(200,230,250,0.16)"],
    [1, "rgba(180,220,245,0)"],
  ], 128);
  mistMat = new THREE.SpriteMaterial({
    map: mistTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.55, toneMapped: false,
  });
  const sparkTex = radialTex([
    [0, "rgba(255,255,255,1)"],
    [0.25, "rgba(220,245,255,0.7)"],
    [1, "rgba(180,220,255,0)"],
  ], 32);
  sparkMat = new THREE.SpriteMaterial({
    map: sparkTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 1, toneMapped: false,
  });
}

function dropMatFor(kind) {
  if (kind === "milk") return milkSpriteMat;
  if (kind === "oil") return oilSpriteMat;
  return dropSpriteMat;
}

function pedestal() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.1, 40), mats.marble, 0, 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.52, 0.6, 0.18, 32), mats.sand, 0, 0.18, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.54, 0.52, 0.045, 32), mats.gold, 0, 0.3, 0));
  return g;
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("murti image failed"));
    im.src = url;
  });
}

function punchBackground(img) {
  const maxW = 900;
  const scale = Math.min(1, maxW / img.width);
  const w = Math.max(2, Math.round(img.width * scale));
  const h = Math.max(2, Math.round(img.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  let edgeClear = 0;
  let edgeN = 0;
  for (let x = 0; x < w; x++) {
    if (d[x * 4 + 3] < 10) edgeClear += 1;
    if (d[((h - 1) * w + x) * 4 + 3] < 10) edgeClear += 1;
    edgeN += 2;
  }
  if (edgeN && edgeClear / edgeN > 0.18) {
    return { canvas: c, data: imgData, w, h, preCut: true };
  }
  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const corners = [sample(2, 2), sample(w - 3, 2), sample(2, h - 3), sample(w - 3, h - 3)];
  const bg = [0, 0, 0];
  corners.forEach((p) => { bg[0] += p[0]; bg[1] += p[1]; bg[2] += p[2]; });
  bg[0] /= 4; bg[1] /= 4; bg[2] /= 4;
  const bgSat = Math.max(bg[0], bg[1], bg[2]) - Math.min(bg[0], bg[1], bg[2]);
  const bgLuma = 0.299 * bg[0] + 0.587 * bg[1] + 0.114 * bg[2];
  const dist = (x, y) => {
    const i = (y * w + x) * 4;
    const dr = d[i] - bg[0];
    const dg = d[i + 1] - bg[1];
    const db = d[i + 2] - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };
  const satAt = (x, y) => {
    const i = (y * w + x) * 4;
    return Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]);
  };
  const lumaAt = (x, y) => {
    const i = (y * w + x) * 4;
    return 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
  };
  const thresh = bgLuma < 40 ? 48 : 74;
  const visited = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    const di = dist(x, y);
    const s = satAt(x, y);
    const lu = lumaAt(x, y);
    if (s > bgSat + 40 && di > 26) return;
    if (bgLuma < 40) {
      if (!(lu < 42 && s < 22)) return;
    } else if (di > thresh && !(s < 14 && lu > 232)) return;
    visited[p] = 1;
    stack.push(p);
  };
  for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
  for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
  while (stack.length) {
    const p = stack.pop();
    const x = p % w;
    const y = (p / w) | 0;
    d[p * 4 + 3] = 0;
    push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
  }
  ctx.putImageData(imgData, 0, 0);
  return { canvas: c, data: imgData, w, h, preCut: false };
}

function rowBounds(imgData, w, h) {
  const minX = new Int16Array(h).fill(-1);
  const maxX = new Int16Array(h).fill(-1);
  const d = imgData.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (d[(y * w + x) * 4 + 3] >= 24) {
        if (minX[y] < 0) minX[y] = x;
        maxX[y] = x;
      }
    }
  }
  return { minX, maxX };
}

function makeHalo() {
  const g = new THREE.Group();
  const innerTex = radialTex([
    [0, "rgba(255,244,210,0.95)"],
    [0.18, "rgba(255,214,140,0.55)"],
    [0.42, "rgba(255,176,90,0.18)"],
    [1, "rgba(255,160,70,0)"],
  ], 256);
  const outerTex = radialTex([
    [0, "rgba(255,230,180,0.55)"],
    [0.35, "rgba(255,186,110,0.18)"],
    [0.7, "rgba(255,160,90,0.05)"],
    [1, "rgba(255,150,80,0)"],
  ], 256);
  const inner = new THREE.Sprite(new THREE.SpriteMaterial({
    map: innerTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.0, toneMapped: false,
  }));
  inner.scale.set(1.7, 2.05, 1);
  inner.position.z = -0.12;
  const outer = new THREE.Sprite(new THREE.SpriteMaterial({
    map: outerTex, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, opacity: 0.0, toneMapped: false,
  }));
  outer.scale.set(2.6, 3.1, 1);
  outer.position.z = -0.2;
  g.add(outer, inner);
  g.userData.inner = inner;
  g.userData.outer = outer;
  return g;
}

async function makeStatue(spec) {
  const g = new THREE.Group();
  g.add(pedestal());
  const img = await loadImage(spec.src);
  const punched = punchBackground(img);
  const tex = new THREE.CanvasTexture(punched.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  const aspect = punched.w / punched.h;
  const height = 1.72;
  const width = Math.min(1.22, height * aspect);
  const y0 = 0.34 + height / 2;
  const B = bodyMap(spec);

  const halo = makeHalo();
  halo.position.set((B.crownX - 0.5) * width * 0.25, y0 + 0.02, -0.08);
  g.add(halo);

  const geo = new THREE.PlaneGeometry(width, height);
  geo.userData.localGeo = true;
  const matFront = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.08,
    depthWrite: false,
    toneMapped: false,
  });
  matFront.userData.localMat = true;
  matFront.userData.localTex = true;
  const front = new THREE.Mesh(geo, matFront);
  front.position.set(0, y0, 0.02);
  front.renderOrder = 1;
  g.add(front);

  const wetC = document.createElement("canvas");
  wetC.width = punched.w;
  wetC.height = punched.h;
  const wetCtx = wetC.getContext("2d");
  const wetImg = wetCtx.createImageData(punched.w, punched.h);
  const wetTex = new THREE.CanvasTexture(wetC);
  wetTex.needsUpdate = true;
  const wetMat = new THREE.ShaderMaterial({
    uniforms: { uWet: { value: wetTex }, uKind: { value: 0 } },
    vertexShader: WET_VERT,
    fragmentShader: WET_FRAG,
    transparent: true,
    depthWrite: false,
  });
  wetMat.userData.localMat = true;
  const wetMesh = new THREE.Mesh(geo, wetMat);
  wetMesh.position.set(0, y0, 0.03);
  wetMesh.renderOrder = 2;
  g.add(wetMesh);

  const zFace = 0.05;
  const at = (u, v, z) => { const p = uvToLocal(u, v, width, height, y0, z); return dummy(p.x, p.y, p.z); };
  const crown = at(B.crownX, B.crown, zFace);
  const brow = at(B.browX, B.brow, zFace + 0.01);
  const chest = at(B.crownX, 0.52, zFace);
  const hands = at(B.crownX, 0.58, zFace);
  const feet = at(B.feetX, B.feetY, zFace);
  const base = dummy(0, 0.34, 0.08);
  g.add(crown, brow, chest, hands, feet, base);

  const bounds = rowBounds(punched.data, punched.w, punched.h);
  const puddle = mesh(new THREE.CircleGeometry(0.2, 28), mats.water.clone(), 0, 0.331, 0.1);
  puddle.rotation.x = -Math.PI / 2;
  puddle.material.transparent = true;
  puddle.material.opacity = 0;
  puddle.castShadow = false;
  g.add(puddle);

  g.userData.anchors = { crown, forehead: brow, chest, hands, feet, base };
  g.userData.coatMesh = front;
  g.userData.frontMat = matFront;
  g.userData.halo = halo;
  g.userData.puddle = puddle;
  g.userData.kind = "statue";
  g.userData.deityId = spec.id;
  g.userData.family = spec.family;
  g.userData.pose = B.pose;
  g.userData.faceR = width * 0.22;
  g.userData.pixel = {
    crown: { x: B.crownX * (punched.w - 1), y: B.crown * (punched.h - 1) },
    brow: { x: B.browX * (punched.w - 1), y: B.brow * (punched.h - 1) },
    feetY: B.feetY * (punched.h - 1),
    feetX: B.feetX * (punched.w - 1),
  };
  g.userData.wet = {
    canvas: wetC, ctx: wetCtx, tex: wetTex, imgData: wetImg,
    w: punched.w, h: punched.h, alpha: punched.data,
    minX: bounds.minX, maxX: bounds.maxX,
  };
  return g;
}

function disposeGroup(g) {
  if (!g) return;
  g.traverse((c) => {
    if (c.geometry && c.geometry.userData && c.geometry.userData.localGeo) c.geometry.dispose();
    if (c.material) {
      const list = Array.isArray(c.material) ? c.material : [c.material];
      list.forEach((m) => {
        if (m.map && m.userData && m.userData.localTex) m.map.dispose();
        if (m.userData && m.userData.localMat) m.dispose();
      });
    }
  });
}

function makeKalash() {
  const g = new THREE.Group();
  g.add(lathe(
    [[0.0, 0], [0.09, 0.02], [0.12, 0.08], [0.125, 0.16], [0.08, 0.24], [0.045, 0.3], [0.05, 0.33]],
    mats.gold,
  ));
  g.add(mesh(new THREE.TorusGeometry(0.05, 0.01, 8, 16), mats.gold, 0, 0.32, 0));
  const spout = lathe([[0.0, 0], [0.022, 0.01], [0.018, 0.07], [0.0, 0.09]], mats.gold);
  spout.rotation.z = 1.15;
  spout.position.set(-0.11, 0.26, 0);
  g.add(spout);
  const lip = dummy(-0.16, 0.22, 0);
  g.add(lip);
  g.userData.spout = lip;
  g.visible = false;
  g.scale.setScalar(1.15);
  return g;
}

function addDrop(kind, x, y, z, vx, vy, vz, life, role) {
  ensureFxMats();
  const matRef = dropMatFor(kind).clone();
  matRef.userData.localMat = true;
  const s = new THREE.Sprite(matRef);
  const stream = role === "stream";
  const splash = role === "splash";
  const sx = stream ? 0.034 : splash ? 0.022 : 0.018;
  const sy = stream ? 0.055 : splash ? 0.022 : 0.028;
  s.scale.set(sx, sy, 1);
  s.position.set(x, y, z);
  s.userData = { vx, vy, vz, life, maxLife: life, kind, role, sx, sy };
  fxRoot.add(s);
  drops.push(s);
  return s;
}

function spawnSplash(pos, kind, n) {
  const count = n || (reduced ? 10 : 22);
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 0.28 + Math.random() * 0.7;
    addDrop(
      kind,
      pos.x, pos.y, pos.z,
      Math.cos(a) * sp * 0.55,
      0.22 + Math.random() * 0.7,
      Math.sin(a) * sp * 0.4 + 0.12,
      0.28 + Math.random() * 0.28,
      "splash",
    );
  }
  const sparks = reduced ? 4 : 10;
  for (let i = 0; i < sparks; i++) {
    const sp = new THREE.Sprite(sparkMat.clone());
    sp.material.userData.localMat = true;
    sp.scale.set(0.03, 0.03, 1);
    sp.position.copy(pos);
    sp.userData = {
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.15 + Math.random() * 0.45,
      vz: (Math.random() - 0.5) * 0.3,
      life: 0.22 + Math.random() * 0.18,
      maxLife: 0.4,
      kind,
      role: "spark",
      sx: 0.03,
      sy: 0.03,
    };
    fxRoot.add(sp);
    drops.push(sp);
  }
}

function spawnMist(pos) {
  if (reduced) return;
  ensureFxMats();
  const s = new THREE.Sprite(mistMat.clone());
  s.material.userData.localMat = true;
  s.scale.set(0.12, 0.1, 1);
  s.position.copy(pos);
  s.userData = { life: 0.55, grow: 1.8 };
  fxRoot.add(s);
  mists.push(s);
}

function beginWet(kind) {
  if (!current || !current.userData.wet || !current.userData.pixel) return;
  const px = current.userData.pixel;
  if (current.userData.wet.mat) current.userData.wet.mat = null;
  const meshWet = current.children.find((c) => c.material && c.material.uniforms && c.material.uniforms.uKind);
  if (meshWet) meshWet.material.uniforms.uKind.value = kind === "milk" || kind === "oil" ? 1 : 0;
  wetSim = {
    kind,
    t: 0,
    dur: 1.9,
    x: px.crown.x,
    y0: px.crown.y,
    prev: px.crown.y,
  };
}

function clearWet() {
  if (!current || !current.userData.wet) return;
  const W = current.userData.wet;
  W.imgData.data.fill(0);
  W.ctx.putImageData(W.imgData, 0, 0);
  W.tex.needsUpdate = true;
  if (current.userData.puddle) current.userData.puddle.material.opacity = 0;
}

function stepWet(dt) {
  if (!wetSim || !current || !current.userData.wet) return;
  const W = current.userData.wet;
  wetSim.t += dt;
  const u = Math.min(1, wetSim.t / wetSim.dur);
  const eased = u * u * (3 - 2 * u);
  const front = wetSim.y0 + (W.h - 1 - wetSim.y0) * eased;
  const isMilk = wetSim.kind === "milk";
  const isOil = wetSim.kind === "oil";
  const cr = isOil ? 92 : isMilk ? 246 : 130;
  const cg = isOil ? 68 : isMilk ? 241 : 198;
  const cb = isOil ? 28 : isMilk ? 228 : 220;
  const buf = W.imgData.data;
  const alpha = W.alpha.data;
  const yStart = Math.max(0, wetSim.prev | 0);
  const yEnd = Math.min(W.h - 1, front | 0);
  const cx = wetSim.x;
  for (let y = yStart; y <= yEnd; y++) {
    const minX = W.minX[y];
    const maxX = W.maxX[y];
    if (minX < 0) continue;
    const mid = (minX + maxX) * 0.5;
    const left = minX * 0.35 + mid * 0.65;
    const right = maxX * 0.35 + mid * 0.65;
    const xs = [cx, left, right];
    const sig = [18, 11, 11];
    for (let x = minX; x <= maxX; x++) {
      const i = (y * W.w + x) * 4;
      if (alpha[i + 3] < 40) continue;
      let inf = 0;
      for (let k = 0; k < 3; k++) {
        const dlt = x - xs[k];
        inf = Math.max(inf, Math.exp(-(dlt * dlt) / (sig[k] * sig[k])));
      }
      if (inf < 0.08) continue;
      const fade = 0.6 + 0.4 * (1 - (y - wetSim.y0) / Math.max(1, W.h - wetSim.y0));
      const add = inf * fade * (isMilk ? 140 : isOil ? 120 : 90);
      buf[i] = Math.max(buf[i], cr);
      buf[i + 1] = Math.max(buf[i + 1], cg);
      buf[i + 2] = Math.max(buf[i + 2], cb);
      buf[i + 3] = Math.min(160, buf[i + 3] + add);
      if (Math.abs(x - cx) < 2) buf[i] = Math.min(255, buf[i] + 50);
    }
  }
  wetSim.prev = front;
  W.ctx.putImageData(W.imgData, 0, 0);
  W.tex.needsUpdate = true;
  if (current.userData.puddle) {
    current.userData.puddle.material.opacity = Math.min(0.55, u * 0.55);
    const s = 0.7 + u * 0.55;
    current.userData.puddle.scale.set(s, s, 1);
  }
  if (u >= 1) wetSim = null;
}

function pour(kind) {
  if (!current) return;
  ensureFxMats();
  const top = worldOf(current.userData.anchors.crown);
  const hold = top.clone().add(new THREE.Vector3(0.22, 0.28, 0.22));
  kalash.position.copy(hold);
  kalash.rotation.set(0.05, 0.2, -0.12);
  kalash.visible = true;
  kalashAnim = { t: 0, hold, kind, top, emitting: false, emitAcc: 0, hits: 0 };
}

function arghya() {
  if (!current) return;
  ensureFxMats();
  const hands = worldOf(current.userData.anchors.hands || current.userData.anchors.chest);
  const from = hands.clone().add(new THREE.Vector3(0.02, 0.06, 0.2));
  const to = hands.clone().add(new THREE.Vector3(0, 0.38, 0.9));
  kalash.position.copy(from.clone().add(new THREE.Vector3(0.14, 0.1, 0.04)));
  kalash.rotation.set(0.2, 0, -0.9);
  kalash.visible = true;
  kalashAnim = { t: 0, hold: kalash.position.clone(), kind: "water", top: to, emitting: false, emitAcc: 0, hits: 0, arghya: true };
}

function spoutWorld() {
  if (kalash.userData.spout) return worldOf(kalash.userData.spout);
  return kalash.position.clone().add(new THREE.Vector3(-0.14, 0.02, 0));
}

function emitStream(kind, from, to, n) {
  const dirx = to.x - from.x;
  const diry = to.y - from.y;
  const dirz = to.z - from.z;
  const dist = Math.max(0.08, Math.hypot(dirx, diry, dirz));
  const speed = 1.55 + Math.random() * 0.35;
  for (let i = 0; i < n; i++) {
    const jx = (Math.random() - 0.5) * 0.045;
    const jz = (Math.random() - 0.5) * 0.03;
    addDrop(
      kind,
      from.x + jx,
      from.y + (Math.random() - 0.5) * 0.02,
      from.z + jz,
      (dirx / dist) * speed + jx * 2,
      (diry / dist) * speed,
      (dirz / dist) * speed + jz * 2,
      0.55 + Math.random() * 0.2,
      "stream",
    );
  }
}

function stepKalash(dt) {
  if (!kalashAnim || !kalash) return;
  kalashAnim.t += dt;
  const t = kalashAnim.t;
  if (t < 0.32) kalash.rotation.z = -0.12 - 1.05 * (t / 0.32);
  else if (t < 1.65) kalash.rotation.z = -1.17 + Math.sin(t * 18) * 0.03;
  else if (t < 2.1) kalash.rotation.z = -1.17 + 1.05 * ((t - 1.65) / 0.45);
  else {
    kalash.visible = false;
    kalashAnim = null;
    return;
  }
  if (t >= 0.28 && t < 1.62) {
    if (!kalashAnim.emitting) {
      kalashAnim.emitting = true;
      beginWet(kalashAnim.kind);
    }
    kalashAnim.emitAcc += dt;
    const rate = reduced ? 0.04 : 0.016;
    while (kalashAnim.emitAcc >= rate) {
      kalashAnim.emitAcc -= rate;
      emitStream(kalashAnim.kind, spoutWorld(), kalashAnim.top, reduced ? 3 : 7);
    }
  }
}

function stepDrops(dt) {
  const hit = kalashAnim && kalashAnim.top;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    const u = d.userData;
    u.vy -= (u.role === "stream" ? 2.1 : 5.4) * dt;
    d.position.x += u.vx * dt;
    d.position.y += u.vy * dt;
    d.position.z += u.vz * dt;
    u.life -= dt;
    const fade = Math.max(0, u.life / u.maxLife);
    if (d.material && d.material.opacity != null) {
      d.material.opacity = (u.role === "spark" ? 1 : 0.85) * fade;
    }
    if (u.role === "stream") {
      d.scale.set(u.sx, u.sy * (1 + Math.max(0, -u.vy) * 0.12), 1);
      if (hit && d.position.distanceTo(hit) < 0.09) {
        spawnSplash(hit, u.kind, reduced ? 6 : 12);
        if (Math.random() < 0.35) spawnMist(hit);
        if (kalashAnim) {
          kalashAnim.hits += 1;
          if (kalashAnim.hits === 1 || kalashAnim.hits % 8 === 0) spawnSplash(hit, u.kind, reduced ? 10 : 18);
        }
        if (current && current.userData.anchors.base && Math.random() < 0.22) {
          const b = worldOf(current.userData.anchors.base);
          addDrop(u.kind, b.x + (Math.random() - 0.5) * 0.1, b.y + 0.12, b.z, (Math.random() - 0.5) * 0.08, -0.15, 0.04, 0.4, "drip");
        }
        fxRoot.remove(d);
        drops.splice(i, 1);
        continue;
      }
    } else if (u.role === "splash") {
      d.scale.setScalar(u.sx * (0.6 + fade * 0.7));
    }
    if (u.life <= 0 || d.position.y < 0.28) {
      if (u.role === "splash" && d.position.y < 0.34 && Math.random() < 0.25 && current && current.userData.puddle) {
        current.userData.puddle.material.opacity = Math.min(0.6, current.userData.puddle.material.opacity + 0.04);
      }
      fxRoot.remove(d);
      drops.splice(i, 1);
    }
  }
}

function stepMist(dt) {
  for (let i = mists.length - 1; i >= 0; i--) {
    const s = mists[i];
    s.userData.life -= dt;
    s.scale.multiplyScalar(1 + dt * s.userData.grow);
    s.position.y += 0.12 * dt;
    if (s.material) s.material.opacity = Math.max(0, s.userData.life * 0.7);
    if (s.userData.life <= 0) {
      fxRoot.remove(s);
      mists.splice(i, 1);
    }
  }
}

function stampMark(kind) {
  if (!current) return;
  const brow = current.userData.anchors.forehead;
  if (kind === "tilak" && (current.userData.family === "shiva" || current.userData.family === "shiva-lingam")) {
    [-0.016, 0, 0.016].forEach((dy) => {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.012), mats.bhasma);
      stripe.position.set(0, dy, 0.012);
      brow.add(stripe);
      marks.push(stripe);
    });
    const bindu = new THREE.Mesh(new THREE.CircleGeometry(0.011, 12), mats.kumkum);
    bindu.position.set(0, 0, 0.014);
    brow.add(bindu);
    marks.push(bindu);
    return;
  }
  const w = kind === "chandan" ? 0.05 : 0.028;
  const h = kind === "chandan" ? 0.038 : 0.028;
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(kind === "chandan" ? 0.028 : 0.016, 16),
    kind === "chandan" ? mats.chandan : mats.kumkum,
  );
  m.scale.set(w / 0.028, h / 0.028, 1);
  m.position.set(0, 0.006, 0.012);
  brow.add(m);
  marks.push(m);
}

function mark(kind) {
  if (!current) return;
  const brow = worldOf(current.userData.anchors.forehead);
  const blob = new THREE.Mesh(
    new THREE.SphereGeometry(kind === "chandan" ? 0.016 : 0.011, 12, 10),
    kind === "chandan" ? mats.chandan : mats.kumkum,
  );
  blob.position.copy(brow.clone().add(new THREE.Vector3(0.2, 0.08, 0.22)));
  fxRoot.add(blob);
  applicator = {
    mesh: blob,
    from: blob.position.clone(),
    to: brow.clone().add(new THREE.Vector3(0, 0, 0.02)),
    t: 0,
    dur: 0.5,
    kind,
    stamped: false,
  };
}

function stepApplicator(dt) {
  if (!applicator) return;
  applicator.t += dt;
  const u = Math.min(1, applicator.t / applicator.dur);
  const e = 1 - Math.pow(1 - u, 3);
  applicator.mesh.position.lerpVectors(applicator.from, applicator.to, e);
  applicator.mesh.scale.setScalar(1 - e * 0.35);
  if (u >= 1 && !applicator.stamped) {
    applicator.stamped = true;
    stampMark(applicator.kind);
  }
  if (u >= 1) {
    fxRoot.remove(applicator.mesh);
    applicator = null;
  }
}

function leafMesh(kind) {
  const isGrass = kind === "durva";
  const isTulsi = kind === "tulsi";
  const geo = isGrass
    ? new THREE.PlaneGeometry(0.018, 0.09)
    : new THREE.CircleGeometry(isTulsi ? 0.028 : 0.04, 5);
  const matRef = mats.leaf.clone();
  if (isTulsi) matRef.color = new THREE.Color(0x3d8b5a);
  if (kind === "bilva") matRef.color = new THREE.Color(0x6a9a4a);
  const p = new THREE.Mesh(geo, matRef);
  p.castShadow = false;
  if (isGrass) p.rotation.z = (Math.random() - 0.5) * 0.6;
  return p;
}

function shower(kind) {
  if (!current) return;
  const atFeet = kind === "tulsi";
  const host = atFeet
    ? (current.userData.anchors.feet || current.userData.anchors.base)
    : current.userData.anchors.crown;
  const top = worldOf(host);
  const n = reduced ? 8 : (kind === "tulsi" ? 16 : 18);
  const isLeaf = kind === "bilva" || kind === "durva" || kind === "tulsi";
  const spread = atFeet ? 0.14 : 0.12;
  for (let i = 0; i < n; i++) {
    const p = isLeaf
      ? leafMesh(kind)
      : mesh(new THREE.SphereGeometry(0.032, 8, 6), mats.petal);
    if (!isLeaf) p.scale.set(0.7, 0.22, 1.1);
    p.position.set(
      top.x + (Math.random() - 0.5) * 0.28,
      (atFeet ? 1.2 : 2.05) + Math.random() * 0.18,
      top.z + 0.12 + Math.random() * 0.1,
    );
    p.userData = {
      vy: atFeet ? -0.18 : 0,
      target: top.clone().add(new THREE.Vector3(
        (Math.random() - 0.5) * spread,
        atFeet ? 0.02 : 0.02,
        0.02 + (Math.random() - 0.5) * spread * 0.4,
      )),
    };
    fxRoot.add(p);
    petals.push(p);
  }
}

function incense() {
  const n = reduced ? 8 : 16;
  for (let i = 0; i < n; i++) {
    const s = mesh(new THREE.SphereGeometry(0.03, 8, 8), mats.cream);
    s.material = mats.cream.clone();
    s.material.transparent = true;
    s.material.opacity = 0.35;
    s.position.set((Math.random() - 0.5) * 0.2, 0.55, 0.5);
    s.userData = { life: 1.8 };
    fxRoot.add(s);
    smokes.push(s);
  }
}

function canvasFlame() {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 128;
  const ctx = c.getContext("2d");
  const grd = ctx.createRadialGradient(32, 100, 3, 32, 70, 34);
  grd.addColorStop(0, "rgba(255,255,230,1)");
  grd.addColorStop(0.22, "rgba(255,196,70,0.95)");
  grd.addColorStop(0.55, "rgba(255,90,12,0.42)");
  grd.addColorStop(1, "rgba(255,40,0,0)");
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.moveTo(32, 10);
  ctx.bezierCurveTo(52, 48, 50, 92, 32, 122);
  ctx.bezierCurveTo(14, 92, 12, 48, 32, 10);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
}

function flameSprite(sx, sy) {
  const map = flameMap || flameFallback;
  const mat = new THREE.SpriteMaterial({
    map, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
  });
  const s = new THREE.Sprite(mat);
  s.scale.set(sx || 0.1, sy || 0.18, 1);
  s.userData.kind = "flameSprite";
  return s;
}

function makeDiyaGroup() {
  const g = new THREE.Group();
  const bowl = lathe(
    [[0.0, 0], [0.05, 0.008], [0.072, 0.03], [0.06, 0.04], [0.02, 0.042]],
    mats.gold,
  );
  bowl.castShadow = false;
  g.add(bowl);
  if (diyaMap) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(0.2, 0.17),
      new THREE.MeshBasicMaterial({ map: diyaMap, transparent: true, depthWrite: false, toneMapped: false }),
    );
    plane.rotation.x = -1.05;
    plane.position.set(0, 0.028, 0.01);
    plane.userData.kind = "diyaPlane";
    g.add(plane);
  }
  const flame = flameSprite(0.09, 0.16);
  flame.position.set(0, 0.11, 0);
  g.add(flame);
  const light = new THREE.PointLight(0xffb060, 1.05, 3.2);
  light.position.set(0, 0.14, 0);
  g.add(light);
  g.userData.flame = flame;
  g.userData.light = light;
  return g;
}

function refreshSanctumDiyas() {
  if (!sanctumRoot) return;
  sanctumRoot.traverse((o) => {
    if (o.userData && o.userData.kind === "flameSprite" && flameMap && o.material) {
      o.material.map = flameMap;
      o.material.needsUpdate = true;
    }
    if (o.userData && o.userData.kind === "diyaPlane" && diyaMap && o.material) {
      o.material.map = diyaMap;
      o.material.needsUpdate = true;
    }
  });
}

function loadProps() {
  if (!flameFallback) flameFallback = canvasFlame();
  const loader = new THREE.TextureLoader();
  loader.load("../deities/diya.webp?v=u2", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    diyaMap = t;
    refreshSanctumDiyas();
  });
  loader.load("../deities/flame.webp?v=u2", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    flameMap = t;
    refreshSanctumDiyas();
  });
}

function aarti() {
  if (aartiLamp) {
    fxRoot.remove(aartiLamp);
    aartiLamp = null;
  }
  aartiLamp = makeDiyaGroup();
  aartiT = 0;
  fxRoot.add(aartiLamp);
}

function bow() {
  if (!camera) return;
  const start = camera.position.clone();
  const down = start.clone();
  down.y -= 0.22;
  down.z += 0.1;
  const t0 = performance.now();
  function tick() {
    const u = (performance.now() - t0) / 900;
    if (u >= 1) { camera.position.copy(start); return; }
    const s = u < 0.45 ? u / 0.45 : 1 - (u - 0.45) / 0.55;
    camera.position.lerpVectors(start, down, Math.sin(s * Math.PI * 0.5));
    camera.lookAt(controls.target);
    requestAnimationFrame(tick);
  }
  tick();
}

function stepPetals(dt) {
  for (let i = petals.length - 1; i >= 0; i--) {
    const p = petals[i];
    p.userData.vy -= 1.6 * dt;
    p.position.y += p.userData.vy * dt;
    p.rotation.z += dt * 1.4;
    if (p.position.y <= p.userData.target.y) {
      p.position.copy(p.userData.target);
      p.userData.vy = 0;
      p.userData.settled = (p.userData.settled || 0) + dt;
      if (p.userData.settled > 8) { fxRoot.remove(p); petals.splice(i, 1); }
    }
  }
}

function stepSmoke(dt) {
  for (let i = smokes.length - 1; i >= 0; i--) {
    const s = smokes[i];
    s.position.y += 0.35 * dt;
    s.scale.multiplyScalar(1 + dt * 0.8);
    s.userData.life -= dt;
    s.material.opacity = Math.max(0, s.userData.life * 0.2);
    if (s.userData.life <= 0) { fxRoot.remove(s); smokes.splice(i, 1); }
  }
}

function stepAarti(dt) {
  if (!aartiLamp || !current) return;
  aartiT += dt;
  const face = worldOf(current.userData.anchors.forehead);
  const r = Math.max(0.18, (current.userData.faceR || 0.16) + 0.06);
  const t = aartiT * 1.7;
  aartiLamp.position.set(
    face.x + Math.sin(t) * r,
    face.y - 0.02 + Math.sin(t * 2) * 0.04,
    face.z + 0.18 + Math.cos(t) * r * 0.45,
  );
  if (aartiLamp.userData.flame) {
    const flick = 1 + Math.sin(aartiT * 18) * 0.08 + Math.sin(aartiT * 31) * 0.05;
    aartiLamp.userData.flame.scale.set(0.09 * flick, 0.16 * flick, 1);
  }
  if (aartiLamp.userData.light) {
    aartiLamp.userData.light.intensity = 1.05 + Math.sin(aartiT * 22) * 0.2;
  }
  if (aartiT > 3.6) { fxRoot.remove(aartiLamp); aartiLamp = null; }
}

function stepHalo(dt) {
  if (!current || !current.userData.halo) return;
  const h = current.userData.halo;
  const inner = h.userData.inner;
  const outer = h.userData.outer;
  const pulse = 0.5 + 0.5 * Math.sin(clockT * 1.15);
  const inReveal = revealAnim ? Math.min(1, revealAnim.t / revealAnim.dur) : 1;
  if (inner && inner.material) {
    inner.material.opacity = inReveal * (0.62 + pulse * 0.16);
    const s = 1.65 + pulse * 0.08;
    inner.scale.set(s, s * 1.2, 1);
  }
  if (outer && outer.material) {
    outer.material.opacity = inReveal * (0.42 + pulse * 0.12);
    const s = 2.5 + pulse * 0.14;
    outer.scale.set(s, s * 1.18, 1);
  }
}

function stepReveal(dt) {
  if (!revealAnim || !camera) return;
  revealAnim.t += dt;
  const u = Math.min(1, revealAnim.t / revealAnim.dur);
  const e = 1 - Math.pow(1 - u, 3);
  camera.position.lerpVectors(revealAnim.from, revealAnim.to, e);
  controls.target.copy(revealAnim.target);
  camera.lookAt(revealAnim.target);
  if (current && current.userData.frontMat) {
    current.userData.frontMat.opacity = Math.min(1, 0.05 + e * 1.05);
  }
  if (sunLight) sunLight.intensity = 0.35 + 0.7 * e;
  if (hemLight) hemLight.intensity = 0.35 + 0.55 * e;
  if (fillLight) fillLight.intensity = 0.12 + 0.22 * e;
  if (u >= 1) {
    if (current && current.userData.frontMat) current.userData.frontMat.opacity = 1;
    if (controls) {
      controls.enabled = true;
      controls.enableRotate = false;
    }
    revealAnim = null;
  }
}

function loop(t) {
  if (!running) return;
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  clockT = t * 0.001;
  stepReveal(dt);
  stepKalash(dt);
  stepDrops(dt);
  stepMist(dt);
  stepWet(dt);
  stepApplicator(dt);
  stepPetals(dt);
  stepSmoke(dt);
  stepAarti(dt);
  stepHalo(dt);
  if (sanctumRoot && sanctumRoot.userData.flames) {
    sanctumRoot.userData.flames.forEach((f, i) => {
      const flick = 1 + Math.sin(t * 0.012 + i * 1.7) * 0.12 + Math.sin(t * 0.031 + i) * 0.07;
      if (f.scale) f.scale.set(0.09 * flick, 0.16 * flick, 1);
    });
  }
  if (controls && !revealAnim) controls.update();
  renderer.render(scene, camera);
}

function clearFx() {
  [...drops, ...petals, ...smokes, ...mists].forEach((o) => fxRoot.remove(o));
  drops.length = 0; petals.length = 0; smokes.length = 0; mists.length = 0;
  marks.forEach((m) => { if (m.parent) m.parent.remove(m); });
  marks.length = 0;
  if (aartiLamp) { fxRoot.remove(aartiLamp); aartiLamp = null; }
  if (kalash) kalash.visible = false;
  kalashAnim = null;
  wetSim = null;
  if (applicator) {
    fxRoot.remove(applicator.mesh);
    applicator = null;
  }
  clearWet();
}

function buildSanctum() {
  const g = new THREE.Group();
  const wall = mesh(new THREE.BoxGeometry(5.4, 3.5, 0.18), mats.sand, 0, 1.55, -1.85);
  wall.castShadow = false;
  g.add(wall);
  const flames = [];
  function diya(x, z) {
    const d = makeDiyaGroup();
    d.position.set(x, 0.4, z);
    if (d.userData.flame) flames.push(d.userData.flame);
    return d;
  }
  g.add(diya(-0.95, 0.55), diya(0.95, 0.55));
  g.userData.flames = flames;
  return g;
}

function startReveal() {
  const end = { pos: new THREE.Vector3(0, 1.14, 2.38), target: new THREE.Vector3(0, 1.06, 0) };
  const from = end.pos.clone().add(new THREE.Vector3(0, 0.04, 0.85));
  camera.position.copy(from);
  camera.up.set(0, 1, 0);
  controls.target.copy(end.target);
  camera.lookAt(end.target);
  controls.autoRotate = false;
  controls.enableRotate = false;
  controls.enablePan = false;
  controls.enabled = false;
  if (current && current.userData.frontMat) current.userData.frontMat.opacity = 0.05;
  if (sunLight) sunLight.intensity = 0.35;
  if (hemLight) hemLight.intensity = 0.35;
  revealAnim = reduced ? null : { t: 0, dur: 1.6, from, to: end.pos, target: end.target };
  if (!revealAnim) {
    camera.position.copy(end.pos);
    if (current && current.userData.frontMat) current.userData.frontMat.opacity = 1;
    controls.enabled = true;
    controls.enableRotate = false;
  }
}

export function mountMurti(canvas) {
  canvasEl = canvas;
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  readyMats();
  ensureFxMats();
  if (!flameFallback) flameFallback = canvasFlame();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf6e4d0);
  scene.fog = new THREE.Fog(0xf6e4d0, 8, 16);
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 40);
  camera.position.set(0, 1.14, 2.38);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  hemLight = new THREE.HemisphereLight(0xfff4e8, 0x8a6a50, 0.9);
  scene.add(hemLight);
  sunLight = new THREE.DirectionalLight(0xffe6c4, 1.05);
  sunLight.position.set(1.2, 4.0, 3.0);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 14;
  sunLight.shadow.camera.left = -3;
  sunLight.shadow.camera.right = 3;
  sunLight.shadow.camera.top = 3;
  sunLight.shadow.camera.bottom = -3;
  scene.add(sunLight);
  fillLight = new THREE.DirectionalLight(0xffd8b0, 0.32);
  fillLight.position.set(-2, 1.8, 1.4);
  scene.add(fillLight);

  const floor = mesh(new THREE.CircleGeometry(4.8, 48), mats.marble, 0, 0, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.castShadow = false;
  scene.add(floor);
  const inlay = mesh(new THREE.RingGeometry(0.68, 0.84, 40), mats.gold, 0, 0.01, 0);
  inlay.rotation.x = -Math.PI / 2;
  inlay.castShadow = false;
  scene.add(inlay);

  sanctumRoot = buildSanctum();
  scene.add(sanctumRoot);
  root = new THREE.Group();
  scene.add(root);
  fxRoot = new THREE.Group();
  scene.add(fxRoot);
  kalash = makeKalash();
  scene.add(kalash);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.14;
  controls.enablePan = false;
  controls.enableRotate = false;
  controls.minDistance = 1.85;
  controls.maxDistance = 3.6;
  controls.target.set(0, 1.06, 0);
  controls.autoRotate = false;

  loadProps();
  resize();
  running = true;
  lastT = performance.now();
  renderer.setAnimationLoop(loop);
  window.addEventListener("resize", resize);
}

export async function showDeity(spec) {
  const gen = ++loadGen;
  clearFx();
  if (current) {
    root.remove(current);
    disposeGroup(current);
    current = null;
  }
  let next;
  try {
    next = await makeStatue(spec);
  } catch (err) {
    if (gen !== loadGen) return;
    throw err;
  }
  if (gen !== loadGen) {
    disposeGroup(next);
    return;
  }
  current = next;
  root.add(current);
  startReveal();
  if (typeof window !== "undefined") {
    window.__murtiQA = {
      play: (k) => playOffer(k),
      id: spec.id,
    };
  }
}

export function playOffer(kind) {
  if (kind === "water" || kind === "milk" || kind === "oil") pour(kind);
  else if (kind === "arghya") arghya();
  else if (kind === "tilak" || kind === "chandan") mark(kind);
  else if (kind === "flowers") shower("flowers");
  else if (kind === "bilva") shower("bilva");
  else if (kind === "durva") shower("durva");
  else if (kind === "tulsi") shower("tulsi");
  else if (kind === "dhoop") incense();
  else if (kind === "aarti") aarti();
  else if (kind === "pranam") bow();
}

export function resize() {
  if (!renderer || !canvasEl) return;
  const w = canvasEl.clientWidth || 1;
  const h = canvasEl.clientHeight || 1;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h, false);
}

export function destroy() {
  running = false;
  if (renderer) renderer.setAnimationLoop(null);
  window.removeEventListener("resize", resize);
  if (controls) controls.dispose();
  if (renderer) renderer.dispose();
}

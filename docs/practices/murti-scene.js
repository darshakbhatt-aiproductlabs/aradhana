import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

let renderer, scene, camera, controls, root, fxRoot, kalash, sanctumRoot;
let current = null;
let canvasEl = null;
let running = false;
let lastT = 0;
const drops = [];
const petals = [];
const smokes = [];
const marks = [];
let aartiLamp = null;
let aartiT = 0;
let reduced = false;
let milkPool = null;
const coats = [];
const mats = {};
const _v = new THREE.Vector3();
let loadGen = 0;
let kalashAnim = null;
let dropGeo = null;
const streams = [];
let diyaMap = null;
let flameMap = null;
let flameFallback = null;
let tubeGeoDummy = null;
let sunLight = null;
let fillLight = null;
let hemLight = null;
let revealAnim = null;
let wetSim = null;
let applicator = null;
let clockT = 0;
let auraLight = null;
let motes = null;
let statueMats = [];
const _side = new THREE.Vector3();
const _dir = new THREE.Vector3();


const ANCHORS = {
  ganesha: { crown: [0.5, 0.93], brow: [0.5, 0.62] },
  shiva: { crown: [0.5, 0.92], brow: [0.5, 0.78] },
  krishna: { crown: [0.5, 0.93], brow: [0.5, 0.76] },
  durga: { crown: [0.5, 0.9], brow: [0.5, 0.74] },
  lakshmi: { crown: [0.5, 0.92], brow: [0.5, 0.72] },
  hanuman: { crown: [0.5, 0.92], brow: [0.5, 0.78] },
  saraswati: { crown: [0.5, 0.91], brow: [0.5, 0.74] },
  rama: { crown: [0.5, 0.93], brow: [0.5, 0.78] },
  kali: { crown: [0.5, 0.9], brow: [0.5, 0.76] },
  custom: { crown: [0.5, 0.92], brow: [0.5, 0.72] },
};

const BROW_T = {
  ganesha: 0.38,
  shiva: 0.2,
  krishna: 0.22,
  durga: 0.2,
  lakshmi: 0.24,
  hanuman: 0.2,
  saraswati: 0.22,
  rama: 0.2,
  kali: 0.18,
  custom: 0.26,
};

const FACE_FRAC = {
  ganesha: { crown: 0.08, brow: 0.54, inset: 0.4 },
  shiva: { crown: 0.1, brow: 0.5, inset: 0.36 },
  "shiva-parvati": { crown: 0.1, brow: 0.48, inset: 0.34 },
  nataraja: { crown: 0.16, brow: 0.46, inset: 0.36 },
  shivling: { crown: 0.08, brow: 0.28, inset: 0.32 },
  vishnu: { crown: 0.1, brow: 0.44, inset: 0.34 },
  venkateswara: { crown: 0.1, brow: 0.42, inset: 0.34 },
  krishna: { crown: 0.12, brow: 0.46, inset: 0.34 },
  "radha-krishna": { crown: 0.1, brow: 0.46, inset: 0.32 },
  rama: { crown: 0.1, brow: 0.44, inset: 0.34 },
  hanuman: { crown: 0.1, brow: 0.46, inset: 0.34 },
  durga: { crown: 0.12, brow: 0.46, inset: 0.34 },
  kali: { crown: 0.14, brow: 0.48, inset: 0.36 },
  saraswati: { crown: 0.1, brow: 0.46, inset: 0.34 },
  brahma: { crown: 0.16, brow: 0.48, inset: 0.34 },
  surya: { crown: 0.16, brow: 0.44, inset: 0.34 },
  murugan: { crown: 0.1, brow: 0.44, inset: 0.34 },
  ayyappa: { crown: 0.12, brow: 0.46, inset: 0.36 },
  dattatreya: { crown: 0.12, brow: 0.46, inset: 0.34 },
  shani: { crown: 0.1, brow: 0.46, inset: 0.34 },
  custom: { crown: 0.1, brow: 0.48, inset: 0.34 },
};

const WATER_VERT = [
  "varying vec2 vUv;",
  "void main() {",
  "  vUv = uv;",
  "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
  "}",
].join("\n");

const WATER_FRAG = [
  "uniform float uTime;",
  "uniform float uFill;",
  "uniform vec3 uColor;",
  "uniform float uOpacity;",
  "varying vec2 vUv;",
  "void main() {",
  "  if (vUv.x > uFill + 0.002) discard;",
  "  float across = vUv.y;",
  "  float core = 1.0 - abs(across - 0.5) * 2.0;",
  "  core = max(0.0, core);",
  "  float n1 = sin(vUv.x * 54.0 - uTime * 16.0 + across * 8.0);",
  "  float n2 = sin(vUv.x * 96.0 + uTime * 23.0 + across * 14.0);",
  "  float caustic = 0.55 + 0.45 * n1 * n2;",
  "  float highlight = pow(core, 3.4) * caustic;",
  "  vec3 col = mix(uColor * 0.42, vec3(0.93, 0.97, 1.0), highlight);",
  "  float alpha = uOpacity * pow(core, 1.35) * (0.28 + 0.72 * caustic);",
  "  alpha *= smoothstep(0.0, 0.05, vUv.x) * smoothstep(0.0, 0.1, uFill);",
  "  gl_FragColor = vec4(col, alpha);",
  "}",
].join("\n");

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
  "  float spec = pow(w.r, 2.8);",
  "  vec3 dark = mix(vec3(0.09, 0.13, 0.16), vec3(0.42, 0.36, 0.28), uKind);",
  "  vec3 gloss = mix(vec3(0.78, 0.9, 0.96), vec3(0.96, 0.93, 0.86), uKind);",
  "  vec3 col = mix(dark, gloss, spec);",
  "  float alpha = w.a * 0.58 + spec * 0.42;",
  "  gl_FragColor = vec4(col, alpha);",
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
  mat("gold", { color: 0xc49a4a, metalness: 0.7, roughness: 0.32 });
  mat("stone", { color: 0x3c3e46, metalness: 0.12, roughness: 0.5 });
  mat("marble", { color: 0xeee4d4, metalness: 0.05, roughness: 0.3 });
  mat("sand", { color: 0xc4a07a, metalness: 0.04, roughness: 0.82 });
  mat("niche", { color: 0x6e5340, metalness: 0.04, roughness: 0.8 });
  mat("cream", { color: 0xf3ece0, metalness: 0.04, roughness: 0.42 });
  mat("water", { color: 0x8ec8ea, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.62 });
  mat("milk", { color: 0xf7f2e8, roughness: 0.16, metalness: 0.04, transparent: true, opacity: 0.86 });
  mat("kumkum", { color: 0xc4452d, roughness: 0.55, metalness: 0.05 });
  mat("chandan", { color: 0xe8d09a, roughness: 0.48, metalness: 0.04 });
  mat("bhasma", { color: 0xe8e2d6, roughness: 0.62, metalness: 0.02 });
  mat("petal", { color: 0xf2b7a0, roughness: 0.5, metalness: 0.04 });
  mat("oil", { color: 0x6b4a1e, roughness: 0.22, metalness: 0.04, transparent: true, opacity: 0.82 });
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
  return mesh(new THREE.LatheGeometry(pts.map((p) => new THREE.Vector2(p[0], p[1])), seg || 40), m, x, y, z);
}

function helix(r, y0, y1, turns, tubeR, m, tilt) {
  const pts = [];
  const n = 72;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = t * Math.PI * 2 * turns;
    pts.push(new THREE.Vector3(Math.cos(a) * r, y0 + (y1 - y0) * t, Math.sin(a) * r));
  }
  const curve = new THREE.CatmullRomCurve3(pts);
  const h = new THREE.Mesh(new THREE.TubeGeometry(curve, 80, tubeR, 7, false), m);
  h.castShadow = true;
  if (tilt) h.rotation.x = tilt;
  return h;
}

function pedestal() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.1, 40), mats.marble, 0, 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.54, 0.62, 0.2, 32), mats.sand, 0, 0.2, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.56, 0.54, 0.05, 32), mats.gold, 0, 0.325, 0));
  return g;
}

function shivling() {
  const g = new THREE.Group();
  g.add(pedestal());
  const yoni = lathe(
    [[0.58, 0], [0.58, 0.08], [0.5, 0.14], [0.42, 0.16], [0.22, 0.16]],
    mats.marble, 0, 0.34, 0, 48,
  );
  yoni.scale.set(1, 1, 0.82);
  g.add(yoni);
  const spout = lathe(
    [[0.0, 0], [0.07, 0], [0.07, 0.04], [0.0, 0.04]],
    mats.marble, 0, 0.48, 0.42, 12,
  );
  spout.rotation.x = Math.PI / 2;
  spout.scale.set(1, 1, 2.2);
  g.add(spout);
  const lingam = lathe(
    [[0.22, 0], [0.22, 0.28], [0.21, 0.42], [0.17, 0.54], [0.1, 0.62], [0.0, 0.64]],
    mats.stone, 0, 0.5, 0, 56,
  );
  g.add(lingam);
  g.add(helix(0.23, 0.58, 0.92, 1.35, 0.022, mats.gold, 0.18));
  const hood = mesh(new THREE.SphereGeometry(0.055, 12, 10), mats.gold, 0.02, 1.0, -0.08);
  hood.scale.set(1.1, 0.7, 1.4);
  g.add(hood);
  const pool = mesh(new THREE.CircleGeometry(0.34, 32), mats.milk.clone(), 0, 0.505, 0.02);
  pool.rotation.x = -Math.PI / 2;
  pool.material.transparent = true;
  pool.material.opacity = 0;
  pool.castShadow = false;
  g.add(pool);
  milkPool = pool;

  const crown = dummy(0, 1.16, 0);
  const brow = dummy(0, 0.92, 0.2);
  g.add(crown, brow);
  const feet = dummy(0, 0.42, 0.28);
  g.add(feet);
  g.userData.anchors = { crown, forehead: brow, chest: lingam, hands: brow, feet, base: yoni };
  g.userData.coatMesh = lingam;
  g.userData.kind = "lingam";
  g.userData.deityId = "shivling";
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
  const maxW = 720;
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

function erodeAlpha(imgData, w, h, times) {
  const d = imgData.data;
  for (let t = 0; t < times; t++) {
    const copy = new Uint8ClampedArray(d);
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = (y * w + x) * 4 + 3;
        if (copy[i] === 0) continue;
        if (
          copy[(y * w + (x - 1)) * 4 + 3] === 0
          || copy[(y * w + (x + 1)) * 4 + 3] === 0
          || copy[((y - 1) * w + x) * 4 + 3] === 0
          || copy[((y + 1) * w + x) * 4 + 3] === 0
        ) d[i] = 0;
      }
    }
  }
}

function traceOutline(imgData, w, h, aMin) {
  const amin = aMin || 40;
  const at = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return false;
    return imgData.data[(y * w + x) * 4 + 3] >= amin;
  };
  let sx = -1;
  let sy = -1;
  outer: for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (at(x, y)) { sx = x; sy = y; break outer; }
    }
  }
  if (sx < 0) return [];
  const dirs = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
  const pts = [];
  let x = sx;
  let y = sy;
  let dir = 0;
  let guard = 0;
  do {
    pts.push([x, y]);
    const startDir = (dir + 6) % 8;
    let found = false;
    for (let i = 0; i < 8; i++) {
      const k = (startDir + i) % 8;
      const nx = x + dirs[k][0];
      const ny = y + dirs[k][1];
      if (at(nx, ny)) { x = nx; y = ny; dir = k; found = true; break; }
    }
    if (!found) break;
    guard += 1;
  } while ((x !== sx || y !== sy) && guard < w * h);
  const step = Math.max(1, (pts.length / 140) | 0);
  const out = [];
  for (let i = 0; i < pts.length; i += step) out.push(pts[i]);
  return out;
}

function makeRim(pts, w, h, width, height, y0, depth) {
  const toX = (px) => ((px / (w - 1)) - 0.5) * width;
  const toY = (py) => y0 + (0.5 - py / (h - 1)) * height;
  const n = pts.length;
  if (n < 8) return null;
  const positions = new Float32Array(n * 2 * 3);
  const indices = [];
  const zf = depth * 0.5;
  const zb = -depth * 0.5;
  for (let i = 0; i < n; i++) {
    const x = toX(pts[i][0]);
    const y = toY(pts[i][1]);
    const o = i * 6;
    positions[o] = x; positions[o + 1] = y; positions[o + 2] = zf;
    positions[o + 3] = x; positions[o + 4] = y; positions[o + 5] = zb;
  }
  for (let i = 0; i < n; i++) {
    const a = i * 2;
    const b = a + 1;
    const c = ((i + 1) % n) * 2;
    const d = c + 1;
    indices.push(a, c, b, b, c, d);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  geo.userData.localGeo = true;
  return geo;
}

function silhouetteRows(imgData, w, h, aMin) {
  const rows = [];
  const data = imgData.data;
  const amin = aMin || 40;
  for (let y = 0; y < h; y++) {
    let minX = -1;
    let maxX = -1;
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] >= amin) {
        if (minX < 0) minX = x;
        maxX = x;
      }
    }
    if (minX >= 0) rows.push({ y, minX, maxX, mid: (minX + maxX) * 0.5 });
  }
  return rows;
}

function reliefGeometry(imgData, w, h, width, height) {
  const segX = reduced ? 48 : 72;
  const segY = reduced ? 64 : 96;
  const geo = new THREE.PlaneGeometry(width, height, segX, segY);
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const px = Math.min(w - 1, Math.max(0, (u * (w - 1)) | 0));
    const py = Math.min(h - 1, Math.max(0, ((1 - v) * (h - 1)) | 0));
    const i4 = (py * w + px) * 4;
    const a = imgData.data[i4 + 3];
    const lum = (imgData.data[i4] + imgData.data[i4 + 1] + imgData.data[i4 + 2]) / 765;
    const nx = (u - 0.5) * 2;
    const ny = (v - 0.42) * 2;
    const body = Math.max(0, 1 - (nx * nx * 0.9 + ny * ny * 1.15));
    const z = a < 18 ? -0.02 : body * 0.22 + lum * 0.1;
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function densestColumn(data, w, h, y0, y1, x0, x1) {
  const xStart = Math.max(0, Math.floor(x0));
  const xEnd = Math.min(w - 1, Math.ceil(x1));
  const yStart = Math.max(0, Math.floor(y0));
  const yEnd = Math.min(h - 1, Math.ceil(y1));
  const scores = new Float32Array(w);
  for (let y = yStart; y <= yEnd; y++) {
    const row = y * w;
    for (let x = xStart; x <= xEnd; x++) scores[x] += data[(row + x) * 4 + 3];
  }
  let bestX = (xStart + xEnd) * 0.5;
  let best = -1;
  for (let x = xStart + 1; x < xEnd; x++) {
    const s = scores[x - 1] + scores[x] * 2 + scores[x + 1];
    if (s > best) { best = s; bestX = x; }
  }
  return bestX;
}

function faceSpec(spec) {
  spec = spec || {};
  return FACE_FRAC[spec.id] || FACE_FRAC.custom;
}

function detectHead(rows, imgData, w, h, spec) {
  spec = spec || {};
  const n = rows.length;
  if (n < 8) return null;
  const fr = faceSpec(spec);
  const widths = rows.map((r) => r.maxX - r.minX + 1);
  const topN = Math.max(6, Math.round(n * 0.08));
  const sample = widths.slice(0, topN).slice().sort((a, b) => a - b);
  const earlyMed = sample[sample.length >> 1] || widths[0];
  let headEnd = Math.min(n - 1, Math.round(n * 0.3));
  for (let i = topN; i < Math.min(n, Math.round(n * 0.52)); i++) {
    if (widths[i] > earlyMed * 1.7) {
      headEnd = Math.max(topN, i - 1);
      break;
    }
  }
  const prefer = spec.crownX != null ? spec.crownX : 0.5;
  const headRows = rows.slice(0, headEnd + 1);
  let minX = w;
  let maxX = 0;
  headRows.forEach((r) => {
    minX = Math.min(minX, r.minX);
    maxX = Math.max(maxX, r.maxX);
  });
  const headW = maxX - minX + 1;
  if (headW > earlyMed * 2.1) {
    if (prefer < 0.45) maxX = Math.min(maxX, Math.round(minX + headW * 0.52));
    else if (prefer > 0.55) minX = Math.max(minX, Math.round(minX + headW * 0.48));
    else {
      const c = (minX + maxX) / 2;
      minX = Math.round(c - headW * 0.26);
      maxX = Math.round(c + headW * 0.26);
    }
  }
  const yTop = headRows[0].y;
  const yBot = headRows[headRows.length - 1].y;
  const headH = Math.max(8, yBot - yTop);
  const inset = fr.inset;
  const faceX0 = minX + (maxX - minX) * inset;
  const faceX1 = minX + (maxX - minX) * (1 - inset);
  const crownY = yTop + headH * fr.crown;
  const browY = yTop + headH * fr.brow;
  const data = imgData.data;
  const crownX = densestColumn(data, w, h, yTop, yTop + headH * 0.18, faceX0, faceX1);
  const browX = densestColumn(data, w, h, browY - headH * 0.05, browY + headH * 0.08, faceX0, faceX1);
  return {
    crown: { x: crownX, y: crownY },
    brow: { x: browX, y: browY },
    head: { minX, maxX, yTop, yBot, h: headH },
  };
}

function median(arr) {
  if (!arr.length) return 0;
  const a = arr.slice().sort((x, y) => x - y);
  return a[a.length >> 1];
}

function pathsFromRows(rows, w, h, width, height, y0, spec, imgData) {
  spec = spec || {};
  const B = bodyMap(spec);
  const toLocal = (px, py, z) => new THREE.Vector3(
    ((px / (w - 1)) - 0.5) * width,
    y0 + (0.5 - py / (h - 1)) * height,
    z,
  );
  const n = rows.length;
  const midW = median(rows.slice((n * 0.35) | 0, (n * 0.55) | 0).map((r) => r.maxX - r.minX));
  const lowW = median(rows.slice((n * 0.85) | 0).map((r) => r.maxX - r.minX));
  const seated = B.pose === "seated" || B.pose === "recumbent" || lowW > midW * 1.12;
  const startY = B.crown * (h - 1);
  const start = Math.max(0, rows.findIndex((r) => r.y >= startY));
  const step = Math.max(1, ((rows.length - start) / 20) | 0);
  const left = [];
  const right = [];
  const center = [];
  const cxPx = B.crownX * (w - 1);
  for (let i = start; i < rows.length; i += step) {
    const r = rows[i];
    left.push(toLocal(r.minX, r.y, 0.14));
    right.push(toLocal(r.maxX, r.y, 0.14));
    center.push(toLocal(cxPx, r.y, 0.2));
  }
  const last = rows[rows.length - 1];
  left.push(toLocal(last.minX, last.y, 0.1));
  right.push(toLocal(last.maxX, last.y, 0.1));
  center.push(toLocal(last.mid, last.y, 0.12));
  const chestRow = rows[Math.min(n - 1, Math.round(n * 0.5))];
  const handsRow = rows[Math.min(n - 1, Math.round(n * (seated ? 0.58 : 0.52)))];
  const faceZ = 0.42;
  return {
    left,
    right,
    center,
    crownPos: uvToLocal(B.crownX, B.crown, width, height, y0, faceZ),
    browPos: uvToLocal(B.browX, B.brow, width, height, y0, faceZ + 0.02),
    chestPos: toLocal(chestRow.mid, chestRow.y, 0.28),
    handsPos: toLocal(handsRow.mid, handsRow.y, 0.3),
    feetPos: uvToLocal(B.feetX, B.feetY, width, height, y0, 0.36),
    basePos: toLocal(last.mid, last.y, 0.08),
    faceR: 0.12,
    seated,
    pose: B.pose,
    pixel: {
      crown: { x: B.crownX * (w - 1), y: B.crown * (h - 1) },
      brow: { x: B.browX * (w - 1), y: B.brow * (h - 1) },
      feetY: B.feetY * (h - 1),
      feetX: B.feetX * (w - 1),
    },
  };
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

async function makeStatue(spec) {
  const g = new THREE.Group();
  g.add(pedestal());
  const img = await loadImage(spec.src);
  const punched = punchBackground(img);
  if (!punched.preCut) erodeAlpha(punched.data, punched.w, punched.h, 2);
  const pctx = punched.canvas.getContext("2d");
  pctx.putImageData(punched.data, 0, 0);
  const rows = silhouetteRows(punched.data, punched.w, punched.h, 40);
  const outline = traceOutline(punched.data, punched.w, punched.h, 40);
  const tex = new THREE.CanvasTexture(punched.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  const aspect = punched.w / punched.h;
  const height = 1.66;
  const width = Math.min(1.32, height * aspect);
  const y0 = 0.36 + height / 2;
  const depth = 0.36;

  const rimGeo = makeRim(outline, punched.w, punched.h, width, height, y0, depth);
  if (rimGeo) {
    const rim = new THREE.Mesh(rimGeo, mats.bronze);
    rim.castShadow = true;
    rim.receiveShadow = true;
    g.add(rim);
  }

  const geo = reliefGeometry(punched.data, punched.w, punched.h, width, height);
  geo.userData.localGeo = true;
  const matFront = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.36,
    metalness: 0.42,
  });
  matFront.userData.localMat = true;
  matFront.userData.localTex = true;
  const front = new THREE.Mesh(geo, matFront);
  front.position.set(0, y0, depth * 0.5);
  front.castShadow = true;
  front.receiveShadow = true;
  g.add(front);

  const backGeo = geo.clone();
  backGeo.userData.localGeo = true;
  const pos = backGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setZ(i, -pos.getZ(i));
  backGeo.computeVertexNormals();
  const matBack = new THREE.MeshStandardMaterial({
    color: 0x8a5a32,
    alphaMap: tex,
    transparent: true,
    alphaTest: 0.2,
    roughness: 0.48,
    metalness: 0.5,
    side: THREE.BackSide,
  });
  matBack.userData.localMat = true;
  const back = new THREE.Mesh(backGeo, matBack);
  back.position.set(0, y0, -depth * 0.5);
  back.castShadow = true;
  g.add(back);

  let crown;
  let brow;
  let chest;
  let base;
  let feet;
  let hands;
  let paths = null;
  let pixel = null;
  if (rows.length > 8) {
    const P = pathsFromRows(rows, punched.w, punched.h, width, height, y0, spec, punched.data);
    paths = { left: P.left, right: P.right, center: P.center };
    crown = dummy(P.crownPos.x, P.crownPos.y, P.crownPos.z);
    brow = dummy(P.browPos.x, P.browPos.y, P.browPos.z);
    chest = dummy(P.chestPos.x, P.chestPos.y, P.chestPos.z);
    hands = dummy(P.handsPos.x, P.handsPos.y, P.handsPos.z);
    feet = dummy(P.feetPos.x, P.feetPos.y, P.feetPos.z);
    base = dummy(P.basePos.x, P.basePos.y, P.basePos.z);
    g.userData.faceR = P.faceR;
    pixel = P.pixel;
  } else {
    const uv = ANCHORS[spec.id] || ANCHORS.custom;
    crown = dummy((uv.crown[0] - 0.5) * width, y0 + (uv.crown[1] - 0.5) * height, 0.22);
    brow = dummy((uv.brow[0] - 0.5) * width, y0 + (uv.brow[1] - 0.5) * height, 0.24);
    chest = dummy(0, y0, 0.18);
    hands = dummy(0, y0 - height * 0.08, 0.2);
    feet = dummy(0, y0 - height * 0.38, 0.18);
    base = dummy(0, y0 - height * 0.38, 0.1);
  }
  g.add(crown, brow, chest, hands, feet, base);
  const debugOn = typeof location !== "undefined" && /(?:\?|&)debug=1/.test(location.search);
  if (debugOn) {
    const mark = (obj, color) => {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.035, 12, 10),
        new THREE.MeshBasicMaterial({ color, depthTest: false, transparent: true, opacity: 0.92 }),
      );
      s.renderOrder = 20;
      obj.add(s);
    };
    mark(crown, 0x3b9dff);
    mark(brow, 0xff3b3b);
    mark(feet, 0x3bff7a);
  }

  const wetC = document.createElement("canvas");
  wetC.width = punched.w;
  wetC.height = punched.h;
  const wetCtx = wetC.getContext("2d");
  const wetImg = wetCtx.createImageData(punched.w, punched.h);
  const wetTex = new THREE.CanvasTexture(wetC);
  wetTex.needsUpdate = true;
  const wetMat = new THREE.ShaderMaterial({
    uniforms: {
      uWet: { value: wetTex },
      uKind: { value: 0 },
    },
    vertexShader: WET_VERT,
    fragmentShader: WET_FRAG,
    transparent: true,
    depthWrite: false,
  });
  wetMat.userData.localMat = true;
  const wetMesh = new THREE.Mesh(geo, wetMat);
  wetMesh.position.set(0, y0, depth * 0.5 + 0.008);
  wetMesh.castShadow = false;
  wetMesh.receiveShadow = false;
  wetMesh.renderOrder = 2;
  g.add(wetMesh);
  const minX = new Int16Array(punched.h).fill(-1);
  const maxX = new Int16Array(punched.h).fill(-1);
  rows.forEach((r) => { minX[r.y] = r.minX; maxX[r.y] = r.maxX; });

  g.userData.anchors = { crown, forehead: brow, chest, hands, feet, base };
  g.userData.paths = paths;
  g.userData.coatMesh = front;
  g.userData.kind = "statue";
  g.userData.deityId = spec.id;
  g.userData.family = spec.family;
  g.userData.wet = {
    canvas: wetC,
    ctx: wetCtx,
    tex: wetTex,
    imgData: wetImg,
    w: punched.w,
    h: punched.h,
    alpha: punched.data,
    minX,
    maxX,
  };
  g.userData.pixel = pixel;
  g.userData.pose = spec.pose || "standing";
  g.userData.wetMat = wetMat;
  g.userData.frontMat = matFront;
  g.userData.backMat = matBack;
  return g;
}

function worldOf(obj) {
  obj.getWorldPosition(_v);
  return _v.clone();
}

function makeKalash() {
  const g = new THREE.Group();
  const body = lathe(
    [[0.02, 0], [0.1, 0.03], [0.125, 0.16], [0.07, 0.26], [0.04, 0.32]],
    mats.gold,
  );
  g.add(body);
  g.add(mesh(new THREE.TorusGeometry(0.048, 0.01, 8, 16), mats.gold, 0, 0.3, 0));
  const spout = lathe(
    [[0.0, 0], [0.022, 0.0], [0.018, 0.09], [0.0, 0.1]],
    mats.gold,
  );
  spout.rotation.z = 1.15;
  spout.position.set(-0.09, 0.26, 0);
  g.add(spout);
  const lip = dummy(-0.16, 0.3, 0);
  g.add(lip);
  g.userData.spout = lip;
  g.scale.setScalar(1.15);
  g.visible = false;
  return g;
}

function pourCurve(from, to, n) {
  const mid = from.clone().lerp(to, 0.42);
  mid.y = Math.max(to.y + 0.04, from.y - 0.02);
  mid.z = (from.z + to.z) * 0.5 + 0.05;
  const curve = new THREE.CatmullRomCurve3([from, mid, to]);
  return curve.getPoints(n);
}

function spoutWorld() {
  if (!kalash || !kalash.userData.spout) {
    return kalash.position.clone().add(new THREE.Vector3(-0.12, 0.04, 0));
  }
  return worldOf(kalash.userData.spout);
}

function addCoat(kind) {
  if (!current || !current.userData.coatMesh) return;
  const host = current.userData.coatMesh;
  const isMilk = kind === "milk";
  const coatMat = (isMilk ? mats.milk : mats.water).clone();
  coatMat.transparent = true;
  coatMat.opacity = 0;
  coatMat.depthWrite = false;
  if (host.material && host.material.map) {
    coatMat.map = host.material.map;
    coatMat.alphaTest = 0.14;
  }
  const coat = new THREE.Mesh(host.geometry, coatMat);
  coat.position.z = 0.01;
  coat.castShadow = false;
  coat.receiveShadow = false;
  host.add(coat);
  coat.userData.life = 8;
  coat.userData.target = isMilk ? 0.5 : 0.28;
  coats.push(coat);
}

function makeWaterMaterial(kind) {
  const isMilk = kind === "milk";
  const isOil = kind === "oil";
  const color = isOil ? new THREE.Color(0x6b4a1e) : isMilk ? new THREE.Color(0xf3eee4) : new THREE.Color(0x9ecbe0);
  const uniforms = {
    uTime: { value: 0 },
    uFill: { value: 0 },
    uColor: { value: color },
    uOpacity: { value: isOil ? 0.9 : isMilk ? 0.84 : 0.78 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: WATER_VERT,
    fragmentShader: WATER_FRAG,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  mat.userData.localMat = true;
  return { mat, uniforms };
}

function ribbonGeometry(points, width) {
  const n = points.length;
  const positions = new Float32Array(n * 2 * 3);
  const uvs = new Float32Array(n * 2 * 2);
  const idx = [];
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const nxt = points[Math.min(n - 1, i + 1)];
    const prv = points[Math.max(0, i - 1)];
    _dir.copy(nxt).sub(prv);
    if (_dir.lengthSq() < 1e-8) _dir.set(0, -1, 0);
    _side.set(-_dir.z, 0, _dir.x);
    if (_side.lengthSq() < 1e-6) _side.set(1, 0, 0);
    _side.normalize().multiplyScalar(width * 0.5);
    const o = i * 6;
    positions[o] = p.x - _side.x; positions[o + 1] = p.y; positions[o + 2] = p.z - _side.z;
    positions[o + 3] = p.x + _side.x; positions[o + 4] = p.y; positions[o + 5] = p.z + _side.z;
    const v = n === 1 ? 0 : i / (n - 1);
    const uo = i * 4;
    uvs[uo] = v; uvs[uo + 1] = 0;
    uvs[uo + 2] = v; uvs[uo + 3] = 1;
  }
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2; const b = a + 1; const c = a + 2; const d = a + 3;
    idx.push(a, b, c, b, d, c);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  geo.userData.localGeo = true;
  return geo;
}

function addRibbon(pts, width, kind, fillSpeed, life) {
  if (!pts || pts.length < 2) return;
  const { mat, uniforms } = makeWaterMaterial(kind);
  const mesh = new THREE.Mesh(ribbonGeometry(pts, width), mat);
  mesh.castShadow = false;
  mesh.frustumCulled = false;
  fxRoot.add(mesh);
  streams.push({
    mesh,
    uniforms,
    fill: 0,
    fillSpeed: fillSpeed || 2.4,
    life: life || 1.7,
    baseOpacity: uniforms.uOpacity.value,
    kind,
  });
}

function arcPoints(from, to, n) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = from.clone().lerp(to, t);
    p.y += Math.sin(t * Math.PI) * 0.03 - 4 * t * (1 - t) * 0.05;
    p.z += Math.sin(t * Math.PI) * 0.02;
    pts.push(p);
  }
  return pts;
}

function dropMesh(matRef, size) {
  if (!dropGeo) dropGeo = new THREE.SphereGeometry(1, 10, 10);
  const d = new THREE.Mesh(dropGeo, matRef);
  d.scale.set(size * 0.7, size * 1.05, size * 0.7);
  d.castShadow = false;
  d.receiveShadow = false;
  return d;
}

function clearWet() {
  if (!current || !current.userData.wet) return;
  const W = current.userData.wet;
  W.imgData.data.fill(0);
  W.ctx.putImageData(W.imgData, 0, 0);
  W.tex.needsUpdate = true;
}

function beginWet(kind) {
  if (!current || !current.userData.wet || !current.userData.pixel) return;
  const px = current.userData.pixel;
  if (current.userData.wetMat && current.userData.wetMat.uniforms) {
    current.userData.wetMat.uniforms.uKind.value = kind === "milk" ? 1 : kind === "oil" ? 0.65 : 0;
  }
  wetSim = {
    kind,
    t: 0,
    dur: 2.1,
    x: px.crown.x,
    y0: px.crown.y,
    prev: px.crown.y,
    wobble: (Math.random() - 0.5) * 8,
  };
}

function stepWet(dt) {
  if (!wetSim || !current || !current.userData.wet) return;
  const W = current.userData.wet;
  wetSim.t += dt;
  const u = Math.min(1, wetSim.t / wetSim.dur);
  const eased = u * u * (3 - 2 * u);
  const front = wetSim.y0 + (W.h - 1 - wetSim.y0) * eased;
  const buf = W.imgData.data;
  const alpha = W.alpha.data;
  const yStart = Math.max(0, wetSim.prev | 0);
  const yEnd = Math.min(W.h - 1, front | 0);
  const cx0 = wetSim.x;
  for (let y = yStart; y <= yEnd; y++) {
    const minX = W.minX[y];
    const maxX = W.maxX[y];
    if (minX < 0) continue;
    const mid = (minX + maxX) * 0.5;
    const drift = Math.sin((y - wetSim.y0) * 0.035 + wetSim.wobble) * 7;
    const c1 = Math.min(maxX - 2, Math.max(minX + 2, cx0 + drift));
    const c2 = mid * 0.35 + c1 * 0.65;
    const c3 = minX * 0.25 + mid * 0.75 + drift * 0.4;
    const xs = [c1, c2, c3];
    const sig = [28, 70, 18];
    const travel = (y - wetSim.y0) / Math.max(1, W.h - wetSim.y0);
    for (let x = minX; x <= maxX; x++) {
      const i = (y * W.w + x) * 4;
      if (alpha[i + 3] < 40) continue;
      let inf = 0;
      let core = 0;
      for (let k = 0; k < 3; k++) {
        const d = x - xs[k];
        const g = Math.exp(-(d * d) / (2 * sig[k]));
        inf = Math.max(inf, g);
        if (k === 0) core = g;
      }
      if (inf < 0.05) continue;
      const fade = 0.7 + 0.3 * (1 - travel);
      const add = inf * fade * 90;
      const hi = Math.min(255, 70 + core * 185);
      buf[i] = Math.max(buf[i], hi);
      buf[i + 1] = Math.max(buf[i + 1], hi * 0.92);
      buf[i + 2] = Math.max(buf[i + 2], hi * 0.88);
      buf[i + 3] = Math.min(210, buf[i + 3] + add);
    }
  }
  wetSim.prev = front;
  W.ctx.putImageData(W.imgData, 0, 0);
  W.tex.needsUpdate = true;
  if (current.userData.puddle) {
    const reach = Math.max(0, (u - 0.55) / 0.45);
    current.userData.puddle.material.opacity = 0.38 * reach;
  }
  if (u >= 1) wetSim = null;
}

function spawnSplash(top, kind) {
  const isMilk = kind === "milk";
  const isOil = kind === "oil";
  const splashN = reduced ? 6 : 12;
  const splashMat = new THREE.MeshStandardMaterial({
    color: isOil ? 0x6b4a1e : isMilk ? 0xf6f1e6 : 0xcfe8f4,
    transparent: true,
    opacity: 0.7,
    roughness: 0.06,
    metalness: 0.05,
    depthWrite: false,
  });
  splashMat.userData.localMat = true;
  for (let i = 0; i < splashN; i++) {
    const d = dropMesh(splashMat, isMilk || isOil ? 0.011 : 0.0075);
    d.position.copy(top);
    d.userData = {
      vx: (Math.random() - 0.5) * 0.16,
      vy: 0.08 + Math.random() * 0.1,
      vz: 0.02 + Math.random() * 0.1,
      life: 0.38 + Math.random() * 0.22,
      splash: true,
    };
    fxRoot.add(d);
    drops.push(d);
  }
}

function ensurePuddle() {
  if (!current) return null;
  if (current.userData.puddle) return current.userData.puddle;
  const p = mesh(new THREE.CircleGeometry(0.2, 28), (mats.water).clone(), 0, 0.332, 0.14);
  p.rotation.x = -Math.PI / 2;
  p.material.transparent = true;
  p.material.opacity = 0;
  p.material.roughness = 0.05;
  p.material.metalness = 0.08;
  p.castShadow = false;
  current.add(p);
  current.userData.puddle = p;
  return p;
}

function pour(kind) {
  if (!current) return;
  const top = worldOf(current.userData.anchors.crown);
  const hold = top.clone().add(new THREE.Vector3(0.28, 0.34, 0.22));
  kalash.position.copy(hold);
  kalash.rotation.set(0.12, 0.1, -0.08);
  kalash.visible = true;
  kalashAnim = { t: 0, hold, kind, top, started: false };
  if (milkPool && kind === "milk") milkPool.material.opacity = 0.72;
  else if (milkPool && kind === "water") {
    milkPool.material.color = mats.water.color;
    milkPool.material.opacity = 0.45;
  }
  ensurePuddle();
}

function arghya() {
  if (!current) return;
  const hands = worldOf(current.userData.anchors.hands || current.userData.anchors.chest);
  const from = hands.clone().add(new THREE.Vector3(0, 0.04, 0.22));
  const to = hands.clone().add(new THREE.Vector3(0, 0.42, 0.85));
  kalash.position.copy(from.clone().add(new THREE.Vector3(0.12, 0.08, 0.04)));
  kalash.rotation.set(0.2, 0, -0.9);
  kalash.visible = true;
  kalashAnim = { t: 0, hold: kalash.position.clone() };
  addRibbon(arcPoints(from, to, 14), 0.014, "water", 2.8, 1.6);
}

function stepKalash(dt) {
  if (!kalashAnim || !kalash) return;
  kalashAnim.t += dt;
  const t = kalashAnim.t;
  if (t < 0.32) kalash.rotation.z = -0.08 - 1.05 * (t / 0.32);
  else if (t < 1.55) kalash.rotation.z = -1.13;
  else if (t < 2.05) kalash.rotation.z = -1.13 + 1.05 * ((t - 1.55) / 0.5);
  else {
    kalash.visible = false;
    kalashAnim = null;
    return;
  }
  if (!kalashAnim.started && t >= 0.26) {
    kalashAnim.started = true;
    const kind = kalashAnim.kind;
    const isMilk = kind === "milk";
    const isOil = kind === "oil";
    const width = isMilk || isOil ? 0.016 : 0.009;
    const from = spoutWorld();
    addRibbon(pourCurve(from, kalashAnim.top, 22), width, kind, 3.2, 1.7);
    beginWet(kind);
    spawnSplash(kalashAnim.top, kind);
  }
}

function stepStreams(dt) {
  for (let i = streams.length - 1; i >= 0; i--) {
    const s = streams[i];
    s.fill = Math.min(1, s.fill + s.fillSpeed * dt);
    s.life -= dt;
    s.uniforms.uFill.value = s.fill;
    s.uniforms.uTime.value = clockT;
    const fade = s.life < 0.45 ? Math.max(0, s.life / 0.45) : 1;
    s.uniforms.uOpacity.value = s.baseOpacity * fade;
    if (s.life <= 0) {
      fxRoot.remove(s.mesh);
      if (s.mesh.geometry) s.mesh.geometry.dispose();
      if (s.mesh.material && s.mesh.material.userData.localMat) s.mesh.material.dispose();
      streams.splice(i, 1);
    }
  }
}

function stampMark(kind) {
  if (!current) return;
  const brow = current.userData.anchors.forehead;
  if (current.userData.kind === "lingam") {
    const host = current.userData.coatMesh;
    const stripe = (yy, h, matRef) => {
      const s = mesh(new THREE.BoxGeometry(0.28, h, 0.02), matRef, 0, yy, 0.2);
      host.add(s);
      marks.push(s);
    };
    if (kind === "chandan") stripe(0.22, 0.045, mats.chandan);
    else {
      stripe(0.32, 0.022, mats.bhasma);
      stripe(0.26, 0.022, mats.bhasma);
      stripe(0.2, 0.022, mats.bhasma);
      const bindu = mesh(new THREE.CircleGeometry(0.03, 16), mats.kumkum, 0, 0.26, 0.22);
      host.add(bindu);
      marks.push(bindu);
    }
    return;
  }
  if (kind === "tilak" && (current.userData.family === "shiva" || current.userData.deityId === "shivling")) {
    [-0.016, 0, 0.016].forEach((dy) => {
      const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 0.011), mats.bhasma);
      stripe.position.set(0, dy, 0.012);
      brow.add(stripe);
      marks.push(stripe);
    });
    const bindu = new THREE.Mesh(new THREE.CircleGeometry(0.01, 12), mats.kumkum);
    bindu.position.set(0, 0, 0.014);
    brow.add(bindu);
    marks.push(bindu);
    return;
  }
  const w = kind === "chandan" ? 0.055 : 0.028;
  const h = kind === "chandan" ? 0.038 : 0.028;
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(kind === "chandan" ? 0.028 : 0.016, 18),
    kind === "chandan" ? mats.chandan : mats.kumkum,
  );
  m.scale.set(1.35, 1, 1);
  m.position.set(0, 0, 0.014);
  brow.add(m);
  marks.push(m);
}

function mark(kind) {
  if (!current) return;
  const brow = worldOf(current.userData.anchors.forehead);
  const blob = new THREE.Mesh(
    new THREE.SphereGeometry(kind === "chandan" ? 0.018 : 0.012, 12, 10),
    kind === "chandan" ? mats.chandan : mats.kumkum,
  );
  blob.position.copy(brow.clone().add(new THREE.Vector3(0.22, 0.08, 0.28)));
  fxRoot.add(blob);
  applicator = {
    mesh: blob,
    from: blob.position.clone(),
    to: brow.clone().add(new THREE.Vector3(0, 0, 0.02)),
    t: 0,
    dur: 0.55,
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
  const mat = (isTulsi ? mats.leaf : mats.leaf).clone();
  if (isTulsi) mat.color = new THREE.Color(0x3d8b5a);
  if (kind === "bilva") mat.color = new THREE.Color(0x6a9a4a);
  const p = new THREE.Mesh(geo, mat);
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
  const n = reduced ? 8 : (kind === "tulsi" ? 16 : 16);
  const isLeaf = kind === "bilva" || kind === "durva" || kind === "tulsi";
  const spread = atFeet
    ? 0.1
    : Math.min(0.13, (current.userData.faceR || 0.14) * 1.05);
  for (let i = 0; i < n; i++) {
    const p = isLeaf
      ? leafMesh(kind)
      : mesh(new THREE.SphereGeometry(0.032, 8, 6), mats.petal);
    if (!isLeaf) p.scale.set(0.7, 0.22, 1.1);
    const ox = (Math.random() - 0.5) * spread;
    const oz = 0.03 + (Math.random() - 0.5) * spread * 0.45;
    p.position.set(
      top.x + ox * 1.4,
      top.y + (atFeet ? 0.38 : 0.55) + Math.random() * 0.12,
      top.z + 0.1 + Math.random() * 0.08,
    );
    p.userData = {
      vy: atFeet ? -0.05 : 0,
      target: top.clone().add(new THREE.Vector3(ox, atFeet ? 0.015 : 0.02, oz)),
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
    map,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
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
      new THREE.MeshBasicMaterial({ map: diyaMap, transparent: true, depthWrite: false }),
    );
    plane.rotation.x = -1.05;
    plane.position.set(0, 0.028, 0.01);
    plane.userData.kind = "diyaPlane";
    g.add(plane);
  }
  const flame = flameSprite(0.09, 0.16);
  flame.position.set(0, 0.11, 0);
  g.add(flame);
  const light = new THREE.PointLight(0xffb060, 1.15, 3.4);
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
    t.needsUpdate = true;
    diyaMap = t;
    refreshSanctumDiyas();
  });
  loader.load("../deities/flame.webp?v=u2", (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.needsUpdate = true;
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
  down.y -= 0.28;
  down.z += 0.12;
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

function stepDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    if (d.userData.splash) {
      d.userData.vy -= 2.6 * dt;
      d.position.x += d.userData.vx * dt;
      d.position.y += d.userData.vy * dt;
      d.position.z += d.userData.vz * dt;
      d.userData.life -= dt;
      const s = Math.max(0.2, d.userData.life * 2);
      d.scale.setScalar(s * 0.012);
      if (d.material && d.material.opacity != null) d.material.opacity = Math.max(0, d.userData.life * 1.6);
      if (d.userData.life <= 0 || d.position.y < 0.35) {
        fxRoot.remove(d);
        drops.splice(i, 1);
      }
      continue;
    }
    d.userData.u += d.userData.speed * dt;
    const u = d.userData.u;
    if (u < 0) {
      d.visible = false;
      continue;
    }
    d.visible = true;
    if (d.userData.kind === "lingam") {
      const y = 1.14 - u * 0.72;
      let r = 0.04;
      const localY = y - 0.5;
      if (localY < 0.64 && localY > 0.46) r = 0.1 + (0.64 - localY) * 0.6;
      else if (localY <= 0.46) r = 0.21;
      d.position.set(Math.cos(d.userData.ang) * r, y, Math.sin(d.userData.ang) * r * 0.85);
      if (y < 0.5) { fxRoot.remove(d); drops.splice(i, 1); }
    } else {
      const path = d.userData.path;
      if (!path || path.length < 2) { fxRoot.remove(d); drops.splice(i, 1); continue; }
      const max = path.length - 1;
      const t = Math.min(Math.max(u, 0), max);
      const i0 = Math.min(Math.floor(t), max - 1);
      const f = t - i0;
      d.position.lerpVectors(path[i0], path[i0 + 1], f);
      d.position.x += Math.cos(d.userData.ang) * 0.01;
      d.lookAt(path[Math.min(i0 + 1, max)]);
      if (u > max + 0.2) { fxRoot.remove(d); drops.splice(i, 1); }
    }
  }
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
  const r = Math.max(0.16, (current.userData.faceR || 0.16) + 0.08);
  const t = aartiT * 1.7;
  aartiLamp.position.set(
    face.x + Math.sin(t) * r,
    face.y - 0.02 + Math.sin(t * 2) * 0.04,
    face.z + 0.22 + Math.cos(t) * r * 0.55,
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

function stepCoats(dt) {
  for (let i = coats.length - 1; i >= 0; i--) {
    const c = coats[i];
    c.userData.life -= dt;
    const fadeIn = Math.min(1, (8 - c.userData.life) * 2);
    c.material.opacity = c.userData.target * Math.min(1, fadeIn) * Math.max(0, Math.min(1, c.userData.life / 3));
    if (c.userData.life <= 0) {
      if (c.parent) c.parent.remove(c);
      coats.splice(i, 1);
    }
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
  if (sunLight) sunLight.intensity = 0.08 + 1.17 * e;
  if (hemLight) hemLight.intensity = 0.12 + 0.78 * e;
  if (fillLight) fillLight.intensity = 0.06 + 0.32 * e;
  if (auraLight) auraLight.intensity = e < 0.55 ? e * 3.2 : 1.76 - (e - 0.55) * 1.4;
  statueMats.forEach((m) => {
    if (!m) return;
    if (m.opacity != null && m.transparent) m.opacity = Math.min(1, 0.12 + e * 0.95);
    if (m.emissiveIntensity != null) m.emissiveIntensity = 0.7 * (1 - e);
  });
  if (motes && motes.material) {
    motes.material.opacity = e < 0.7 ? e * 0.85 : 0.6 * (1 - (e - 0.7) / 0.3);
  }
  if (u >= 1) {
    statueMats.forEach((m) => {
      if (!m) return;
      if (m.opacity != null) m.opacity = 1;
      if (m.emissiveIntensity != null) m.emissiveIntensity = 0.04;
    });
    if (controls) {
      controls.enabled = true;
      controls.enableRotate = true;
    }
    revealAnim = null;
  }
}

function spawnMotes() {
  if (motes) {
    fxRoot.remove(motes);
    if (motes.geometry) motes.geometry.dispose();
    motes = null;
  }
  if (reduced) return;
  const n = 64;
  const pos = new Float32Array(n * 3);
  const vel = [];
  for (let i = 0; i < n; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 1.5;
    pos[i * 3 + 1] = 0.35 + Math.random() * 1.7;
    pos[i * 3 + 2] = 0.15 + Math.random() * 0.7;
    vel.push(0.035 + Math.random() * 0.07);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.userData.localGeo = true;
  const mat = new THREE.PointsMaterial({
    color: 0xffe2a8,
    size: 0.016,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: true,
  });
  mat.userData.localMat = true;
  motes = new THREE.Points(geo, mat);
  motes.userData.vel = vel;
  fxRoot.add(motes);
}

function stepMotes(dt) {
  if (!motes) return;
  const pos = motes.geometry.attributes.position;
  const vel = motes.userData.vel;
  for (let i = 0; i < pos.count; i++) {
    let y = pos.getY(i) + vel[i] * dt;
    if (y > 2.15) y = 0.4;
    pos.setY(i, y);
  }
  pos.needsUpdate = true;
  if (!revealAnim && motes.material.opacity > 0) {
    motes.material.opacity = Math.max(0, motes.material.opacity - dt * 0.18);
    if (motes.material.opacity <= 0) {
      fxRoot.remove(motes);
      motes.geometry.dispose();
      motes = null;
    }
  }
}

function prepareManifest(lingam) {
  statueMats = [];
  if (!current) return;
  current.scale.setScalar(1);
  current.position.y = 0;
  current.rotation.set(0, 0, 0);
  const front = current.userData.frontMat;
  const back = current.userData.backMat;
  [front, back].forEach((m) => {
    if (!m) return;
    m.transparent = true;
    m.opacity = 0.08;
    m.emissive = new THREE.Color(0xc49a4a);
    m.emissiveIntensity = 0.7;
    statueMats.push(m);
  });
  if (!auraLight) {
    auraLight = new THREE.PointLight(0xffc878, 0, 3.6);
    scene.add(auraLight);
  }
  auraLight.position.set(0, lingam ? 0.9 : 1.25, 0.45);
  auraLight.intensity = 0;
  spawnMotes();
}

function loop(t) {
  if (!running) return;
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  clockT = t * 0.001;
  stepReveal(dt);
  stepMotes(dt);
  stepDrops(dt);
  stepKalash(dt);
  stepStreams(dt);
  stepWet(dt);
  stepApplicator(dt);
  stepPetals(dt);
  stepSmoke(dt);
  stepAarti(dt);
  stepCoats(dt);
  if (current && current.userData.frontMat && !revealAnim) {
    const m = current.userData.frontMat;
    if (m.emissiveIntensity != null) {
      m.emissiveIntensity = 0.035 + Math.sin(clockT * 1.4) * 0.02;
    }
  }
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
  [...drops, ...petals, ...smokes].forEach((o) => fxRoot.remove(o));
  drops.length = 0; petals.length = 0; smokes.length = 0;
  streams.forEach((s) => {
    fxRoot.remove(s.mesh);
    if (s.mesh.geometry && s.mesh.geometry !== tubeGeoDummy) s.mesh.geometry.dispose();
  });
  streams.length = 0;
  marks.forEach((m) => { if (m.parent) m.parent.remove(m); });
  marks.length = 0;
  coats.forEach((c) => { if (c.parent) c.parent.remove(c); });
  coats.length = 0;
  if (aartiLamp) { fxRoot.remove(aartiLamp); aartiLamp = null; }
  if (kalash) kalash.visible = false;
  kalashAnim = null;
  milkPool = null;
  wetSim = null;
  if (applicator) {
    fxRoot.remove(applicator.mesh);
    applicator = null;
  }
  if (motes) {
    fxRoot.remove(motes);
    if (motes.geometry) motes.geometry.dispose();
    motes = null;
  }
  statueMats = [];
  clearWet();
}

function buildSanctum() {
  const g = new THREE.Group();
  const wall = mesh(new THREE.BoxGeometry(5.2, 3.4, 0.22), mats.sand, 0, 1.55, -1.72);
  wall.castShadow = false;
  g.add(wall);
  const niche = mesh(
    new THREE.CylinderGeometry(1.28, 1.28, 2.7, 36, 1, true, Math.PI * 0.18, Math.PI * 0.64),
    mats.niche, 0, 1.42, -1.4,
  );
  niche.rotation.y = Math.PI;
  niche.castShadow = false;
  g.add(niche);
  const arch = mesh(new THREE.TorusGeometry(1.18, 0.055, 8, 24, Math.PI), mats.gold, 0, 2.18, -1.12);
  arch.rotation.z = Math.PI;
  g.add(arch);
  [-1.48, 1.48].forEach((x) => {
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.3, 14), mats.cream, x, 1.2, -0.9));
    g.add(mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.08, 14), mats.gold, x, 2.38, -0.9));
    g.add(mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 14), mats.gold, x, 0.1, -0.9));
  });
  const flames = [];
  function diya(x, z) {
    const d = makeDiyaGroup();
    d.position.set(x, 0.4, z);
    if (d.userData.flame) flames.push(d.userData.flame);
    return d;
  }
  g.add(diya(-0.92, 0.58), diya(0.92, 0.58));
  g.userData.flames = flames;
  return g;
}

function startReveal(lingam) {
  const end = lingam
    ? { pos: new THREE.Vector3(0, 1.14, 2.28), target: new THREE.Vector3(0, 0.78, 0) }
    : { pos: new THREE.Vector3(0, 1.16, 2.42), target: new THREE.Vector3(0, 1.08, 0) };
  const from = end.pos.clone().add(new THREE.Vector3(0, 0.1, 1.65));
  camera.position.copy(from);
  camera.up.set(0, 1, 0);
  controls.target.copy(end.target);
  camera.lookAt(end.target);
  controls.autoRotate = false;
  controls.enableRotate = false;
  controls.minAzimuthAngle = -0.16;
  controls.maxAzimuthAngle = 0.16;
  controls.minPolarAngle = Math.PI * 0.42;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.enabled = false;
  if (sunLight) sunLight.intensity = 0.08;
  if (hemLight) hemLight.intensity = 0.12;
  if (fillLight) fillLight.intensity = 0.06;
  prepareManifest(lingam);
  revealAnim = reduced
    ? null
    : { t: 0, dur: 2.35, from, to: end.pos, target: end.target };
  if (!revealAnim) {
    camera.position.copy(end.pos);
    statueMats.forEach((m) => {
      if (!m) return;
      if (m.opacity != null) m.opacity = 1;
      if (m.emissiveIntensity != null) m.emissiveIntensity = 0.04;
    });
    controls.enabled = true;
    controls.enableRotate = true;
  }
}

function frameStatue(lingam) {
  startReveal(!!lingam);
}

export function mountMurti(canvas) {
  canvasEl = canvas;
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  readyMats();
  if (!flameFallback) flameFallback = canvasFlame();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3e0cc);
  scene.fog = new THREE.Fog(0xf3e0cc, 6.5, 13);
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 1.3, 2.72);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xffe2c4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  pmrem.dispose();

  hemLight = new THREE.HemisphereLight(0xfff1e0, 0x8a6a50, 0.9);
  scene.add(hemLight);
  sunLight = new THREE.DirectionalLight(0xffe4b8, 1.25);
  sunLight.position.set(1.6, 4.2, 3.2);
  sunLight.castShadow = true;
  sunLight.shadow.mapSize.set(1024, 1024);
  sunLight.shadow.camera.near = 0.5;
  sunLight.shadow.camera.far = 14;
  sunLight.shadow.camera.left = -3;
  sunLight.shadow.camera.right = 3;
  sunLight.shadow.camera.top = 3;
  sunLight.shadow.camera.bottom = -3;
  scene.add(sunLight);
  fillLight = new THREE.DirectionalLight(0xffd8b0, 0.35);
  fillLight.position.set(-2, 1.8, 1.2);
  scene.add(fillLight);
  const rim = new THREE.DirectionalLight(0xffc8a0, 0.28);
  rim.position.set(0.2, 1.6, -2.4);
  scene.add(rim);

  const floor = mesh(new THREE.CircleGeometry(4.8, 48), mats.marble, 0, 0, 0);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  floor.castShadow = false;
  scene.add(floor);
  const inlay = mesh(new THREE.RingGeometry(0.7, 0.86, 40), mats.gold, 0, 0.01, 0);
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
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.minDistance = 1.7;
  controls.maxDistance = 4.2;
  controls.minPolarAngle = Math.PI * 0.38;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.rotateSpeed = 0.16;
  controls.dampingFactor = 0.16;
  controls.target.set(0, 1.08, 0);
  controls.autoRotate = false;
  controls.autoRotateSpeed = 0;
  controls.enableRotate = true;
  controls.minAzimuthAngle = -0.16;
  controls.maxAzimuthAngle = 0.16;

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
  const lingam = spec.lingam === true;
  let next;
  try {
    next = lingam ? shivling() : await makeStatue(spec);
  } catch (err) {
    if (gen !== loadGen) return;
    throw err;
  }
  if (gen !== loadGen) {
    disposeGroup(next);
    return;
  }
  if (next.userData.deityId && spec.id && next.userData.deityId !== spec.id) {
    disposeGroup(next);
    return;
  }
  current = next;
  root.add(current);
  frameStatue(lingam);
  if (typeof window !== "undefined") {
    window.__murtiQA = {
      play: (k) => playOffer(k),
      id: spec.id,
      pose: next.userData.pose,
      anchors() {
        if (!current) return null;
        const a = current.userData.anchors;
        const w = (o) => {
          if (!o) return null;
          const v = worldOf(o);
          return { x: +v.x.toFixed(3), y: +v.y.toFixed(3), z: +v.z.toFixed(3) };
        };
        return {
          id: current.userData.deityId,
          pose: current.userData.pose,
          crown: w(a.crown),
          brow: w(a.forehead),
          feet: w(a.feet),
        };
      },
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

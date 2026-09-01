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

const ANCHORS = {
  ganesha: { crown: [0.5, 0.93], brow: [0.5, 0.7] },
  shiva: { crown: [0.5, 0.9], brow: [0.5, 0.62] },
  krishna: { crown: [0.5, 0.91], brow: [0.5, 0.72] },
  durga: { crown: [0.5, 0.88], brow: [0.5, 0.62] },
  lakshmi: { crown: [0.5, 0.91], brow: [0.5, 0.68] },
  hanuman: { crown: [0.5, 0.9], brow: [0.5, 0.7] },
  saraswati: { crown: [0.5, 0.9], brow: [0.5, 0.68] },
  rama: { crown: [0.48, 0.9], brow: [0.48, 0.7] },
  kali: { crown: [0.5, 0.88], brow: [0.5, 0.62] },
  custom: { crown: [0.5, 0.92], brow: [0.5, 0.72] },
};

function mat(name, opts) {
  if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial(opts);
  return mats[name];
}

function readyMats() {
  mat("bronze", { color: 0xb07840, metalness: 0.55, roughness: 0.42 });
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
  g.userData.anchors = { crown, forehead: brow, chest: lingam, base: yoni };
  g.userData.coatMesh = lingam;
  g.userData.kind = "lingam";
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

  const sample = (x, y) => {
    const i = (y * w + x) * 4;
    return [d[i], d[i + 1], d[i + 2]];
  };
  const corners = [sample(2, 2), sample(w - 3, 2), sample(2, h - 3), sample(w - 3, h - 3)];
  const bg = [0, 0, 0];
  corners.forEach((p) => { bg[0] += p[0]; bg[1] += p[1]; bg[2] += p[2]; });
  bg[0] /= 4; bg[1] /= 4; bg[2] /= 4;

  const dist = (x, y) => {
    const i = (y * w + x) * 4;
    const dr = d[i] - bg[0];
    const dg = d[i + 1] - bg[1];
    const db = d[i + 2] - bg[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  };

  const thresh = 58;
  const visited = new Uint8Array(w * h);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    const p = y * w + x;
    if (visited[p]) return;
    if (dist(x, y) > thresh) return;
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

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = (y * w + x) * 4;
      if (d[i + 3] === 0) continue;
      let n = 0;
      if (d[((y) * w + (x - 1)) * 4 + 3] === 0) n++;
      if (d[((y) * w + (x + 1)) * 4 + 3] === 0) n++;
      if (d[((y - 1) * w + x) * 4 + 3] === 0) n++;
      if (d[((y + 1) * w + x) * 4 + 3] === 0) n++;
      if (n >= 2) d[i + 3] = Math.min(d[i + 3], 90);
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return { canvas: c, data: imgData, w, h };
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
    const z = a < 18 ? -0.02 : body * 0.2 + lum * 0.06;
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

async function makeRelief(spec) {
  const g = new THREE.Group();
  g.add(pedestal());
  const img = await loadImage(spec.src);
  const punched = punchBackground(img);
  const tex = new THREE.CanvasTexture(punched.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  tex.needsUpdate = true;

  const aspect = punched.w / punched.h;
  const height = 1.62;
  const width = Math.min(1.28, height * aspect);
  const geo = reliefGeometry(punched.data, punched.w, punched.h, width, height);
  geo.userData.localGeo = true;
  const y0 = 0.36 + height / 2;
  const matFront = new THREE.MeshStandardMaterial({
    map: tex,
    transparent: true,
    alphaTest: 0.14,
    roughness: 0.48,
    metalness: 0.08,
  });
  const front = new THREE.Mesh(geo, matFront);
  front.position.set(0, y0, 0.02);
  front.castShadow = true;
  front.receiveShadow = true;
  g.add(front);

  const back = mesh(new THREE.BoxGeometry(width * 0.72, height * 0.78, 0.1), mats.bronze, 0, y0 - 0.04, -0.08);
  back.castShadow = true;
  g.add(back);

  const uv = ANCHORS[spec.id] || ANCHORS.custom;
  const toLocal = (uvxy, z) => dummy(
    (uvxy[0] - 0.5) * width,
    y0 + (uvxy[1] - 0.5) * height,
    z,
  );
  const crown = toLocal(uv.crown, 0.22);
  const brow = toLocal(uv.brow, 0.24);
  const chest = toLocal([0.5, 0.48], 0.18);
  const base = toLocal([0.5, 0.12], 0.1);
  g.add(crown, brow, chest, base);
  g.userData.anchors = { crown, forehead: brow, chest, base };
  g.userData.coatMesh = front;
  g.userData.kind = "relief";
  return g;
}

function worldOf(obj) {
  obj.getWorldPosition(_v);
  return _v.clone();
}

function makeKalash() {
  const g = new THREE.Group();
  g.add(lathe([[0.02, 0], [0.085, 0.02], [0.1, 0.12], [0.055, 0.18], [0.035, 0.22]], mats.gold));
  g.add(mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 12), mats.gold, 0, 0.2, 0));
  g.visible = false;
  return g;
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

function pour(kind) {
  if (!current) return;
  const top = worldOf(current.userData.anchors.crown);
  const brow = worldOf(current.userData.anchors.forehead);
  const chest = worldOf(current.userData.anchors.chest);
  const base = worldOf(current.userData.anchors.base);
  kalash.position.copy(top).add(new THREE.Vector3(0.1, 0.3, 0.12));
  kalash.rotation.set(0.15, 0, -0.7);
  kalash.visible = true;
  addCoat(kind);
  if (milkPool && kind === "milk") milkPool.material.opacity = 0.72;
  else if (milkPool && kind === "water") {
    milkPool.material.color = mats.water.color;
    milkPool.material.opacity = 0.45;
  }
  const isMilk = kind === "milk";
  const colorMat = isMilk ? mats.milk : mats.water;
  const n = reduced ? 20 : 48;
  const lingam = current.userData.kind === "lingam";
  for (let i = 0; i < n; i++) {
    const d = mesh(new THREE.SphereGeometry(isMilk ? 0.022 : 0.016, 8, 8), colorMat);
    d.castShadow = false;
    d.userData = {
      ang: Math.random() * Math.PI * 2,
      u: -Math.random() * 0.12,
      speed: 0.55 + Math.random() * 0.35,
      kind: current.userData.kind,
      path: lingam ? null : [top.clone(), brow.clone(), chest.clone(), base.clone()],
    };
    d.position.copy(top);
    fxRoot.add(d);
    drops.push(d);
  }
  setTimeout(() => { kalash.visible = false; }, 1700);
}

function mark(kind) {
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
  const m = new THREE.Mesh(
    new THREE.CircleGeometry(kind === "chandan" ? 0.035 : 0.026, 16),
    kind === "chandan" ? mats.chandan : mats.kumkum,
  );
  m.position.set(0, 0, 0.02);
  brow.add(m);
  marks.push(m);
}

function shower(kind) {
  if (!current) return;
  const top = worldOf(current.userData.anchors.crown);
  const n = reduced ? 10 : 22;
  const isLeaf = kind === "bilva";
  for (let i = 0; i < n; i++) {
    const p = mesh(
      isLeaf ? new THREE.CircleGeometry(0.045, 5) : new THREE.SphereGeometry(0.035, 8, 6),
      isLeaf ? mats.leaf : mats.petal,
    );
    if (!isLeaf) p.scale.set(0.7, 0.22, 1.1);
    p.position.set(top.x + (Math.random() - 0.5) * 0.8, 2.1 + Math.random() * 0.3, top.z + (Math.random() - 0.5) * 0.6);
    p.userData = {
      vy: 0,
      target: top.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.02, (Math.random() - 0.5) * 0.16)),
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

function aarti() {
  if (aartiLamp) {
    fxRoot.remove(aartiLamp);
    aartiLamp = null;
  }
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.055, 0.08, 0.06, 12), mats.gold, 0, 0, 0));
  g.add(mesh(new THREE.ConeGeometry(0.032, 0.12, 8), mats.flame, 0, 0.09, 0));
  const pl = new THREE.PointLight(0xffb040, 1.05, 3.2);
  pl.position.set(0, 0.12, 0);
  g.add(pl);
  aartiLamp = g;
  aartiT = 0;
  fxRoot.add(g);
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
    d.userData.u += d.userData.speed * dt;
    const u = d.userData.u;
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
      if (!path) { fxRoot.remove(d); drops.splice(i, 1); continue; }
      const max = path.length - 1;
      const t = Math.min(u, max);
      const i0 = Math.min(Math.floor(t), max - 1);
      const f = t - i0;
      d.position.lerpVectors(path[i0], path[i0 + 1], f);
      d.position.x += Math.cos(d.userData.ang) * 0.025 * f;
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
  const chest = worldOf(current.userData.anchors.forehead);
  const t = aartiT * 1.55;
  aartiLamp.position.set(
    chest.x + Math.sin(t) * 0.38,
    chest.y - 0.08 + Math.sin(t * 2) * 0.07,
    chest.z + 0.34 + Math.cos(t) * 0.12,
  );
  if (aartiT > 3.4) { fxRoot.remove(aartiLamp); aartiLamp = null; }
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

function loop(t) {
  if (!running) return;
  const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016);
  lastT = t;
  stepDrops(dt);
  stepPetals(dt);
  stepSmoke(dt);
  stepAarti(dt);
  stepCoats(dt);
  if (sanctumRoot && sanctumRoot.userData.flames) {
    sanctumRoot.userData.flames.forEach((f, i) => {
      f.scale.y = 1 + Math.sin(t * 0.008 + i) * 0.18;
    });
  }
  if (controls) controls.update();
  renderer.render(scene, camera);
}

function clearFx() {
  [...drops, ...petals, ...smokes].forEach((o) => fxRoot.remove(o));
  drops.length = 0; petals.length = 0; smokes.length = 0;
  marks.forEach((m) => { if (m.parent) m.parent.remove(m); });
  marks.length = 0;
  coats.forEach((c) => { if (c.parent) c.parent.remove(c); });
  coats.length = 0;
  if (aartiLamp) { fxRoot.remove(aartiLamp); aartiLamp = null; }
  if (kalash) kalash.visible = false;
  milkPool = null;
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
    const d = new THREE.Group();
    d.position.set(x, 0.4, z);
    d.add(mesh(new THREE.CylinderGeometry(0.055, 0.075, 0.045, 12), mats.gold, 0, 0, 0));
    const f = mesh(new THREE.ConeGeometry(0.028, 0.09, 8), mats.flame, 0, 0.065, 0);
    f.castShadow = false;
    d.add(f);
    flames.push(f);
    const light = new THREE.PointLight(0xffb060, 0.6, 3.6);
    light.position.set(0, 0.14, 0);
    d.add(light);
    return d;
  }
  g.add(diya(-0.92, 0.58), diya(0.92, 0.58));
  g.userData.flames = flames;
  return g;
}

export function mountMurti(canvas) {
  canvasEl = canvas;
  reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  readyMats();
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3e0cc);
  scene.fog = new THREE.Fog(0xf3e0cc, 6.5, 13);
  camera = new THREE.PerspectiveCamera(34, 1, 0.1, 40);
  camera.position.set(0, 1.22, 2.7);
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

  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x8a6a50, 0.9));
  const sun = new THREE.DirectionalLight(0xffe4b8, 1.25);
  sun.position.set(1.6, 4.2, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 14;
  sun.shadow.camera.left = -3;
  sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 3;
  sun.shadow.camera.bottom = -3;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffd8b0, 0.35);
  fill.position.set(-2, 1.8, 1.2);
  scene.add(fill);

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
  controls.minPolarAngle = Math.PI * 0.32;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.target.set(0, 1.05, 0);
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.35;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  resize();
  running = true;
  lastT = performance.now();
  renderer.setAnimationLoop(loop);
  window.addEventListener("resize", resize);
}

export async function showDeity(spec) {
  clearFx();
  if (current) {
    root.remove(current);
    current.traverse((c) => {
      if (c.geometry && c.geometry.userData && c.geometry.userData.localGeo) c.geometry.dispose();
    });
    current = null;
  }
  const lingam = spec.id === "shivling" || spec.lingam;
  if (lingam) current = shivling();
  else current = await makeRelief(spec);
  root.add(current);
  if (lingam) {
    controls.minAzimuthAngle = -Infinity;
    controls.maxAzimuthAngle = Infinity;
    controls.target.set(0, 0.72, 0);
    camera.position.set(0, 1.12, 2.35);
  } else {
    controls.minAzimuthAngle = -0.55;
    controls.maxAzimuthAngle = 0.55;
    controls.target.set(0, 1.05, 0);
    camera.position.set(0, 1.2, 2.55);
  }
  controls.autoRotate = !reduced;
}

export function playOffer(kind) {
  if (kind === "water" || kind === "milk") pour(kind);
  else if (kind === "tilak" || kind === "chandan") mark(kind);
  else if (kind === "flowers") shower("flowers");
  else if (kind === "bilva") shower("bilva");
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

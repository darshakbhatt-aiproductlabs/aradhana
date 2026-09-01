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
const _v2 = new THREE.Vector3();

function mat(name, opts) {
  if (!mats[name]) mats[name] = new THREE.MeshStandardMaterial(opts);
  return mats[name];
}

function readyMats() {
  mat("bronze", { color: 0xc48a4a, metalness: 0.78, roughness: 0.28 });
  mat("bronzeDark", { color: 0x8a5a32, metalness: 0.72, roughness: 0.34 });
  mat("gold", { color: 0xd4a54a, metalness: 0.9, roughness: 0.2 });
  mat("stone", { color: 0x3c3e46, metalness: 0.14, roughness: 0.48 });
  mat("stoneLite", { color: 0x5a5c64, metalness: 0.1, roughness: 0.52 });
  mat("marble", { color: 0xeee4d4, metalness: 0.06, roughness: 0.28 });
  mat("sand", { color: 0xc4a07a, metalness: 0.04, roughness: 0.82 });
  mat("niche", { color: 0x7a5a40, metalness: 0.05, roughness: 0.78 });
  mat("cream", { color: 0xf3ece0, metalness: 0.04, roughness: 0.42 });
  mat("rose", { color: 0xe8b8b0, metalness: 0.08, roughness: 0.46 });
  mat("dhoti", { color: 0xc45a3a, metalness: 0.08, roughness: 0.5 });
  mat("saffron", { color: 0xd4783a, metalness: 0.1, roughness: 0.45 });
  mat("skinDark", { color: 0x5c3a28, metalness: 0.55, roughness: 0.4 });
  mat("blue", { color: 0x3a5a78, metalness: 0.35, roughness: 0.4 });
  mat("water", { color: 0x8ec8ea, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.62 });
  mat("milk", { color: 0xf7f2e8, roughness: 0.16, metalness: 0.04, transparent: true, opacity: 0.86 });
  mat("kumkum", { color: 0xc4452d, roughness: 0.55, metalness: 0.05 });
  mat("chandan", { color: 0xe8d09a, roughness: 0.48, metalness: 0.04 });
  mat("bhasma", { color: 0xe8e2d6, roughness: 0.62, metalness: 0.02 });
  mat("petal", { color: 0xf2b7a0, roughness: 0.5, metalness: 0.04 });
  mat("leaf", { color: 0x6a9a4a, roughness: 0.55, metalness: 0.04 });
  mat("flame", { color: 0xffc14a, emissive: 0xff9a1a, emissiveIntensity: 1.6, roughness: 0.4 });
  mat("eye", { color: 0x1a1410, roughness: 0.35, metalness: 0.1 });
  mat("ivory", { color: 0xf0e6d0, metalness: 0.12, roughness: 0.38 });
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

function taperedPath(curve, n, r0, r1, m) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const p = curve.getPoint(t);
    const r = r0 + (r1 - r0) * t;
    g.add(mesh(new THREE.SphereGeometry(r, 10, 8), m, p.x, p.y, p.z));
  }
  return g;
}

function pedestal() {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.7, 0.78, 0.1, 40), mats.marble, 0, 0.05, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.52, 0.6, 0.2, 32), mats.sand, 0, 0.2, 0));
  g.add(mesh(new THREE.CylinderGeometry(0.54, 0.52, 0.05, 32), mats.gold, 0, 0.325, 0));
  return g;
}

function lotus(y, r, m) {
  const g = new THREE.Group();
  g.position.y = y;
  const n = 12;
  for (let i = 0; i < n; i++) {
    const p = mesh(new THREE.SphereGeometry(r * 0.4, 12, 8), m || mats.rose);
    p.scale.set(0.5, 0.16, 1.2);
    const a = (i / n) * Math.PI * 2;
    p.position.set(Math.cos(a) * r * 0.58, 0.02, Math.sin(a) * r * 0.58);
    p.rotation.y = a;
    g.add(p);
  }
  g.add(mesh(new THREE.CylinderGeometry(r * 0.32, r * 0.38, 0.05, 20), mats.gold, 0, 0.03, 0));
  return g;
}

function mukut(m, y) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.1, 0.13, 0.08, 8), m, 0, y, 0));
  g.add(mesh(new THREE.ConeGeometry(0.09, 0.16, 6), mats.gold, 0, y + 0.1, 0));
  g.add(mesh(new THREE.SphereGeometry(0.025, 8, 8), mats.gold, 0, y + 0.19, 0));
  return g;
}

function eyes(y, z, spread) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.SphereGeometry(0.018, 8, 8), mats.cream, spread, y, z));
  g.add(mesh(new THREE.SphereGeometry(0.018, 8, 8), mats.cream, -spread, y, z));
  g.add(mesh(new THREE.SphereGeometry(0.008, 6, 6), mats.eye, spread, y, z + 0.012));
  g.add(mesh(new THREE.SphereGeometry(0.008, 6, 6), mats.eye, -spread, y, z + 0.012));
  return g;
}

function padmaLegs(m, y) {
  const g = new THREE.Group();
  const thigh = new THREE.CapsuleGeometry(0.09, 0.28, 4, 10);
  const L = mesh(thigh, m, 0.17, y, 0.06);
  L.rotation.set(1.2, 0.15, 1.2);
  const R = mesh(thigh, m, -0.17, y, 0.06);
  R.rotation.set(1.2, -0.15, -1.2);
  g.add(L, R);
  g.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), m, 0.2, y - 0.02, 0.18));
  g.add(mesh(new THREE.SphereGeometry(0.075, 12, 10), m, -0.2, y - 0.02, 0.18));
  const dhoti = mesh(new THREE.TorusGeometry(0.24, 0.09, 10, 24), mats.dhoti, 0, y + 0.02, 0.02);
  dhoti.rotation.x = Math.PI / 2;
  dhoti.scale.set(1.15, 1, 0.7);
  g.add(dhoti);
  return g;
}

function arm(m, sign, pose, y) {
  const g = new THREE.Group();
  g.position.set(sign * 0.26, y, 0.02);
  const upper = mesh(new THREE.CapsuleGeometry(0.045, 0.2, 3, 8), m, sign * 0.08, -0.1, 0);
  const lower = mesh(new THREE.CapsuleGeometry(0.04, 0.18, 3, 8), m, sign * 0.1, -0.28, 0.08);
  const hand = mesh(new THREE.SphereGeometry(0.042, 10, 8), m, sign * 0.1, -0.4, 0.1);
  if (pose === "dhyana") {
    g.rotation.z = sign * 0.75;
    lower.position.set(sign * -0.04, -0.26, 0.14);
    hand.position.set(sign * -0.02, -0.36, 0.2);
  } else if (pose === "raised") {
    g.rotation.z = sign * -1.15;
    g.rotation.x = -0.2;
    lower.position.set(sign * 0.02, -0.26, 0.04);
    hand.position.set(sign * 0.02, -0.4, 0.02);
  } else if (pose === "out") {
    g.rotation.z = sign * 0.35;
    g.rotation.x = 0.35;
  } else if (pose === "flute") {
    g.rotation.z = sign * 0.55;
    lower.position.set(sign * -0.02, -0.22, 0.16);
    hand.position.set(sign * -0.04, -0.28, 0.22);
  } else if (pose === "anjali") {
    g.rotation.z = sign * 0.55;
    g.rotation.x = -0.4;
    lower.position.set(sign * -0.06, -0.22, 0.12);
    hand.position.set(sign * -0.08, -0.28, 0.18);
  }
  g.add(upper, lower, hand);
  return g;
}

function torso(m, y, belly) {
  const g = new THREE.Group();
  const abdomen = mesh(new THREE.SphereGeometry(belly ? 0.27 : 0.2, 24, 18), m, 0, y, 0.02);
  abdomen.scale.set(belly ? 1.28 : 1.08, belly ? 0.95 : 0.88, 0.82);
  const chest = mesh(new THREE.SphereGeometry(0.2, 22, 16), m, 0, y + 0.22, 0);
  chest.scale.set(1.22, 0.95, 0.7);
  g.add(abdomen, chest);
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

function ganesha() {
  const m = mats.gold;
  const g = new THREE.Group();
  g.add(pedestal());
  g.add(lotus(0.34, 0.48, mats.rose));
  g.add(padmaLegs(m, 0.44));
  g.add(torso(m, 0.68, true));
  g.add(arm(m, 1, "raised", 0.92));
  g.add(arm(m, -1, "raised", 0.92));
  g.add(arm(m, 1, "out", 0.82));
  g.add(arm(m, -1, "out", 0.82));
  const modak = mesh(new THREE.SphereGeometry(0.05, 10, 8), mats.saffron, 0.38, 0.55, 0.18);
  g.add(modak);

  const head = new THREE.Group();
  head.position.set(0, 1.05, 0.06);
  const skull = mesh(new THREE.SphereGeometry(0.2, 24, 18), m, 0, 0, 0.04);
  skull.scale.set(1.22, 0.92, 1.18);
  head.add(skull);
  const earGeo = new THREE.SphereGeometry(0.2, 16, 12);
  const earL = mesh(earGeo, m, 0.3, 0.02, -0.02, 0.32, 1.15, 0.72);
  earL.rotation.set(0.15, -0.35, 0.45);
  const earR = mesh(earGeo, m, -0.3, 0.02, -0.02, 0.32, 1.15, 0.72);
  earR.rotation.set(0.15, 0.35, -0.45);
  head.add(earL, earR);
  const innerL = mesh(new THREE.SphereGeometry(0.12, 12, 10), mats.rose, 0.28, 0.0, 0.02, 0.22, 0.95, 0.5);
  const innerR = mesh(new THREE.SphereGeometry(0.12, 12, 10), mats.rose, -0.28, 0.0, 0.02, 0.22, 0.95, 0.5);
  head.add(innerL, innerR);

  const trunkCurve = new THREE.CubicBezierCurve3(
    new THREE.Vector3(0, -0.02, 0.22),
    new THREE.Vector3(0.02, -0.16, 0.4),
    new THREE.Vector3(0.16, -0.34, 0.32),
    new THREE.Vector3(0.14, -0.18, 0.12),
  );
  head.add(taperedPath(trunkCurve, 16, 0.065, 0.022, m));
  const tuskL = mesh(new THREE.ConeGeometry(0.025, 0.12, 8), mats.ivory, 0.07, -0.08, 0.2);
  tuskL.rotation.set(1.1, 0, -0.4);
  const tuskR = mesh(new THREE.ConeGeometry(0.018, 0.07, 8), mats.ivory, -0.07, -0.06, 0.2);
  tuskR.rotation.set(1.1, 0, 0.5);
  head.add(tuskL, tuskR);
  head.add(eyes(-0.02, 0.2, 0.07));
  head.add(mukut(mats.gold, 0.16));
  g.add(head);

  const mouse = mesh(new THREE.SphereGeometry(0.05, 10, 8), mats.stoneLite, 0.42, 0.4, 0.32);
  mouse.scale.set(1.3, 0.7, 0.9);
  g.add(mouse);

  const crown = dummy(0, 1.42, 0.08);
  const brow = dummy(0, 1.08, 0.28);
  g.add(crown, brow);
  g.userData.anchors = { crown, forehead: brow, chest: skull, base: g };
  g.userData.coatMesh = skull;
  g.userData.kind = "figure";
  return g;
}

function shiva(form) {
  const dark = form === "bhairav" || form === "kali";
  const m = dark ? mats.skinDark : mats.bronze;
  const g = new THREE.Group();
  g.add(pedestal());
  g.add(lotus(0.34, 0.44, mats.cream));

  if (form === "nataraj") {
    const stand = mesh(new THREE.CylinderGeometry(0.07, 0.1, 0.55, 12), m, 0.05, 0.68, 0);
    stand.rotation.z = 0.18;
    g.add(stand);
    const torsoN = mesh(new THREE.SphereGeometry(0.16, 18, 14), m, 0, 1.05, 0);
    torsoN.scale.set(1.15, 1.25, 0.7);
    g.add(torsoN);
    g.add(mesh(new THREE.SphereGeometry(0.13, 16, 12), m, 0, 1.32, 0.02));
    const bun = mesh(new THREE.SphereGeometry(0.08, 12, 10), m, 0, 1.46, -0.02);
    g.add(bun);
    const armL = mesh(new THREE.CapsuleGeometry(0.04, 0.42, 4, 8), m, 0.32, 1.18, 0);
    armL.rotation.z = 1.05;
    const armR = mesh(new THREE.CapsuleGeometry(0.04, 0.38, 4, 8), m, -0.28, 1.22, 0);
    armR.rotation.z = -1.25;
    const armL2 = mesh(new THREE.CapsuleGeometry(0.035, 0.32, 3, 8), m, 0.3, 1.0, -0.04);
    armL2.rotation.z = 0.4;
    const armR2 = mesh(new THREE.CapsuleGeometry(0.035, 0.32, 3, 8), m, -0.3, 1.0, -0.04);
    armR2.rotation.z = -0.4;
    g.add(armL, armR, armL2, armR2);
    const ring = mesh(new THREE.TorusGeometry(0.78, 0.03, 8, 48), mats.gold, 0, 1.05, 0);
    g.add(ring);
    const flameN = 10;
    for (let i = 0; i < flameN; i++) {
      const a = (i / flameN) * Math.PI * 2;
      const f = mesh(new THREE.ConeGeometry(0.03, 0.12, 6), mats.flame, Math.cos(a) * 0.78, 1.05 + Math.sin(a) * 0.78, 0);
      f.rotation.z = a - Math.PI / 2;
      g.add(f);
    }
    g.add(eyes(1.34, 0.12, 0.045));
    const crown = dummy(0, 1.56, 0);
    const brow = dummy(0, 1.34, 0.14);
    g.add(crown, brow);
    g.userData.anchors = { crown, forehead: brow, chest: torsoN, base: stand };
    g.userData.coatMesh = torsoN;
    g.userData.kind = "figure";
    return g;
  }

  g.add(padmaLegs(m, 0.44));
  g.add(torso(m, 0.66, false));
  g.add(arm(m, 1, form === "abhaya" ? "raised" : "dhyana", 0.88));
  g.add(arm(m, -1, "dhyana", 0.88));
  const head = mesh(new THREE.SphereGeometry(0.145, 20, 16), m, 0, 1.08, 0.03);
  g.add(head);
  const bun = mesh(new THREE.SphereGeometry(0.1, 14, 12), m, 0, 1.24, -0.02);
  bun.scale.set(1.05, 0.85, 1.05);
  g.add(bun);
  for (let i = 0; i < 7; i++) {
    const lock = mesh(new THREE.CapsuleGeometry(0.025, 0.16, 3, 6), m, (i - 3) * 0.045, 1.16, -0.1);
    lock.rotation.x = 0.7;
    g.add(lock);
  }
  const crescent = mesh(new THREE.TorusGeometry(0.055, 0.012, 6, 16, Math.PI), mats.gold, 0.08, 1.28, 0.02);
  crescent.rotation.set(0.3, 0.6, 0.4);
  g.add(crescent);
  g.add(eyes(1.08, 0.16, 0.045));
  const third = mesh(new THREE.SphereGeometry(0.012, 8, 8), mats.gold, 0, 1.12, 0.155);
  g.add(third);
  if (form === "neelkanth") {
    g.add(mesh(new THREE.SphereGeometry(0.05, 10, 8), mats.blue, 0, 0.94, 0.12, 1.1, 0.6, 0.5));
  }
  const mala = mesh(new THREE.TorusGeometry(0.16, 0.018, 8, 24), mats.saffron, 0, 0.9, 0.04);
  mala.rotation.x = 0.5;
  g.add(mala);
  const snake = helix(0.17, 0.86, 1.0, 1.2, 0.016, mats.gold, 0);
  g.add(snake);
  const trishul = new THREE.Group();
  trishul.position.set(-0.55, 0.4, -0.05);
  trishul.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.15, 8), mats.gold, 0, 0.6, 0));
  trishul.add(mesh(new THREE.ConeGeometry(0.02, 0.12, 6), mats.gold, 0, 1.22, 0));
  trishul.add(mesh(new THREE.ConeGeometry(0.018, 0.1, 6), mats.gold, 0.05, 1.16, 0));
  trishul.add(mesh(new THREE.ConeGeometry(0.018, 0.1, 6), mats.gold, -0.05, 1.16, 0));
  g.add(trishul);
  if (form === "gangadhar") {
    const stream = mesh(new THREE.CapsuleGeometry(0.02, 0.22, 3, 6), mats.water, 0.06, 1.34, 0.08);
    stream.rotation.z = -0.4;
    g.add(stream);
  }
  if (form === "ardhanari") {
    const half = mesh(new THREE.SphereGeometry(0.2, 18, 14, 0, Math.PI), mats.rose, 0, 0.7, 0.02);
    half.scale.set(1.08, 0.9, 0.7);
    g.add(half);
  }

  const crown = dummy(0, 1.38, 0);
  const brow = dummy(0, 1.1, 0.17);
  g.add(crown, brow);
  g.userData.anchors = { crown, forehead: brow, chest: head, base: g };
  g.userData.coatMesh = head;
  g.userData.kind = "figure";
  return g;
}

function standing(m, extra) {
  const g = new THREE.Group();
  g.add(pedestal());
  const hip = mesh(new THREE.SphereGeometry(0.14, 16, 12), m, 0, 0.55, 0);
  hip.scale.set(1.15, 0.7, 0.8);
  g.add(hip);
  const legL = mesh(new THREE.CapsuleGeometry(0.055, 0.38, 4, 8), m, 0.08, 0.38, 0);
  const legR = mesh(new THREE.CapsuleGeometry(0.055, 0.38, 4, 8), m, -0.08, 0.38, 0);
  if (extra === "tribhanga") {
    legR.rotation.z = 0.18;
    hip.position.x = 0.04;
  }
  g.add(legL, legR);
  const dhoti = mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.38, 16), mats.saffron, extra === "tribhanga" ? 0.03 : 0, 0.58, 0);
  g.add(dhoti);
  const chest = mesh(new THREE.SphereGeometry(0.16, 18, 14), m, extra === "tribhanga" ? 0.02 : 0, 0.95, 0);
  chest.scale.set(1.15, 1.2, 0.68);
  g.add(chest);
  const head = mesh(new THREE.SphereGeometry(0.13, 18, 14), m, 0, 1.28, 0.02);
  g.add(head);
  g.add(mukut(mats.gold, 1.4));
  g.add(eyes(1.28, 0.13, 0.04));

  if (extra === "flute" || extra === "tribhanga") {
    g.add(arm(m, 1, "flute", 1.05));
    g.add(arm(m, -1, "flute", 1.05));
    const flute = mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.5, 10), mats.gold, 0, 1.02, 0.2);
    flute.rotation.z = Math.PI / 2;
    g.add(flute);
    const feather = mesh(new THREE.ConeGeometry(0.03, 0.12, 6), mats.leaf, 0.04, 1.52, 0.02);
    feather.rotation.z = 0.4;
    g.add(feather);
  } else if (extra === "bow") {
    g.add(arm(m, 1, "out", 1.05));
    g.add(arm(m, -1, "raised", 1.05));
    const bow = mesh(new THREE.TorusGeometry(0.28, 0.014, 6, 20, Math.PI), mats.gold, -0.32, 1.1, 0);
    bow.rotation.y = Math.PI / 2;
    g.add(bow);
  } else if (extra === "anjali") {
    g.add(arm(m, 1, "anjali", 1.02));
    g.add(arm(m, -1, "anjali", 1.02));
    const tail = mesh(new THREE.SphereGeometry(0.08, 12, 10), m, 0, 0.7, -0.16);
    tail.scale.set(0.6, 1.4, 0.8);
    g.add(tail);
  } else if (extra === "arms") {
    g.add(arm(m, 1, "raised", 1.08));
    g.add(arm(m, -1, "raised", 1.08));
    g.add(arm(m, 1, "out", 0.95));
    g.add(arm(m, -1, "out", 0.95));
  } else if (extra === "hair") {
    g.add(arm(m, 1, "raised", 1.08));
    g.add(arm(m, -1, "out", 1.0));
    for (let i = 0; i < 10; i++) {
      const lock = mesh(new THREE.CapsuleGeometry(0.03, 0.34, 3, 6), mats.skinDark, (i - 4.5) * 0.05, 1.2, -0.12);
      lock.rotation.x = 0.85;
      g.add(lock);
    }
  } else {
    g.add(arm(m, 1, "dhyana", 1.02));
    g.add(arm(m, -1, "dhyana", 1.02));
  }

  const crown = dummy(0, 1.58, 0);
  const brow = dummy(0, 1.3, 0.14);
  g.add(crown, brow);
  g.userData.anchors = { crown, forehead: brow, chest: chest, base: g };
  g.userData.coatMesh = head;
  g.userData.kind = "figure";
  return g;
}

function seatedGoddess(m) {
  const g = new THREE.Group();
  g.add(pedestal());
  g.add(lotus(0.34, 0.48, mats.rose));
  g.add(padmaLegs(m, 0.44));
  g.add(torso(m, 0.66, false));
  g.add(arm(m, 1, "raised", 0.9));
  g.add(arm(m, -1, "dhyana", 0.88));
  const head = mesh(new THREE.SphereGeometry(0.135, 18, 14), m, 0, 1.06, 0.03);
  g.add(head);
  g.add(mukut(mats.gold, 1.18));
  g.add(eyes(1.06, 0.15, 0.042));
  const sari = mesh(new THREE.TorusGeometry(0.2, 0.08, 10, 20), mats.saffron, 0, 0.72, 0.04);
  sari.rotation.x = 0.9;
  g.add(sari);
  const crown = dummy(0, 1.4, 0);
  const brow = dummy(0, 1.08, 0.16);
  g.add(crown, brow);
  g.userData.anchors = { crown, forehead: brow, chest: head, base: g };
  g.userData.coatMesh = head;
  g.userData.kind = "figure";
  return g;
}

function billboard(url) {
  const g = new THREE.Group();
  g.add(pedestal());
  const loader = new THREE.TextureLoader();
  const tex = loader.load(url);
  tex.colorSpace = THREE.SRGBColorSpace;
  const frame = mesh(new THREE.BoxGeometry(1.12, 1.52, 0.06), mats.gold, 0, 1.1, -0.04);
  g.add(frame);
  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(1.02, 1.42),
    new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55, metalness: 0.05 }),
  );
  plane.position.set(0, 1.1, 0.0);
  plane.castShadow = true;
  g.add(plane);
  const c = dummy(0, 1.82, 0.02);
  const brow = dummy(0, 1.55, 0.04);
  g.add(c, brow);
  g.userData.anchors = { crown: c, forehead: brow, chest: plane, base: plane };
  g.userData.coatMesh = plane;
  g.userData.kind = "card";
  return g;
}

function buildDeity(spec) {
  switch (spec.id) {
    case "shivling": return shivling();
    case "ganesha": return ganesha();
    case "nataraj": return shiva("nataraj");
    case "bhairav": return shiva("bhairav");
    case "neelkanth": return shiva("neelkanth");
    case "gangadhar": return shiva("gangadhar");
    case "ardhanari": return shiva("ardhanari");
    case "abhaya": return shiva("abhaya");
    case "shiva":
    case "meditating":
    case "chandrashekhar":
    case "shivyogi":
      return shiva(spec.id);
    case "krishna": return standing(mats.bronze, "tribhanga");
    case "rama": return standing(mats.bronze, "bow");
    case "hanuman": return standing(mats.skinDark, "anjali");
    case "durga": return standing(mats.gold, "arms");
    case "kali": return standing(mats.skinDark, "hair");
    case "lakshmi": return seatedGoddess(mats.gold);
    case "saraswati": return seatedGoddess(mats.cream);
    case "custom": return spec.src ? billboard(spec.src) : seatedGoddess(mats.bronze);
    default: return shiva("shiva");
  }
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
  const src = isMilk ? mats.milk : mats.water;
  const coat = new THREE.Mesh(host.geometry, src.clone());
  coat.material.transparent = true;
  coat.material.opacity = 0.0;
  coat.scale.setScalar(1.02);
  coat.castShadow = false;
  coat.receiveShadow = false;
  host.add(coat);
  coat.userData.life = 8;
  coat.userData.target = isMilk ? 0.55 : 0.32;
  coats.push(coat);
}

function pour(kind) {
  if (!current) return;
  const top = worldOf(current.userData.anchors.crown);
  const brow = worldOf(current.userData.anchors.forehead);
  const chest = worldOf(current.userData.anchors.chest);
  const base = worldOf(current.userData.anchors.base);
  kalash.position.copy(top).add(new THREE.Vector3(0.1, 0.32, 0.1));
  kalash.rotation.set(0.15, 0, -0.7);
  kalash.visible = true;
  addCoat(kind);
  if (milkPool && kind === "milk") {
    milkPool.material.opacity = 0.72;
  } else if (milkPool && kind === "water") {
    milkPool.material.color = mats.water.color;
    milkPool.material.opacity = 0.45;
  }
  const isMilk = kind === "milk";
  const colorMat = isMilk ? mats.milk : mats.water;
  const n = reduced ? 20 : 52;
  const lingam = current.userData.kind === "lingam";
  for (let i = 0; i < n; i++) {
    const d = mesh(new THREE.SphereGeometry(isMilk ? 0.024 : 0.018, 8, 8), colorMat);
    d.castShadow = false;
    const ang = Math.random() * Math.PI * 2;
    d.userData = {
      ang,
      u: -Math.random() * 0.15,
      speed: 0.55 + Math.random() * 0.35,
      kind: current.userData.kind,
      path: lingam ? null : [top.clone(), brow.clone(), chest.clone(), base.clone().setY(Math.max(0.42, base.y))],
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
    if (kind === "chandan") {
      stripe(0.22, 0.045, mats.chandan);
    } else {
      stripe(0.32, 0.022, mats.bhasma);
      stripe(0.26, 0.022, mats.bhasma);
      stripe(0.2, 0.022, mats.bhasma);
      const bindu = mesh(new THREE.CircleGeometry(0.03, 16), mats.kumkum, 0, 0.26, 0.22);
      host.add(bindu);
      marks.push(bindu);
    }
    return;
  }
  const geo = kind === "chandan"
    ? new THREE.CircleGeometry(0.04, 16)
    : new THREE.CircleGeometry(0.028, 16);
  const m = new THREE.Mesh(geo, kind === "chandan" ? mats.chandan : mats.kumkum);
  m.position.set(0, 0, 0.01);
  brow.add(m);
  marks.push(m);
}

function shower(kind) {
  if (!current) return;
  const top = worldOf(current.userData.anchors.crown);
  const n = reduced ? 10 : 24;
  const isLeaf = kind === "bilva";
  for (let i = 0; i < n; i++) {
    const p = mesh(
      isLeaf ? new THREE.CircleGeometry(0.045, 5) : new THREE.SphereGeometry(0.035, 8, 6),
      isLeaf ? mats.leaf : mats.petal,
    );
    if (!isLeaf) p.scale.set(0.7, 0.22, 1.1);
    p.position.set(top.x + (Math.random() - 0.5) * 0.85, 2.15 + Math.random() * 0.35, top.z + (Math.random() - 0.5) * 0.85);
    p.userData = {
      vy: 0,
      target: top.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.22, 0.02, (Math.random() - 0.5) * 0.22)),
    };
    fxRoot.add(p);
    petals.push(p);
  }
}

function incense() {
  const n = reduced ? 8 : 18;
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
  const pl = new THREE.PointLight(0xffb040, 1.1, 3.2);
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
  down.y -= 0.32;
  down.z += 0.14;
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
      if (y < 0.5) {
        fxRoot.remove(d);
        drops.splice(i, 1);
      }
    } else {
      const path = d.userData.path;
      if (!path) { fxRoot.remove(d); drops.splice(i, 1); continue; }
      const max = path.length - 1;
      const t = Math.min(u, max);
      const i0 = Math.min(Math.floor(t), max - 1);
      const f = t - i0;
      d.position.lerpVectors(path[i0], path[i0 + 1], f);
      d.position.x += Math.cos(d.userData.ang) * 0.03 * f;
      if (u > max + 0.2) {
        fxRoot.remove(d);
        drops.splice(i, 1);
      }
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
      if (p.userData.settled > 8) {
        fxRoot.remove(p);
        petals.splice(i, 1);
      }
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
    if (s.userData.life <= 0) {
      fxRoot.remove(s);
      smokes.splice(i, 1);
    }
  }
}

function stepAarti(dt) {
  if (!aartiLamp || !current) return;
  aartiT += dt;
  const chest = worldOf(current.userData.anchors.forehead);
  const t = aartiT * 1.55;
  aartiLamp.position.set(
    chest.x + Math.sin(t) * 0.4,
    chest.y - 0.08 + Math.sin(t * 2) * 0.07,
    chest.z + 0.32 + Math.cos(t) * 0.14,
  );
  if (aartiT > 3.4) {
    fxRoot.remove(aartiLamp);
    aartiLamp = null;
  }
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
  if (sanctumRoot) {
    const flames = sanctumRoot.userData.flames;
    if (flames) {
      flames.forEach((f, i) => {
        f.scale.y = 1 + Math.sin(t * 0.008 + i) * 0.18;
      });
    }
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
    new THREE.CylinderGeometry(1.25, 1.25, 2.6, 36, 1, true, Math.PI * 0.18, Math.PI * 0.64),
    mats.niche, 0, 1.4, -1.42,
  );
  niche.rotation.y = Math.PI;
  niche.castShadow = false;
  g.add(niche);
  const arch = mesh(new THREE.TorusGeometry(1.15, 0.06, 8, 24, Math.PI), mats.gold, 0, 2.15, -1.15);
  arch.rotation.z = Math.PI;
  g.add(arch);
  const col = mats.cream;
  [-1.45, 1.45].forEach((x) => {
    g.add(mesh(new THREE.CylinderGeometry(0.1, 0.12, 2.3, 14), col, x, 1.2, -0.9));
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
    const light = new THREE.PointLight(0xffb060, 0.65, 3.8);
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
  scene.fog = new THREE.Fog(0xf3e0cc, 6, 12);
  camera = new THREE.PerspectiveCamera(36, 1, 0.1, 40);
  camera.position.set(0, 1.28, 2.85);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const envScene = new THREE.Scene();
  envScene.background = new THREE.Color(0xffe2c4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
  pmrem.dispose();

  scene.add(new THREE.HemisphereLight(0xfff1e0, 0x8a6a50, 0.95));
  const sun = new THREE.DirectionalLight(0xffe4b8, 1.45);
  sun.position.set(2.2, 4.4, 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.near = 0.5;
  sun.shadow.camera.far = 14;
  sun.shadow.camera.left = -3;
  sun.shadow.camera.right = 3;
  sun.shadow.camera.top = 3;
  sun.shadow.camera.bottom = -3;
  scene.add(sun);
  const rim = new THREE.DirectionalLight(0xd6e8ff, 0.45);
  rim.position.set(-2.4, 1.6, -1.4);
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
  controls.minDistance = 1.6;
  controls.maxDistance = 4.6;
  controls.minPolarAngle = Math.PI * 0.28;
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.target.set(0, 0.88, 0);
  controls.autoRotate = !reduced;
  controls.autoRotateSpeed = 0.45;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  resize();
  running = true;
  lastT = performance.now();
  renderer.setAnimationLoop(loop);
  window.addEventListener("resize", resize);
}

export function showDeity(spec) {
  clearFx();
  if (current) {
    root.remove(current);
    current.traverse((c) => {
      if (c.geometry && c.userData && c.userData.localGeo) c.geometry.dispose();
    });
    current = null;
  }
  current = buildDeity(spec);
  root.add(current);
  const lingam = spec.id === "shivling" || spec.lingam;
  controls.target.set(0, lingam ? 0.72 : 0.9, 0);
  camera.position.set(0, lingam ? 1.12 : 1.3, lingam ? 2.35 : 2.8);
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

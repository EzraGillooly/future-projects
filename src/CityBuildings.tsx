import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mulberry32 } from "./textures";

// A procedural kit of Japanese night-city buildings, one block back. Instead of
// generic boxes, each building is a TYPOLOGY with real geometry detail:
//   - apartment/manshon: unit grid with balcony parapets + an exterior access
//     walkway down one side (the danchi look), warm homey windows
//   - office: horizontal ribbon glazing + spandrel ledges + rooftop signage
//   - skyscraper: stepped mass, fine curtain-wall grid, tapered crown, red
//     aircraft-warning light
//   - pencil: narrow tower with a vertical stack of glowing signs (Tokyo alley)
// All the repeated detail (windows, balconies, ledges, walkway slabs) collapses
// into TWO instanced draw calls — emissive quads (windows/ribbons/signs) and
// concrete detail boxes (balconies/ledges/walkways/parapets). Only the masses
// and rooftop clutter are per-building meshes. Far buildings are fog-exempt so
// they read through the haze; near ones fog with the scene.

type Vec3 = [number, number, number];

// --- shared element buckets -------------------------------------------------
interface Emit { pos: Vec3; rotY: number; sx: number; sy: number; color: string }
interface Detail { pos: Vec3; rotY: number; sx: number; sy: number; sz: number }
interface Mass { pos: Vec3; size: Vec3; tint: string; fog: boolean }
interface Prop { kind: string; pos: Vec3; color?: string; a?: number; b?: number }
interface Built { masses: Mass[]; emits: Emit[]; details: Detail[]; props: Prop[] }

// Warm sodium/tungsten window glow — old-town back-alley, no cyber neon.
const WARM = ["#ffcf8f", "#ffbe73", "#ffd9a8", "#ffe4bd", "#ffb867", "#ffa95c", "#f7a24a"];
// Warm izakaya / lantern signage (amber, red-orange, warm white).
const SIGN = ["#ff8a3b", "#ffb347", "#e04a3a", "#ffd98a", "#ff7a4d"];

function pickWin(rng: () => number): string {
  return WARM[Math.floor(rng() * WARM.length)];
}

// --- building spec ----------------------------------------------------------
type Kind = "apartment" | "office" | "skyscraper" | "pencil";
interface Spec {
  kind: Kind;
  pos: Vec3;
  w: number;
  h: number;
  d: number;
  tint: string;
  far?: boolean;
}

// Clustered around the foreground (garage x0, mart ~x-13), clear of the interior
// footprint (x in [-11,6], z in [-18,0]). Near/side buildings are detailed and
// fog with the scene; the far row (far:true) is taller, dimmer, fog-exempt.
const SPECS: Spec[] = [
  // near sides — read clearly, carry the most detail
  { kind: "office", pos: [17, 0, -6], w: 9, h: 16, d: 11, tint: "#20242e" },
  { kind: "apartment", pos: [-27, 0, -5], w: 8, h: 13, d: 11, tint: "#242019" },
  { kind: "office", pos: [26, 0, -11], w: 8, h: 14, d: 10, tint: "#1e222c" },
  // mid back
  { kind: "apartment", pos: [-11, 0, -28], w: 9, h: 20, d: 7, tint: "#221e18" },
  { kind: "skyscraper", pos: [14, 0, -29], w: 8, h: 27, d: 7, tint: "#181c26" },
  { kind: "pencil", pos: [3, 0, -32], w: 4, h: 19, d: 4, tint: "#1b1720" },
  { kind: "apartment", pos: [-26, 0, -24], w: 8, h: 16, d: 8, tint: "#231f18" },
  // far row — fog-exempt skyline
  { kind: "skyscraper", pos: [-6, 0, -45], w: 11, h: 33, d: 9, tint: "#161a24", far: true },
  { kind: "office", pos: [10, 0, -48], w: 10, h: 30, d: 8, tint: "#141822", far: true },
  { kind: "apartment", pos: [-23, 0, -44], w: 9, h: 25, d: 8, tint: "#1d1912", far: true },
  { kind: "skyscraper", pos: [25, 0, -47], w: 10, h: 35, d: 9, tint: "#151924", far: true },
  { kind: "pencil", pos: [2, 0, -58], w: 6, h: 42, d: 6, tint: "#12161f", far: true },
  // backstop layer — tall, wide, overlapping across the full width so the sky
  // only shows in slivers between them (fills the empty sky corners)
  { kind: "office", pos: [-32, 0, -60], w: 15, h: 40, d: 9, tint: "#141822", far: true },
  { kind: "apartment", pos: [-15, 0, -62], w: 14, h: 38, d: 9, tint: "#1d1912", far: true },
  { kind: "office", pos: [1, 0, -63], w: 15, h: 44, d: 9, tint: "#141822", far: true },
  { kind: "skyscraper", pos: [18, 0, -61], w: 14, h: 47, d: 10, tint: "#151924", far: true },
  { kind: "apartment", pos: [34, 0, -58], w: 14, h: 39, d: 9, tint: "#1d1912", far: true },
];

const PROUD = 0.06;

// Small unit windows over the four faces (used by apartment / skyscraper).
function addFaceWindows(
  b: Built, s: Spec, rng: () => number,
  floorH: number, colW: number, lit: number, yStart = 1.4, winH = 1.3
) {
  const [cx, , cz] = s.pos;
  const faces = [
    { axis: "z" as const, sgn: 1, span: s.w, rotY: 0 },
    { axis: "z" as const, sgn: -1, span: s.w, rotY: Math.PI },
    { axis: "x" as const, sgn: 1, span: s.d, rotY: Math.PI / 2 },
    { axis: "x" as const, sgn: -1, span: s.d, rotY: -Math.PI / 2 },
  ];
  for (const f of faces) {
    const cols = Math.max(1, Math.floor(f.span / colW));
    const startU = -(cols * colW) / 2 + colW / 2;
    for (let y = yStart; y < s.h - 1; y += floorH) {
      for (let c = 0; c < cols; c++) {
        if (rng() > lit) continue;
        const u = startU + c * colW + (rng() - 0.5) * 0.15;
        const pos: Vec3 = f.axis === "z"
          ? [cx + u, y, cz + f.sgn * (s.d / 2 + PROUD)]
          : [cx + f.sgn * (s.w / 2 + PROUD), y, cz + u];
        b.emits.push({ pos, rotY: f.rotY, sx: colW * 0.6, sy: winH, color: pickWin(rng) });
      }
    }
  }
}

function genApartment(b: Built, s: Spec, rng: () => number) {
  b.masses.push({ pos: [s.pos[0], s.h / 2, s.pos[2]], size: [s.w, s.h, s.d], tint: s.tint, fog: !s.far });
  const floorH = 3.0;
  const colW = 2.3;
  const [cx, , cz] = s.pos;
  // windows all round (warm, homey, fairly lit)
  addFaceWindows(b, s, rng, floorH, colW, 0.6, 2.0, 1.2);
  // balcony parapets + slabs on the front (+Z) face, one per unit
  const cols = Math.max(1, Math.floor(s.w / colW));
  const startU = -(cols * colW) / 2 + colW / 2;
  const zf = cz + s.d / 2;
  for (let y = 2.0; y < s.h - 1; y += floorH) {
    for (let c = 0; c < cols; c++) {
      const x = cx + startU + c * colW;
      b.details.push({ pos: [x, y - 0.6, zf + 0.28], rotY: 0, sx: colW * 0.94, sy: 0.55, sz: 0.28 }); // parapet
      b.details.push({ pos: [x, y - 0.88, zf + 0.28], rotY: 0, sx: colW * 0.98, sy: 0.12, sz: 0.5 }); // floor slab
    }
  }
  // exterior access walkway + railing down the inner side face
  const sideSgn = cx >= 0 ? -1 : 1;
  const xw = cx + sideSgn * (s.w / 2);
  for (let y = 2.0; y < s.h - 1; y += floorH) {
    b.details.push({ pos: [xw + sideSgn * 0.35, y - 0.9, cz], rotY: 0, sx: 0.7, sy: 0.12, sz: s.d * 0.9 }); // deck
    b.details.push({ pos: [xw + sideSgn * 0.68, y - 0.55, cz], rotY: 0, sx: 0.1, sy: 0.5, sz: s.d * 0.9 }); // rail
  }
  // rooftop: parapet + water tank + stair bulkhead
  addRoofRail(b, s);
  b.props.push({ kind: "tank", pos: [cx - s.w * 0.22, s.h, cz + s.d * 0.1] });
  b.props.push({ kind: "bulkhead", pos: [cx + s.w * 0.24, s.h, cz - s.d * 0.15] });
}

function genOffice(b: Built, s: Spec, rng: () => number) {
  b.masses.push({ pos: [s.pos[0], s.h / 2, s.pos[2]], size: [s.w, s.h, s.d], tint: s.tint, fog: !s.far });
  const floorH = 3.2;
  const [cx, , cz] = s.pos;
  const faces = [
    { axis: "z" as const, sgn: 1, span: s.w, rotY: 0 },
    { axis: "z" as const, sgn: -1, span: s.w, rotY: Math.PI },
    { axis: "x" as const, sgn: 1, span: s.d, rotY: Math.PI / 2 },
    { axis: "x" as const, sgn: -1, span: s.d, rotY: -Math.PI / 2 },
  ];
  for (const f of faces) {
    for (let y = 2.2; y < s.h - 0.8; y += floorH) {
      // continuous ribbon of glazing per floor, lit as a whole (some dark)
      const lit = rng() < 0.55;
      const color = lit ? pickWin(rng) : "#0a0e16";
      const pos: Vec3 = f.axis === "z"
        ? [cx, y, cz + f.sgn * (s.d / 2 + PROUD)]
        : [cx + f.sgn * (s.w / 2 + PROUD), y, cz];
      b.emits.push({ pos, rotY: f.rotY, sx: f.span * 0.9, sy: 1.5, color });
      // spandrel ledge just below the ribbon
      const lpos: Vec3 = f.axis === "z"
        ? [cx, y - 1.1, cz + f.sgn * (s.d / 2 + 0.12)]
        : [cx + f.sgn * (s.w / 2 + 0.12), y - 1.1, cz];
      b.details.push({ pos: lpos, rotY: f.rotY, sx: f.span * 0.96, sy: 0.18, sz: 0.24 });
    }
  }
  addRoofRail(b, s);
  b.props.push({ kind: "ac", pos: [cx - 1, s.h + 0.3, cz] });
  b.props.push({ kind: "ac", pos: [cx + 1.2, s.h + 0.3, cz - 0.8] });
  b.props.push({ kind: "signbox", pos: [cx, s.h + 1.1, cz + s.d * 0.3], color: SIGN[Math.floor(rng() * SIGN.length)] });
  if (rng() < 0.6) b.props.push({ kind: "antenna", pos: [cx + s.w * 0.3, s.h, cz - s.d * 0.2], a: s.h * 0.3 });
}

function genSkyscraper(b: Built, s: Spec, rng: () => number) {
  const [cx, , cz] = s.pos;
  // stepped mass: main + narrower upper setback
  const lowerH = s.h * 0.68;
  b.masses.push({ pos: [cx, lowerH / 2, cz], size: [s.w, lowerH, s.d], tint: s.tint, fog: !s.far });
  const upW = s.w * 0.72;
  const upD = s.d * 0.72;
  const upH = s.h - lowerH;
  b.masses.push({ pos: [cx, lowerH + upH / 2, cz], size: [upW, upH, upD], tint: s.tint, fog: !s.far });
  // fine curtain-wall grid, warm, sparse
  addFaceWindows(b, s, rng, 2.6, 1.6, 0.4, 2.0, 1.1);
  // tapered crown + aircraft light + spire
  b.props.push({ kind: "crown", pos: [cx, s.h, cz], a: Math.min(upW, upD), b: s.h * 0.14 });
  b.props.push({ kind: "spire", pos: [cx, s.h + s.h * 0.14, cz], a: s.h * 0.22 });
  if (rng() < 0.5) b.props.push({ kind: "band", pos: [cx, lowerH, cz], color: SIGN[Math.floor(rng() * SIGN.length)], a: s.w, b: s.d });
}

function genPencil(b: Built, s: Spec, rng: () => number) {
  b.masses.push({ pos: [s.pos[0], s.h / 2, s.pos[2]], size: [s.w, s.h, s.d], tint: s.tint, fog: !s.far });
  const [cx, , cz] = s.pos;
  // small tenant windows on the sides
  addFaceWindows(b, s, rng, 2.8, 1.5, 0.45, 2.0, 1.0);
  // a vertical stack of glowing signs down the front face (izakaya alley)
  const zf = cz + s.d / 2 + 0.12;
  let y = s.h - 1.4;
  while (y > 2) {
    const sh = 1.0 + rng() * 1.4;
    const color = SIGN[Math.floor(rng() * SIGN.length)];
    b.emits.push({ pos: [cx, y - sh / 2, zf], rotY: 0, sx: s.w * 0.82, sy: sh, color });
    y -= sh + 0.5;
  }
  b.props.push({ kind: "antenna", pos: [cx, s.h, cz], a: s.h * 0.25 });
}

// roof perimeter parapet as four thin detail boxes
function addRoofRail(b: Built, s: Spec) {
  const [cx, , cz] = s.pos;
  const t = 0.16;
  const y = s.h + 0.25;
  b.details.push({ pos: [cx, y, cz + s.d / 2], rotY: 0, sx: s.w, sy: 0.5, sz: t });
  b.details.push({ pos: [cx, y, cz - s.d / 2], rotY: 0, sx: s.w, sy: 0.5, sz: t });
  b.details.push({ pos: [cx + s.w / 2, y, cz], rotY: 0, sx: t, sy: 0.5, sz: s.d });
  b.details.push({ pos: [cx - s.w / 2, y, cz], rotY: 0, sx: t, sy: 0.5, sz: s.d });
}

// --- rooftop / structural props (per-building meshes) -----------------------
function RoofProp({ p }: { p: Prop }) {
  const c = p.color ?? "#ff3bd0";
  switch (p.kind) {
    case "tank":
      return (
        <group position={p.pos}>
          {[[-0.35, -0.35], [0.35, -0.35], [-0.35, 0.35], [0.35, 0.35]].map(([x, z], i) => (
            <mesh key={i} position={[x, 0.35, z]}>
              <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
              <meshStandardMaterial color="#14161e" metalness={0.4} roughness={0.7} fog={false} />
            </mesh>
          ))}
          <mesh position={[0, 0.9, 0]} castShadow>
            <cylinderGeometry args={[0.5, 0.5, 0.7, 10]} />
            <meshStandardMaterial color="#3a3228" roughness={0.85} fog={false} />
          </mesh>
        </group>
      );
    case "bulkhead":
      return (
        <mesh position={[p.pos[0], p.pos[1] + 0.55, p.pos[2]]} castShadow>
          <boxGeometry args={[1.6, 1.1, 1.4]} />
          <meshStandardMaterial color="#1a1e28" roughness={0.9} fog={false} />
        </mesh>
      );
    case "ac":
      return (
        <mesh position={p.pos} castShadow>
          <boxGeometry args={[0.9, 0.5, 0.7]} />
          <meshStandardMaterial color="#2b2f3a" metalness={0.4} roughness={0.7} fog={false} />
        </mesh>
      );
    case "antenna":
      return (
        <group position={p.pos}>
          <mesh position={[0, (p.a ?? 2) / 2, 0]}>
            <cylinderGeometry args={[0.03, 0.05, p.a ?? 2, 6]} />
            <meshStandardMaterial color="#0e1017" metalness={0.5} roughness={0.6} fog={false} />
          </mesh>
          <mesh position={[0, p.a ?? 2, 0]}>
            <sphereGeometry args={[0.07, 8, 8]} />
            <meshStandardMaterial color="#ff3b3b" emissive="#ff2020" emissiveIntensity={3} toneMapped={false} fog={false} />
          </mesh>
        </group>
      );
    case "crown":
      return (
        <mesh position={[p.pos[0], p.pos[1] + (p.b ?? 1) / 2, p.pos[2]]}>
          <cylinderGeometry args={[(p.a ?? 4) * 0.28, (p.a ?? 4) * 0.5, p.b ?? 1, 6]} />
          <meshStandardMaterial color="#0e1017" metalness={0.5} roughness={0.6} fog={false} />
        </mesh>
      );
    case "spire":
      return (
        <group position={p.pos}>
          <mesh position={[0, (p.a ?? 2) / 2, 0]}>
            <cylinderGeometry args={[0.04, 0.12, p.a ?? 2, 6]} />
            <meshStandardMaterial color="#0e1017" metalness={0.5} roughness={0.6} fog={false} />
          </mesh>
          <mesh position={[0, p.a ?? 2, 0]}>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color="#ff3b3b" emissive="#ff2020" emissiveIntensity={3} toneMapped={false} fog={false} />
          </mesh>
        </group>
      );
    case "signbox":
      return (
        <mesh position={p.pos}>
          <boxGeometry args={[2.2, 1.3, 0.16]} />
          <meshStandardMaterial color={c} emissive={c} emissiveIntensity={1.8} toneMapped={false} fog={false} />
        </mesh>
      );
    case "band": {
      const w = p.a ?? 4;
      const d = p.b ?? 4;
      const t = 0.12;
      const parts: Vec3[] = [[0, 0, d / 2], [0, 0, -d / 2]];
      return (
        <group position={p.pos}>
          {parts.map((pp, i) => (
            <mesh key={i} position={pp} scale={[w + t, t, t]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2.2} toneMapped={false} fog={false} />
            </mesh>
          ))}
          {[w / 2, -w / 2].map((x, i) => (
            <mesh key={"s" + i} position={[x, 0, 0]} scale={[t, t, d + t]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color={c} emissive={c} emissiveIntensity={2.2} toneMapped={false} fog={false} />
            </mesh>
          ))}
        </group>
      );
    }
    default:
      return null;
  }
}

const GEN: Record<Kind, (b: Built, s: Spec, rng: () => number) => void> = {
  apartment: genApartment,
  office: genOffice,
  skyscraper: genSkyscraper,
  pencil: genPencil,
};

export function CityBuildings() {
  const built = useMemo<Built>(() => {
    const rng = mulberry32(7);
    const b: Built = { masses: [], emits: [], details: [], props: [] };
    for (const s of SPECS) GEN[s.kind](b, s, rng);
    return b;
  }, []);

  const emitRef = useRef<THREE.InstancedMesh>(null);
  const detailRef = useRef<THREE.InstancedMesh>(null);

  useLayoutEffect(() => {
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    const em = emitRef.current;
    if (em) {
      built.emits.forEach((e, i) => {
        o.position.set(e.pos[0], e.pos[1], e.pos[2]);
        o.rotation.set(0, e.rotY, 0);
        o.scale.set(e.sx, e.sy, 0.12);
        o.updateMatrix();
        em.setMatrixAt(i, o.matrix);
        em.setColorAt(i, col.set(e.color));
      });
      em.instanceMatrix.needsUpdate = true;
      if (em.instanceColor) em.instanceColor.needsUpdate = true;
    }
    const dt = detailRef.current;
    if (dt) {
      built.details.forEach((e, i) => {
        o.position.set(e.pos[0], e.pos[1], e.pos[2]);
        o.rotation.set(0, e.rotY, 0);
        o.scale.set(e.sx, e.sy, e.sz);
        o.updateMatrix();
        dt.setMatrixAt(i, o.matrix);
      });
      dt.instanceMatrix.needsUpdate = true;
    }
  }, [built]);

  return (
    <group>
      {built.masses.map((m, i) => (
        <mesh key={i} position={m.pos} castShadow receiveShadow>
          <boxGeometry args={m.size} />
          <meshStandardMaterial color={m.tint} roughness={0.92} metalness={0.08} fog={m.fog} />
        </mesh>
      ))}
      {built.props.map((p, i) => (
        <RoofProp key={i} p={p} />
      ))}
      <instancedMesh ref={emitRef} args={[undefined, undefined, built.emits.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial toneMapped={false} fog={false} />
      </instancedMesh>
      <instancedMesh ref={detailRef} args={[undefined, undefined, built.details.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#2b2f39" roughness={0.9} metalness={0.05} fog={false} />
      </instancedMesh>
    </group>
  );
}

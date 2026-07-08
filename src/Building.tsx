import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  makeSkylineTexture,
  makeStorefrontTexture,
  makeSignTexture,
  makeBannerTexture,
  makeCorrugatedTexture,
  makeSidewalkTexture,
  makeLineTexture,
  makeApronTexture,
  makePaintedLogo,
  makeSponsorDecals,
} from "./textures";
import { Awning, Gutter, ACUnit, Pipe } from "./Props";
import { CityBuildings } from "./CityBuildings";
import { Interior } from "./Interior";
import { GARAGE_X } from "./layout";

// A glowing vertical neon signboard mounted flat against a wall.
function NeonSign({
  position,
  rotation = [0, 0, 0],
  scale = 1,
  tex,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: number;
  tex: THREE.Texture;
}) {
  return (
    <mesh position={position} rotation={rotation} scale={scale}>
      <planeGeometry args={[1, 3]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

// The night-time tuning shop, its neighbours, and the clickable garage door.

// Far night-city backdrop plane, self-lit and unaffected by fog.
function Backdrop({ skyline }: { skyline: THREE.Texture }) {
  return (
    <mesh position={[0, 22, -64]}>
      <planeGeometry args={[380, 120]} />
      <meshBasicMaterial map={skyline} toneMapped={false} fog={false} depthWrite={false} />
    </mesh>
  );
}

export const DOOR_W = 4.4;
export const DOOR_H = 3.4;
const SHOP_H = 5.5;

// A deterministic grid of lit windows on a building's +Z face.

// Clickable garage door: an open roller shutter (シャッター) rolled partway up into
// a housing box, with steel side guide tracks. The hotspot plane fills the
// opening; the bunched slats warm slightly on hover as the affordance. Warm
// interior light spills through the open gap below.
function GarageDoor({ onEnter, live }: { onEnter: () => void; live: boolean }) {
  const [hovered, setHovered] = useState(false);
  const hot = live && hovered;

  useEffect(() => {
    if (!hot) return;
    document.body.style.cursor = "pointer";
    return () => void (document.body.style.cursor = "auto");
  }, [hot]);

  const slatGlow = hot ? 0.5 : 0;

  return (
    <group>
      {/* Transparent click/hover target across the opening (opacity 0 rather
          than visible=false, so R3F still fires pointer events on it) */}
      <mesh
        position={[0, DOOR_H / 2, 0.06]}
        onClick={(e) => {
          if (!live) return;
          e.stopPropagation();
          onEnter();
        }}
        onPointerOver={(e) => {
          if (!live) return;
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <planeGeometry args={[DOOR_W, DOOR_H]} />
        <meshBasicMaterial colorWrite={false} depthWrite={false} />
      </mesh>
      {/* shutter housing (roll drum cover) above the opening */}
      <mesh position={[0, DOOR_H + 0.28, 0.08]} castShadow>
        <boxGeometry args={[DOOR_W + 0.55, 0.52, 0.42]} />
        <meshStandardMaterial color="#20242e" metalness={0.6} roughness={0.5} />
      </mesh>
      {/* steel side guide tracks */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * (DOOR_W / 2 + 0.08), DOOR_H / 2, 0.06]}>
          <boxGeometry args={[0.14, DOOR_H + 0.1, 0.18]} />
          <meshStandardMaterial color="#181c24" metalness={0.6} roughness={0.5} />
        </mesh>
      ))}
      {/* rolled-up shutter slats bunched under the housing (door is open) */}
      {Array.from({ length: 5 }).map((_, i) => (
        <mesh key={i} position={[0, DOOR_H - 0.05 - i * 0.11, 0.07]}>
          <boxGeometry args={[DOOR_W - 0.04, 0.09, 0.05]} />
          <meshStandardMaterial
            color="#3a3f4a"
            metalness={0.55}
            roughness={0.55}
            emissive="#ffb26b"
            emissiveIntensity={slatGlow}
          />
        </mesh>
      ))}
      {/* the shutter's leading bottom rail, sitting just under the bunched slats */}
      <mesh position={[0, DOOR_H - 0.62, 0.08]}>
        <boxGeometry args={[DOOR_W - 0.02, 0.12, 0.07]} />
        <meshStandardMaterial color="#2a2f39" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

// Triangular infill closing the gap between a flat wall top and the sloped
// mono-pitch roof underside (tall at the front eave, tapering to nothing at the
// back). Built as a raw triangle so no rotation guesswork.
function RoofGable({ x }: { x: number }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute(
      "position",
      new THREE.BufferAttribute(
        new Float32Array([
          x, SHOP_H, 0.5, // bottom front
          x, SHOP_H, -9.8, // bottom back
          x, SHOP_H + 1.1, 0.5, // top front (at the eave)
        ]),
        3
      )
    );
    g.computeVertexNormals();
    return g;
  }, [x]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial color="#0e1220" side={THREE.DoubleSide} metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

// A see-through glass shop window set into an opening in the front wall (the
// wall around it is built as border segments so the interior shows through).
const WIN_W = 2.4;
const WIN_H = 1.6;
const WIN_CY = 2.35; // centred between the two-tone base and the door hanger

function WindowGlass({ cx, cy = WIN_CY, w = WIN_W, h = WIN_H }: { cx: number; cy?: number; w?: number; h?: number }) {
  const z = -0.12;
  return (
    <group position={[cx, cy, z]}>
      {/* clean aluminium frame/casing around the WHOLE pane — mounted PROUD of the
          exterior wall face so it reads as a real window. Picture-frame build: the
          top/bottom bars span the full outer width and the left/right bars fill
          exactly between them, so the corners close with no gaps. Thin (0.07). */}
      {[
        { p: [0, h / 2 + 0.035, 0.095] as const, a: [w + 0.14, 0.07, 0.14] as const },
        { p: [0, -h / 2 - 0.035, 0.095] as const, a: [w + 0.14, 0.07, 0.14] as const },
        { p: [-w / 2 - 0.035, 0, 0.095] as const, a: [0.07, h, 0.14] as const },
        { p: [w / 2 + 0.035, 0, 0.095] as const, a: [0.07, h, 0.14] as const },
      ].map((b, i) => (
        <mesh key={"fr" + i} position={b.p}>
          <boxGeometry args={b.a} />
          <meshStandardMaterial color="#6b7280" metalness={0.6} roughness={0.4} />
        </mesh>
      ))}
      {/* glass pane — set just behind the exterior face, inside the frame */}
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[w, h, 0.02]} />
        <meshStandardMaterial color="#2a3a44" metalness={0.15} roughness={0.2} transparent opacity={0.12} depthWrite={false} />
      </mesh>
      {/* interior fill so the shop reads through the glass */}
      <pointLight position={[0, 0.2, -1.2]} intensity={10} color="#ffdcae" distance={7} />
    </group>
  );
}

// A projecting blade / lightbox sign perpendicular to the wall (readable down
// the street). Glowing box with the sign texture on its two large faces.
function BladeSign({ position, tex }: { position: [number, number, number]; tex: THREE.Texture }) {
  return (
    <group position={position}>
      {/* mounting bracket to the wall */}
      <mesh position={[0, 0, -0.35]}>
        <boxGeometry args={[0.08, 0.1, 0.7]} />
        <meshStandardMaterial color="#14161e" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* lightbox body */}
      <mesh>
        <boxGeometry args={[0.09, 1.5, 0.85]} />
        <meshStandardMaterial color="#0a0b12" metalness={0.3} roughness={0.6} />
      </mesh>
      {/* glowing sign faces on both sides */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.05, 0, 0]} rotation={[0, s > 0 ? Math.PI / 2 : -Math.PI / 2, 0]}>
          <planeGeometry args={[0.8, 1.4]} />
          <meshBasicMaterial map={tex} transparent toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// A separate 24H convenience store next to the garage: facade upper floors,
// lit storefront ground floor, banner, awning, entrance.
function MartBuilding({
  x,
  corrugated,
  store,
  banner,
}: {
  x: number;
  corrugated: THREE.Texture;
  store: THREE.Texture;
  banner: THREE.Texture;
}) {
  const W = 6;
  const H = 4.8;
  const D = 6;
  const wallTex = useMemo(() => {
    const t = corrugated.clone();
    t.needsUpdate = true;
    t.repeat.set(2, 2);
    return t;
  }, [corrugated]);
  const storeTex = useMemo(() => {
    const t = store.clone();
    t.needsUpdate = true;
    t.repeat.set(2, 1);
    return t;
  }, [store]);
  return (
    <group position={[x, 0, 0]}>
      {/* body / upper floors — corrugated metal, matching the garage shell */}
      <mesh position={[0, H / 2, -D / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial map={wallTex} metalness={0.6} roughness={0.55} />
      </mesh>
      {/* lit storefront ground floor */}
      <mesh position={[0, 1.35, 0.07]} castShadow>
        <boxGeometry args={[W - 0.5, 2.4, 0.14]} />
        <meshStandardMaterial map={storeTex} emissiveMap={storeTex} emissive="#fff4dc" emissiveIntensity={0.85} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* entrance door */}
      <mesh position={[W * 0.28, 1.05, 0.16]}>
        <boxGeometry args={[1.1, 2.1, 0.05]} />
        <meshStandardMaterial color="#0a0d16" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* 24H MART banner */}
      <mesh position={[0, 2.9, 0.16]}>
        <boxGeometry args={[W - 0.6, 0.62, 0.06]} />
        <meshStandardMaterial map={banner} emissiveMap={banner} emissive="#ffffff" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      <Awning position={[0, 2.55, 0.75]} width={W - 0.3} />
    </group>
  );
}

export function Scene3D({ onEnter, doorLive }: { onEnter: () => void; doorLive: boolean }) {
  const skyline = useMemo(() => makeSkylineTexture(), []);
  const store = useMemo(() => makeStorefrontTexture(), []);
  const corrugated = useMemo(() => {
    const t = makeCorrugatedTexture();
    t.repeat.set(3, 2);
    return t;
  }, []);
  const roofCorr = useMemo(() => {
    const t = makeCorrugatedTexture();
    t.repeat.set(1, 8);
    return t;
  }, []);
  const martBanner = useMemo(() => makeBannerTexture("24H MART", "#1c8a3c", true), []);
  const garageBanner = useMemo(() => makeBannerTexture("GARAGE", "#e6e9f2", false, "#171b28"), []);
  const sign1 = useMemo(() => makeSignTexture("ラーメン", "#ff4fd8"), []);
  const sign2 = useMemo(() => makeSignTexture("居酒屋", "#4fd8ff"), []);
  const sign3 = useMemo(() => makeSignTexture("カラオケ", "#ffb43f"), []);
  // One long non-repeating concrete strip per sidewalk (maps once, repeat 1,1),
  // so cracks/stains never visibly tile. Different seeds keep the two walks
  // distinct; a lengthwise joint + vertical panel dividers are baked in.
  const sidewalkFar = useMemo(() => makeSidewalkTexture(3, 24), []);
  const sidewalkNear = useMemo(() => makeSidewalkTexture(6, 24), []);
  const apron = useMemo(() => makeApronTexture(4), []);
  const paintedLogo = useMemo(() => makePaintedLogo("湾岸", "#dfe4ee"), []);
  const sponsorDecals = useMemo(() => makeSponsorDecals(2), []);
  const bladeSign = useMemo(() => makeSignTexture("ガレージ", "#ffb43f"), []);
  // Worn painted road lines: continuous alpha strips that fade sporadically
  // along their length (never fully gone). One dashed centre line + two solid
  // edge lines (both road edges identical).
  const centreLine = useMemo(() => {
    const t = makeLineTexture(11, true);
    t.repeat.set(6, 1);
    return t;
  }, []);
  const edgeLine = useMemo(() => {
    const t = makeLineTexture(23, false);
    t.repeat.set(6, 1);
    return t;
  }, []);
  return (
    <group>
      <Backdrop skyline={skyline} />

      {/* --- Shop front wall (framed around the door opening) --- */}
      {/* --- The garage (exterior + interior + door), shiftable via GARAGE_X --- */}
      <group position={[GARAGE_X, 0, 0]}>
      {/* Left panel — corrugated metal (reaches the interior's left wall at x=-6
          so the interior no longer shows through on the left) */}
      {/* Left panel — corrugated, border segments around a window centred in the
          panel with even padding (opening x -5.35..-2.95, y 1.55..3.15) */}
      {[
        { p: [-4.15, 0.775, -0.12] as const, a: [3.9, 1.55, 0.2] as const },
        { p: [-4.15, 4.325, -0.12] as const, a: [3.9, 2.35, 0.2] as const },
        { p: [-5.725, 2.35, -0.12] as const, a: [0.75, 1.6, 0.2] as const },
        { p: [-2.575, 2.35, -0.12] as const, a: [0.75, 1.6, 0.2] as const },
      ].map((s, i) => (
        <mesh key={"lp" + i} position={s.p} castShadow>
          <boxGeometry args={s.a} />
          <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
        </mesh>
      ))}
      <WindowGlass cx={-4.15} />
      {/* Right panel — corrugated, segments around the left part of the right
          window hole (window spans x 2.95..7.75; this panel covers x 2.2..5) */}
      {[
        { p: [3.6, 0.775, -0.12] as const, a: [2.8, 1.55, 0.2] as const },
        { p: [3.6, 4.325, -0.12] as const, a: [2.8, 2.35, 0.2] as const },
        { p: [2.575, 2.35, -0.12] as const, a: [0.75, 1.6, 0.2] as const },
      ].map((s, i) => (
        <mesh key={"rp" + i} position={s.p} castShadow>
          <boxGeometry args={s.a} />
          <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
        </mesh>
      ))}
      {/* Lintel above the door */}
      <mesh position={[0, DOOR_H + (SHOP_H - DOOR_H) / 2, -0.12]} castShadow>
        <boxGeometry args={[DOOR_W, SHOP_H - DOOR_H, 0.2]} />
        <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
      </mesh>
      {/* Right extension — SMOOTH flat cladding (#4); covers the right part of the
          double-wide window hole (window spans x 2.95..7.75; extension is x 5..11.1) */}
      {[
        { p: [8.05, 0.775, -0.119] as const, a: [6.1, 1.55, 0.2] as const },
        { p: [8.05, 4.325, -0.119] as const, a: [6.1, 2.35, 0.2] as const },
        { p: [9.425, 2.35, -0.119] as const, a: [3.35, 1.6, 0.2] as const },
      ].map((s, i) => (
        <mesh key={"ext" + i} position={s.p} castShadow>
          <boxGeometry args={s.a} />
          <meshStandardMaterial color="#2f333d" metalness={0.55} roughness={0.5} />
        </mesh>
      ))}
      <WindowGlass cx={5.35} w={4.8} />
      {/* Mono-pitch corrugated roof: high at the front (over the door) sloping
          down to the back, with a front eave overhang, fascia, gutter + downpipe */}
      <group>
        {/* sloped corrugated sheet */}
        <mesh position={[2.5, SHOP_H + 0.65, -4.7]} rotation={[-0.104, 0, 0]} castShadow>
          <boxGeometry args={[18, 0.22, 10.6]} />
          <meshStandardMaterial map={roofCorr} metalness={0.55} roughness={0.6} />
        </mesh>
        {/* fascia board at the roof's front edge */}
        <mesh position={[2.5, SHOP_H + 0.95, 0.5]} castShadow>
          <boxGeometry args={[18, 0.5, 0.12]} />
          <meshStandardMaterial color="#151924" metalness={0.4} roughness={0.7} />
        </mesh>
        {/* gutter channel mounted on the fascia, at the roof edge */}
        <mesh position={[2.5, SHOP_H + 0.62, 0.6]}>
          <boxGeometry args={[18, 0.16, 0.18]} />
          <meshStandardMaterial color="#0c0f18" metalness={0.5} roughness={0.6} />
        </mesh>
        {/* front clerestory strip closing the gap between wall top and roof */}
        <mesh position={[2.5, SHOP_H + 0.55, -0.12]} castShadow>
          <boxGeometry args={[17.2, 1.1, 0.2]} />
          <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
        </mesh>
        {/* triangular side infill following the roof slope */}
        <RoofGable x={-6} />
        <RoofGable x={11} />

        {/* rain downpipe: gutter outlet → swan-neck offset → pipe → shoe + splash */}
        <group>
          {/* short vertical outlet dropping out of the gutter */}
          <mesh position={[10.6, SHOP_H + 0.45, 0.6]}>
            <cylinderGeometry args={[0.06, 0.06, 0.5, 8]} />
            <meshStandardMaterial color="#0c0f18" metalness={0.5} roughness={0.6} />
          </mesh>
          {/* swan-neck offset from the gutter line back to the wall-side pipe */}
          <mesh position={[10.6, SHOP_H + 0.2, 0.38]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.06, 0.06, 0.56, 8]} />
            <meshStandardMaterial color="#0c0f18" metalness={0.5} roughness={0.6} />
          </mesh>
          {/* vertical pipe strapped to the wall */}
          <mesh position={[10.6, 2.85, 0.16]}>
            <cylinderGeometry args={[0.07, 0.07, 5.3, 8]} />
            <meshStandardMaterial color="#0c0f18" metalness={0.5} roughness={0.6} />
          </mesh>
          {/* two pipe straps */}
          {[1.6, 4.2].map((y) => (
            <mesh key={y} position={[10.6, y, 0.1]}>
              <boxGeometry args={[0.2, 0.05, 0.06]} />
              <meshStandardMaterial color="#0a0c14" metalness={0.5} roughness={0.7} />
            </mesh>
          ))}
          {/* shoe kicking outward at the bottom */}
          <mesh position={[10.6, 0.35, 0.34]} rotation={[-Math.PI / 4, 0, 0]}>
            <cylinderGeometry args={[0.07, 0.07, 0.55, 8]} />
            <meshStandardMaterial color="#0c0f18" metalness={0.5} roughness={0.6} />
          </mesh>
          {/* concrete splash block */}
          <mesh position={[10.6, 0.05, 0.62]} receiveShadow>
            <boxGeometry args={[0.5, 0.1, 0.7]} />
            <meshStandardMaterial color="#2b2f39" roughness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Expanded interior (walls, floor, ceiling, loft, lift) */}
      <Interior />

      {/* GARAGE sign above the roll-up door (clear of the shutter housing) */}
      <mesh position={[0, DOOR_H + 0.95, 0.16]}>
        <boxGeometry args={[4.2, 0.6, 0.06]} />
        <meshStandardMaterial map={garageBanner} emissiveMap={garageBanner} emissive="#8fb2ff" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>

      <GarageDoor onEnter={onEnter} live={doorLive} />

      {/* #5 wall utility (garage kept clean — no rust) */}
      <group>
        {/* under-eave fluorescent batten washing the sign + door */}
        <mesh position={[0, SHOP_H - 0.15, 0.28]}>
          <boxGeometry args={[4.2, 0.1, 0.12]} />
          <meshStandardMaterial color="#eaf0ff" emissive="#dfe8ff" emissiveIntensity={2.2} toneMapped={false} />
        </mesh>
        <pointLight position={[0, SHOP_H - 0.4, 0.9]} intensity={8} color="#eef3ff" distance={7} />

        {/* wall-mounted AC condenser on a bracket (right panel) */}
        <mesh position={[8.6, 3.75, 0.28]}>
          <boxGeometry args={[1.0, 0.2, 0.5]} />
          <meshStandardMaterial color="#14161e" metalness={0.5} roughness={0.7} />
        </mesh>
        <ACUnit position={[8.6, 4.2, 0.42]} />

        {/* electrical meter box + exposed conduit on the LEFT side wall (x=-6) */}
        <mesh position={[-6.2, 2.3, -1.5]}>
          <boxGeometry args={[0.16, 0.6, 0.42]} />
          <meshStandardMaterial color="#3a3f4a" metalness={0.4} roughness={0.7} />
        </mesh>
        <Pipe position={[-6.24, 3.6, -1.5]} height={2.4} />
        <Pipe position={[-6.24, 1.05, -1.5]} height={2.5} />
        {/* #19 breaker / junction boxes with a conduit run to the meter */}
        {[
          { p: [-6.22, 2.3, -2.4] as const, a: [0.14, 0.5, 0.36] as const },
          { p: [-6.22, 3.0, -2.4] as const, a: [0.12, 0.32, 0.28] as const },
        ].map((b, i) => (
          <mesh key={"bk" + i} position={b.p}>
            <boxGeometry args={b.a} />
            <meshStandardMaterial color="#2c313b" metalness={0.4} roughness={0.7} />
          </mesh>
        ))}
        <mesh position={[-6.24, 2.3, -1.95]}>
          <boxGeometry args={[0.05, 0.05, 0.9]} />
          <meshStandardMaterial color="#1a1e26" metalness={0.4} roughness={0.7} />
        </mesh>
      </group>

      {/* #3 base course · #5 corner flashing · #8 painted logo · #9 blade sign · #11 stickers */}
      <group>
        {/* concrete plinth along the base (skips the door opening) */}
        {[
          { p: [-4.15, 0.4, -0.02] as const, a: [3.9, 0.8, 0.26] as const },
          { p: [6.65, 0.4, -0.02] as const, a: [8.9, 0.8, 0.26] as const },
        ].map((b, i) => (
          <mesh key={"base" + i} position={b.p} receiveShadow>
            <boxGeometry args={b.a} />
            <meshStandardMaterial color="#42454c" roughness={0.95} metalness={0} />
          </mesh>
        ))}
        {/* corner flashing trims at the front corners */}
        {[-6.15, 11.15].map((x) => (
          <mesh key={"cf" + x} position={[x, SHOP_H / 2, 0.0]}>
            <boxGeometry args={[0.12, SHOP_H, 0.14]} />
            <meshStandardMaterial color="#3a3f4a" metalness={0.6} roughness={0.5} />
          </mesh>
        ))}
        {/* #8 painted logo on the left panel, above the window */}
        <mesh position={[-3.9, 3.9, 0.0]}>
          <planeGeometry args={[2.4, 1.0]} />
          <meshStandardMaterial map={paintedLogo} transparent roughness={0.9} depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
        {/* #11 sponsor stickers below the right window, between door and window */}
        <mesh position={[3.55, 1.15, 0.0]}>
          <planeGeometry args={[1.2, 0.6]} />
          <meshStandardMaterial map={sponsorDecals} transparent depthWrite={false} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
        {/* #9 projecting blade sign on the right corner */}
        <BladeSign position={[11.0, 3.6, 0.55]} tex={bladeSign} />
      </group>
      </group>

      {/* --- 24H convenience store, to the left with a wide alley before the garage --- */}
      <MartBuilding x={-13.4} corrugated={corrugated} store={store} banner={martBanner} />

      {/* --- Varied city buildings (mid + background, real geometry windows) --- */}
      <CityBuildings />

      {/* Vertical neon signboards */}
      <NeonSign tex={sign1} position={[12.9, 4.2, 1]} rotation={[0, -Math.PI / 2, 0]} scale={1.2} />
      <NeonSign tex={sign2} position={[-16.3, 3.7, 0.2]} scale={1.05} />
      <NeonSign tex={sign3} position={[-14.5, 6, 3.06]} scale={1.1} />

      {/* Overhead power lines crossing the street (silhouette against the
          lit buildings) */}
      {[
        { y: 6.9, z: 5.5 },
        { y: 6.6, z: 6.2 },
        { y: 7.1, z: 4.8 },
      ].map((w, i) => (
        <mesh key={i} position={[0, w.y, w.z]} rotation={[0, 0, 0]}>
          <boxGeometry args={[34, 0.04, 0.04]} />
          <meshStandardMaterial color="#15171f" metalness={0.2} roughness={0.8} />
        </mesh>
      ))}

      {/* Sidewalk in front of the buildings — concrete panels (slab grid) */}
      <mesh position={[0, 0.06, 1.5]} receiveShadow>
        <boxGeometry args={[60, 0.12, 2.6]} />
        <meshStandardMaterial map={sidewalkFar} roughness={1} metalness={0} />
      </mesh>
      {/* Sidewalk on the near (viewer's) side */}
      <mesh position={[0, 0.06, 10]} receiveShadow>
        <boxGeometry args={[60, 0.12, 3]} />
        <meshStandardMaterial map={sidewalkNear} roughness={1} metalness={0} />
      </mesh>
      {/* Concrete forecourt / apron in front of the garage door — the pad the
          cars sit on; overlays the sidewalk from the garage face to the gutter */}
      <mesh position={[GARAGE_X, 0.122, 1.425]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[11, 2.85]} />
        <meshStandardMaterial map={apron} roughness={0.78} metalness={0.05} polygonOffset polygonOffsetFactor={-1} />
      </mesh>

      {/* U-shaped roadside gutters where the curbs used to be */}
      <Gutter z={2.85} />
      <Gutter z={8.5} />

      {/* Crisp lengthwise joint along each sidewalk's road edge — borders the
          gutter and caps the vertical panel dividers (both sides identical) */}
      {[2.77, 8.53].map((z) => (
        <mesh key={"edge" + z} position={[0, 0.125, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 0.05]} />
          <meshStandardMaterial color="#2f323a" roughness={1} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}

      {/* Worn centre dashes — one continuous strip, paint fades sporadically */}
      <mesh position={[0, 0.011, 6]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[52, 0.15]} />
        <meshStandardMaterial
          color="#c6cac8"
          alphaMap={centreLine}
          transparent
          opacity={0.9}
          roughness={0.6}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>
      {/* Worn edge lines — both road edges identical */}
      {[3.25, 8.15].map((z) => (
        <mesh key={z} position={[0, 0.011, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[52, 0.12]} />
          <meshStandardMaterial
            color="#b9bdba"
            alphaMap={edgeLine}
            transparent
            opacity={0.88}
            roughness={0.6}
            polygonOffset
            polygonOffsetFactor={-1}
          />
        </mesh>
      ))}

    </group>
  );
}

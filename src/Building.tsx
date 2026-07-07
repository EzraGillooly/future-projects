import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  makeFacadeTexture,
  makeSkylineTexture,
  makeStorefrontTexture,
  makeSignTexture,
  makeBannerTexture,
  makeCorrugatedTexture,
} from "./textures";
import { ACUnit, Pipe, Awning, Puddle, Manhole, Crosswalk } from "./Props";
import { CityBuildings } from "./CityBuildings";
import { GLBModel } from "./Vehicle";
import { Interior } from "./Interior";

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
// Simple boxes, but the neighbours wear a procedural facade texture (window
// grid + emissive map) so they read as buildings, not flat rectangles.

// A box building clad in the facade texture. repeat controls window density; the
// texture is cloned per-instance so each building tiles independently.
function FacadeBox({
  position,
  args,
  repeat,
  facade,
}: {
  position: [number, number, number];
  args: [number, number, number];
  repeat: [number, number];
  facade: THREE.Texture;
}) {
  const tex = useMemo(() => {
    const t = facade.clone();
    t.needsUpdate = true;
    t.repeat.set(repeat[0], repeat[1]);
    return t;
  }, [facade, repeat[0], repeat[1]]);
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color="#ffffff"
        map={tex}
        emissiveMap={tex}
        emissive="#fff2dd"
        emissiveIntensity={0.9}
        roughness={0.85}
        metalness={0.1}
      />
    </mesh>
  );
}

// Far night-city backdrop plane, self-lit and unaffected by fog.
function Backdrop({ skyline }: { skyline: THREE.Texture }) {
  return (
    <mesh position={[0, 13, -34]}>
      <planeGeometry args={[230, 64]} />
      <meshBasicMaterial map={skyline} toneMapped={false} fog={false} depthWrite={false} />
    </mesh>
  );
}

export const DOOR_W = 4.4;
export const DOOR_H = 3.4;
const SHOP_W = 10;
const SHOP_H = 5.5;

// A deterministic grid of lit windows on a building's +Z face.

// Clickable garage door: an open glowing opening. The hotspot plane fills the
// opening; a frame brightens on hover.
function GarageDoor({ onEnter, live }: { onEnter: () => void; live: boolean }) {
  const [hovered, setHovered] = useState(false);
  const hot = live && hovered;

  useEffect(() => {
    if (!hot) return;
    document.body.style.cursor = "pointer";
    return () => void (document.body.style.cursor = "auto");
  }, [hot]);

  const frameColor = hot ? "#ff8fe6" : "#ff4fd8";
  const frameGlow = hot ? 3.5 : 1.6;

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
      {/* Neon door frame */}
      {[
        { p: [0, DOOR_H, 0.08] as const, a: [DOOR_W + 0.2, 0.12, 0.06] as const },
        { p: [-DOOR_W / 2, DOOR_H / 2, 0.08] as const, a: [0.12, DOOR_H, 0.06] as const },
        { p: [DOOR_W / 2, DOOR_H / 2, 0.08] as const, a: [0.12, DOOR_H, 0.06] as const },
      ].map((b, i) => (
        <mesh key={i} position={b.p}>
          <boxGeometry args={b.a} />
          <meshStandardMaterial color={frameColor} emissive={frameColor} emissiveIntensity={frameGlow} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

// A separate 24H convenience store next to the garage: facade upper floors,
// lit storefront ground floor, banner, awning, entrance.
function MartBuilding({
  x,
  facade,
  store,
  banner,
}: {
  x: number;
  facade: THREE.Texture;
  store: THREE.Texture;
  banner: THREE.Texture;
}) {
  const W = 6;
  const H = 4.8;
  const D = 6;
  const facadeTex = useMemo(() => {
    const t = facade.clone();
    t.needsUpdate = true;
    t.repeat.set(3, 3);
    return t;
  }, [facade]);
  const storeTex = useMemo(() => {
    const t = store.clone();
    t.needsUpdate = true;
    t.repeat.set(2, 1);
    return t;
  }, [store]);
  return (
    <group position={[x, 0, 0]}>
      {/* body / upper floors */}
      <mesh position={[0, H / 2, -D / 2]} castShadow receiveShadow>
        <boxGeometry args={[W, H, D]} />
        <meshStandardMaterial color="#ffffff" map={facadeTex} emissiveMap={facadeTex} emissive="#fff2dd" emissiveIntensity={0.9} roughness={0.85} metalness={0.1} />
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
      <ACUnit position={[-1.8, 4.1, 0.3]} />
    </group>
  );
}

export function Scene3D({ onEnter, doorLive }: { onEnter: () => void; doorLive: boolean }) {
  const facade = useMemo(() => makeFacadeTexture(3), []);
  const skyline = useMemo(() => makeSkylineTexture(), []);
  const store = useMemo(() => makeStorefrontTexture(), []);
  const corrugated = useMemo(() => {
    const t = makeCorrugatedTexture();
    t.repeat.set(3, 2);
    return t;
  }, []);
  const martBanner = useMemo(() => makeBannerTexture("24H MART", "#1c8a3c", true), []);
  const garageBanner = useMemo(() => makeBannerTexture("GARAGE", "#e6e9f2", false, "#171b28"), []);
  const sign1 = useMemo(() => makeSignTexture("ラーメン", "#ff4fd8"), []);
  const sign2 = useMemo(() => makeSignTexture("居酒屋", "#4fd8ff"), []);
  const sign3 = useMemo(() => makeSignTexture("カラオケ", "#ffb43f"), []);
  return (
    <group>
      <Backdrop skyline={skyline} />

      {/* --- Shop front wall (framed around the door opening) --- */}
      {/* Left panel — corrugated metal */}
      <mesh position={[-(SHOP_W / 2 + DOOR_W / 2) / 2 - DOOR_W / 4, SHOP_H / 2, 0]} castShadow>
        <boxGeometry args={[SHOP_W / 2 - DOOR_W / 2, SHOP_H, 0.2]} />
        <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
      </mesh>
      {/* Right panel — corrugated metal */}
      <mesh position={[(SHOP_W / 2 + DOOR_W / 2) / 2 + DOOR_W / 4, SHOP_H / 2, 0]} castShadow>
        <boxGeometry args={[SHOP_W / 2 - DOOR_W / 2, SHOP_H, 0.2]} />
        <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
      </mesh>
      {/* Lintel above the door */}
      <mesh position={[0, DOOR_H + (SHOP_H - DOOR_H) / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W, SHOP_H - DOOR_H, 0.2]} />
        <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
      </mesh>
      {/* Exterior wall wrapping the right lift-bay extension so the wider garage
          reads as one building and the interior no longer shows on the street */}
      <mesh position={[8, SHOP_H / 2, 0]} castShadow>
        <boxGeometry args={[6, SHOP_H, 0.25]} />
        <meshStandardMaterial map={corrugated} metalness={0.6} roughness={0.55} />
      </mesh>
      {/* Roof capping the (now wider) garage */}
      <mesh position={[3, SHOP_H + 0.12, -4.5]} castShadow>
        <boxGeometry args={[16.6, 0.3, 11]} />
        <meshStandardMaterial color="#0e1220" metalness={0.4} roughness={0.6} />
      </mesh>

      {/* Expanded interior (walls, floor, ceiling, loft, lift) */}
      <Interior />

      {/* GARAGE sign above the roll-up door */}
      <mesh position={[0, DOOR_H + 0.55, 0.16]}>
        <boxGeometry args={[4.2, 0.6, 0.06]} />
        <meshStandardMaterial map={garageBanner} emissiveMap={garageBanner} emissive="#8fb2ff" emissiveIntensity={0.5} toneMapped={false} />
      </mesh>
      {/* AC units + drainpipe on the garage face */}
      <ACUnit position={[-4.3, 4.4, 0.35]} />
      <ACUnit position={[4.2, 4.7, 0.35]} />
      <Pipe position={[-4.95, 2.7, 0.2]} height={5.4} />
      <Pipe position={[4.95, 2.7, 0.2]} height={5.4} />

      {/* A vending machine (real model) beside the door + its glow */}
      <GLBModel url="/models/vending-machine.glb" position={[3.3, 0, 0.7]} rotation={[0, 0, 0]} height={1.9} />
      <pointLight position={[3.3, 1.4, 1.4]} intensity={4} color="#9fd6ff" distance={5} />

      <GarageDoor onEnter={onEnter} live={doorLive} />

      {/* --- 24H convenience store, to the left with a wide alley before the garage --- */}
      <MartBuilding x={-13.4} facade={facade} store={store} banner={martBanner} />

      {/* --- Apartment block (moved back, clear of the expanded interior) --- */}
      <FacadeBox position={[0, 8, -26]} args={[18, 16, 3]} repeat={[6, 6]} facade={facade} />

      {/* --- Varied city buildings (depth + skyline variety) --- */}
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

      {/* Sidewalk in front of the buildings (between them and the road) */}
      <mesh position={[0, 0.06, 1.5]} receiveShadow>
        <boxGeometry args={[60, 0.12, 2.6]} />
        <meshStandardMaterial color="#33384a" roughness={0.95} metalness={0.1} />
      </mesh>
      {/* Curb edge */}
      <mesh position={[0, 0.09, 2.78]}>
        <boxGeometry args={[60, 0.18, 0.16]} />
        <meshStandardMaterial color="#4a4f60" roughness={0.9} />
      </mesh>

      {/* Ground detail: manholes + a crosswalk */}
      <Manhole position={[3, 0.02, 5.5]} />
      <Manhole position={[-7.5, 0.02, 7]} />
      <Crosswalk x={7} />

      {/* Puddles catching the neon (wet night) */}
      <Puddle position={[2, 0.015, 3.2]} scale={[1.6, 1.0]} rotation={0.3} />
      <Puddle position={[-4.5, 0.015, 4.2]} scale={[2.1, 1.3]} rotation={-0.4} />
      <Puddle position={[6.5, 0.015, 5]} scale={[1.4, 0.9]} rotation={0.1} />
      <Puddle position={[-1.5, 0.015, 7]} scale={[2.4, 1.2]} rotation={0.5} />
      <Puddle position={[-9, 0.015, 3.4]} scale={[1.3, 0.9]} rotation={-0.2} />

      {/* Centre-line dashes running ALONG the street (left-to-right) */}
      {Array.from({ length: 13 }).map((_, i) => (
        <mesh key={i} position={[-18 + i * 3, 0.02, 6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.3, 0.26]} />
          <meshStandardMaterial color="#d8c98c" emissive="#8a7838" emissiveIntensity={0.5} roughness={0.7} />
        </mesh>
      ))}

      {/* Street lamps (real models) on the sidewalk + a warm glow at each head */}
      {[7, -9].map((x) => (
        <group key={x}>
          <GLBModel url="/models/streetlight.glb" position={[x, 0, 2.7]} rotation={[0, x < 0 ? -Math.PI / 2 : Math.PI / 2, 0]} height={6} />
          <pointLight position={[x, 5.4, 3.5]} intensity={22} color="#ffe6b0" distance={16} />
        </group>
      ))}

      {/* Big dumpster in the alley, against the 24H mart's side wall + litter */}
      <GLBModel url="/models/dumpster.glb" position={[-9.7, 0, -1]} rotation={[0, Math.PI / 2, 0]} length={2.4} />
      <GLBModel url="/models/debris-papers.glb" position={[-8.5, 0.02, 0.6]} rotation={[0, 0.4, 0]} length={0.8} />
      <GLBModel url="/models/debris-papers.glb" position={[-2.2, 0.02, 6.4]} rotation={[0, 1.3, 0]} length={0.7} />
    </group>
  );
}

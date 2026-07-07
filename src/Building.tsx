import { useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import {
  makeFacadeTexture,
  makeSkylineTexture,
  makeStorefrontTexture,
  makeSignTexture,
  makeBannerTexture,
} from "./textures";
import { ACUnit, Pipe, Bush, TrashCan, Awning } from "./Props";

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
const SHOP_D = 9;
const SHOP_H = 5.5;

const WALL = "#20263c";
const WALL_DARK = "#161b2e";

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

export function Scene3D({ onEnter, doorLive }: { onEnter: () => void; doorLive: boolean }) {
  const facade = useMemo(() => makeFacadeTexture(3), []);
  const skyline = useMemo(() => makeSkylineTexture(), []);
  const store = useMemo(() => makeStorefrontTexture(), []);
  const banner = useMemo(() => makeBannerTexture(), []);
  const sign1 = useMemo(() => makeSignTexture("ラーメン", "#ff4fd8"), []);
  const sign2 = useMemo(() => makeSignTexture("居酒屋", "#4fd8ff"), []);
  const sign3 = useMemo(() => makeSignTexture("カラオケ", "#ffb43f"), []);
  return (
    <group>
      <Backdrop skyline={skyline} />

      {/* --- Shop front wall (framed around the door opening) --- */}
      {/* Left panel — lit storefront window */}
      <mesh position={[-(SHOP_W / 2 + DOOR_W / 2) / 2 - DOOR_W / 4, SHOP_H / 2, 0]} castShadow>
        <boxGeometry args={[SHOP_W / 2 - DOOR_W / 2, SHOP_H, 0.2]} />
        <meshStandardMaterial map={store} emissiveMap={store} emissive="#fff4dc" emissiveIntensity={0.8} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Right panel — lit storefront window */}
      <mesh position={[(SHOP_W / 2 + DOOR_W / 2) / 2 + DOOR_W / 4, SHOP_H / 2, 0]} castShadow>
        <boxGeometry args={[SHOP_W / 2 - DOOR_W / 2, SHOP_H, 0.2]} />
        <meshStandardMaterial map={store} emissiveMap={store} emissive="#fff4dc" emissiveIntensity={0.8} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Lintel above the door */}
      <mesh position={[0, DOOR_H + (SHOP_H - DOOR_H) / 2, 0]} castShadow>
        <boxGeometry args={[DOOR_W, SHOP_H - DOOR_H, 0.2]} />
        <meshStandardMaterial color={WALL} metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Side + back walls, roof, interior floor */}
      <mesh position={[-SHOP_W / 2, SHOP_H / 2, -SHOP_D / 2]}>
        <boxGeometry args={[0.2, SHOP_H, SHOP_D]} />
        <meshStandardMaterial color={WALL_DARK} />
      </mesh>
      <mesh position={[SHOP_W / 2, SHOP_H / 2, -SHOP_D / 2]}>
        <boxGeometry args={[0.2, SHOP_H, SHOP_D]} />
        <meshStandardMaterial color={WALL_DARK} />
      </mesh>
      <mesh position={[0, SHOP_H / 2, -SHOP_D]}>
        <boxGeometry args={[SHOP_W, SHOP_H, 0.2]} />
        <meshStandardMaterial color={WALL_DARK} />
      </mesh>
      <mesh position={[0, SHOP_H, -SHOP_D / 2]} castShadow>
        <boxGeometry args={[SHOP_W + 0.6, 0.2, SHOP_D + 0.4]} />
        <meshStandardMaterial color="#0e1220" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.02, -SHOP_D / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[SHOP_W, SHOP_D]} />
        <meshStandardMaterial color="#1a1e2e" roughness={0.9} />
      </mesh>

      {/* Interior neon accent strips along the side walls */}
      <mesh position={[-SHOP_W / 2 + 0.15, 3.2, -SHOP_D / 2]}>
        <boxGeometry args={[0.05, 0.12, SHOP_D - 1]} />
        <meshStandardMaterial color="#ff4fd8" emissive="#ff4fd8" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh position={[SHOP_W / 2 - 0.15, 3.2, -SHOP_D / 2]}>
        <boxGeometry args={[0.05, 0.12, SHOP_D - 1]} />
        <meshStandardMaterial color="#4fd8ff" emissive="#4fd8ff" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      {/* Shop banner above the door */}
      <mesh position={[0, DOOR_H + 1.15, 0.16]}>
        <boxGeometry args={[4.4, 0.7, 0.06]} />
        <meshStandardMaterial map={banner} emissiveMap={banner} emissive="#ffffff" emissiveIntensity={0.9} toneMapped={false} />
      </mesh>
      {/* Awning over the storefront */}
      <Awning position={[0, DOOR_H + 0.25, 0.9]} width={SHOP_W - 0.4} />
      {/* AC units + drainpipe on the shop face */}
      <ACUnit position={[-4.3, 4.4, 0.35]} />
      <ACUnit position={[4.2, 4.7, 0.35]} />
      <Pipe position={[-4.95, 2.7, 0.2]} height={5.4} />
      <Pipe position={[4.95, 2.7, 0.2]} height={5.4} />

      {/* Vending machines to the left of the door */}
      <mesh position={[-2.9, 0.9, 0.55]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.6]} />
        <meshStandardMaterial color="#c0243a" emissive="#ff3355" emissiveIntensity={0.7} />
      </mesh>
      <mesh position={[-3.65, 0.9, 0.55]} castShadow>
        <boxGeometry args={[0.7, 1.8, 0.6]} />
        <meshStandardMaterial color="#1c6fb0" emissive="#2b9dff" emissiveIntensity={0.7} />
      </mesh>

      <GarageDoor onEnter={onEnter} live={doorLive} />

      {/* --- Apartment block behind the shop --- */}
      <FacadeBox position={[0, 6.5, -13]} args={[14, 13, 3]} repeat={[5, 5]} facade={facade} />

      {/* --- Framing buildings along the street --- */}
      <FacadeBox position={[-11, 4, -3]} args={[6, 8, 12]} repeat={[3, 4]} facade={facade} />
      <FacadeBox position={[11, 5, -3]} args={[6, 10, 12]} repeat={[3, 5]} facade={facade} />
      {/* Vertical neon signboards mounted on the neighbouring buildings */}
      <NeonSign tex={sign1} position={[-7.95, 4.2, 2.5]} rotation={[0, Math.PI / 2, 0]} scale={1.2} />
      <NeonSign tex={sign2} position={[7.95, 3.6, 1.5]} rotation={[0, -Math.PI / 2, 0]} scale={1.15} />
      <NeonSign tex={sign3} position={[9.6, 6, 3.06]} scale={1.1} />

      {/* Bushes + trash by the storefront */}
      <Bush position={[-4.4, 0, 1.3]} scale={1.1} />
      <Bush position={[3.6, 0, 1.4]} scale={0.9} />
      <TrashCan position={[2.6, 0.45, 1.2]} />
      <TrashCan position={[3.1, 0.45, 1.35]} />

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

      {/* Faint centre-line dashes down the wet road */}
      {[3, 5.5, 8, 10.5].map((z) => (
        <mesh key={z} position={[0, 0.02, z]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.28, 1.1]} />
          <meshStandardMaterial color="#c9b877" emissive="#7a6a2e" emissiveIntensity={0.5} roughness={0.7} />
        </mesh>
      ))}

      {/* Street lamp posts, pushed to the frame edges */}
      {[-9.5, 9.5].map((x) => (
        <group key={x} position={[x, 0, 8]}>
          <mesh position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.08, 0.08, 5, 8]} />
            <meshStandardMaterial color="#0a0c14" />
          </mesh>
          <mesh position={[0, 5, 0]}>
            <boxGeometry args={[0.5, 0.2, 0.5]} />
            <meshStandardMaterial color="#fff4d6" emissive="#ffdf9e" emissiveIntensity={2.5} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

import { useEffect, useMemo, useState } from "react";

// The night-time tuning shop, its neighbours, and the clickable garage door.
// All primitives — stylized homage, not a replica.

export const DOOR_W = 4.4;
export const DOOR_H = 3.4;
const SHOP_W = 10;
const SHOP_D = 9;
const SHOP_H = 5.5;

const WALL = "#20263c";
const WALL_DARK = "#161b2e";

// A deterministic grid of lit windows on a building's +Z face.
function Windows({
  width,
  height,
  y,
  z,
  cols,
  rows,
}: {
  width: number;
  height: number;
  y: number;
  z: number;
  cols: number;
  rows: number;
}) {
  const panes = useMemo(() => {
    const out: { x: number; y: number; on: boolean; warm: boolean }[] = [];
    const stepX = width / cols;
    const stepY = height / rows;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        out.push({
          x: -width / 2 + stepX * (c + 0.5),
          y: y - height / 2 + stepY * (r + 0.5),
          on: i % 3 !== 0, // most windows lit
          warm: i % 2 === 0,
        });
      }
    }
    return out;
  }, [width, height, y, cols, rows]);

  return (
    <>
      {panes.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, z]}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshStandardMaterial
            color={p.on ? (p.warm ? "#ffcf8f" : "#8fd0ff") : "#0c1020"}
            emissive={p.on ? (p.warm ? "#ffb24d" : "#4da6ff") : "#000000"}
            emissiveIntensity={p.on ? 1.1 : 0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </>
  );
}

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
      {/* Invisible click/hover target across the opening */}
      <mesh
        position={[0, DOOR_H / 2, 0.06]}
        visible={false}
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
  return (
    <group>
      {/* --- Shop front wall (framed around the door opening) --- */}
      {/* Left panel */}
      <mesh position={[-(SHOP_W / 2 + DOOR_W / 2) / 2 - DOOR_W / 4, SHOP_H / 2, 0]} castShadow>
        <boxGeometry args={[SHOP_W / 2 - DOOR_W / 2, SHOP_H, 0.2]} />
        <meshStandardMaterial color={WALL} metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Right panel */}
      <mesh position={[(SHOP_W / 2 + DOOR_W / 2) / 2 + DOOR_W / 4, SHOP_H / 2, 0]} castShadow>
        <boxGeometry args={[SHOP_W / 2 - DOOR_W / 2, SHOP_H, 0.2]} />
        <meshStandardMaterial color={WALL} metalness={0.3} roughness={0.7} />
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

      {/* Shop sign above the door */}
      <mesh position={[0, DOOR_H + 0.55, 0.16]}>
        <boxGeometry args={[3.6, 0.5, 0.06]} />
        <meshStandardMaterial color="#eaf6ff" emissive="#8fe6ff" emissiveIntensity={2.2} toneMapped={false} />
      </mesh>

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
      <mesh position={[0, 6.5, -13]}>
        <boxGeometry args={[14, 13, 3]} />
        <meshStandardMaterial color="#10131f" />
      </mesh>
      <Windows width={12} height={10} y={7} z={-11.4} cols={8} rows={6} />

      {/* --- Framing buildings along the street --- */}
      <mesh position={[-11, 4, -3]}>
        <boxGeometry args={[6, 8, 12]} />
        <meshStandardMaterial color="#0f1220" />
      </mesh>
      <Windows width={4.5} height={6} y={4.5} z={2.9} cols={4} rows={4} />
      <mesh position={[11, 5, -3]}>
        <boxGeometry args={[6, 10, 12]} />
        <meshStandardMaterial color="#0f1220" />
      </mesh>
      {/* Neon sign on the right building */}
      <mesh position={[8.1, 5.5, 2]}>
        <boxGeometry args={[0.1, 2.4, 0.3]} />
        <meshStandardMaterial color="#ff4fd8" emissive="#ff4fd8" emissiveIntensity={2.6} toneMapped={false} />
      </mesh>

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

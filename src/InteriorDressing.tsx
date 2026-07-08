import { useMemo } from "react";
import {
  makeMangaSpines,
  makePosterTexture,
  makeArtPlaceholder,
  makeAlbumArt,
} from "./textures";

// Procedural props to dress the garage interior — a chill lounge + a display of
// tastes on the loft, plus working-garage clutter. All primitives + canvas
// textures (CSP-safe). Positions are in the interior's local space.

type Vec3 = [number, number, number];

// --- lounge / display -------------------------------------------------------

// A low sofa: seat, back, two arms, and back cushions.
export function Couch({ position, rotation = 0, w = 2.4, color = "#3a3f52" }: { position: Vec3; rotation?: number; w?: number; color?: string }) {
  const d = 0.95;
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[w, 0.32, d]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.5, -d / 2 + 0.12]} castShadow>
        <boxGeometry args={[w, 0.6, 0.22]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {[-w / 2 + 0.12, w / 2 - 0.12].map((x) => (
        <mesh key={x} position={[x, 0.42, 0]} castShadow>
          <boxGeometry args={[0.22, 0.5, d]} />
          <meshStandardMaterial color={color} roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: Math.max(2, Math.round(w / 0.9)) }).map((_, i, a) => (
        <mesh key={i} position={[-w / 2 + 0.4 + (i * (w - 0.8)) / (a.length - 1 || 1), 0.5, -d / 2 + 0.24]}>
          <boxGeometry args={[(w - 0.8) / a.length - 0.06, 0.42, 0.14]} />
          <meshStandardMaterial color={color === "#3a3f52" ? "#454b60" : "#4a3a52"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

export function Rug({ position, size = [3, 2], color = "#5a2140", rotation = 0 }: { position: Vec3; size?: [number, number]; color?: string; rotation?: number }) {
  return (
    <mesh position={position} rotation={[-Math.PI / 2, 0, rotation]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={1} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}

export function LowTable({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.34, 0]} castShadow>
        <boxGeometry args={[1.3, 0.08, 0.75]} />
        <meshStandardMaterial color="#1c140d" roughness={0.6} metalness={0.1} />
      </mesh>
      {[[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.17, z]}>
          <boxGeometry args={[0.06, 0.34, 0.06]} />
          <meshStandardMaterial color="#0e0a06" />
        </mesh>
      ))}
    </group>
  );
}

// A media console with a turntable + two speakers + a stack of records.
export function MediaConsole({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  const albums = useMemo(() => [1, 2, 3].map((s) => makeAlbumArt(s)), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* cabinet */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[1.8, 0.6, 0.5]} />
        <meshStandardMaterial color="#241a12" roughness={0.5} metalness={0.15} />
      </mesh>
      {/* turntable on top */}
      <mesh position={[-0.4, 0.63, 0]}>
        <boxGeometry args={[0.6, 0.06, 0.44]} />
        <meshStandardMaterial color="#0c0d12" roughness={0.4} />
      </mesh>
      <mesh position={[-0.4, 0.67, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.16, 0.16, 0.02, 24]} />
        <meshStandardMaterial color="#111" roughness={0.3} />
      </mesh>
      {/* record propped up, album art visible */}
      <mesh position={[0.55, 0.85, -0.15]} rotation={[0, -0.3, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.02]} />
        <meshStandardMaterial map={albums[0]} roughness={0.6} />
      </mesh>
      {/* two small speakers */}
      {[-0.78, 0.78].map((x) => (
        <mesh key={x} position={[x, 0.85, 0]} castShadow>
          <boxGeometry args={[0.24, 0.5, 0.24]} />
          <meshStandardMaterial color="#15100c" roughness={0.6} />
        </mesh>
      ))}
      {/* records leaning inside the cabinet shelf */}
      {albums.map((a, i) => (
        <mesh key={i} position={[0.2 + i * 0.03, 0.3, 0.2]} rotation={[0, 0, 0.06 * (i - 1)]}>
          <boxGeometry args={[0.02, 0.44, 0.44]} />
          <meshStandardMaterial map={a} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// A wall shelf full of manga spines (2 rows).
export function MangaShelf({ position, rotation = 0, w = 1.8 }: { position: Vec3; rotation?: number; w?: number }) {
  const spines = useMemo(() => [7, 12].map((s) => makeMangaSpines(s)), []);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {[0, 0.42].map((dy, r) => (
        <group key={r} position={[0, dy, 0]}>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[w, 0.04, 0.24]} />
            <meshStandardMaterial color="#1a130c" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.17, -0.02]}>
            <boxGeometry args={[w, 0.3, 0.06]} />
            <meshStandardMaterial map={spines[r]} roughness={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// A framed picture — REPLACEABLE: swap `makeArtPlaceholder` for a real image via
// useTexture('/art/xxx.jpg') once the image is dropped in public/art/.
export function FramedArt({ position, rotation = 0, w = 0.9, h = 1.1, seed = 1 }: { position: Vec3; rotation?: number; w?: number; h?: number; seed?: number }) {
  const art = useMemo(() => makeArtPlaceholder(seed), [seed]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.05]} />
        <meshStandardMaterial color="#0e0b08" roughness={0.5} metalness={0.2} />
      </mesh>
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial map={art} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Poster({ position, rotation = 0, w = 1.1, h = 1.6, seed = 1 }: { position: Vec3; rotation?: number; w?: number; h?: number; seed?: number }) {
  const tex = useMemo(() => makePosterTexture(seed), [seed]);
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} roughness={0.85} polygonOffset polygonOffsetFactor={-1} />
    </mesh>
  );
}

// A glowing neon word bar (self-lit).
export function NeonBarSign({ position, rotation = 0, w = 2.2, color = "#ff4fd8" }: { position: Vec3; rotation?: number; w?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh>
        <boxGeometry args={[w, 0.14, 0.04]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.6} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 0, 0.4]} intensity={4} color={color} distance={4} />
    </group>
  );
}

export function FloorLamp({ position, color = "#ffcf8f" }: { position: Vec3; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.03, 0]}>
        <cylinderGeometry args={[0.18, 0.2, 0.06, 12]} />
        <meshStandardMaterial color="#14161e" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
        <meshStandardMaterial color="#20242e" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.65, 0]}>
        <cylinderGeometry args={[0.16, 0.2, 0.28, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} roughness={0.7} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} intensity={7} color={color} distance={5} />
    </group>
  );
}

export function PottedPlant({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const blobs: { p: Vec3; r: number }[] = [
    { p: [0, 0.55, 0], r: 0.28 },
    { p: [0.2, 0.42, 0.05], r: 0.22 },
    { p: [-0.18, 0.46, -0.05], r: 0.22 },
    { p: [0.02, 0.72, 0], r: 0.2 },
  ];
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.16, 0]}>
        <cylinderGeometry args={[0.16, 0.12, 0.32, 10]} />
        <meshStandardMaterial color="#7a4a2a" roughness={0.9} />
      </mesh>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <icosahedronGeometry args={[b.r, 0]} />
          <meshStandardMaterial color={i % 2 ? "#1f3a24" : "#274a2c"} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

// A retro arcade cabinet with a glowing screen.
export function Arcade({ position, rotation = 0, color = "#7a1f2a" }: { position: Vec3; rotation?: number; color?: string }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.7, 1.7, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* screen */}
      <mesh position={[0, 1.25, 0.34]} rotation={[0.15, 0, 0]}>
        <planeGeometry args={[0.5, 0.42]} />
        <meshStandardMaterial color="#2a5fd8" emissive="#3a6bff" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* control panel */}
      <mesh position={[0, 0.88, 0.36]} rotation={[-0.6, 0, 0]}>
        <boxGeometry args={[0.6, 0.28, 0.05]} />
        <meshStandardMaterial color="#14100c" roughness={0.7} />
      </mesh>
      {/* marquee */}
      <mesh position={[0, 1.62, 0.3]}>
        <boxGeometry args={[0.66, 0.16, 0.06]} />
        <meshStandardMaterial color="#ffcf6b" emissive="#ffb03b" emissiveIntensity={1.2} toneMapped={false} />
      </mesh>
      <pointLight position={[0, 1.25, 0.8]} intensity={4} color="#5a8bff" distance={3} />
    </group>
  );
}

export function MiniFridge({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.6, 0.9, 0.6]} />
        <meshStandardMaterial color="#c23b3b" roughness={0.4} metalness={0.2} />
      </mesh>
      <mesh position={[0.26, 0.45, 0.31]}>
        <boxGeometry args={[0.04, 0.3, 0.03]} />
        <meshStandardMaterial color="#e0e0e0" metalness={0.5} roughness={0.4} />
      </mesh>
    </group>
  );
}

// --- working garage clutter -------------------------------------------------

export function ToolChest({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.1, 1.1, 0.55]} />
        <meshStandardMaterial color="#b3202a" roughness={0.4} metalness={0.35} />
      </mesh>
      {[0.2, 0.5, 0.8].map((dy) => (
        <mesh key={dy} position={[0, dy, 0.28]}>
          <boxGeometry args={[1.0, 0.03, 0.02]} />
          <meshStandardMaterial color="#111" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* top chest */}
      <mesh position={[0, 1.2, 0]} castShadow>
        <boxGeometry args={[1.1, 0.4, 0.55]} />
        <meshStandardMaterial color="#8a1820" roughness={0.4} metalness={0.35} />
      </mesh>
    </group>
  );
}

export function Workbench({ position, rotation = 0, w = 2.6 }: { position: Vec3; rotation?: number; w?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* top */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[w, 0.1, 0.7]} />
        <meshStandardMaterial color="#2a2620" roughness={0.7} metalness={0.2} />
      </mesh>
      {/* legs */}
      {[-w / 2 + 0.15, w / 2 - 0.15].map((x) =>
        [-0.28, 0.28].map((z) => (
          <mesh key={x + "" + z} position={[x, 0.45, z]}>
            <boxGeometry args={[0.08, 0.9, 0.08]} />
            <meshStandardMaterial color="#15130f" metalness={0.4} roughness={0.6} />
          </mesh>
        ))
      )}
      {/* pegboard behind + hanging tools (silhouettes) */}
      <mesh position={[0, 1.75, -0.32]}>
        <boxGeometry args={[w, 1.4, 0.04]} />
        <meshStandardMaterial color="#3a2f22" roughness={0.9} />
      </mesh>
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh key={i} position={[-w / 2 + 0.4 + i * (w - 0.8) / 7, 1.6 + (i % 2) * 0.35, -0.29]}>
          <boxGeometry args={[0.05, 0.28 + (i % 3) * 0.08, 0.05]} />
          <meshStandardMaterial color="#0e0c09" metalness={0.4} roughness={0.6} />
        </mesh>
      ))}
      {/* a vice on the corner */}
      <mesh position={[w / 2 - 0.35, 1.0, 0]}>
        <boxGeometry args={[0.18, 0.18, 0.22]} />
        <meshStandardMaterial color="#2a5a8a" metalness={0.6} roughness={0.4} />
      </mesh>
    </group>
  );
}

export function TireStack({ position, count = 4 }: { position: Vec3; count?: number }) {
  return (
    <group position={position}>
      {Array.from({ length: count }).map((_, i) => (
        <mesh key={i} position={[0, 0.16 + i * 0.24, 0]} rotation={[Math.PI / 2, 0, i * 0.4]} castShadow>
          <torusGeometry args={[0.32, 0.13, 8, 16]} />
          <meshStandardMaterial color="#14151a" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

export function OilDrum({ position, color = "#2f6f3c" }: { position: Vec3; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.9, 16]} />
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.3} />
      </mesh>
      {[0.25, 0.65].map((y) => (
        <mesh key={y} position={[0, y, 0]}>
          <torusGeometry args={[0.31, 0.02, 6, 16]} />
          <meshStandardMaterial color="#111" roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

// An engine block on a stand.
export function EngineStand({ position, rotation = 0 }: { position: Vec3; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* stand legs */}
      {[[-0.4, -0.4], [0.4, -0.4], [-0.4, 0.4], [0.4, 0.4]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <boxGeometry args={[0.06, 0.7, 0.06]} />
          <meshStandardMaterial color="#d0a020" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 0.72, 0]}>
        <boxGeometry args={[0.9, 0.06, 0.9]} />
        <meshStandardMaterial color="#c8981c" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* engine block */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[0.6, 0.5, 0.55]} />
        <meshStandardMaterial color="#5a5f68" metalness={0.6} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.4, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.45]} />
        <meshStandardMaterial color="#3a3f48" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

// A string of warm bulbs between two points (festoon lights).
export function StringLights({ from, to, bulbs = 8, y = 0 }: { from: Vec3; to: Vec3; bulbs?: number; y?: number }) {
  return (
    <group>
      {Array.from({ length: bulbs }).map((_, i) => {
        const t = i / (bulbs - 1);
        const sag = Math.sin(t * Math.PI) * 0.35;
        const x = from[0] + (to[0] - from[0]) * t;
        const z = from[2] + (to[2] - from[2]) * t;
        const yy = from[1] + (to[1] - from[1]) * t - sag + y;
        return (
          <mesh key={i} position={[x, yy, z]}>
            <sphereGeometry args={[0.05, 8, 8]} />
            <meshStandardMaterial color="#ffd98a" emissive="#ffcf7a" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        );
      })}
    </group>
  );
}

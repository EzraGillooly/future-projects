import { GLBModel } from "./Vehicle";

// The expanded garage interior — bigger than the exterior footprint (fine: the
// camera never sees both at once). A deep main bay, a back loft/hangout, and a
// right extension with a car lift. The exterior street facade is untouched.

// Interior bounds (world units). Front (z=0) keeps the real door opening.
const L = -6; // left wall x
const R = 11; // right wall x
const BACK = -18; // back wall z
const H = 5.5; // ceiling height (matches the exterior garage front)
const WALL = "#161b2e";
const WALL2 = "#12172a";

function Box({
  position,
  args,
  color = WALL,
  ...rest
}: {
  position: [number, number, number];
  args: [number, number, number];
  color?: string;
  [k: string]: unknown;
}) {
  return (
    <mesh position={position} {...rest}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.9} metalness={0.1} />
    </mesh>
  );
}

function Loft() {
  const y = 2.7; // deck height
  const zC = -16; // deck centre
  const w = 11;
  const d = 4;
  const xC = 2.5;
  return (
    <group>
      {/* Deck */}
      <Box position={[xC, y, zC]} args={[w, 0.2, d]} color="#20263c" castShadow receiveShadow />
      {/* Support posts under the front edge */}
      {[7, 2.5, -2].map((x) => (
        <Box key={x} position={[x, y / 2, zC + d / 2 - 0.2]} args={[0.2, y, 0.2]} color="#0d1120" />
      ))}
      {/* Front railing */}
      <Box position={[xC, y + 0.45, zC + d / 2]} args={[w, 0.08, 0.08]} color="#3a4560" />
      {[7.6, -2.4].map((x) => (
        <Box key={x} position={[x, y + 0.22, zC + d / 2]} args={[0.08, 0.45, 0.08]} color="#2a3350" />
      ))}
      {/* Staircase up to the loft (real model) */}
      <GLBModel url="/models/staircase.glb" position={[-2.6, 0, -10.6]} height={2.9} />

      {/* Hangout dressing on the deck */}
      {/* Rug */}
      <mesh position={[xC, y + 0.11, zC]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5, 2.6]} />
        <meshStandardMaterial color="#3a2140" roughness={1} />
      </mesh>
      {/* L-couch */}
      <Box position={[xC + 1.6, y + 0.45, zC - 0.6]} args={[1.0, 0.7, 2.4]} color="#2b2f45" castShadow />
      <Box position={[xC + 0.6, y + 0.45, zC - 1.6]} args={[2.6, 0.7, 1.0]} color="#2b2f45" castShadow />
      {/* Coffee table */}
      <Box position={[xC, y + 0.35, zC + 0.2]} args={[1.2, 0.1, 0.7]} color="#14100c" />
      {/* TV on the back wall, glowing */}
      <mesh position={[xC - 2.6, y + 1.1, BACK + 0.12]}>
        <boxGeometry args={[2.2, 1.3, 0.08]} />
        <meshStandardMaterial color="#0a0d16" emissive="#3a6bd8" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {/* Warm loft light */}
      <pointLight position={[xC, y + 1.6, zC]} intensity={16} color="#ffb26b" distance={10} />
    </group>
  );
}

function Lift() {
  const x = 8;
  const z = -3.5;
  const deckY = 1.5;
  return (
    <group position={[x, 0, z]}>
      {/* Two posts */}
      {[-1, 1].map((s) => (
        <Box key={s} position={[s * 1.1, 1.4, 0]} args={[0.28, 2.8, 0.28]} color="#c8b030" />
      ))}
      {/* Cross beam */}
      <Box position={[0, 2.7, 0]} args={[2.5, 0.2, 0.3]} color="#c8b030" />
      {/* Lift arms / platform */}
      {[-0.9, 0.9].map((z2) => (
        <Box key={z2} position={[0, deckY, z2]} args={[2.4, 0.14, 0.4]} color="#8a7820" />
      ))}
      {/* A car up on the lift (decor) */}
      <group position={[0, deckY + 0.12, 0]}>
        <GLBModel url="/models/nissan-180sx.glb" position={[0, 0, 0]} rotation={[0, 0, 0]} length={4.1} />
      </group>
      {/* Work light */}
      <pointLight position={[0, 3.4, 1.5]} intensity={14} color="#eaf2ff" distance={9} />
    </group>
  );
}

export function Interior() {
  const depth = 0 - BACK;
  const width = R - L;
  const zMid = BACK / 2;
  return (
    <group>
      {/* Left + right walls */}
      <Box position={[L, H / 2, zMid]} args={[0.2, H, depth]} color={WALL2} />
      <Box position={[R, H / 2, zMid]} args={[0.2, H, depth]} color={WALL2} />
      {/* Back wall */}
      <Box position={[(L + R) / 2, H / 2, BACK]} args={[width, H, 0.2]} color={WALL2} />
      {/* Front wall closing the right extension (right of the door panels) */}
      <Box position={[(R + 5) / 2, H / 2, 0]} args={[R - 5, H, 0.2]} color={WALL2} />
      {/* Ceiling */}
      <Box position={[(L + R) / 2, H, zMid]} args={[width, 0.2, depth]} color="#0e1220" castShadow />
      {/* Interior floor (concrete over the wet road) */}
      <mesh position={[(L + R) / 2, 0.02, zMid]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial color="#1a1e2e" roughness={0.92} metalness={0.05} />
      </mesh>

      {/* Neon accent strips high on the side walls */}
      <mesh position={[L + 0.15, 4, zMid]}>
        <boxGeometry args={[0.05, 0.12, depth - 2]} />
        <meshStandardMaterial color="#ff4fd8" emissive="#ff4fd8" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh position={[R - 0.15, 4, zMid]}>
        <boxGeometry args={[0.05, 0.12, depth - 2]} />
        <meshStandardMaterial color="#4fd8ff" emissive="#4fd8ff" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      <Loft />
      <Lift />

      {/* General warm fill so the deeper space reads */}
      <pointLight position={[2, 3.6, -8]} intensity={22} color="#ffa24d" distance={20} />
      <pointLight position={[0, 3.6, -3]} intensity={20} color="#ffb26b" distance={14} />
    </group>
  );
}

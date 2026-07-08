import { useMemo } from "react";
import { makeApronTexture } from "./textures";
import {
  Couch,
  Rug,
  LowTable,
  ArmChair,
  MediaConsole,
  MangaShelf,
  Poster,
  NeonBarSign,
  FloorLamp,
  PottedPlant,
  Arcade,
  MiniFridge,
  ToolChest,
  Workbench,
  TireStack,
  EngineStand,
  StringLights,
} from "./InteriorDressing";

// The expanded garage interior — bigger than the exterior footprint (fine: the
// camera never sees both at once). A working ground floor + a back LOFT with a
// chill lounge underneath and a taste-display on top (Tokyo-Drift garage vibe).

// Interior bounds (world units). Front (z=0) keeps the real door opening.
const L = -6; // left wall x
const R = 11; // right wall x
const BACK = -18; // back wall z
const H = 5.5; // ceiling height (matches the exterior garage front)
const WALL2 = "#12172a";

function Box({
  position,
  args,
  color = "#161b2e",
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

// A railing run between two deck-edge points: a top rail + evenly spaced balusters.
function Railing({ x1, z1, x2, z2, y }: { x1: number; z1: number; x2: number; z2: number; y: number }) {
  const dx = x2 - x1;
  const dz = z2 - z1;
  const len = Math.hypot(dx, dz);
  const n = Math.max(2, Math.round(len / 0.9));
  const angle = Math.atan2(dz, dx);
  return (
    <group>
      <mesh position={[(x1 + x2) / 2, y + 0.52, (z1 + z2) / 2]} rotation={[0, -angle, 0]}>
        <boxGeometry args={[len, 0.08, 0.08]} />
        <meshStandardMaterial color="#3a4560" />
      </mesh>
      {Array.from({ length: n + 1 }).map((_, i) => {
        const t = i / n;
        return (
          <mesh key={i} position={[x1 + dx * t, y + 0.26, z1 + dz * t]}>
            <boxGeometry args={[0.05, 0.5, 0.05]} />
            <meshStandardMaterial color="#2a3350" />
          </mesh>
        );
      })}
    </group>
  );
}

// A solid straight staircase climbing along X up to the deck, flush to a wall.
// Each step is a block from the floor to its tread height, so it reads built-in.
function Stairs({ x0, x1, top, z, width = 1.15, steps = 8 }: { x0: number; x1: number; top: number; z: number; width?: number; steps?: number }) {
  const dx = (x1 - x0) / steps;
  const dy = top / steps;
  return (
    <group>
      {Array.from({ length: steps }).map((_, i) => {
        const cx = x0 + dx * (i + 0.5);
        const h = dy * (i + 1);
        return (
          <mesh key={i} position={[cx, h / 2, z]} castShadow receiveShadow>
            <boxGeometry args={[Math.abs(dx) + 0.01, h, width]} />
            <meshStandardMaterial color="#2a3350" roughness={0.85} metalness={0.1} />
          </mesh>
        );
      })}
    </group>
  );
}

// The loft: deck spanning the back, chill lounge underneath, display on top.
function Loft() {
  const y = 2.6; // deck top height
  const d = 6.9; // extended back so the deck reaches the back wall
  const zC = -14.45; // deck centre (z -11..-17.9, back edge on the wall)
  const xC = 1.5; // (x -3..6)
  const w = 9;
  const frontZ = zC + d / 2; // z = -11
  const backZ = zC - d / 2; // z = -17.9 (against the back wall)

  return (
    <group>
      {/* Deck slab */}
      <Box position={[xC, y, zC]} args={[w, 0.2, d]} color="#20263c" castShadow receiveShadow />
      {/* Support posts (front edge + back corners) */}
      {[-2.7, 1.5, 5.7].map((x) => (
        <Box key={"pf" + x} position={[x, y / 2, frontZ - 0.15]} args={[0.18, y, 0.18]} color="#0d1120" />
      ))}
      {[-2.7, 5.7].map((x) => (
        <Box key={"pb" + x} position={[x, y / 2, zC - d / 2 + 0.15]} args={[0.18, y, 0.18]} color="#0d1120" />
      ))}
      {/* Safety railing around the deck. Deck spans x[-3, 6], z[-17.9, -11]; the
          back edge is against the wall (no railing there), and the back-right is
          left open as the stair landing. */}
      <Railing x1={-3} z1={frontZ} x2={6} z2={frontZ} y={y} />
      <Railing x1={-3} z1={frontZ} x2={-3} z2={backZ + 0.2} y={y} />
      <Railing x1={6} z1={frontZ} x2={6} z2={-16} y={y} />
      {/* Staircase — back-right, flush against the back wall and parallel to it,
          climbing from x=9 up to the deck's back-right edge (clear of the cars) */}
      <Stairs x0={9} x1={6} top={y} z={backZ + 0.65} />

      {/* ================= CHILL LOUNGE — underneath the deck ================= */}
      {/* Left wall: TV nook — couch on the rug facing the wall-mounted TV, table between */}
      <Rug position={[-4.5, 0.03, -14.5]} size={[2.8, 3.6]} color="#4a1f3a" />
      <Couch position={[-4.0, 0, -14.5]} rotation={-Math.PI / 2} w={2.4} color="#3a2f45" />
      <LowTable position={[-5.0, 0, -14.5]} rotation={-Math.PI / 2} />
      {/* wall-mounted TV on the left wall, screen facing into the room (+X) */}
      <mesh position={[-5.88, 1.5, -14.5]} rotation={[0, Math.PI / 2, 0]}>
        <boxGeometry args={[2.0, 1.2, 0.08]} />
        <meshStandardMaterial color="#0a0d16" emissive="#3a6bd8" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      <FloorLamp position={[-3.2, 0, -16.3]} color="#ffb26b" />
      <PottedPlant position={[-2.7, 0, -12.4]} scale={1.1} />
      {/* Right side: two armchairs facing the garage (+Z), grouped on a small rug */}
      <Rug position={[4.3, 0.03, -14.6]} size={[3.4, 2.8]} color="#3a2140" />
      <ArmChair position={[3.4, 0, -15.2]} rotation={0} color="#3a2f45" />
      <ArmChair position={[5.2, 0, -15.2]} rotation={0} color="#3a2f45" />
      <LowTable position={[4.3, 0, -13.4]} />
      <Arcade position={[4.7, 0, -16.8]} rotation={-0.3} color="#5a1f6a" />
      <MiniFridge position={[2.9, 0, -16.6]} rotation={0.2} />
      {/* festoon string lights under the deck front edge */}
      <StringLights from={[-2.8, 2.35, frontZ]} to={[5.8, 2.35, frontZ]} bulbs={9} />
      {/* warm fill — one for each side of the lounge */}
      <pointLight position={[-4.5, 2.1, -14.5]} intensity={10} color="#ffb26b" distance={8} />
      <pointLight position={[4.3, 2.1, -14.5]} intensity={10} color="#ffb26b" distance={8} />

      {/* ================= DISPLAY — on top of the deck ================= */}
      <Rug position={[0.6, y + 0.11, -13.6]} size={[4.2, 2.6]} color="#3a2140" />
      {/* couch + record console facing forward off the loft */}
      <group position={[0, y + 0.1, 0]}>
        <Couch position={[0.6, 0, -13.2]} rotation={Math.PI} w={2.4} color="#454b60" />
        <MediaConsole position={[3.6, 0, -14]} rotation={-Math.PI / 2} />
        <FloorLamp position={[-2.2, 0, -13]} color="#ffd9a8" />
        <PottedPlant position={[5.2, 0, -12.6]} scale={1} />
      </group>
      {/* manga shelf on the back wall above the deck */}
      <MangaShelf position={[3.9, y + 1.0, -17.7]} w={2.0} />
      {/* neon word sign over the display */}
      <NeonBarSign position={[1.5, y + 2.5, -17.6]} w={3.0} color="#ff4fd8" />
      {/* warm display light */}
      <pointLight position={[1.5, y + 1.8, -13.5]} intensity={14} color="#ffcf8f" distance={9} />
    </group>
  );
}

function Lift() {
  const x = 8.5;
  const z = -4;
  const deckY = 1.5;
  return (
    <group position={[x, 0, z]}>
      {[-1, 1].map((s) => (
        <Box key={s} position={[s * 1.1, 1.4, 0]} args={[0.28, 2.8, 0.28]} color="#c8b030" />
      ))}
      <Box position={[0, 2.7, 0]} args={[2.5, 0.2, 0.3]} color="#c8b030" />
      {[-0.9, 0.9].map((z2) => (
        <Box key={z2} position={[0, deckY, z2]} args={[2.4, 0.14, 0.4]} color="#8a7820" />
      ))}
      <pointLight position={[0, 3.4, 1.5]} intensity={14} color="#eaf2ff" distance={9} />
    </group>
  );
}

// Working-garage clutter on the ground floor (kept clear of the parked cars at
// local x ±3.5, z -2.6/-6, and the lift at x 8.5).
function GroundShop() {
  return (
    <group>
      {/* Left-wall work corner (forward of the lounge): bench + pegboard, tool chest */}
      <Workbench position={[-5.2, 0, -11.2]} rotation={Math.PI / 2} w={3.0} />
      <ToolChest position={[-5.3, 0, -8.4]} rotation={Math.PI / 2} />
      {/* engine on a stand + tyres, right-centre / right wall behind the cars */}
      <EngineStand position={[6.4, 0, -8]} rotation={0.5} />
      <TireStack position={[10.2, 0, -8]} count={3} />
      <TireStack position={[10.3, 0, -11]} count={4} />

      {/* Posters on the walls */}
      <Poster position={[L + 0.12, 3.6, -4.5]} rotation={Math.PI / 2} seed={1} />
      <Poster position={[L + 0.12, 3.6, -8.5]} rotation={Math.PI / 2} w={1.0} h={1.4} seed={2} />
      <Poster position={[R - 0.12, 3.7, -6]} rotation={-Math.PI / 2} seed={3} />
      <Poster position={[R - 0.12, 3.5, -10]} rotation={-Math.PI / 2} w={1.0} h={1.4} seed={4} />
    </group>
  );
}

export function Interior() {
  const depth = 0 - BACK;
  const width = R - L;
  const zMid = BACK / 2;
  const floorTex = useMemo(() => {
    const t = makeApronTexture(5, false);
    t.repeat.set(width / 6, depth / 6);
    return t;
  }, [width, depth]);
  return (
    <group>
      {/* Left + right walls */}
      <Box position={[L, H / 2, zMid]} args={[0.2, H, depth]} color={WALL2} />
      <Box position={[R, H / 2, zMid]} args={[0.2, H, depth]} color={WALL2} />
      {/* Back wall */}
      <Box position={[(L + R) / 2, H / 2, BACK]} args={[width, H, 0.2]} color={WALL2} />
      {/* Front wall closing the right extension — border segments around the
          right shop-window hole (x 5..7.75, y 1.55..3.15) */}
      <Box position={[8, 0.775, -0.12]} args={[6, 1.55, 0.2]} color={WALL2} />
      <Box position={[8, 4.325, -0.12]} args={[6, 2.35, 0.2]} color={WALL2} />
      <Box position={[9.375, 2.35, -0.12]} args={[3.25, 1.6, 0.2]} color={WALL2} />
      {/* Ceiling */}
      <Box position={[(L + R) / 2, H, zMid]} args={[width, 0.2, depth]} color="#0e1220" castShadow />
      {/* Interior floor — oil-stained concrete, matching the forecourt apron */}
      <mesh position={[(L + R) / 2, 0.02, zMid]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={floorTex} roughness={0.82} metalness={0.05} />
      </mesh>

      {/* Neon accent strips high on the side walls */}
      <mesh position={[L + 0.15, 4.6, zMid]}>
        <boxGeometry args={[0.05, 0.12, depth - 2]} />
        <meshStandardMaterial color="#ff4fd8" emissive="#ff4fd8" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <mesh position={[R - 0.15, 4.6, zMid]}>
        <boxGeometry args={[0.05, 0.12, depth - 2]} />
        <meshStandardMaterial color="#4fd8ff" emissive="#4fd8ff" emissiveIntensity={2.4} toneMapped={false} />
      </mesh>

      <Loft />
      <Lift />
      <GroundShop />

      {/* General warm fill so the deeper space reads */}
      <pointLight position={[2, 3.6, -8]} intensity={20} color="#ffa24d" distance={20} />
      <pointLight position={[0, 3.6, -3]} intensity={18} color="#ffb26b" distance={14} />
    </group>
  );
}

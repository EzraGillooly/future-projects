import { useMemo } from "react";
import { GLBModel } from "./Vehicle";
import { makeApronTexture } from "./textures";
import {
  Couch,
  Rug,
  LowTable,
  MediaConsole,
  MangaShelf,
  FramedArt,
  Poster,
  NeonBarSign,
  FloorLamp,
  PottedPlant,
  Arcade,
  MiniFridge,
  ToolChest,
  Workbench,
  TireStack,
  OilDrum,
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

// The loft: deck spanning the back, chill lounge underneath, display on top.
function Loft() {
  const y = 2.6; // deck top height
  const zC = -14; // deck centre (z -11..-17)
  const d = 6;
  const xC = 1.5; // (x -3..6)
  const w = 9;
  const frontZ = zC + d / 2; // z = -11

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
      {/* Front railing + balusters */}
      <Box position={[xC, y + 0.52, frontZ]} args={[w, 0.08, 0.08]} color="#3a4560" />
      {Array.from({ length: 7 }).map((_, i) => (
        <Box key={i} position={[-3 + 0.4 + i * (w - 0.8) / 6, y + 0.26, frontZ]} args={[0.05, 0.5, 0.05]} color="#2a3350" />
      ))}
      {/* Staircase up to the loft */}
      <GLBModel url="/models/staircase.glb" position={[-2.4, 0, frontZ + 1.7]} height={2.7} />

      {/* ================= CHILL LOUNGE — underneath the deck ================= */}
      <Rug position={[1.5, 0.03, -14]} size={[4.4, 3.2]} color="#4a1f3a" />
      {/* couch tucked at the back, looking out toward the door/cars */}
      <Couch position={[1.4, 0, -16]} rotation={0} w={2.6} color="#3a2f45" />
      <LowTable position={[1.4, 0, -14.2]} />
      {/* arcade cabinet + mini fridge + lamp + plant */}
      <Arcade position={[-2.2, 0, -16.4]} rotation={0.4} color="#5a1f6a" />
      <MiniFridge position={[5.1, 0, -16.4]} rotation={-0.3} />
      <FloorLamp position={[4.7, 0, -12.3]} color="#ffb26b" />
      <PottedPlant position={[-2.5, 0, -12.2]} scale={1.1} />
      {/* festoon string lights under the deck front edge */}
      <StringLights from={[-2.8, 2.35, frontZ]} to={[5.8, 2.35, frontZ]} bulbs={9} />
      {/* warm fill for the lounge */}
      <pointLight position={[1.5, 2.1, -14]} intensity={12} color="#ffb26b" distance={9} />

      {/* ================= DISPLAY — on top of the deck ================= */}
      <Rug position={[0.6, y + 0.11, -13.6]} size={[4.2, 2.6]} color="#3a2140" />
      {/* couch + record console facing forward off the loft */}
      <group position={[0, y + 0.1, 0]}>
        <Couch position={[0.6, 0, -13.2]} rotation={Math.PI} w={2.4} color="#454b60" />
        <MediaConsole position={[3.6, 0, -14]} rotation={-Math.PI / 2} />
        <FloorLamp position={[-2.2, 0, -13]} color="#ffd9a8" />
        <PottedPlant position={[5.2, 0, -12.6]} scale={1} />
        {/* model-car / trophy shelf */}
        <Box position={[-2.3, 0.9, -16.6]} args={[1.4, 0.06, 0.4]} color="#1a130c" />
        {[-2.8, -2.3, -1.8].map((x, i) => (
          <GLBModel key={i} url="/models/nissan-gtr.glb" position={[x, 0.95, -16.6]} length={0.55} />
        ))}
      </group>
      {/* manga shelf + framed art on the back wall above the deck */}
      <MangaShelf position={[3.9, y + 1.0, -17.7]} w={2.0} />
      <FramedArt position={[-1.2, y + 1.5, -17.78]} w={1.0} h={1.2} seed={1} />
      <FramedArt position={[0.1, y + 1.4, -17.78]} w={0.8} h={1.0} seed={2} />
      <FramedArt position={[1.3, y + 1.55, -17.78]} w={1.0} h={1.3} seed={3} />
      {/* neon word sign over the display */}
      <NeonBarSign position={[1.5, y + 2.5, -17.6]} w={3.0} color="#ff4fd8" />
      {/* TV on the back wall for the lounge below to see */}
      <mesh position={[-3.4, y - 1.0, -17.85]}>
        <boxGeometry args={[2.0, 1.2, 0.08]} />
        <meshStandardMaterial color="#0a0d16" emissive="#3a6bd8" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
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
      <group position={[0, deckY + 0.12, 0]}>
        <GLBModel url="/models/nissan-180sx.glb" position={[0, 0, 0]} rotation={[0, 0, 0]} length={4.1} />
      </group>
      <pointLight position={[0, 3.4, 1.5]} intensity={14} color="#eaf2ff" distance={9} />
    </group>
  );
}

// Working-garage clutter on the ground floor (kept clear of the parked cars at
// local x ±3.5, z -2.6/-6, and the lift at x 8.5).
function GroundShop() {
  return (
    <group>
      {/* Left-wall work zone: bench + pegboard, tool chest, tyres, drums */}
      <Workbench position={[-5.2, 0, -10]} rotation={Math.PI / 2} w={3.0} />
      <ToolChest position={[-5.3, 0, -6.5]} rotation={Math.PI / 2} />
      <TireStack position={[-5.2, 0, -13.5]} count={4} />
      <OilDrum position={[-5.4, 0, -3.5]} color="#2f6f3c" />
      <OilDrum position={[-4.7, 0, -3.4]} color="#8a6a1c" />
      {/* engine on a stand, right-centre behind the cars */}
      <EngineStand position={[6.4, 0, -8]} rotation={0.5} />
      <TireStack position={[10.2, 0, -8]} count={3} />

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

import { useMemo } from "react";
import * as THREE from "three";
import { makeFacadeTexture } from "./textures";

// A cluster of procedurally-varied city buildings for depth + variety, so the
// skyline stops looking like matching boxes. Curated placements (kept clear of
// the foreground garage/mart footprint) with varied size, window pattern (one of
// several facade seeds), tint, setbacks, and rooftop props.

type Vec3 = [number, number, number];

// --- Rooftop props ----------------------------------------------------------
function WaterTank({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      {[
        [-0.35, -0.35],
        [0.35, -0.35],
        [-0.35, 0.35],
        [0.35, 0.35],
      ].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.35, z]}>
          <cylinderGeometry args={[0.05, 0.05, 0.7, 6]} />
          <meshStandardMaterial color="#14161e" metalness={0.4} roughness={0.7} />
        </mesh>
      ))}
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.7, 12]} />
        <meshStandardMaterial color="#3a3228" metalness={0.2} roughness={0.85} />
      </mesh>
      <mesh position={[0, 1.42, 0]}>
        <coneGeometry args={[0.6, 0.35, 12]} />
        <meshStandardMaterial color="#2c261e" roughness={0.9} />
      </mesh>
    </group>
  );
}

function Antenna({ position, height = 2.4 }: { position: Vec3; height?: number }) {
  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.03, 0.05, height, 6]} />
        <meshStandardMaterial color="#0e1017" metalness={0.5} roughness={0.6} />
      </mesh>
      {[0.45, 0.62, 0.78].map((t, i) => (
        <mesh key={i} position={[0, height * t, 0]}>
          <boxGeometry args={[0.5 - i * 0.12, 0.03, 0.03]} />
          <meshStandardMaterial color="#0e1017" />
        </mesh>
      ))}
      {/* red aircraft-warning light */}
      <mesh position={[0, height, 0]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#ff3b3b" emissive="#ff2020" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  );
}

function RoofAC({ position }: { position: Vec3 }) {
  return (
    <mesh position={position} castShadow>
      <boxGeometry args={[0.9, 0.5, 0.7]} />
      <meshStandardMaterial color="#2b2f3a" metalness={0.4} roughness={0.7} />
    </mesh>
  );
}

function Billboard({ position, color }: { position: Vec3; color: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[2.4, 1.3, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.6} toneMapped={false} />
      </mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.9, 0.3, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.9, 6]} />
          <meshStandardMaterial color="#0e1017" />
        </mesh>
      ))}
    </group>
  );
}

// --- Building spec ----------------------------------------------------------
type Roof = "tank" | "antenna" | "ac" | "billboard" | "none";

interface Spec {
  pos: Vec3; // centre of footprint at ground
  w: number;
  h: number;
  d: number;
  tex: number; // facade variant index
  tint: string;
  setback?: number; // height of a smaller stacked box, 0 = none
  roof: Roof;
  billboardColor?: string;
}

// Curated, varied placements around the foreground (garage at x0, mart ~x8.5).
// Kept clear of the expanded interior footprint (x in [-11,6], z in [-18,0]).
const SPECS: Spec[] = [
  { pos: [17, 0, -4], w: 8, h: 15, d: 12, tex: 1, tint: "#4c515f", setback: 3, roof: "tank" },
  { pos: [14, 0, -26], w: 8, h: 20, d: 6, tex: 2, tint: "#565b6d", roof: "antenna" },
  { pos: [2, 0, -30], w: 12, h: 15, d: 5, tex: 3, tint: "#4a4f5e", roof: "billboard", billboardColor: "#ff4fd8" },
  { pos: [-11, 0, -26], w: 8, h: 24, d: 6, tex: 1, tint: "#5a5f72", setback: 4, roof: "antenna" },
  { pos: [-16, 0, -3], w: 6, h: 10, d: 12, tex: 2, tint: "#4e5364", roof: "tank" },
  { pos: [-24, 0, -12], w: 8, h: 17, d: 8, tex: 0, tint: "#565b6d", roof: "billboard", billboardColor: "#4fd8ff" },
  { pos: [25, 0, -8], w: 7, h: 12, d: 10, tex: 3, tint: "#4a4f5e", roof: "ac" },
];

function VariedBuilding({ spec, facade }: { spec: Spec; facade: THREE.Texture }) {
  const tex = useMemo(() => {
    const t = facade.clone();
    t.needsUpdate = true;
    t.repeat.set(Math.max(2, Math.round(spec.w / 2)), Math.max(2, Math.round(spec.h / 2.4)));
    return t;
  }, [facade, spec.w, spec.h]);

  const top = spec.h;
  const roofPos: Vec3 = [spec.pos[0], top, spec.pos[2]];

  return (
    <group>
      <mesh position={[spec.pos[0], spec.h / 2, spec.pos[2]]} castShadow receiveShadow>
        <boxGeometry args={[spec.w, spec.h, spec.d]} />
        <meshStandardMaterial color={spec.tint} map={tex} emissiveMap={tex} emissive="#fff2dd" emissiveIntensity={0.85} roughness={0.85} metalness={0.1} />
      </mesh>
      {spec.setback ? (
        <mesh position={[spec.pos[0], spec.h + spec.setback / 2, spec.pos[2]]} castShadow>
          <boxGeometry args={[spec.w * 0.6, spec.setback, spec.d * 0.6]} />
          <meshStandardMaterial color={spec.tint} map={tex} emissiveMap={tex} emissive="#fff2dd" emissiveIntensity={0.85} roughness={0.85} />
        </mesh>
      ) : null}
      {spec.roof === "tank" && <WaterTank position={[roofPos[0] - spec.w * 0.2, top, roofPos[2]]} />}
      {spec.roof === "antenna" && <Antenna position={roofPos} height={spec.h * 0.35} />}
      {spec.roof === "ac" && (
        <>
          <RoofAC position={[roofPos[0] - 1, top + 0.25, roofPos[2]]} />
          <RoofAC position={[roofPos[0] + 1.1, top + 0.25, roofPos[2] - 0.6]} />
        </>
      )}
      {spec.roof === "billboard" && (
        <Billboard position={[roofPos[0], top, roofPos[2] + spec.d * 0.3]} color={spec.billboardColor ?? "#ff4fd8"} />
      )}
    </group>
  );
}

export function CityBuildings() {
  const facades = useMemo(() => [3, 11, 27, 42].map((s) => makeFacadeTexture(s)), []);
  return (
    <group>
      {SPECS.map((spec, i) => (
        <VariedBuilding key={i} spec={spec} facade={facades[spec.tex]} />
      ))}
    </group>
  );
}

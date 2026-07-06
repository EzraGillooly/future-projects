// Stylized low-poly car built from primitives. Nose points toward +X (local);
// the parent positions/rotates it. Visual only — no interaction, no popup.

const WHEEL_X = 0.85;
const WHEEL_Z = 0.55;

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.3, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.3, 0.3, 0.24, 16]} />
      <meshStandardMaterial color="#0c0e18" roughness={0.8} />
    </mesh>
  );
}

export function CarModel({
  bodyColor = "#1b2036",
  accent,
  glow,
  opacity = 1,
  headlights = true,
}: {
  bodyColor?: string;
  accent: string;
  glow: number;
  opacity?: number;
  headlights?: boolean;
}) {
  return (
    <>
      {/* Lower body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.6, 0.42, 1.1]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.35} transparent opacity={opacity} />
      </mesh>
      {/* Cabin / greenhouse, set back toward the rear */}
      <mesh position={[-0.25, 0.92, 0]} castShadow>
        <boxGeometry args={[1.2, 0.42, 0.98]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.3} transparent opacity={opacity} />
      </mesh>
      {/* Open hood panel, hinged up at the nose */}
      <mesh position={[0.62, 0.95, 0]} rotation={[0, 0, 0.95]} castShadow>
        <boxGeometry args={[0.9, 0.05, 1.0]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.35} transparent opacity={opacity} />
      </mesh>
      {/* Engine block in the open bay */}
      <mesh position={[0.72, 0.66, 0]}>
        <boxGeometry args={[0.7, 0.38, 0.86]} />
        <meshStandardMaterial color="#2b3050" emissive={accent} emissiveIntensity={glow * 0.4} metalness={0.7} roughness={0.4} />
      </mesh>

      <Wheel x={WHEEL_X} z={WHEEL_Z} />
      <Wheel x={WHEEL_X} z={-WHEEL_Z} />
      <Wheel x={-WHEEL_X} z={WHEEL_Z} />
      <Wheel x={-WHEEL_X} z={-WHEEL_Z} />

      {headlights && (
        <>
          <mesh position={[1.31, 0.55, 0.36]}>
            <boxGeometry args={[0.06, 0.16, 0.22]} />
            <meshStandardMaterial color="#fff2cc" emissive="#ffd27a" emissiveIntensity={2} toneMapped={false} />
          </mesh>
          <mesh position={[1.31, 0.55, -0.36]}>
            <boxGeometry args={[0.06, 0.16, 0.22]} />
            <meshStandardMaterial color="#fff2cc" emissive="#ffd27a" emissiveIntensity={2} toneMapped={false} />
          </mesh>
        </>
      )}

      {/* Neon underglow */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 1.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={glow} transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </>
  );
}

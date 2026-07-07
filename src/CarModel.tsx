// Stylized low-poly car built from primitives. Nose points toward +X (local);
// the parent positions/rotates it. Glossy paint + glass catch the neon
// environment map for reflections. Visual only — no interaction, no popup.

const WHEEL_X = 0.85;
const WHEEL_Z = 0.56;

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.3, z]} rotation={[Math.PI / 2, 0, 0]}>
      {/* Tyre */}
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.26, 20]} />
        <meshStandardMaterial color="#0b0d15" roughness={0.85} metalness={0.1} />
      </mesh>
      {/* Rim */}
      <mesh position={[0, z >= 0 ? 0.14 : -0.14, 0]}>
        <cylinderGeometry args={[0.17, 0.17, 0.04, 16]} />
        <meshStandardMaterial color="#cdd6ea" metalness={1} roughness={0.22} envMapIntensity={1.4} />
      </mesh>
    </group>
  );
}

export function CarModel({
  bodyColor = "#232a44",
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
  const paint = { metalness: 0.85, roughness: 0.26, envMapIntensity: 1.3 };

  return (
    <>
      {/* Lower splitter / chin */}
      <mesh position={[0, 0.28, 0]}>
        <boxGeometry args={[2.72, 0.14, 1.16]} />
        <meshStandardMaterial color="#0c0e18" metalness={0.4} roughness={0.6} transparent opacity={opacity} />
      </mesh>
      {/* Main body */}
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[2.6, 0.42, 1.1]} />
        <meshStandardMaterial color={bodyColor} {...paint} transparent opacity={opacity} />
      </mesh>
      {/* Glass greenhouse band */}
      <mesh position={[-0.3, 0.85, 0]}>
        <boxGeometry args={[1.3, 0.3, 0.92]} />
        <meshStandardMaterial color="#0a0d18" metalness={0.9} roughness={0.06} envMapIntensity={1.6} transparent opacity={opacity * 0.92} />
      </mesh>
      {/* Roof */}
      <mesh position={[-0.36, 1.03, 0]} castShadow>
        <boxGeometry args={[1.0, 0.14, 0.86]} />
        <meshStandardMaterial color={bodyColor} {...paint} transparent opacity={opacity} />
      </mesh>
      {/* Side mirrors */}
      {[0.55, -0.55].map((z) => (
        <mesh key={z} position={[0.2, 0.88, z]}>
          <boxGeometry args={[0.14, 0.08, 0.12]} />
          <meshStandardMaterial color={bodyColor} {...paint} transparent opacity={opacity} />
        </mesh>
      ))}

      {/* Open hood panel, hinged up at the nose */}
      <mesh position={[0.62, 0.95, 0]} rotation={[0, 0, 0.95]} castShadow>
        <boxGeometry args={[0.9, 0.05, 1.0]} />
        <meshStandardMaterial color={bodyColor} {...paint} transparent opacity={opacity} />
      </mesh>
      {/* Engine block in the open bay */}
      <mesh position={[0.72, 0.66, 0]}>
        <boxGeometry args={[0.7, 0.38, 0.86]} />
        <meshStandardMaterial color="#2b3050" emissive={accent} emissiveIntensity={glow * 0.4} metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Rear wing */}
      {[0.34, -0.34].map((z) => (
        <mesh key={z} position={[-1.16, 0.78, z]}>
          <boxGeometry args={[0.06, 0.2, 0.06]} />
          <meshStandardMaterial color="#0c0e18" metalness={0.5} roughness={0.5} transparent opacity={opacity} />
        </mesh>
      ))}
      <mesh position={[-1.24, 0.9, 0]} castShadow>
        <boxGeometry args={[0.42, 0.05, 1.02]} />
        <meshStandardMaterial color={bodyColor} {...paint} transparent opacity={opacity} />
      </mesh>

      <Wheel x={WHEEL_X} z={WHEEL_Z} />
      <Wheel x={WHEEL_X} z={-WHEEL_Z} />
      <Wheel x={-WHEEL_X} z={WHEEL_Z} />
      <Wheel x={-WHEEL_X} z={-WHEEL_Z} />

      {headlights && (
        <>
          <mesh position={[1.31, 0.55, 0.36]}>
            <boxGeometry args={[0.06, 0.16, 0.22]} />
            <meshStandardMaterial color="#fff2cc" emissive="#ffd27a" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
          <mesh position={[1.31, 0.55, -0.36]}>
            <boxGeometry args={[0.06, 0.16, 0.22]} />
            <meshStandardMaterial color="#fff2cc" emissive="#ffd27a" emissiveIntensity={2.2} toneMapped={false} />
          </mesh>
        </>
      )}
      {/* Tail-light strip */}
      <mesh position={[-1.3, 0.55, 0]}>
        <boxGeometry args={[0.05, 0.12, 0.82]} />
        <meshStandardMaterial color="#ff5a6e" emissive="#ff2d4a" emissiveIntensity={1.6} toneMapped={false} />
      </mesh>

      {/* Neon underglow */}
      <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.7, 1.2]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={glow} transparent opacity={0.55} toneMapped={false} />
      </mesh>
    </>
  );
}

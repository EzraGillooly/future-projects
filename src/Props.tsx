// Small self-contained street props (pure geometry) that make the scene feel
// lived-in: AC units, drainpipes, bushes, trash cans, a storefront awning.

type Vec3 = [number, number, number];

export function ACUnit({ position, rotation = [0, 0, 0] }: { position: Vec3; rotation?: Vec3 }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow>
        <boxGeometry args={[0.9, 0.7, 0.5]} />
        <meshStandardMaterial color="#b8bcc8" metalness={0.5} roughness={0.6} />
      </mesh>
      {/* vent face */}
      <mesh position={[0, 0, 0.26]}>
        <circleGeometry args={[0.26, 20]} />
        <meshStandardMaterial color="#2b2f3a" metalness={0.3} roughness={0.7} />
      </mesh>
    </group>
  );
}

export function Pipe({ position, height = 4 }: { position: Vec3; height?: number }) {
  return (
    <mesh position={position} castShadow>
      <cylinderGeometry args={[0.09, 0.09, height, 10]} />
      <meshStandardMaterial color="#2a2e3a" metalness={0.6} roughness={0.5} />
    </mesh>
  );
}

export function Bush({ position, scale = 1 }: { position: Vec3; scale?: number }) {
  const blobs: { p: Vec3; r: number }[] = [
    { p: [0, 0.25, 0], r: 0.42 },
    { p: [0.35, 0.18, 0.1], r: 0.32 },
    { p: [-0.32, 0.2, -0.08], r: 0.34 },
    { p: [0.05, 0.45, -0.05], r: 0.3 },
  ];
  return (
    <group position={position} scale={scale}>
      {blobs.map((b, i) => (
        <mesh key={i} position={b.p} castShadow>
          <icosahedronGeometry args={[b.r, 0]} />
          <meshStandardMaterial color={i % 2 ? "#1f3a24" : "#274a2c"} roughness={1} flatShading />
        </mesh>
      ))}
    </group>
  );
}

export function TrashCan({ position }: { position: Vec3 }) {
  return (
    <group position={position}>
      <mesh castShadow>
        <cylinderGeometry args={[0.3, 0.26, 0.9, 12]} />
        <meshStandardMaterial color="#20303a" metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.33, 0.33, 0.1, 12]} />
        <meshStandardMaterial color="#2a3f4a" metalness={0.4} roughness={0.6} />
      </mesh>
    </group>
  );
}

// A striped shop awning: a shallow slanted slab tilted out over the storefront.
export function Awning({ position, width }: { position: Vec3; width: number }) {
  const stripes = Math.max(3, Math.round(width / 0.7));
  const sw = width / stripes;
  return (
    <group position={position} rotation={[-0.5, 0, 0]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[width, 0.08, 1.3]} />
        <meshStandardMaterial color="#141824" roughness={0.8} />
      </mesh>
      {Array.from({ length: stripes }).map((_, i) => (
        <mesh key={i} position={[-width / 2 + sw * (i + 0.5), 0.05, 0]}>
          <boxGeometry args={[sw * 0.92, 0.03, 1.32]} />
          <meshStandardMaterial
            color={i % 2 ? "#c8322f" : "#efe9dc"}
            emissive={i % 2 ? "#5a1210" : "#3a352c"}
            emissiveIntensity={0.4}
            roughness={0.7}
          />
        </mesh>
      ))}
      {/* glowing under-lip so the awning catches the shop light */}
      <mesh position={[0, -0.02, 0.66]}>
        <boxGeometry args={[width, 0.05, 0.05]} />
        <meshStandardMaterial color="#ffdca0" emissive="#ffcf8f" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

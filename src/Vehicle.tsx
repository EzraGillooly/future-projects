import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Per-model yaw correction so every vehicle's nose points +X at rotation 0
// (the car models ship facing along Z). Callers then use semantic rotation
// (facing / travel direction) without worrying about native orientation.
const MODEL_YAW: Record<string, number> = {
  "/models/mazda-rx7.glb": Math.PI / 2,
  "/models/toyota-ae86.glb": Math.PI / 2,
  "/models/nissan-gtr.glb": Math.PI / 2,
  "/models/nissan-180sx.glb": Math.PI / 2,
  "/models/motorcycle.glb": 0,
};

// Loads a glTF/.glb vehicle from public/models and drops it into the scene,
// auto-normalised: whatever units the model ships in, it's recentred on the
// ground and scaled so its longest horizontal dimension equals `length` (world
// units), and yaw-corrected so its nose points +X. Every mesh casts/receives
// shadows so it sits in the night lighting.
export function GLBModel({
  url,
  position,
  rotation = [0, 0, 0],
  length,
  height,
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number; // desired world size of the longest horizontal axis
  height?: number; // OR desired world height (for tall/thin props like poles)
}) {
  const yaw = MODEL_YAW[url] ?? 0;
  const { scene } = useGLTF(url);
  const { obj, autoScale } = useMemo(() => {
    const c = scene.clone(true);
    c.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
      }
    });
    const box = new THREE.Box3().setFromObject(c);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    // recentre on x/z, drop bottom to y=0
    c.position.set(-center.x, -box.min.y, -center.z);
    const footprint = Math.max(size.x, size.z, 0.0001);
    const scale = height ? height / Math.max(size.y, 0.0001) : (length ?? 2) / footprint;
    return { obj: c, autoScale: scale };
  }, [scene, length, height]);

  return (
    <group
      position={position}
      rotation={[rotation[0], rotation[1] + yaw, rotation[2]]}
      scale={autoScale}
    >
      <primitive object={obj} />
    </group>
  );
}

// A car driving down the street on a loop, with glowing head/tail lights, for
// a bit of night-time life.
export function PassingCar({
  url,
  z = 6,
  speed = 9,
  from = -30,
  to = 30,
  length = 4.3,
}: {
  url: string;
  z?: number;
  speed?: number;
  from?: number;
  to?: number;
  length?: number;
}) {
  const ref = useRef<THREE.Group>(null);
  const dir = to > from ? 1 : -1;
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x += speed * dir * Math.min(dt, 0.05);
    if (dir > 0 ? g.position.x > to : g.position.x < to) g.position.x = from;
  });
  return (
    <group ref={ref} position={[from, 0, z]} rotation={[0, dir > 0 ? 0 : Math.PI, 0]}>
      <GLBModel url={url} position={[0, 0, 0]} length={length} />
      {/* headlight glow */}
      {[-0.5, 0.5].map((s) => (
        <mesh key={s} position={[length * 0.46, 0.5, s * 0.6]}>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#fff2cc" emissive="#ffe6a0" emissiveIntensity={3} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

useGLTF.preload("/models/motorcycle.glb");

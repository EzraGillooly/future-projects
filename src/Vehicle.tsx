import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

// Loads a glTF/.glb vehicle from public/models and drops it into the scene,
// auto-normalised: whatever units the model ships in, it's recentred on the
// ground and scaled so its longest horizontal dimension equals `length` (world
// units). Every mesh casts/receives shadows so it sits in the night lighting.
export function GLBModel({
  url,
  position,
  rotation = [0, 0, 0],
  length = 2,
}: {
  url: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  length?: number; // desired world size of the longest horizontal axis
}) {
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
    return { obj: c, autoScale: 1 / footprint };
  }, [scene]);

  return (
    <group position={position} rotation={rotation} scale={autoScale * length}>
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

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Cheap night rain: a cloud of falling points over the street that wraps around
// when it hits the ground. Kept low-count so it stays fast on mobile.
const COUNT = 700;
const AREA_X = 44;
const AREA_Z = 44;
const TOP = 16;
const SPEED = 22;

export function Rain() {
  const ref = useRef<THREE.Points>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * AREA_X;
      positions[i * 3 + 1] = Math.random() * TOP;
      positions[i * 3 + 2] = (Math.random() - 0.5) * AREA_Z + 2;
      speeds[i] = 0.6 + Math.random() * 0.8;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    const pts = ref.current;
    if (!pts) return;
    const arr = pts.geometry.attributes.position.array as Float32Array;
    const step = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      arr[i * 3 + 1] -= SPEED * speeds[i] * step;
      if (arr[i * 3 + 1] < 0) arr[i * 3 + 1] = TOP;
    }
    pts.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#9fb8ff"
        size={0.06}
        transparent
        opacity={0.5}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

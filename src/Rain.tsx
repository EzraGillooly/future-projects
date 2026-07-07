import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Cheap night rain: streaks (short vertical line segments) falling over the
// street, wrapping at the ground. Low count so it stays fast on mobile.
const COUNT = 650;
const AREA_X = 46;
const AREA_Z = 46;
const TOP = 17;
const SPEED = 26;
const STREAK = 0.55;

export function Rain() {
  const ref = useRef<THREE.LineSegments>(null);

  const { positions, speeds } = useMemo(() => {
    const positions = new Float32Array(COUNT * 2 * 3);
    const speeds = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * AREA_X;
      const y = Math.random() * TOP;
      const z = (Math.random() - 0.5) * AREA_Z + 2;
      // top vertex
      positions[i * 6] = x;
      positions[i * 6 + 1] = y + STREAK;
      positions[i * 6 + 2] = z;
      // bottom vertex
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z;
      speeds[i] = 0.7 + Math.random() * 0.7;
    }
    return { positions, speeds };
  }, []);

  useFrame((_, delta) => {
    const seg = ref.current;
    if (!seg) return;
    const arr = seg.geometry.attributes.position.array as Float32Array;
    const step = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const drop = SPEED * speeds[i] * step;
      arr[i * 6 + 1] -= drop;
      arr[i * 6 + 4] -= drop;
      if (arr[i * 6 + 4] < 0) {
        arr[i * 6 + 1] = TOP + STREAK;
        arr[i * 6 + 4] = TOP;
      }
    }
    seg.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <lineBasicMaterial color="#aec4ff" transparent opacity={0.32} depthWrite={false} />
    </lineSegments>
  );
}

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

// Night rain: short streaks falling over the street, wrapping at the ground.
// Streak LENGTH scales with per-drop speed (faster drops read as longer, faster
// streaks), each leans slightly with the wind, and brightness varies by depth
// so near rain reads heavier than far. Low count so it stays fast on mobile.
const COUNT = 700;
const AREA_X = 46;
const AREA_Z = 46;
const TOP = 17;
const SPEED = 26;
const WIND = 0.12; // horizontal lean as a fraction of streak length

export function Rain() {
  const ref = useRef<THREE.LineSegments>(null);

  const { positions, colors, speeds, lengths } = useMemo(() => {
    const positions = new Float32Array(COUNT * 2 * 3);
    const colors = new Float32Array(COUNT * 2 * 3);
    const speeds = new Float32Array(COUNT);
    const lengths = new Float32Array(COUNT);
    const tint = new THREE.Color("#aec4ff");
    for (let i = 0; i < COUNT; i++) {
      const x = (Math.random() - 0.5) * AREA_X;
      const y = Math.random() * TOP;
      const z = (Math.random() - 0.5) * AREA_Z + 2;
      // wider speed range so drops visibly fall at different rates
      const sp = 0.5 + Math.random() * 1.3;
      const len = 0.3 + sp * 0.5; // faster => longer streak (motion blur)
      speeds[i] = sp;
      lengths[i] = len;
      // top vertex (leaned along wind), bottom vertex
      positions[i * 6] = x + WIND * len;
      positions[i * 6 + 1] = y + len;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z;
      // depth-ish brightness: dimmer streaks recede
      const b = 0.35 + Math.random() * 0.65;
      for (const v of [0, 1]) {
        colors[i * 6 + v * 3] = tint.r * b;
        colors[i * 6 + v * 3 + 1] = tint.g * b;
        colors[i * 6 + v * 3 + 2] = tint.b * b;
      }
    }
    return { positions, colors, speeds, lengths };
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
        arr[i * 6 + 1] = TOP + lengths[i];
        arr[i * 6 + 4] = TOP;
      }
    }
    seg.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <lineSegments ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[colors, 3]} />
      </bufferGeometry>
      <lineBasicMaterial vertexColors transparent opacity={0.4} depthWrite={false} />
    </lineSegments>
  );
}

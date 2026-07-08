import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Puddle } from "./layout";

// Rain impact ripples on the wet ground: a pool of flat rings that expand and
// fade where drops land. Ripples are concentrated on the puddles (water pools
// there) and sparser across the open road. One instanced draw call.
const COUNT = 160;
const PUDDLE_SHARE = 0.72; // fraction of ripples that spawn on a puddle

// Road area drops can land on (between the two sidewalks).
const ROAD_X = 30;
const ROAD_Z0 = 3;
const ROAD_Z1 = 8.4;

// Soft concentric ripple: two faint rings on transparent, used additively.
function makeRippleTexture(): THREE.CanvasTexture {
  const s = 128;
  const cvs = document.createElement("canvas");
  cvs.width = cvs.height = s;
  const ctx = cvs.getContext("2d")!;
  const c = s / 2;
  const ring = (r: number, width: number, a: number) => {
    const g = ctx.createRadialGradient(c, c, Math.max(0, r - width), c, c, r + width);
    g.addColorStop(0, "rgba(255,255,255,0)");
    g.addColorStop(0.5, `rgba(255,255,255,${a})`);
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
  };
  ring(s * 0.42, s * 0.06, 0.9);
  ring(s * 0.28, s * 0.04, 0.4);
  const tex = new THREE.CanvasTexture(cvs);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

type Drop = { x: number; z: number; age: number; life: number; maxR: number };

export function Splashes({ puddles }: { puddles: Puddle[] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const tex = useMemo(makeRippleTexture, []);
  const tint = useMemo(() => new THREE.Color("#bcd2ff"), []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);

  // Pick a landing spot: mostly on a random puddle (weighted by area), else the
  // open road. Returns [x, z, maxRadius] — puddle ripples run a touch bigger.
  const spawn = useMemo(() => {
    return (): [number, number, number] => {
      if (puddles.length && Math.random() < PUDDLE_SHARE) {
        const p = puddles[(Math.random() * puddles.length) | 0];
        const a = Math.random() * Math.PI * 2;
        const rr = Math.sqrt(Math.random());
        const x = p.position[0] + Math.cos(a) * p.scale[0] * rr;
        const z = p.position[2] + Math.sin(a) * p.scale[1] * rr;
        return [x, z, 0.28 + Math.random() * 0.22];
      }
      const x = (Math.random() - 0.5) * 2 * ROAD_X;
      const z = ROAD_Z0 + Math.random() * (ROAD_Z1 - ROAD_Z0);
      return [x, z, 0.16 + Math.random() * 0.14];
    };
  }, [puddles]);

  const drops = useMemo<Drop[]>(() => {
    return Array.from({ length: COUNT }, () => {
      const [x, z, maxR] = spawn();
      return {
        x,
        z,
        maxR,
        life: 0.3 + Math.random() * 0.25,
        age: Math.random() * 0.55, // stagger so they don't pulse in sync
      };
    });
  }, [spawn]);

  useFrame((_, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const step = Math.min(delta, 0.05);
    for (let i = 0; i < COUNT; i++) {
      const d = drops[i];
      d.age += step;
      if (d.age >= d.life) {
        const [x, z, maxR] = spawn();
        d.x = x;
        d.z = z;
        d.maxR = maxR;
        d.life = 0.3 + Math.random() * 0.25;
        d.age = 0;
      }
      const t = d.age / d.life;
      const r = 0.05 + d.maxR * (1 - (1 - t) * (1 - t)); // ease-out expand
      dummy.position.set(d.x, 0.02, d.z);
      dummy.rotation.x = -Math.PI / 2;
      dummy.scale.set(r * 2, r * 2, 1);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      color.copy(tint).multiplyScalar((1 - t) * 0.8); // additive: darker = fainter
      mesh.setColorAt(i, color);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={tex}
        transparent
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </instancedMesh>
  );
}

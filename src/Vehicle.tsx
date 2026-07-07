import { useMemo } from "react";
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

useGLTF.preload("/models/motorcycle.glb");

import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { GLBModel } from "./Vehicle";
import { ProjectPopup } from "./ProjectPopup";
import { makePuddleAlpha } from "./textures";
import type { CarSlot } from "./layout";

const CAR_LENGTH = 4.3;

// A clickable project car (real .glb model) parked inside the garage. A neon
// underglow plane gives hover/active feedback since the model has fixed
// materials. Interaction is only live once the camera is at the entrance.
export function Car({
  slot,
  active,
  interactive,
  onSelect,
}: {
  slot: CarSlot;
  active: boolean;
  interactive: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);
  const lift = useRef<THREE.Group>(null);
  const glowAlpha = useMemo(() => makePuddleAlpha(), []);

  useEffect(() => {
    if (!interactive || !hovered) return;
    document.body.style.cursor = "pointer";
    return () => void (document.body.style.cursor = "auto");
  }, [interactive, hovered]);

  // Subtle rise when hovered (and not yet focused) to signal it's clickable.
  useFrame(() => {
    if (!lift.current) return;
    const target = hovered && interactive && !active ? 0.14 : 0;
    lift.current.position.y += (target - lift.current.position.y) * 0.15;
  });

  const accent = active ? "#ff4fd8" : hovered && interactive ? "#67e8f9" : "#3b4570";
  const glow = active ? 2.6 : hovered && interactive ? 1.5 : 0.12;

  return (
    <group position={slot.position} rotation={[0, slot.facing, 0]}>
      <group
        ref={lift}
        onClick={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          if (!interactive) return;
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
      >
        <GLBModel url={slot.model} position={[0, 0, 0]} rotation={[0, slot.modelYaw, 0]} length={CAR_LENGTH} />
        {/* Soft neon underglow for hover/active feedback */}
        <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[CAR_LENGTH * 0.46, CAR_LENGTH * 0.3, 1]}>
          <circleGeometry args={[1, 24]} />
          <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={glow} transparent opacity={0.6} alphaMap={glowAlpha} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>

      {active && (
        <Html position={[0, 1.9, 0]} center distanceFactor={6} zIndexRange={[100, 0]}>
          <ProjectPopup project={slot.project} />
        </Html>
      )}
    </group>
  );
}

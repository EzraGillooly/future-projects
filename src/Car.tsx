import { useEffect, useMemo, useState } from "react";
import { Html } from "@react-three/drei";
import { GLBModel } from "./Vehicle";
import { ProjectPopup } from "./ProjectPopup";
import { makePuddleAlpha } from "./textures";
import type { CarSlot } from "./layout";

const CAR_LENGTH = 4.3;

// A clickable project car (real .glb model) parked inside the garage. A neon
// underglow plane under the car gives hover/active feedback (the model itself
// has fixed materials); clicking pans the camera in. Live only at the entrance.
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
  const glowAlpha = useMemo(() => makePuddleAlpha(), []);

  useEffect(() => {
    if (!interactive || !hovered) return;
    document.body.style.cursor = "pointer";
    return () => void (document.body.style.cursor = "auto");
  }, [interactive, hovered]);

  const hot = interactive && hovered;
  const accent = active ? "#ff4fd8" : hot ? "#67e8f9" : "#3b4570";
  const glow = active ? 2.6 : hot ? 1.5 : 0.12;

  return (
    <group position={slot.position} rotation={[0, slot.facing, 0]}>
      <group
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

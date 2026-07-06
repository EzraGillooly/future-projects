import { useEffect, useState } from "react";
import { Html } from "@react-three/drei";
import { CarModel } from "./CarModel";
import { ProjectPopup } from "./ProjectPopup";
import type { CarSlot } from "./layout";

// A clickable project car parked inside the garage. Interaction is only live
// once the camera is at the entrance (`interactive`).
export function Car({
  slot,
  active,
  dimmed,
  interactive,
  onSelect,
}: {
  slot: CarSlot;
  active: boolean;
  dimmed: boolean;
  interactive: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!interactive || !hovered) return;
    document.body.style.cursor = "pointer";
    return () => void (document.body.style.cursor = "auto");
  }, [interactive, hovered]);

  const accent = active ? "#ff4fd8" : hovered && interactive ? "#67e8f9" : "#3b4570";
  const glow = active ? 2.4 : hovered && interactive ? 1.4 : 0.15;
  const opacity = dimmed ? 0.2 : 1;

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
        <CarModel accent={accent} glow={glow} opacity={opacity} />
      </group>

      {active && (
        <Html position={[0.9, 1.5, 0]} center distanceFactor={6} zIndexRange={[100, 0]}>
          <ProjectPopup project={slot.project} />
        </Html>
      )}
    </group>
  );
}

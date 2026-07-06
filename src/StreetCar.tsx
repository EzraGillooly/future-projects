import { CarModel } from "./CarModel";

// Non-interactive car parked on the street — pure set dressing. Fixed neon body
// colour, faint idle underglow.
export function StreetCar({
  position,
  facing = 0,
  color,
}: {
  position: [number, number, number];
  facing?: number;
  color: string;
}) {
  return (
    <group position={position} rotation={[0, facing, 0]}>
      <CarModel bodyColor={color} accent={color} glow={0.4} headlights={false} />
    </group>
  );
}

import * as THREE from "three";
import { PROJECTS, type Project } from "../data/projects";

// --- Camera poses -----------------------------------------------------------
// The whole journey runs on two saved poses. STREET: across the road at an
// angle, taking in the shop. ENTRANCE: at the open garage door, looking in.
export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const STREET: CameraPose = {
  position: new THREE.Vector3(-6, 2.3, 11),
  target: new THREE.Vector3(0, 1.7, -1),
};

export const ENTRANCE: CameraPose = {
  position: new THREE.Vector3(0, 1.75, 3),
  target: new THREE.Vector3(0, 1.05, -6),
};

// --- Interior project cars --------------------------------------------------
// Cars park along the two side walls, rear to the wall, engine bay (nose)
// pointing into the central aisle. CarModel's nose is +X: left-wall cars keep
// facing 0 (nose toward centre), right-wall cars yaw 180°.
export interface CarSlot {
  project: Project;
  position: THREE.Vector3;
  facing: number;
  cameraPose: CameraPose; // angled 3/4 view into the open hood
}

// side: -1 left wall, +1 right wall. z runs deeper into the shop.
const CAR_SPOTS: { side: -1 | 1; z: number }[] = [
  { side: -1, z: -2.6 },
  { side: 1, z: -2.6 },
  { side: -1, z: -6.0 },
  { side: 1, z: -6.0 },
];

const WALL_PARK = 3.5; // |x| of a parked car's centre

export function buildCarSlots(): CarSlot[] {
  return PROJECTS.map((project, i) => {
    const { side, z } = CAR_SPOTS[i % CAR_SPOTS.length];
    const x = side * WALL_PARK;
    const facing = side === -1 ? 0 : Math.PI; // nose toward the aisle
    const dir = -side; // +1 for left car (nose +X), -1 for right car (nose -X)
    // Camera glides to a spot out in the aisle, in front of the nose and raised,
    // angled toward the door so it looks down into the open hood.
    const cameraPose: CameraPose = {
      position: new THREE.Vector3(x + dir * 4.4, 2.15, z + 2.3),
      target: new THREE.Vector3(x + dir * 0.6, 0.9, z),
    };
    return { project, position: new THREE.Vector3(x, 0, z), facing, cameraPose };
  });
}

// --- Street set-dressing cars (non-interactive) -----------------------------
export interface Decor {
  position: [number, number, number];
  facing: number;
  color: string;
}

// Parked along the garage wall, parallel to the street (nose along +X), on the
// apron just in front of the building, flanking the door.
export const STREET_CARS: Decor[] = [
  { position: [-4, 0, 1.7], facing: 0, color: "#e6b800" }, // yellow
  { position: [3.6, 0, 1.7], facing: 0, color: "#d81f3a" }, // red
];

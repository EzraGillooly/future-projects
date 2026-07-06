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
  position: new THREE.Vector3(6, 2.3, 11),
  target: new THREE.Vector3(0, 1.7, -1),
};

export const ENTRANCE: CameraPose = {
  position: new THREE.Vector3(0, 1.75, 3),
  target: new THREE.Vector3(0, 1.05, -6),
};

// --- Interior project cars --------------------------------------------------
// Cars park inside the garage facing the door (+Z). CarModel's nose is +X, so a
// -90° yaw points it at the entrance.
const FACE_DOOR = -Math.PI / 2;

export interface CarSlot {
  project: Project;
  position: THREE.Vector3;
  facing: number;
}

// Two staggered rows so all cars stay visible from the entrance.
const CAR_SPOTS: [number, number][] = [
  [-2.4, -3.2],
  [2.4, -3.2],
  [-2.4, -6.2],
  [2.4, -6.2],
];

export function buildCarSlots(): CarSlot[] {
  return PROJECTS.map((project, i) => {
    const [x, z] = CAR_SPOTS[i % CAR_SPOTS.length];
    return { project, position: new THREE.Vector3(x, 0, z), facing: FACE_DOOR };
  });
}

// --- Street set-dressing cars (non-interactive) -----------------------------
export interface Decor {
  position: [number, number, number];
  facing: number;
  color: string;
}

export const STREET_CARS: Decor[] = [
  { position: [-6.5, 0, 6], facing: 0, color: "#e6b800" }, // yellow, nose +X
  { position: [6.5, 0, 6], facing: Math.PI, color: "#d81f3a" }, // red, nose -X
];

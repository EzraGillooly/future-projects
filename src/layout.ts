import * as THREE from "three";
import { PROJECTS, type Project } from "../data/projects";

// World-x offset of the whole garage (exterior + interior + cars + poses). The
// garage is authored around x=0; shift it here to move it left/right.
export const GARAGE_X = -1.5;

// --- Camera poses -----------------------------------------------------------
// The whole journey runs on two saved poses. STREET: across the road at an
// angle, taking in the shop. ENTRANCE: at the open garage door, looking in.
export interface CameraPose {
  position: THREE.Vector3;
  target: THREE.Vector3;
}

export const STREET: CameraPose = {
  position: new THREE.Vector3(-12, 3.1, 15),
  target: new THREE.Vector3(-4, 2.1, -2),
};

export const ENTRANCE: CameraPose = {
  position: new THREE.Vector3(GARAGE_X, 1.9, 3.2),
  target: new THREE.Vector3(GARAGE_X, 1.2, -12),
};

// --- Interior project cars --------------------------------------------------
// Cars park along the two side walls, rear to the wall, engine bay (nose)
// pointing into the central aisle. CarModel's nose is +X: left-wall cars keep
// facing 0 (nose toward centre), right-wall cars yaw 180°.
export interface CarSlot {
  project: Project;
  position: THREE.Vector3;
  facing: number;
  cameraPose: CameraPose; // angled 3/4 view of the car front
  model: string; // .glb url
  modelYaw: number; // native-forward correction so the nose points +X
}

// Which real car represents each project (by project id).
const PROJECT_CARS: Record<string, string> = {
  "dream-garage": "/models/mazda-rx7.glb",
  "now-building-widget": "/models/toyota-ae86.glb",
  "jdm-car-spotter": "/models/nissan-gtr.glb",
  "screenshot-filer": "/models/nissan-180sx.glb",
};

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
    const x = GARAGE_X + side * WALL_PARK;
    const facing = side === -1 ? 0 : Math.PI; // nose toward the aisle
    const dir = -side; // +1 for left car (nose +X), -1 for right car (nose -X)
    // Camera glides to a spot out in the aisle, in front of the nose and raised,
    // angled toward the door so it looks down into the open hood.
    const cameraPose: CameraPose = {
      position: new THREE.Vector3(x + dir * 4.4, 2.15, z + 2.3),
      target: new THREE.Vector3(x + dir * 0.6, 0.9, z),
    };
    return {
      project,
      position: new THREE.Vector3(x, 0, z),
      facing,
      cameraPose,
      model: PROJECT_CARS[project.id] ?? "/models/nissan-180sx.glb",
      modelYaw: 0,
    };
  });
}

// --- Street set-dressing cars (non-interactive) -----------------------------
export interface Decor {
  position: [number, number, number];
  facing: number;
  color: string;
}

// Street set-dressing vehicles (empty for now — focusing on scene structure).
export const STREET_CARS: Decor[] = [];

// --- Rain puddles -----------------------------------------------------------
// Reflective puddles where rain visibly pools in low spots on the road. Shared
// so the puddle meshes and the splash system (heavier ripples here) agree on
// where the water is. `scale` is the ellipse radius in X / Z.
export interface Puddle {
  position: [number, number, number];
  scale: [number, number];
  rotation: number;
  seed: number;
}

export const STREET_PUDDLES: Puddle[] = [
  { position: [-8, -0.01, 3.7], scale: [2.9, 1.7], rotation: 0.2, seed: 5 },
  { position: [6.5, -0.01, 8.0], scale: [3.3, 2.0], rotation: -0.35, seed: 2 },
  { position: [-1, -0.01, 6.3], scale: [2.3, 1.4], rotation: 0.5, seed: 8 },
];

// --- Interior camera spots (non-car) ----------------------------------------
// Extra clickable areas that glide the camera to a saved pose (no popup — just a
// viewpoint). Each carries an invisible hotspot volume (world coords) to click.
// Live only at the entrance; Esc / back returns. Poses are in world coords.
export interface Spot {
  id: string;
  pose: CameraPose;
  hotspot: { position: [number, number, number]; size: [number, number, number] };
}

export const SPOTS: Spot[] = [
  {
    id: "loft",
    pose: {
      position: new THREE.Vector3(1.5, 4.0, -8.5),
      target: new THREE.Vector3(0.5, 2.7, -15.5),
    },
    hotspot: { position: [-0.5, 3.1, -12], size: [7, 1.4, 4] },
  },
  {
    id: "lounge",
    pose: {
      position: new THREE.Vector3(-3.2, 1.6, -10.5),
      target: new THREE.Vector3(-6.5, 1.1, -14.5),
    },
    hotspot: { position: [-5.5, 1.0, -14.5], size: [2.6, 2.0, 3.2] },
  },
  {
    id: "armchairs",
    pose: {
      position: new THREE.Vector3(2.8, 1.7, -9.5),
      target: new THREE.Vector3(2.8, 0.8, -15),
    },
    hotspot: { position: [2.8, 1.0, -15], size: [3.6, 2.0, 2.6] },
  },
  {
    id: "work",
    pose: {
      position: new THREE.Vector3(-3.5, 1.7, -6.5),
      target: new THREE.Vector3(-6.6, 1.0, -10),
    },
    hotspot: { position: [-6.5, 1.1, -9.8], size: [1.8, 2.2, 4.5] },
  },
];

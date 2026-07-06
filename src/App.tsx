import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { PROJECTS, type Project } from "../data/projects";

// --- Layout -----------------------------------------------------------------
// Cars sit along two walls of a garage that runs back along -Z. The street
// (establishing shot) looks in from +Z. Half the projects on each wall.
const WALL_X = 4;
const CAR_GAP = 4.2;
const STANDOFF = 6.5; // camera distance from a car's wall when focused
const ANGLE_Z = 2.5; // pull the focus pose toward the street for a 3/4 view

interface Slot {
  project: Project;
  position: THREE.Vector3; // car centre
  side: -1 | 1; // -1 = left wall, +1 = right wall
  cameraPose: { position: THREE.Vector3; target: THREE.Vector3 };
}

// Establishing shot: standing out on the street, looking into the garage.
const ESTABLISHING = {
  position: new THREE.Vector3(0, 3, 13),
  target: new THREE.Vector3(0, 1.2, -4),
};

function buildSlots(): Slot[] {
  return PROJECTS.map((project, i) => {
    const side: -1 | 1 = i % 2 === 0 ? -1 : 1;
    const row = Math.floor(i / 2); // 0, 1, ... down the wall
    const z = -2 - row * CAR_GAP;
    const position = new THREE.Vector3(side * WALL_X, 0.6, z);
    // Camera glides to a 3/4 spot in the aisle in front of the car, looking at it.
    const cameraPose = {
      position: new THREE.Vector3(side * (WALL_X - STANDOFF), 1.6, z + ANGLE_Z),
      target: new THREE.Vector3(side * WALL_X, 0.9, z),
    };
    return { project, position, side, cameraPose };
  });
}

// --- Camera rig -------------------------------------------------------------
// Lerps the camera position + look target toward the active pose each frame.
// This is the "camera on rails" core: one establishing shot + one pose per car.
function CameraRig({ pose }: { pose: Slot["cameraPose"] }) {
  const { camera } = useThree();
  const lookAt = useRef(ESTABLISHING.target.clone());

  useFrame(() => {
    camera.position.lerp(pose.position, 0.06);
    lookAt.current.lerp(pose.target, 0.06);
    camera.lookAt(lookAt.current);
  });

  return null;
}

// --- Car (greybox) ----------------------------------------------------------
function Car({
  slot,
  active,
  dimmed,
  onSelect,
}: {
  slot: Slot;
  active: boolean;
  dimmed: boolean;
  onSelect: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? "pointer" : "auto";
    return () => void (document.body.style.cursor = "auto");
  }, [hovered]);

  const color = active ? "#ff4fd8" : hovered ? "#67e8f9" : "#8891c4";

  return (
    <group position={slot.position}>
      {/* Car body */}
      <mesh
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[1.6, 1.0, 3.4]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={active ? 0.5 : hovered ? 0.25 : 0.08}
          transparent
          opacity={dimmed ? 0.25 : 1}
        />
      </mesh>
      {/* Engine block hint at the front (aisle-facing end) */}
      <mesh position={[slot.side * -0.4, 0.65, 0]}>
        <boxGeometry args={[0.8, 0.4, 1.0]} />
        <meshStandardMaterial color="#2b2f4a" opacity={dimmed ? 0.25 : 1} transparent />
      </mesh>

      {active && (
        <Html position={[0, 1.9, 0]} center distanceFactor={9} zIndexRange={[100, 0]}>
          <ProjectPopup project={slot.project} />
        </Html>
      )}
    </group>
  );
}

// --- Popup ------------------------------------------------------------------
function ProjectPopup({ project }: { project: Project }) {
  return (
    <div
      style={{
        width: 240,
        padding: "14px 16px",
        borderRadius: 14,
        background: "rgba(10, 12, 24, 0.86)",
        border: "1px solid rgba(255, 79, 216, 0.4)",
        boxShadow: "0 10px 40px rgba(255, 79, 216, 0.25)",
        color: "#e7ebff",
        fontFamily: "system-ui, sans-serif",
        backdropFilter: "blur(8px)",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "#67e8f9",
        }}
      >
        {project.type} · {project.status}
      </div>
      <div style={{ fontSize: 20, fontWeight: 600, margin: "4px 0 8px" }}>
        {project.title}
      </div>
      <div style={{ fontSize: 13, lineHeight: 1.5, color: "#b9c1e6" }}>
        {project.blurb}
      </div>
      {project.tags.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: "#8891c4" }}>
          {project.tags.map((t) => `#${t}`).join("  ")}
        </div>
      )}
    </div>
  );
}

// --- Scene ------------------------------------------------------------------
function Scene() {
  const slots = useMemo(buildSlots, []);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = slots.find((s) => s.project.id === activeId) ?? null;
  const pose = active ? active.cameraPose : ESTABLISHING;

  // Escape returns to the establishing shot.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setActiveId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <CameraRig pose={pose} />

      {/* Lights: cold ambient + a warm loft pool + a cool street rim. */}
      <ambientLight intensity={0.25} color="#4a5580" />
      <pointLight position={[0, 5, -6]} intensity={40} color="#ffb26b" distance={22} />
      <pointLight position={[0, 4, 12]} intensity={30} color="#6bd5ff" distance={30} />

      {/* Floor: click empty floor to deselect. */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, -2]}
        onClick={() => setActiveId(null)}
        receiveShadow
      >
        <planeGeometry args={[20, 34]} />
        <meshStandardMaterial color="#0b0e1c" />
      </mesh>

      {/* Loft box at the back of the garage. */}
      <mesh position={[0, 3.4, -11]}>
        <boxGeometry args={[12, 2.4, 2]} />
        <meshStandardMaterial color="#141830" />
      </mesh>

      {slots.map((slot) => (
        <Car
          key={slot.project.id}
          slot={slot}
          active={active?.project.id === slot.project.id}
          dimmed={active !== null && active.project.id !== slot.project.id}
          onSelect={() => setActiveId(slot.project.id)}
        />
      ))}
    </>
  );
}

export function App() {
  return (
    <Canvas
      shadows
      camera={{ position: ESTABLISHING.position.toArray(), fov: 45 }}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#05060d"]} />
      <fog attach="fog" args={["#05060d", 14, 34]} />
      <Scene />
    </Canvas>
  );
}

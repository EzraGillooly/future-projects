import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { STREET, ENTRANCE, buildCarSlots, STREET_CARS, type CameraPose } from "./layout";
import { Car } from "./Car";
import { StreetCar } from "./StreetCar";
import { Scene3D } from "./Building";

// Camera on rails: lerp position + look target toward the active pose each frame.
function CameraRig({ pose }: { pose: CameraPose }) {
  const { camera } = useThree();
  const lookAt = useRef(STREET.target.clone());

  useFrame(() => {
    camera.position.lerp(pose.position, 0.05);
    lookAt.current.lerp(pose.target, 0.05);
    camera.lookAt(lookAt.current);
  });

  return null;
}

function Scene() {
  const cars = useMemo(buildCarSlots, []);
  const [view, setView] = useState<"street" | "entrance">("street");
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCar = cars.find((c) => c.project.id === activeId) ?? null;
  const pose = activeCar ? activeCar.cameraPose : view === "street" ? STREET : ENTRANCE;
  const atEntrance = view === "entrance";

  // Escape steps back out: focused car → deselect, then entrance → street.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (activeId) setActiveId(null);
      else if (view === "entrance") setView("street");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, view]);

  const backOut = () => {
    if (activeId) setActiveId(null);
    else if (view === "entrance") setView("street");
  };

  return (
    <>
      <CameraRig pose={pose} />

      {/* Night ambient + warm spill from inside the shop + cool street fill */}
      <ambientLight intensity={0.14} color="#2a3358" />
      <pointLight position={[0, 2.4, -3]} intensity={40} color="#ffb26b" distance={15} castShadow />
      <pointLight position={[0, 3.2, -6.5]} intensity={22} color="#ffa24d" distance={14} />
      <pointLight position={[0, 4, 14]} intensity={14} color="#6bd5ff" distance={40} />
      <pointLight position={[-6, 4.6, 7]} intensity={26} color="#fff0cf" distance={18} />
      <pointLight position={[6, 4.6, 7]} intensity={26} color="#fff0cf" distance={18} />

      {/* Wet asphalt: one big reflective plane under the whole scene */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={backOut}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          resolution={1024}
          mirror={0.5}
          mixStrength={1.1}
          blur={[300, 100]}
          roughness={0.9}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#06070f"
          metalness={0.6}
        />
      </mesh>

      <Scene3D onEnter={() => setView("entrance")} doorLive={view === "street"} />

      {STREET_CARS.map((d, i) => (
        <StreetCar key={i} position={d.position} facing={d.facing} color={d.color} />
      ))}

      {cars.map((slot) => (
        <Car
          key={slot.project.id}
          slot={slot}
          interactive={atEntrance}
          active={activeId === slot.project.id}
          dimmed={activeId !== null && activeId !== slot.project.id}
          onSelect={() => setActiveId(slot.project.id)}
        />
      ))}

      <EffectComposer>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.6} luminanceSmoothing={0.3} />
        <Vignette eskil={false} offset={0.28} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

export function App() {
  return (
    <Canvas
      shadows
      camera={{ position: STREET.position.toArray(), fov: 45 }}
      style={{ position: "fixed", inset: 0 }}
    >
      <color attach="background" args={["#04050b"]} />
      <fog attach="fog" args={["#04050b", 20, 48]} />
      <Scene />
    </Canvas>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import { STREET, ENTRANCE, buildCarSlots, STREET_CARS, type CameraPose, type CarSlot } from "./layout";
import { Car } from "./Car";
import { StreetCar } from "./StreetCar";
import { Scene3D } from "./Building";
import { Rain } from "./Rain";

type View = "street" | "entrance";

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

function Scene({
  cars,
  view,
  activeCar,
  onEnter,
  onSelect,
  onBack,
}: {
  cars: CarSlot[];
  view: View;
  activeCar: CarSlot | null;
  onEnter: () => void;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const atEntrance = view === "entrance";
  const pose = activeCar ? activeCar.cameraPose : view === "street" ? STREET : ENTRANCE;

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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={onBack}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          resolution={1024}
          mirror={0.6}
          mixStrength={1.3}
          blur={[300, 90]}
          roughness={0.85}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          color="#06070f"
          metalness={0.65}
        />
      </mesh>

      <Scene3D onEnter={onEnter} doorLive={view === "street"} />

      {STREET_CARS.map((d, i) => (
        <StreetCar key={i} position={d.position} facing={d.facing} color={d.color} />
      ))}

      {cars.map((slot) => (
        <Car
          key={slot.project.id}
          slot={slot}
          interactive={atEntrance}
          active={activeCar?.project.id === slot.project.id}
          dimmed={activeCar !== null && activeCar.project.id !== slot.project.id}
          onSelect={() => onSelect(slot.project.id)}
        />
      ))}

      <Rain />

      <EffectComposer>
        <Bloom mipmapBlur intensity={0.85} luminanceThreshold={0.6} luminanceSmoothing={0.3} />
        <Vignette eskil={false} offset={0.28} darkness={0.8} />
      </EffectComposer>
    </>
  );
}

// On-screen back affordance (Escape isn't discoverable).
function BackHint({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        left: "50%",
        bottom: 28,
        transform: "translateX(-50%)",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "9px 16px",
        borderRadius: 999,
        border: "1px solid rgba(143, 214, 255, 0.35)",
        background: "rgba(10, 12, 24, 0.6)",
        backdropFilter: "blur(8px)",
        color: "#dfe8ff",
        font: "500 13px system-ui, sans-serif",
        letterSpacing: "0.02em",
        cursor: "pointer",
        opacity: 0.85,
        animation: "hintIn 0.3s ease-out both",
      }}
    >
      <span aria-hidden>←</span> {label}
      <kbd
        style={{
          marginLeft: 4,
          padding: "1px 6px",
          borderRadius: 5,
          border: "1px solid rgba(255,255,255,0.18)",
          fontSize: 11,
          opacity: 0.7,
        }}
      >
        Esc
      </kbd>
    </button>
  );
}

export function App() {
  const cars = useMemo(buildCarSlots, []);
  const [view, setView] = useState<View>("street");
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeCar = cars.find((c) => c.project.id === activeId) ?? null;

  const backOut = () => {
    if (activeId) setActiveId(null);
    else if (view === "entrance") setView("street");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") backOut();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const canGoBack = activeId !== null || view === "entrance";

  return (
    <>
      <Canvas
        shadows
        camera={{ position: STREET.position.toArray(), fov: 45 }}
        style={{ position: "fixed", inset: 0 }}
      >
        <color attach="background" args={["#04050b"]} />
        <fog attach="fog" args={["#04050b", 20, 48]} />
        <Scene
          cars={cars}
          view={view}
          activeCar={activeCar}
          onEnter={() => setView("entrance")}
          onSelect={setActiveId}
          onBack={backOut}
        />
      </Canvas>
      {canGoBack && (
        <BackHint label={activeId ? "Back to garage" : "Back to street"} onClick={backOut} />
      )}
    </>
  );
}

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { MeshReflectorMaterial, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import { STREET, ENTRANCE, buildCarSlots, STREET_CARS, type CameraPose, type CarSlot } from "./layout";
import { makeRoadTexture } from "./textures";
import { Car } from "./Car";
import { GLBModel, PassingCar } from "./Vehicle";
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
  freeCam,
  onEnter,
  onSelect,
  onBack,
}: {
  cars: CarSlot[];
  view: View;
  activeCar: CarSlot | null;
  freeCam: boolean;
  onEnter: () => void;
  onSelect: (id: string) => void;
  onBack: () => void;
}) {
  const atEntrance = view === "entrance";
  const pose = activeCar ? activeCar.cameraPose : view === "street" ? STREET : ENTRANCE;
  const road = useMemo(() => {
    const t = makeRoadTexture();
    t.repeat.set(8, 8);
    return t;
  }, []);

  return (
    <>
      {freeCam ? <OrbitControls makeDefault /> : <CameraRig pose={pose} />}

      {/* Self-contained night environment: reflects in the cars' metal without
          any external HDRI. Dim blue sky + warm door glow + neon strips. */}
      <Environment resolution={256} frames={1}>
        <color attach="background" args={["#04050b"]} />
        <Lightformer intensity={0.6} color="#3a4a80" position={[0, 8, -2]} scale={[20, 12, 1]} />
        <Lightformer intensity={3} color="#ffb26b" position={[0, 2, -4]} scale={[5, 4, 1]} />
        <Lightformer intensity={1.6} color="#ff4fd8" position={[-8, 3, 2]} scale={[1, 6, 1]} />
        <Lightformer intensity={1.6} color="#4fd8ff" position={[8, 3, 2]} scale={[1, 6, 1]} />
        <Lightformer intensity={1.2} color="#fff0cf" position={[0, 6, 8]} scale={[8, 1, 1]} />
      </Environment>

      {/* Night ambient + warm spill from inside the shop + cool street fill */}
      <ambientLight intensity={0.14} color="#2a3358" />
      <pointLight position={[0, 2.4, -3]} intensity={40} color="#ffb26b" distance={15} castShadow />
      <pointLight position={[0, 3.2, -6.5]} intensity={22} color="#ffa24d" distance={14} />
      <pointLight position={[0, 4, 14]} intensity={14} color="#6bd5ff" distance={40} />
      <pointLight position={[-6, 4.6, 7]} intensity={26} color="#fff0cf" distance={18} />
      <pointLight position={[6, 4.6, 7]} intensity={26} color="#fff0cf" distance={18} />

      {/* Battered wet asphalt: one big reflective plane under the whole scene */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} onClick={onBack}>
        <planeGeometry args={[60, 60]} />
        <MeshReflectorMaterial
          resolution={1024}
          mirror={0.12}
          mixStrength={0.4}
          blur={[400, 120]}
          roughness={0.96}
          depthScale={1}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.2}
          map={road}
          color="#eef1f5"
          metalness={0.2}
        />
      </mesh>

      <Scene3D onEnter={onEnter} doorLive={view === "street"} />

      {STREET_CARS.map((d, i) => (
        <GLBModel
          key={i}
          url="/models/motorcycle.glb"
          position={d.position}
          rotation={[0, d.facing, 0]}
          length={2.1}
        />
      ))}

      {/* Traffic passing on the street. Japan drives on the LEFT, so a car
          heading right (+X) keeps the far lane (garage side), and one heading
          left (-X) keeps the near lane (camera side). */}
      <PassingCar url="/models/nissan-gtr.glb" z={4.3} speed={10} from={-32} to={32} />
      <PassingCar url="/models/nissan-180sx.glb" z={7} speed={7} from={34} to={-34} />

      {cars.map((slot) => (
        <Car
          key={slot.project.id}
          slot={slot}
          interactive={atEntrance}
          active={activeCar?.project.id === slot.project.id}
          onSelect={() => onSelect(slot.project.id)}
        />
      ))}

      <Rain />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={1.1} luminanceThreshold={0.55} luminanceSmoothing={0.35} radius={0.7} />
        <Vignette eskil={false} offset={0.3} darkness={0.85} />
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
  const [freeCam, setFreeCam] = useState(false);
  const activeCar = cars.find((c) => c.project.id === activeId) ?? null;

  const backOut = () => {
    if (activeId) setActiveId(null);
    else if (view === "entrance") setView("street");
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") backOut();
      // Free-camera inspect mode: drag to orbit, scroll to zoom, right-drag to pan
      if (e.key === "c" || e.key === "C") setFreeCam((f) => !f);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const canGoBack = activeId !== null || view === "entrance";

  return (
    <>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        gl={{ antialias: false, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.15 }}
        camera={{ position: STREET.position.toArray(), fov: 45 }}
        style={{ position: "fixed", inset: 0 }}
      >
        <color attach="background" args={["#04050b"]} />
        <fog attach="fog" args={["#04050b", 20, 48]} />
        <Scene
          cars={cars}
          view={view}
          activeCar={activeCar}
          freeCam={freeCam}
          onEnter={() => setView("entrance")}
          onSelect={setActiveId}
          onBack={backOut}
        />
      </Canvas>
      {freeCam && (
        <div
          style={{
            position: "fixed",
            top: 16,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "7px 14px",
            borderRadius: 999,
            background: "rgba(10,12,24,0.6)",
            backdropFilter: "blur(8px)",
            border: "1px solid rgba(143,214,255,0.35)",
            color: "#dfe8ff",
            font: "500 12px system-ui, sans-serif",
            letterSpacing: "0.02em",
          }}
        >
          Free camera — drag to orbit, scroll to zoom · press C to exit
        </div>
      )}
      {canGoBack && (
        <BackHint label={activeId ? "Back to garage" : "Back to street"} onClick={backOut} />
      )}
    </>
  );
}

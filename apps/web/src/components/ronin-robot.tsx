"use client";

// Процедурная модель ронина (без готового .glb).
// Как только соберёте свою сцену на spline.design —
// эту секцию можно просто заменить на <primitive object={gltf.scene} />

import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

function RoninMesh() {
  const headGroup = useRef<THREE.Group>(null!); // "голова" — шляпа-каса
  const bodyGroup = useRef<THREE.Group>(null!); // весь корпус слегка доворачивается
  const target = useRef(new THREE.Vector2(0, 0));

  // ловим позицию курсора в NDC (-1..1)
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.current.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", handleMove);
    return () => window.removeEventListener("pointermove", handleMove);
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();

    // ограничиваем амплитуду поворота головы
    const maxYaw = 0.5; // ~28°
    const maxPitch = 0.25;

    const targetYaw = THREE.MathUtils.clamp(target.current.x * maxYaw, -maxYaw, maxYaw);
    const targetPitch = THREE.MathUtils.clamp(target.current.y * maxPitch, -maxPitch, maxPitch);

    if (headGroup.current) {
      headGroup.current.rotation.y = THREE.MathUtils.lerp(
        headGroup.current.rotation.y,
        targetYaw,
        0.08
      );
      headGroup.current.rotation.x = THREE.MathUtils.lerp(
        headGroup.current.rotation.x,
        -targetPitch,
        0.08
      );
    }

    if (bodyGroup.current) {
      // тело доворачивается слабее головы + лёгкое "дыхание"
      bodyGroup.current.rotation.y = THREE.MathUtils.lerp(
        bodyGroup.current.rotation.y,
        targetYaw * 0.3,
        0.05
      );
      bodyGroup.current.position.y = -1 + Math.sin(t * 1.2) * 0.03;
    }
  });

  return (
    <group ref={bodyGroup}>
      {/* корпус — приземистый, как в позе "на корточках" */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.55, 0.75, 0.9, 8]} />
        <meshStandardMaterial color="#e8e2d5" roughness={0.9} />
      </mesh>

      {/* красный пояс/ткань */}
      <mesh position={[0, -0.15, 0.35]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[0.5, 0.5, 0.05]} />
        <meshStandardMaterial color="#c23b3b" roughness={0.8} />
      </mesh>

      {/* ноги-сандалии */}
      <mesh position={[-0.4, -0.55, 0.1]}>
        <boxGeometry args={[0.35, 0.15, 0.55]} />
        <meshStandardMaterial color="#4b4b4b" roughness={0.9} />
      </mesh>
      <mesh position={[0.4, -0.55, 0.1]}>
        <boxGeometry args={[0.35, 0.15, 0.55]} />
        <meshStandardMaterial color="#4b4b4b" roughness={0.9} />
      </mesh>

      {/* мечи на спине */}
      <mesh position={[-0.15, 0.5, -0.4]} rotation={[0.3, 0.2, 0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 1.3, 6]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0.15, 0.5, -0.4]} rotation={[0.3, -0.2, -0.5]}>
        <cylinderGeometry args={[0.02, 0.02, 1.3, 6]} />
        <meshStandardMaterial color="#2b2b2b" metalness={0.6} roughness={0.4} />
      </mesh>

      {/* голова + шляпа — вращается за курсором */}
      <group ref={headGroup} position={[0, 0.75, 0]}>
        {/* тень-лицо под шляпой */}
        <mesh position={[0, -0.05, 0]}>
          <sphereGeometry args={[0.32, 12, 12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={1} />
        </mesh>

        {/* соломенная шляпа каса */}
        <mesh position={[0, 0.15, 0]}>
          <coneGeometry args={[0.75, 0.45, 10]} />
          <meshStandardMaterial color="#d8c9a3" roughness={0.95} />
        </mesh>
      </group>
    </group>
  );
}

function SunAccent() {
  return (
    <mesh position={[1.6, 1.4, -1.5]}>
      <circleGeometry args={[0.25, 24]} />
      <meshBasicMaterial color="#d92b2b" toneMapped={false} />
    </mesh>
  );
}

export default function RoninRobot() {
  return (
    <div className="h-full w-full min-h-[480px]">
      <Canvas camera={{ position: [0, 0.3, 3.2], fov: 40 }}>
        <color attach="background" args={["#c9c4b8"]} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 2]} intensity={1.1} />
        <RoninMesh />
        <SunAccent />
      </Canvas>
    </div>
  );
}

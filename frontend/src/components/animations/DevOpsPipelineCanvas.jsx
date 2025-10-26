// src/components/animations/DevOpsPipelineCanvas.jsx
import React, { useRef, useMemo, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Line, Sphere, Text } from "@react-three/drei";
import {
  Vector3,
  Color,
  CatmullRomCurve3,
  MathUtils,
  AdditiveBlending,
  Points,
  BufferGeometry,
  Float32BufferAttribute,
} from "three";

/**
 * Improved cinematic DevOps pipeline canvas
 * - Orb with glowing trail (Points buffer)
 * - Neon curved pipeline segments
 * - Node halos (additive layers)
 * - Smooth camera motion
 *
 * Tweak top-level constants to change look & feel
 */

// ---------- Tunables ----------
const NODE_COLOR_INACTIVE = "#5e6ad2"; // neon blue
const NODE_COLOR_ACTIVE = "#00ff66"; // bright green
const LINE_COLOR_INACTIVE = "#3a2f7a";
const LINE_COLOR_ACTIVE = "#00ff66";
const ORB_COLOR = "#00ff66";
const ORB_SPEED = 0.045; // lower = slower
const TRAIL_LENGTH = 60; // number of trail points
const PARTICLE_OPACITY = 0.18;
const CAMERA_RADIUS = 7;
const FOV = 50;

// ---------- Helper: lerp color ----------
const lerpColor = (outColor, fromHex, toHex, t) => {
  const from = new Color(fromHex);
  const to = new Color(toHex);
  outColor.r = MathUtils.lerp(from.r, to.r, t);
  outColor.g = MathUtils.lerp(from.g, to.g, t);
  outColor.b = MathUtils.lerp(from.b, to.b, t);
  return outColor;
};

// ---------- Pipeline Node Component ----------
function PipelineNode({ position, label, isActive }) {
  const sphereRef = useRef();
  const haloRef = useRef();
  const inactive = useMemo(() => new Color(NODE_COLOR_INACTIVE), []);
  const active = useMemo(() => new Color(NODE_COLOR_ACTIVE), []);

  useFrame(() => {
    if (!sphereRef.current) return;
    // color/emissive lerp
    sphereRef.current.material.color.lerp(isActive ? active : inactive, 0.07);
    sphereRef.current.material.emissive.lerp(isActive ? active : inactive, 0.07);

    // scale pulse for active
    const target = isActive ? 1.08 + Math.sin(Date.now() * 0.007) * 0.03 : 1;
    sphereRef.current.scale.lerp(new Vector3(target, target, target), 0.08);

    if (haloRef.current) {
      haloRef.current.material.opacity = isActive
        ? MathUtils.lerp(haloRef.current.material.opacity, 0.36, 0.06)
        : MathUtils.lerp(haloRef.current.material.opacity, 0.10, 0.06);
      haloRef.current.scale.lerp(
        new Vector3(isActive ? 2.1 : 1.7, isActive ? 2.1 : 1.7, isActive ? 2.1 : 1.7),
        0.06
      );
    }
  });

  return (
    <group position={position}>
      <Sphere ref={sphereRef} args={[0.22, 32, 32]}>
        <meshStandardMaterial
          color={inactive}
          emissive={inactive}
          emissiveIntensity={0.9}
          roughness={0.12}
          metalness={0.5}
        />
      </Sphere>

      {/* additive halo (no heavy postprocessing) */}
      <Sphere ref={haloRef} args={[0.44, 32, 32]} renderOrder={-1}>
        <meshBasicMaterial
          color={isActive ? NODE_COLOR_ACTIVE : NODE_COLOR_INACTIVE}
          transparent
          opacity={isActive ? 0.36 : 0.10}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </Sphere>

      <Text position={[0, 0.48, 0]} fontSize={0.12} color="#e6eef6" anchorX="center" anchorY="middle">
        {label}
      </Text>
    </group>
  );
}

// ---------- Pipeline Segment (neon line) ----------
function PipelineSegment({ points, isActive }) {
  const ref = useRef();
  const inactiveColor = useMemo(() => new Color(LINE_COLOR_INACTIVE), []);
  const activeColor = useMemo(() => new Color(LINE_COLOR_ACTIVE), []);

  useFrame(() => {
    if (!ref.current) return;
    // lerp color and opacity
    ref.current.material.color.lerp(isActive ? activeColor : inactiveColor, 0.06);
    ref.current.material.opacity = isActive
      ? MathUtils.lerp(ref.current.material.opacity, 0.98, 0.06)
      : MathUtils.lerp(ref.current.material.opacity, 0.56, 0.06);
  });

  return (
    <Line
      ref={ref}
      points={points}
      color={inactiveColor}
      lineWidth={3}
      transparent
      opacity={0.6}
      dashed={false}
      depthTest
    />
  );
}

// ---------- Orb trail using Points buffer ----------
function OrbTrail({ trailRefObj }) {
  // trailRefObj: { positionsFloat32, geomRef } - created by parent
  const geomRef = trailRefObj.geomRef;
  const positions = trailRefObj.positionsFloat32;
  const count = TRAIL_LENGTH;

  useEffect(() => {
    // set attribute once
    if (geomRef.current) {
      geomRef.current.setAttribute("position", new Float32BufferAttribute(positions, 3));
    }
  }, [geomRef, positions]);

  useFrame(() => {
    // mark needsUpdate each frame; parent updates positions array externally
    if (geomRef.current) {
      geomRef.current.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points>
      <bufferGeometry ref={geomRef} />
      <pointsMaterial size={0.045} vertexColors={false} transparent opacity={0.85} depthWrite={false} color={NODE_COLOR_ACTIVE} />
    </points>
  );
}

// ---------- Main Scene ----------
function PipelineScene() {
  const { camera, gl } = useThree();

  // node points
  const nodePositions = useMemo(
    () => [
      new Vector3(-3.4, 0.2, 0.0),
      new Vector3(-1.2, 1.6, -0.4),
      new Vector3(1.4, 0.9, 0.15),
      new Vector3(3.0, -0.5, 0.6),
    ],
    []
  );
  const labels = ["Build", "Test", "Deploy", "Monitor"];

  // closed curve for smooth path
  const curve = useMemo(() => new CatmullRomCurve3([...nodePositions, nodePositions[0]], true, "catmullrom", 0.6), [nodePositions]);
  const curvePoints = useMemo(() => curve.getPoints(420), [curve]);

  // segment splitting
  const segmentCount = nodePositions.length;
  const segmentPoints = useMemo(() => {
    const per = Math.floor(curvePoints.length / segmentCount);
    const segs = [];
    for (let i = 0; i < segmentCount; i++) {
      const start = i * per;
      const end = i === segmentCount - 1 ? curvePoints.length - 1 : start + per;
      segs.push(curvePoints.slice(start, end + 1));
    }
    return segs;
  }, [curvePoints, segmentCount]);

  // refs & trail buffer
  const progressRef = useRef(0);
  const activeSegRef = useRef(0);

  // trail buffer: Float32Array length TRAIL_LENGTH*3, initially filled with center
  const trailPositions = useMemo(() => {
    const arr = new Float32Array(TRAIL_LENGTH * 3);
    for (let i = 0; i < TRAIL_LENGTH; i++) {
      arr[i * 3 + 0] = 0;
      arr[i * 3 + 1] = 0;
      arr[i * 3 + 2] = 0;
    }
    return arr;
  }, []);
  const geomRef = useRef();

  // expose a small object to OrbTrail to read
  const trailRefObj = useMemo(() => ({ positionsFloat32: trailPositions, geomRef }), [trailPositions]);

  // camera initial position
  useEffect(() => {
    camera.position.set(0, 0.6, CAMERA_RADIUS);
    camera.lookAt(0, 0.25, 0);
    gl.setClearColor("#000000");
  }, [camera, gl]);

  useFrame((state, delta) => {
    // advance orb progress
    progressRef.current = (progressRef.current + delta * ORB_SPEED) % 1;
    const segIndex = Math.floor(progressRef.current * segmentCount);
    if (segIndex !== activeSegRef.current) {
      activeSegRef.current = segIndex;
    }

    // orb 3D position for trail update
    const orbPos = curve.getPointAt(progressRef.current % 1);

    // update trail array: shift left and push new position at end
    // (we treat index 0 as oldest, end as most recent)
    for (let i = 0; i < TRAIL_LENGTH - 1; i++) {
      trailPositions[i * 3 + 0] = trailPositions[(i + 1) * 3 + 0];
      trailPositions[i * 3 + 1] = trailPositions[(i + 1) * 3 + 1];
      trailPositions[i * 3 + 2] = trailPositions[(i + 1) * 3 + 2];
    }
    // write new
    const last = TRAIL_LENGTH - 1;
    trailPositions[last * 3 + 0] = orbPos.x;
    trailPositions[last * 3 + 1] = orbPos.y;
    trailPositions[last * 3 + 2] = orbPos.z;

    // update camera smoothly to create cinematic parallax
    const t = state.clock.getElapsedTime();
    const targetX = Math.sin(t * 0.05) * 0.6;
    const targetY = 0.6 + Math.sin(t * 0.02) * 0.12;
    const targetZ = CAMERA_RADIUS + Math.cos(t * 0.03) * 0.55;
    camera.position.lerp(new Vector3(targetX, targetY, targetZ), 0.02);
    camera.lookAt(0, 0.25, 0);
  });

  return (
    <group>
      {/* Lighting */}
      <ambientLight intensity={0.24} />
      <directionalLight position={[5, 10, 5]} intensity={0.6} />
      <directionalLight position={[-6, -3, -5]} intensity={0.32} color={"#bfe3ff"} />

      {/* Neon pipeline segments */}
      {segmentPoints.map((pts, i) => (
        <PipelineSegment key={i} points={pts} isActive={i === activeSegRef.current} />
      ))}

      {/* Nodes */}
      {nodePositions.map((pos, i) => (
        <PipelineNode key={i} position={pos} label={labels[i]} isActive={i === activeSegRef.current} />
      ))}

      {/* Orb (bright sphere + point light) */}
      <group>
        <mesh position={curve.getPointAt(progressRef.current % 1)}>
          <sphereGeometry args={[0.12, 32, 32]} />
          <meshStandardMaterial color={ORB_COLOR} emissive={ORB_COLOR} emissiveIntensity={2.8} roughness={0.05} metalness={0.6} />
        </mesh>
        <pointLight color={ORB_COLOR} intensity={3.2} distance={4} decay={2} position={curve.getPointAt(progressRef.current % 1)} />
      </group>

      {/* Orb trail (Points) */}
      <points>
        <bufferGeometry ref={geomRef}>
          <bufferAttribute attachObject={["attributes", "position"]} array={trailPositions} count={trailPositions.length / 3} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.045} color={NODE_COLOR_ACTIVE} transparent opacity={0.9} depthWrite={false} />
      </points>

      {/* subtle particles (faint atmosphere) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attachObject={["attributes", "position"]}
            array={new Float32Array(
              Array.from({ length: 250 }).flatMap(() => [
                (Math.random() - 0.5) * 16,
                (Math.random() - 0.5) * 8,
                (Math.random() - 0.5) * 12,
              ])
            )}
            count={250}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.02} color={NODE_COLOR_INACTIVE} transparent opacity={PARTICLE_OPACITY} depthWrite={false} />
      </points>
    </group>
  );
}

// ---------- Canvas wrapper ----------
export default function DevOpsPipelineCanvas({ className = "" }) {
  return (
    <Canvas className={className} camera={{ position: [0, 0.6, CAMERA_RADIUS], fov: FOV }} gl={{ antialias: true }}>
      <color attach="background" args={["#000000"]} />
      <fog attach="fog" args={["#000000", 4, 18]} />
      <React.Suspense fallback={null}>
        <PipelineScene />
      </React.Suspense>
    </Canvas>
  );
}

import React, { useRef, useState, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Float, Text, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { CoreData } from '../../types';

interface Processor3DProps {
  cores: CoreData[];
  activePid: number | null;
  overallUtilization: number;
  onSelectCore?: (coreId: number) => void;
}

// Single Core Die Tile inside the CPU package
const CoreTile = ({
  core,
  position,
  onHover,
  onSelect
}: {
  core: CoreData;
  position: [number, number, number];
  onHover: (info: string | null) => void;
  onSelect?: () => void;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const isActive = core.active_pid !== null;

  // Pulse animation when core is actively computing
  useFrame((state) => {
    if (!meshRef.current) return;
    if (isActive) {
      const t = state.clock.getElapsedTime();
      const pulse = Math.sin(t * 8) * 0.15 + 0.85;
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = pulse * 1.8;
    } else {
      (meshRef.current.material as THREE.MeshStandardMaterial).emissiveIntensity = hovered ? 0.6 : 0.05;
    }
  });

  const coreColor = isActive ? (core.active_color || '#35D6E8') : hovered ? '#8B7CFF' : '#1E293B';
  const emissiveColor = isActive ? (core.active_color || '#35D6E8') : '#8B7CFF';

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          onSelect?.();
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          onHover(`Core ${String(core.core_id).padStart(2, '0')}: ${isActive ? `Process P${core.active_pid} Active (${core.utilization}% Load)` : `Idle (${core.utilization}% Load)`}`);
        }}
        onPointerOut={() => {
          setHovered(false);
          onHover(null);
        }}
      >
        <boxGeometry args={[0.9, 0.18, 0.9]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={emissiveColor}
          emissiveIntensity={isActive ? 1.2 : 0.1}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Core ID Laser Engraving */}
      <Text
        position={[0, 0.11, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.16}
        color={isActive ? '#080B12' : '#94A3B8'}
        font="/fonts/Inter-Bold.woff"
      >
        {`C${core.core_id}`}
      </Text>
    </group>
  );
};

// Flowing Particle Data Stream between cores and bus
const DataStreams = ({ activeCount }: { activeCount: number }) => {
  const pointsCount = 40;
  const particlesRef = useRef<THREE.Points>(null);

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(pointsCount * 3);
    const spd = new Float32Array(pointsCount);
    for (let i = 0; i < pointsCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 1] = 0.2 + Math.random() * 0.4;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3.5;
      spd[i] = 0.02 + Math.random() * 0.04;
    }
    return [pos, spd];
  }, []);

  useFrame(() => {
    if (!particlesRef.current) return;
    const pos = particlesRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < pointsCount; i++) {
      pos[i * 3 + 1] += speeds[i];
      if (pos[i * 3 + 1] > 1.2) {
        pos[i * 3 + 1] = 0.2;
      }
    }
    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={pointsCount}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color={activeCount > 0 ? '#35D6E8' : '#8B7CFF'}
        transparent
        opacity={0.7}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

export const Processor3D: React.FC<Processor3DProps> = ({
  cores,
  activePid,
  overallUtilization,
  onSelectCore
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const [tooltip, setTooltip] = useState<string | null>(null);
  const { mouse } = useThree();

  // Subtle mouse parallax tilt and smooth idle rotation
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    // Parallax mouse tilt
    const targetRotX = (mouse.y * 0.3) + 0.55;
    const targetRotY = (mouse.x * 0.4) + Math.sin(t * 0.3) * 0.15;
    groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
    groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
  });

  // Calculate 2x2 or 2x4 layout for cores
  const numCores = cores.length || 4;
  const corePositions = useMemo(() => {
    const positions: [number, number, number][] = [];
    const cols = numCores <= 4 ? 2 : 4;
    const rows = 2;
    const spacing = 1.1;
    const offsetX = ((cols - 1) * spacing) / 2;
    const offsetZ = ((rows - 1) * spacing) / 2;

    for (let i = 0; i < numCores; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      positions.push([col * spacing - offsetX, 0.24, row * spacing - offsetZ]);
    }
    return positions;
  }, [numCores]);

  const activeCoresCount = cores.filter((c) => c.active_pid !== null).length;

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {/* 1. Main Silicon Substrate Base */}
      <mesh position={[0, 0, 0]} receiveShadow>
        <boxGeometry args={[4.8, 0.22, 4.8]} />
        <meshStandardMaterial
          color="#0B1220"
          metalness={0.85}
          roughness={0.25}
        />
      </mesh>

      {/* Gold Edge Connector Pins */}
      <mesh position={[0, -0.08, 0]}>
        <boxGeometry args={[4.9, 0.04, 4.9]} />
        <meshStandardMaterial
          color="#D4AF37"
          metalness={0.95}
          roughness={0.15}
        />
      </mesh>

      {/* 2. Heat Spreader Frame (Beveled Edge) */}
      <mesh position={[0, 0.12, 0]}>
        <boxGeometry args={[4.2, 0.08, 4.2]} />
        <meshStandardMaterial
          color="#151E2E"
          metalness={0.9}
          roughness={0.3}
        />
      </mesh>

      {/* Ceramic Die Center Basin */}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[3.6, 0.04, 3.6]} />
        <meshStandardMaterial
          color="#080C16"
          metalness={0.9}
          roughness={0.4}
        />
      </mesh>

      {/* 3. Core Modules (C0, C1, C2, C3...) */}
      {cores.map((core, idx) => (
        <CoreTile
          key={core.core_id}
          core={core}
          position={corePositions[idx] || [0, 0.24, 0]}
          onHover={setTooltip}
          onSelect={() => onSelectCore?.(core.core_id)}
        />
      ))}

      {/* 4. Processor Branding Laser Inscription */}
      <Text
        position={[0, 0.17, -2.0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.22}
        color="#35D6E8"
        font="/fonts/Inter-Bold.woff"
      >
        PULSEQUEUE X // SMP OCTA-CORE
      </Text>
      <Text
        position={[0, 0.17, 2.0]}
        rotation={[-Math.PI / 2, 0, 0]}
        fontSize={0.14}
        color="#929BAD"
      >
        ADAPTIVE PREDICTIVE ARCHITECTURE
      </Text>

      {/* 5. Particle Data Streams */}
      <DataStreams activeCount={activeCoresCount} />

      {/* Subtle Volumetric Lighting Sources */}
      <pointLight position={[0, 2, 0]} color="#35D6E8" intensity={1.5} distance={6} />
      <pointLight position={[2, 1, 2]} color="#8B7CFF" intensity={1.2} distance={5} />
      <directionalLight position={[-3, 4, 2]} color="#FFFFFF" intensity={1.8} />
    </group>
  );
};

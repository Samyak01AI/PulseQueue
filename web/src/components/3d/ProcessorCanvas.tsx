import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Processor3D } from './Processor3D';
import { Fallback2DProcessor } from './Fallback2DProcessor';
import { CoreData } from '../../types';

interface ProcessorCanvasProps {
  cores: CoreData[];
  activePid: number | null;
  overallUtilization: number;
  onSelectCore?: (coreId: number) => void;
}

// Function to check if WebGL is available
const checkWebGL = () => {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
};

export const ProcessorCanvas: React.FC<ProcessorCanvasProps> = (props) => {
  const [webGLSupported, setWebGLSupported] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!checkWebGL()) {
      setWebGLSupported(false);
    }
  }, []);

  if (!webGLSupported || hasError) {
    return <Fallback2DProcessor {...props} />;
  }

  return (
    <div className="relative w-full h-[450px] md:h-[520px] select-none">
      <Suspense fallback={<Fallback2DProcessor {...props} />}>
        <Canvas
          camera={{ position: [0, 4.2, 5.2], fov: 45 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          onError={() => setHasError(true)}
        >
          <ambientLight intensity={0.8} />
          <directionalLight position={[5, 10, 5]} intensity={1.5} />
          <pointLight position={[-5, 5, -5]} intensity={0.8} color="#8B7CFF" />

          <Processor3D {...props} />

          <OrbitControls
            enablePan={false}
            enableZoom={true}
            minDistance={4}
            maxDistance={8}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.2}
            rotateSpeed={0.6}
          />
        </Canvas>
      </Suspense>

      {/* Orbit Interaction Hint */}
      <div className="absolute bottom-3 right-4 px-3 py-1 rounded-full bg-panel/70 border border-white/10 backdrop-blur-md text-[11px] font-mono text-textMuted flex items-center space-x-2 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
        <span>Drag to Rotate // Scroll to Zoom</span>
      </div>
    </div>
  );
};


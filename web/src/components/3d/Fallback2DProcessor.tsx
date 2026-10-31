import React, { useRef, useEffect } from 'react';
import { CoreData } from '../../types';

interface Fallback2DProcessorProps {
  cores: CoreData[];
  activePid: number | null;
  overallUtilization: number;
}

export const Fallback2DProcessor: React.FC<Fallback2DProcessorProps> = ({
  cores,
  activePid,
  overallUtilization
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const render = () => {
      t += 0.03;
      const w = canvas.width;
      const h = canvas.height;

      ctx.clearRect(0, 0, w, h);

      // Center of chip
      const cx = w / 2;
      const cy = h / 2;
      const chipSize = Math.min(w, h) * 0.75;

      // Draw Substrate Outer Board
      ctx.fillStyle = '#0B1220';
      ctx.strokeStyle = '#1F2E45';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cx - chipSize / 2, cy - chipSize / 2, chipSize, chipSize, 16);
      ctx.fill();
      ctx.stroke();

      // Gold Edge Contacts
      ctx.fillStyle = '#D4AF37';
      const pinCount = 12;
      const pinLen = 10;
      const step = chipSize / (pinCount + 1);
      for (let i = 1; i <= pinCount; i++) {
        // Top and bottom pins
        ctx.fillRect(cx - chipSize / 2 + i * step - 2, cy - chipSize / 2 - 4, 4, pinLen);
        ctx.fillRect(cx - chipSize / 2 + i * step - 2, cy + chipSize / 2 - 6, 4, pinLen);
        // Left and right pins
        ctx.fillRect(cx - chipSize / 2 - 4, cy - chipSize / 2 + i * step - 2, pinLen, 4);
        ctx.fillRect(cx + chipSize / 2 - 6, cy - chipSize / 2 + i * step - 2, pinLen, 4);
      }

      // Heat Spreader Basin
      const innerSize = chipSize * 0.8;
      ctx.fillStyle = '#151C2A';
      ctx.beginPath();
      ctx.roundRect(cx - innerSize / 2, cy - innerSize / 2, innerSize, innerSize, 12);
      ctx.fill();

      // Core tiles (2x2 or 2x4)
      const numCores = cores.length || 4;
      const cols = numCores <= 4 ? 2 : 4;
      const rows = 2;
      const tileW = (innerSize * 0.8) / cols;
      const tileH = (innerSize * 0.6) / rows;
      const gap = 8;

      const startX = cx - (cols * (tileW + gap) - gap) / 2;
      const startY = cy - (rows * (tileH + gap) - gap) / 2;

      cores.forEach((core, idx) => {
        const col = idx % cols;
        const row = Math.floor(idx / cols);
        const tx = startX + col * (tileW + gap);
        const ty = startY + row * (tileH + gap);

        const isActive = core.active_pid !== null;
        const coreColor = isActive ? (core.active_color || '#35D6E8') : '#1E293B';

        ctx.fillStyle = coreColor;
        ctx.beginPath();
        ctx.roundRect(tx, ty, tileW, tileH, 6);
        ctx.fill();

        // Pulsing glow when active
        if (isActive) {
          const pulse = (Math.sin(t * 4) + 1) * 0.5;
          ctx.strokeStyle = `rgba(53, 214, 232, ${0.4 + pulse * 0.5})`;
          ctx.lineWidth = 3;
          ctx.stroke();
        }

        // Core label
        ctx.fillStyle = isActive ? '#080B12' : '#94A3B8';
        ctx.font = 'bold 11px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`C${core.core_id}`, tx + tileW / 2, ty + tileH / 2 - 2);

        ctx.font = '9px Inter, sans-serif';
        ctx.fillText(isActive ? `P${core.active_pid}` : `${core.utilization}%`, tx + tileW / 2, ty + tileH / 2 + 10);
      });

      // Chip Inscription
      ctx.fillStyle = '#35D6E8';
      ctx.font = 'bold 12px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PULSEQUEUE X ARCHITECTURE', cx, cy - innerSize / 2 + 20);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [cores, activePid, overallUtilization]);

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      <canvas
        ref={canvasRef}
        width={480}
        height={480}
        className="max-w-full max-h-full drop-shadow-[0_0_35px_rgba(53,214,232,0.25)]"
      />
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-3 py-1 bg-panel/80 border border-white/10 rounded-full text-xs text-textMuted font-mono">
        2D Precision Render Fallback Active
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { ProcessorCanvas } from '../3d/ProcessorCanvas';
import { MultiCoreState } from '../../types';
import { Layers, Activity, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

interface CoreMonitor3DProps {
  multicore: MultiCoreState;
  activePid: number | null;
  onUpdateCores: (numCores: number) => void;
}

export const CoreMonitor3D: React.FC<CoreMonitor3DProps> = ({
  multicore,
  activePid,
  onUpdateCores,
}) => {
  const [selectedCoreId, setSelectedCoreId] = useState<number | null>(null);

  const selectedCore = multicore.cores.find((c) => c.core_id === selectedCoreId) || multicore.cores[0];

  const imbalanceLevel =
    multicore.load_imbalance_std_dev < 10
      ? 'Optimal (Balanced)'
      : multicore.load_imbalance_std_dev < 25
      ? 'Moderate Variance'
      : 'Imbalanced';

  const imbalanceColor =
    multicore.load_imbalance_std_dev < 10
      ? 'text-success'
      : multicore.load_imbalance_std_dev < 25
      ? 'text-warning'
      : 'text-danger';

  return (
    <div className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-panel p-5 rounded-2xl">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
            <h2 className="text-lg font-mono font-bold text-textPrimary tracking-wide">
              3D SYMMETRIC MULTIPROCESSING (SMP) CORE MONITOR
            </h2>
          </div>
          <p className="text-xs text-textMuted mt-1">
            Real-time spatial visualization of CPU core allocations, thread affinities, and hardware load distribution.
          </p>
        </div>

        {/* Core Topology Selector */}
        <div className="flex items-center space-x-2 bg-secondary/80 p-1.5 rounded-xl border border-white/5">
          <span className="text-xs font-mono text-textMuted px-2">Cores:</span>
          {[1, 2, 4, 8].map((count) => (
            <button
              key={count}
              onClick={() => onUpdateCores(count)}
              className={`px-3 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                multicore.num_cores === count
                  ? 'bg-cyan text-[#080B12] shadow-cyan-glow'
                  : 'text-textMuted hover:text-textPrimary hover:bg-white/5'
              }`}
            >
              {count} Core{count > 1 ? 's' : ''}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: 3D Scene (Left) + Core Telemetry Cards (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* 3D Model Card */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-4 border border-white/10 shadow-glass">
          <div className="flex items-center justify-between pb-2 border-b border-white/5">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan" />
              <span className="text-xs font-mono text-textPrimary">Spatial Die Inspection</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono text-textMuted">Overall Load:</span>
              <span className="text-xs font-mono font-bold text-cyan">{multicore.overall_utilization}%</span>
            </div>
          </div>

          <ProcessorCanvas
            cores={multicore.cores}
            activePid={activePid}
            overallUtilization={multicore.overall_utilization}
            onSelectCore={setSelectedCoreId}
          />

          <div className="pt-2 flex items-center justify-between text-[11px] font-mono text-textMuted border-t border-white/5">
            <span>Click any core tile to inspect execution metrics</span>
            <span className={imbalanceColor}>Variance: {multicore.load_imbalance_std_dev}% ({imbalanceLevel})</span>
          </div>
        </div>

        {/* Right: Core Cards & Detail Inspection */}
        <div className="lg:col-span-5 space-y-4">
          {/* Selected Core Detailed Card */}
          {selectedCore && (
            <div className="glass-panel p-5 rounded-2xl border-cyan/30 shadow-cyan-glow space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan/20 border border-cyan/40 flex items-center justify-center font-mono font-bold text-cyan text-sm">
                    {`C${selectedCore.core_id}`}
                  </div>
                  <div>
                    <h3 className="text-sm font-mono font-bold text-textPrimary">CORE {String(selectedCore.core_id).padStart(2, '0')} STATUS</h3>
                    <p className="text-[11px] font-sans text-textMuted">
                      {selectedCore.active_pid ? `Executing Process P${selectedCore.active_pid}` : 'Core Idle (Standby)'}
                    </p>
                  </div>
                </div>

                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${
                    selectedCore.active_pid
                      ? 'bg-cyan/20 text-cyan border border-cyan/40'
                      : 'bg-white/5 text-textMuted border border-white/10'
                  }`}
                >
                  {selectedCore.active_pid ? 'ACTIVE' : 'IDLE'}
                </span>
              </div>

              {/* Progress & Utilization */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-textMuted">Core Utilization</span>
                  <span className="text-cyan font-bold">{selectedCore.utilization}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan to-violet transition-all duration-300"
                    style={{ width: `${selectedCore.utilization}%` }}
                  />
                </div>
              </div>

              {/* Micro Metrics Grid */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-2.5 rounded-xl bg-secondary/60 border border-white/5">
                  <span className="text-[10px] font-mono text-textMuted">CONTEXT SWITCHES</span>
                  <div className="text-lg font-mono font-bold text-textPrimary">{selectedCore.context_switches}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/60 border border-white/5">
                  <span className="text-[10px] font-mono text-textMuted">CURRENT PID</span>
                  <div className="text-lg font-mono font-bold text-cyan">
                    {selectedCore.active_pid ? `P${String(selectedCore.active_pid).padStart(2, '0')}` : '--'}
                  </div>
                </div>
              </div>

              {/* 30-Tick Mini Heat Strip */}
              <div className="space-y-1.5 pt-2">
                <span className="text-[10px] font-mono text-textMuted">ACTIVITY HISTORY (LAST 30 TICKS)</span>
                <div className="flex items-center space-x-0.5 h-6 w-full p-1 rounded-lg bg-secondary/80 border border-white/5">
                  {selectedCore.recent_ticks.length === 0 ? (
                    <span className="text-[10px] text-textMuted font-mono px-2">Awaiting simulation ticks...</span>
                  ) : (
                    selectedCore.recent_ticks.map((pid, idx) => (
                      <div
                        key={idx}
                        title={pid ? `Tick: P${pid}` : 'IDLE'}
                        className="flex-1 h-full rounded-sm transition-all"
                        style={{
                          backgroundColor: pid ? (selectedCore.active_color || '#35D6E8') : '#162032',
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* All Cores Quick Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {multicore.cores.map((c) => {
              const isSelected = selectedCoreId === c.core_id;
              const isBusy = c.active_pid !== null;
              return (
                <div
                  key={c.core_id}
                  onClick={() => setSelectedCoreId(c.core_id)}
                  className={`p-3 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-cyan/15 border border-cyan/50 shadow-sm'
                      : 'bg-panel/70 border border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono font-bold text-xs text-textPrimary">{`C${c.core_id}`}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${isBusy ? 'bg-cyan animate-pulse' : 'bg-textMuted/40'}`}
                    />
                  </div>
                  <div className="text-xs font-mono font-bold text-cyan">{c.utilization}%</div>
                  <div className="text-[10px] font-mono text-textMuted truncate">
                    {c.active_pid ? `P${String(c.active_pid).padStart(2, '0')}` : 'IDLE'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

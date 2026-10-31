import React from 'react';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  Zap,
  Clock,
  Sparkles,
  Sliders,
  ChevronDown,
} from 'lucide-react';

interface TopHeaderProps {
  currentTab: string;
  clock: number;
  running: boolean;
  done: boolean;
  speedMs: number;
  currentWorkload: string;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onSpeedChange: (speed: number) => void;
  onLoadPreset: (preset: string) => void;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: 'Command Overview',
    subtitle: 'High-level telemetry, live metrics, and 3D silicon processor architecture',
  },
  manager: {
    title: 'Process Manager & What-If Lab',
    subtitle: 'Configure tasks, modify burst durations, and test hypothetical schedules',
  },
  simulation: {
    title: 'Live CPU Simulator',
    subtitle: 'Real-time execution, interactive Gantt chart, starvation monitor, and decision replay',
  },
  arena: {
    title: 'Algorithm Battle Arena',
    subtitle: '5-way simultaneous benchmark of FCFS, SJF, Round Robin, Priority, and PulseQueue',
  },
  analytics: {
    title: 'Performance Analytics',
    subtitle: 'Deep diagnostic telemetry, turnaround composition, and deadline adherence',
  },
  learning: {
    title: 'Learning Laboratory',
    subtitle: 'Educational visual guides, the 1997 Mars Pathfinder story, and scheduling formulas',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  currentTab,
  clock,
  running,
  done,
  speedMs,
  currentWorkload,
  onToggleRun,
  onStep,
  onReset,
  onSpeedChange,
  onLoadPreset,
}) => {
  const currentInfo = TAB_TITLES[currentTab] || {
    title: 'PulseQueue X',
    subtitle: 'Adaptive CPU Scheduling Engine',
  };

  const statusLabel = done ? 'Completed' : running ? 'Running' : clock > 0 ? 'Paused' : 'Ready';
  const statusColor = done
    ? 'text-success bg-success/15 border-success/30'
    : running
    ? 'text-cyan bg-cyan/15 border-cyan/30'
    : clock > 0
    ? 'text-warning bg-warning/15 border-warning/30'
    : 'text-textMuted bg-white/5 border-white/10';

  return (
    <header className="sticky top-0 z-30 h-16 w-full border-b border-white/[0.07] bg-[#07090E]/90 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-4">
      {/* Left: Page Title & Context */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center space-x-2.5">
          <h1 className="text-sm sm:text-base font-bold text-textPrimary tracking-tight truncate">
            {currentInfo.title}
          </h1>
          <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${statusColor}`}>
            {statusLabel}
          </span>
        </div>
        <p className="text-[11px] text-textMuted truncate hidden md:block">
          {currentInfo.subtitle}
        </p>
      </div>

      {/* Right: Simulation Controls & Telemetry */}
      <div className="flex items-center space-x-2.5 flex-shrink-0">
        {/* Workload Preset Dropdown */}
        <div className="relative hidden lg:block">
          <select
            value={currentWorkload}
            onChange={(e) => onLoadPreset(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-secondary/80 border border-white/10 text-xs font-mono text-cyan focus:outline-none focus:border-cyan/50 cursor-pointer appearance-none pr-8"
          >
            <option value="standard">Preset: Standard Demo</option>
            <option value="starvation">Preset: Starvation Hazard</option>
            <option value="deadline">Preset: Deadline Crunch</option>
            <option value="batch">Preset: Heavy Batch</option>
            <option value="interactive">Preset: Interactive Burst</option>
            <option value="random">Preset: Synthetic Random</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-textMuted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Speed Selector */}
        <div className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-secondary/80 border border-white/10 text-xs text-textMuted font-mono">
          <span>Speed:</span>
          <select
            value={speedMs}
            onChange={(e) => onSpeedChange(parseInt(e.target.value))}
            className="bg-transparent text-cyan font-bold focus:outline-none cursor-pointer"
          >
            <option value="800" className="bg-[#0D111A] text-textPrimary">0.8s</option>
            <option value="400" className="bg-[#0D111A] text-textPrimary">0.4s</option>
            <option value="150" className="bg-[#0D111A] text-textPrimary">0.15s</option>
          </select>
        </div>

        {/* Live Clock Pill */}
        <div className="px-3 py-1.5 rounded-xl bg-cyan/10 border border-cyan/30 text-xs font-mono text-cyan flex items-center space-x-1.5 font-bold shadow-sm">
          <Clock className="w-3.5 h-3.5 text-cyan animate-spin-slow" />
          <span>Tick {String(clock).padStart(2, '0')}</span>
        </div>

        {/* Primary Simulation Controls */}
        <div className="flex items-center space-x-1 bg-secondary/90 p-1 rounded-xl border border-white/10 shadow-sm">
          {/* Start / Pause */}
          <button
            onClick={onToggleRun}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              running
                ? 'bg-warning text-[#07090E] hover:bg-warning/90'
                : 'bg-cyan text-[#07090E] hover:bg-cyan/90 shadow-cyan-glow'
            }`}
          >
            {running ? <Pause className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
            <span className="hidden sm:inline">{running ? 'Pause' : 'Start'}</span>
          </button>

          {/* Next Step */}
          <button
            onClick={onStep}
            title="Advance exactly 1 clock cycle"
            className="p-1.5 rounded-lg hover:bg-white/10 text-textPrimary transition-all"
          >
            <StepForward className="w-4 h-4" />
          </button>

          {/* Reset */}
          <button
            onClick={onReset}
            title="Reset engine state"
            className="p-1.5 rounded-lg hover:bg-danger/20 text-danger transition-all"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};


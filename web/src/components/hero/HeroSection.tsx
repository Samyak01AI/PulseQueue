import React from 'react';
import { ProcessorCanvas } from '../3d/ProcessorCanvas';
import { EngineState } from '../../types';
import { ArrowRight, Play, Cpu, Activity, Clock, AlertTriangle, Layers } from 'lucide-react';

interface HeroSectionProps {
  state: EngineState;
  onNavigate: (tab: string) => void;
  onToggleRun: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ state, onNavigate, onToggleRun }) => {
  const activeTask = state.tasks.find((t) => t.pid === state.active_pid);

  const kpis = [
    {
      title: 'TOTAL PROCESSES',
      value: state.total_tasks,
      subtext: `${state.completed_count} Completed (${state.total_tasks ? Math.round((state.completed_count / state.total_tasks) * 100) : 0}%)`,
      icon: Layers,
      color: 'text-cyan',
      borderColor: 'border-cyan/30',
    },
    {
      title: 'CURRENT PROCESS',
      value: activeTask ? `P${String(activeTask.pid).padStart(2, '0')}` : 'IDLE',
      subtext: activeTask ? `${activeTask.process_type} (${activeTask.remaining}t left)` : 'Awaiting ready queue dispatch',
      icon: Cpu,
      color: activeTask ? 'text-cyan' : 'text-textMuted',
      borderColor: 'border-violet/30',
    },
    {
      title: 'CPU UTILIZATION',
      value: `${state.cpu_utilization.toFixed(1)}%`,
      subtext: `${state.history.length} ticks recorded`,
      icon: Activity,
      color: 'text-success',
      borderColor: 'border-success/30',
    },
    {
      title: 'AVG WAITING TIME',
      value: `${state.avg_wait.toFixed(1)}t`,
      subtext: `Turnaround: ${state.avg_turnaround.toFixed(1)}t`,
      icon: Clock,
      color: 'text-violet',
      borderColor: 'border-violet/30',
    },
    {
      title: 'DEADLINE MISSES',
      value: state.deadline_misses,
      subtext: `${state.completed_count ? ((state.deadline_misses / state.completed_count) * 100).toFixed(0) : 0}% miss ratio`,
      icon: AlertTriangle,
      color: state.deadline_misses === 0 ? 'text-success' : 'text-danger',
      borderColor: state.deadline_misses === 0 ? 'border-success/30' : 'border-danger/30',
    },
  ];

  return (
    <div className="relative w-full pt-6 pb-16 overflow-hidden">
      {/* Background Spatial Glows */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-radial-cyan pointer-events-none opacity-40 blur-3xl" />
      <div className="absolute top-24 right-1/4 w-[500px] h-[500px] bg-radial-violet pointer-events-none opacity-30 blur-3xl" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Main Grid: Headline + 3D Processor */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Hero Content */}
          <div className="lg:col-span-5 space-y-6 z-10">
            <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-cyan/10 border border-cyan/25 text-cyan text-xs font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan animate-ping" />
              <span>SPATIAL COMPUTING SCHEDULER // 2026</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-textPrimary leading-none">
                PULSEQUEUE <span className="bg-gradient-to-r from-cyan to-violet bg-clip-text text-transparent">X</span>
              </h1>
              <h2 className="text-sm sm:text-base font-mono tracking-widest text-textMuted uppercase">
                PREDICTIVE PROCESS SCHEDULING ENGINE
              </h2>
            </div>

            <p className="text-base sm:text-lg text-[#BAC7DC] font-light leading-relaxed max-w-xl">
              "Intelligent scheduling. Adaptive execution."
              <br />
              An operating-system command center powered by an <span className="text-cyan font-mono font-medium">Indexed Min-Heap</span> with linear-time rebuilds, dynamic priority aging, and deadline slack urgency.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <button
                onClick={() => onNavigate('scheduler')}
                className="flex items-center space-x-2.5 px-6 py-3 rounded-xl bg-gradient-to-r from-cyan to-[#25B5C5] text-[#080B12] font-semibold text-sm shadow-cyan-glow hover:opacity-95 transition-all"
              >
                <span>Launch Simulator</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('arena')}
                className="flex items-center space-x-2 px-5 py-3 rounded-xl bg-secondary/80 hover:bg-secondary border border-white/10 text-textPrimary text-sm font-medium transition-all"
              >
                <span>Explore Algorithm Arena</span>
              </button>

              <button
                onClick={onToggleRun}
                className="flex items-center space-x-2 px-4 py-3 rounded-xl bg-panel border border-white/10 text-textMuted hover:text-textPrimary text-sm transition-all"
              >
                <Play className="w-4 h-4 text-cyan fill-cyan" />
                <span>{state.running ? 'Pause Sim' : 'Quick Run'}</span>
              </button>
            </div>
          </div>

          {/* Right: 3D Spatial Processor View */}
          <div className="lg:col-span-7 relative">
            <div className="relative w-full rounded-2xl glass-panel p-2 overflow-hidden border border-white/10 shadow-glass">
              {/* Top Processor Tag */}
              <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-1 rounded-full bg-secondary/80 border border-white/10 backdrop-blur-md">
                <Cpu className="w-3.5 h-3.5 text-cyan" />
                <span className="text-xs font-mono text-textPrimary">SMP Octa-Core Architecture</span>
              </div>

              {/* 3D Canvas */}
              <ProcessorCanvas
                cores={state.multicore.cores}
                activePid={state.active_pid}
                overallUtilization={state.multicore.overall_utilization}
                onSelectCore={() => onNavigate('cores')}
              />
            </div>
          </div>
        </div>

        {/* Floating Vision Pro Glass KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-12">
          {kpis.map((kpi, idx) => {
            const Icon = kpi.icon;
            return (
              <div
                key={idx}
                className="glass-panel-interactive p-4 rounded-xl flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono tracking-wider text-textMuted uppercase">{kpi.title}</span>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
                <div className="my-2">
                  <div className="text-2xl font-mono font-bold text-textPrimary tracking-tight">
                    {kpi.value}
                  </div>
                </div>
                <div className="text-[11px] font-sans text-textMuted truncate">
                  {kpi.subtext}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

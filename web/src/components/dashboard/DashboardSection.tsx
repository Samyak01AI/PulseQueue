import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { EngineState } from '../../types';
import { Tooltip } from '../common/Tooltip';
import { ProcessorCanvas } from '../3d/ProcessorCanvas';
import {
  Play,
  ArrowRight,
  Sparkles,
  Layers,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  EyeOff,
  Sliders,
  Trophy,
  BookOpen,
  Activity,
  Zap,
} from 'lucide-react';

interface DashboardSectionProps {
  state: EngineState;
  onNavigate: (tab: string) => void;
  onToggleRun: () => void;
  onLoadSample: () => void;
}

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  state,
  onNavigate,
  onToggleRun,
  onLoadSample,
}) => {
  const [show3D, setShow3D] = useState(true);
  const activeTask = state.tasks.find((t) => t.pid === state.active_pid);

  const statusLabel = state.done ? 'Completed' : state.running ? 'Running' : state.clock > 0 ? 'Paused' : 'Ready';
  const statusColor = state.done
    ? 'text-success bg-success/15 border-success/30'
    : state.running
    ? 'text-cyan bg-cyan/15 border-cyan/30'
    : state.clock > 0
    ? 'text-warning bg-warning/15 border-warning/30'
    : 'text-textMuted bg-white/5 border-white/10';

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* 1. Signature Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-panel p-6 sm:p-10 rounded-3xl border border-white/10 relative overflow-hidden shadow-2xl"
      >
        {/* Ambient Subtle Background Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-violet/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-3xl space-y-5 relative z-10">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan/10 border border-cyan/30 text-cyan text-xs font-mono">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2026 Spatial Operating System Laboratory</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-textPrimary leading-tight">
              PulseQueue
            </h1>
            <p className="text-xl sm:text-2xl font-light text-cyan/90 tracking-wide font-sans">
              Intelligent Process Scheduling, Visualized.
            </p>
          </div>

          <p className="text-sm sm:text-base text-textMuted leading-relaxed max-w-2xl">
            A self-adaptive CPU scheduling platform built on custom Indexed Binary Heaps and priority aging.
            Observe real-time thread dispatching, inspect mathematical preemption decisions, and benchmark classic scheduling algorithms on identical workloads.
          </p>

          {/* Signature Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('simulation')}
              className="flex items-center space-x-2.5 px-6 py-3.5 rounded-xl bg-cyan text-[#07090E] font-bold text-sm shadow-cyan-glow hover:bg-cyan/90 transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Simulation</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onLoadSample}
              className="flex items-center space-x-2 px-5 py-3.5 rounded-xl bg-secondary/80 hover:bg-white/10 text-textPrimary text-sm font-semibold border border-white/10 transition-all cursor-pointer"
            >
              <span>Try Sample Workload</span>
              <ArrowRight className="w-4 h-4 text-cyan" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('manager')}
              className="flex items-center space-x-2 px-4 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-textMuted hover:text-textPrimary text-sm font-medium border border-white/5 transition-all cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-violet" />
              <span>What-If Lab</span>
            </motion.button>

            <button
              onClick={() => setShow3D(!show3D)}
              className="flex items-center space-x-1.5 px-3.5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-textMuted hover:text-textPrimary text-xs font-mono transition-all ml-auto"
            >
              {show3D ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5 text-cyan" />}
              <span>{show3D ? 'Hide 3D Silicon' : 'Show 3D Silicon'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* 2. Visual Centerpiece: Interactive 3D CPU Processor */}
      {show3D && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5 rounded-3xl border border-cyan/20 shadow-2xl relative overflow-hidden"
        >
          <div className="flex items-center justify-between pb-3 px-2 border-b border-white/[0.07]">
            <div className="flex items-center space-x-2.5">
              <Cpu className="w-4 h-4 text-cyan" />
              <span className="text-xs font-mono font-bold text-textPrimary tracking-wider uppercase">
                Silicon Die & Multi-Core SMP Spatial Visualization
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-textMuted">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span>WebGL Interactive Die ({state.multicore.num_cores} Cores Active)</span>
            </div>
          </div>

          <ProcessorCanvas
            cores={state.multicore.cores}
            activePid={state.active_pid}
            overallUtilization={state.multicore.overall_utilization}
          />
        </motion.div>
      )}

      {/* 3. Five Key Dashboard Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        {/* Total Processes */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-textMuted text-xs font-medium">
            <span>Total Processes</span>
            <Tooltip content="The total number of processes registered in the current workload." />
          </div>
          <div className="text-3xl font-mono font-bold text-textPrimary mt-2">
            {state.total_tasks}
          </div>
          <div className="text-[11px] text-textMuted mt-1">
            {state.tasks.filter((t) => t.status === 'READY').length} waiting in line
          </div>
        </div>

        {/* Running Process */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-textMuted text-xs font-medium">
            <span>Running Process</span>
            <Tooltip content="The task currently occupying the CPU execution pipeline." />
          </div>
          <div className="text-3xl font-mono font-bold text-cyan mt-2">
            {activeTask ? `P${String(activeTask.pid).padStart(2, '0')}` : 'Idle'}
          </div>
          <div className="text-[11px] text-textMuted mt-1 truncate">
            {activeTask ? `${activeTask.remaining} ticks remaining` : 'No task on core'}
          </div>
        </div>

        {/* Completed Processes */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-textMuted text-xs font-medium">
            <span>Completed</span>
            <Tooltip content="Tasks that have finished all required CPU burst execution cycles." />
          </div>
          <div className="text-3xl font-mono font-bold text-success mt-2">
            {state.completed_count}
          </div>
          <div className="text-[11px] text-textMuted mt-1">
            {state.total_tasks ? Math.round((state.completed_count / state.total_tasks) * 100) : 0}% completion rate
          </div>
        </div>

        {/* Average Waiting Time */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-textMuted text-xs font-medium">
            <span>Avg Waiting</span>
            <Tooltip content="The average ticks completed tasks spent waiting in the ready queue." />
          </div>
          <div className="text-3xl font-mono font-bold text-violet mt-2">
            {state.avg_wait.toFixed(1)}t
          </div>
          <div className="text-[11px] text-textMuted mt-1">
            Latency metric
          </div>
        </div>

        {/* Scheduler Status */}
        <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-cyan/30 transition-all">
          <div className="flex items-center justify-between text-textMuted text-xs font-medium">
            <span>Engine Status</span>
            <Tooltip content="Current state of the real-time simulation engine." />
          </div>
          <div className="mt-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold border inline-block ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
          <div className="text-[11px] text-textMuted mt-1 font-mono">
            Tick {state.clock} // {state.speed_ms}ms
          </div>
        </div>
      </div>

      {/* 4. Five-Step Guided Journey for Beginners & Judges */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Layers className="w-5 h-5 text-cyan" />
            <h2 className="text-base font-bold text-textPrimary tracking-tight">
              PulseQueue Laboratory Workflow
            </h2>
          </div>
          <span className="text-xs font-mono text-textMuted">Complete Interactive Lifecycle</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Step 1 */}
          <div
            onClick={() => onNavigate('manager')}
            className="p-4 rounded-2xl bg-secondary/50 border border-white/5 hover:border-cyan/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan/15 text-cyan flex items-center justify-center font-mono font-bold text-xs group-hover:scale-110 transition-transform">
              1
            </div>
            <h3 className="text-xs font-bold text-textPrimary group-hover:text-cyan transition-colors">
              Add Processes
            </h3>
            <p className="text-[11px] text-textMuted leading-relaxed">
              Define arrival, burst times, and deadlines, or load one-click preset workloads.
            </p>
          </div>

          {/* Step 2 */}
          <div
            onClick={() => onNavigate('simulation')}
            className="p-4 rounded-2xl bg-secondary/50 border border-white/5 hover:border-cyan/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-cyan/15 text-cyan flex items-center justify-center font-mono font-bold text-xs group-hover:scale-110 transition-transform">
              2
            </div>
            <h3 className="text-xs font-bold text-textPrimary group-hover:text-cyan transition-colors">
              Launch Simulation
            </h3>
            <p className="text-[11px] text-textMuted leading-relaxed">
              Step through execution tick-by-tick or run continuously with speed control.
            </p>
          </div>

          {/* Step 3 */}
          <div
            onClick={() => onNavigate('simulation')}
            className="p-4 rounded-2xl bg-secondary/50 border border-white/5 hover:border-violet/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-violet/15 text-violet flex items-center justify-center font-mono font-bold text-xs group-hover:scale-110 transition-transform">
              3
            </div>
            <h3 className="text-xs font-bold text-textPrimary group-hover:text-violet transition-colors">
              Inspect Gantt & Replay
            </h3>
            <p className="text-[11px] text-textMuted leading-relaxed">
              Click Gantt blocks to inspect execution intervals or scrub back through time.
            </p>
          </div>

          {/* Step 4 */}
          <div
            onClick={() => onNavigate('simulation')}
            className="p-4 rounded-2xl bg-secondary/50 border border-white/5 hover:border-violet/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-violet/15 text-violet flex items-center justify-center font-mono font-bold text-xs group-hover:scale-110 transition-transform">
              4
            </div>
            <h3 className="text-xs font-bold text-textPrimary group-hover:text-violet transition-colors">
              Explain Decisions
            </h3>
            <p className="text-[11px] text-textMuted leading-relaxed">
              Inspect why each process was chosen with plain-English narratives and heap math.
            </p>
          </div>

          {/* Step 5 */}
          <div
            onClick={() => onNavigate('arena')}
            className="p-4 rounded-2xl bg-secondary/50 border border-white/5 hover:border-success/40 cursor-pointer transition-all space-y-2 group"
          >
            <div className="w-7 h-7 rounded-lg bg-success/15 text-success flex items-center justify-center font-mono font-bold text-xs group-hover:scale-110 transition-transform">
              5
            </div>
            <h3 className="text-xs font-bold text-textPrimary group-hover:text-success transition-colors">
              Battle Arena
            </h3>
            <p className="text-[11px] text-textMuted leading-relaxed">
              Compare PulseQueue head-to-head with FCFS, SJF, RR, and Static Priority.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

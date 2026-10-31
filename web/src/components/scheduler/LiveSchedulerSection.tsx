import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EngineState, TaskData } from '../../types';
import { ProcessInspectorModal } from './ProcessInspectorModal';
import { ProcessorCanvas } from '../3d/ProcessorCanvas';
import {
  Play,
  Pause,
  StepForward,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Zap,
  Clock,
  AlertTriangle,
  Layers,
  Info,
  ShieldAlert,
  Rewind,
  FastForward,
  Eye,
  EyeOff,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

interface LiveSchedulerSectionProps {
  state: EngineState;
  onToggleRun: () => void;
  onStep: () => void;
  onReset: () => void;
  onUpdateConfig: (cfg: Record<string, any>) => void;
}

export const LiveSchedulerSection: React.FC<LiveSchedulerSectionProps> = ({
  state,
  onToggleRun,
  onStep,
  onReset,
  onUpdateConfig,
}) => {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [inspectedPid, setInspectedPid] = useState<number | null>(null);
  const [replayTick, setReplayTick] = useState<number | null>(null);
  const [show3DCore, setShow3DCore] = useState(true);

  // Replay mode resolution
  const isReplayMode = replayTick !== null && replayTick <= state.clock;
  const effectiveClock = isReplayMode ? replayTick : state.clock;

  // Find active task at the effective tick
  let effectivePid = state.active_pid;
  if (isReplayMode) {
    const historicalEntry = state.history.find(([t]) => t === replayTick);
    effectivePid = historicalEntry ? historicalEntry[1] : null;
  }
  const activeTask = state.tasks.find((t) => t.pid === effectivePid);

  // Find explanation at the effective tick
  let effectiveExplanation = state.latest_explanation;
  if (isReplayMode && state.explanations && state.explanations.length > 0) {
    const matched = state.explanations.find((e) => e.clock === replayTick);
    if (matched) {
      effectiveExplanation = matched;
    }
  }

  // Inspected task object
  const inspectedTask = state.tasks.find((t) => t.pid === inspectedPid) || null;

  // Group continuous execution blocks for the Gantt timeline
  const visibleTicks = state.history.slice(-55);
  const segments: { pid: number | null; count: number; start: number; end: number }[] = [];

  if (visibleTicks.length > 0) {
    let curPid = visibleTicks[0][1];
    let startTick = visibleTicks[0][0];
    let count = 1;

    for (let i = 1; i < visibleTicks.length; i++) {
      const pid = visibleTicks[i][1];
      if (pid === curPid) {
        count++;
      } else {
        segments.push({ pid: curPid, count, start: startTick, end: startTick + count - 1 });
        curPid = pid;
        startTick = visibleTicks[i][0];
        count = 1;
      }
    }
    segments.push({ pid: curPid, count, start: startTick, end: startTick + count - 1 });
  }

  // Friendly plain-English decision narrative generator
  const getSimpleExplanation = () => {
    if (!effectiveExplanation || !activeTask) {
      if (state.done && !isReplayMode) {
        return 'All processes have completed their execution cycles successfully.';
      }
      return 'The CPU was idle during this tick: no processes had arrived or all arrived processes were completed.';
    }

    const exp = effectiveExplanation;
    const taskName = `Process P${String(exp.pid).padStart(2, '0')}`;

    if (exp.preempted_pid) {
      return `⚡ Preemption Event: ${taskName} stepped in to preempt Process P${String(exp.preempted_pid).padStart(2, '0')} because its approaching deadline required immediate priority attention.`;
    }

    if (exp.waited_ticks && exp.waited_ticks >= 4) {
      return `${taskName} was dispatched because it had waited in queue for ${exp.waited_ticks} ticks. PulseQueue's priority aging boosted its score to prevent thread starvation.`;
    }

    if (exp.slack_ticks !== null && exp.slack_ticks <= 5) {
      return `${taskName} was dispatched because its deadline is very close (${exp.slack_ticks} ticks remaining). Priority was elevated to ensure on-time delivery.`;
    }

    return `${taskName} was dispatched because it currently holds the highest effective priority among all ready processes in the queue.`;
  };

  const statusColor = state.done
    ? 'text-success bg-success/15 border-success/30'
    : state.running
    ? 'text-cyan bg-cyan/15 border-cyan/30'
    : state.clock > 0
    ? 'text-warning bg-warning/15 border-warning/30'
    : 'text-textMuted bg-white/5 border-white/10';

  const statusLabel = state.done
    ? 'Completed'
    : state.running
    ? 'Running'
    : state.clock > 0
    ? 'Paused'
    : 'Ready';

  // Starvation monitor tasks
  const waitingTasks = state.tasks.filter((t) => t.status === 'READY' || t.status === 'STARVED');

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Simulation Replay Banner if in Replay Mode */}
      {isReplayMode && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-violet/15 border border-violet/30 flex items-center justify-between shadow-lg"
        >
          <div className="flex items-center space-x-3">
            <Rewind className="w-5 h-5 text-violet animate-pulse" />
            <div>
              <span className="text-xs font-mono font-bold text-violet uppercase tracking-wide block">
                REPLAY MODE: INSPECTING TICK {replayTick} OF {state.clock}
              </span>
              <span className="text-[11px] text-textMuted">
                All telemetry, active process cards, and decision breakdowns below reflect this exact historical tick.
              </span>
            </div>
          </div>
          <button
            onClick={() => setReplayTick(null)}
            className="px-4 py-2 rounded-xl bg-violet text-[#07090E] font-bold text-xs hover:bg-violet/90 transition-all cursor-pointer shadow-sm"
          >
            Return to Live
          </button>
        </motion.div>
      )}

      {/* 1. Central Spatial 3D CPU Visualization */}
      <div className="glass-panel p-5 rounded-3xl border border-cyan/20 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between pb-3 px-2 border-b border-white/[0.07]">
          <div className="flex items-center space-x-2.5">
            <Cpu className="w-4 h-4 text-cyan" />
            <h2 className="text-xs font-mono font-bold text-textPrimary tracking-wider uppercase">
              Spatial CPU Architecture & Execution Core
            </h2>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-textMuted">
              <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
              <span className="hidden sm:inline">Active Cores:</span>
              <span className="text-cyan font-bold">{state.multicore.cores.filter((c) => c.active_pid !== null).length} / {state.multicore.num_cores}</span>
            </div>

            <button
              onClick={() => setShow3DCore(!show3DCore)}
              className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-textPrimary text-xs font-mono transition-all"
              title={show3DCore ? 'Collapse 3D view' : 'Expand 3D view'}
            >
              {show3DCore ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {show3DCore && (
          <div className="relative">
            <ProcessorCanvas
              cores={state.multicore.cores}
              activePid={effectivePid}
              overallUtilization={state.multicore.overall_utilization}
            />
          </div>
        )}
      </div>

      {/* 2. Currently Executing Process Card */}
      <motion.div
        layout
        className="glass-panel p-6 rounded-3xl border border-cyan/30 shadow-xl space-y-4"
      >
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-textMuted uppercase tracking-wider font-mono">
            {isReplayMode ? `PROCESS EXECUTING AT TICK ${replayTick}` : 'CURRENTLY EXECUTING PROCESS'}
          </span>
          <span
            className={`px-3 py-1 rounded-full text-[11px] font-mono font-bold border ${
              activeTask
                ? 'text-cyan bg-cyan/15 border-cyan/30 shadow-cyan-glow'
                : 'text-textMuted bg-white/5 border-white/10'
            }`}
          >
            {activeTask ? 'DISPATCHED ON CPU' : 'CPU IDLE'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div
              className="text-3xl sm:text-4xl font-mono font-black cursor-pointer hover:underline flex items-center space-x-2"
              style={{ color: activeTask?.color || '#94A3B8' }}
              onClick={() => activeTask && setInspectedPid(activeTask.pid)}
              title="Click to open comprehensive process inspection"
            >
              <span>{activeTask ? `Process P${String(activeTask.pid).padStart(2, '0')}` : 'No Active Process'}</span>
            </div>
            <p className="text-xs text-textMuted mt-1">
              {activeTask
                ? `${activeTask.process_type} process • Arrived at Tick ${activeTask.arrival} • Base Priority: ${activeTask.priority} (Click name to inspect)`
                : 'Waiting for ready processes to enter the CPU core.'}
            </p>
          </div>

          {activeTask && (
            <div className="flex items-center space-x-4 bg-secondary/80 px-5 py-3 rounded-2xl border border-white/10 shadow-sm">
              <div className="text-center">
                <span className="text-[10px] text-textMuted block font-mono">REMAINING</span>
                <span className="text-base font-mono font-bold text-cyan">
                  {activeTask.remaining} ticks
                </span>
              </div>
              <div className="w-px h-7 bg-white/10" />
              <div className="text-center">
                <span className="text-[10px] text-textMuted block font-mono">DEADLINE</span>
                <span className="text-base font-mono font-bold text-textPrimary">
                  Tick {activeTask.deadline}
                </span>
              </div>
              <div className="w-px h-7 bg-white/10" />
              <button
                onClick={() => setInspectedPid(activeTask.pid)}
                className="px-3 py-1.5 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan text-xs font-semibold font-mono transition-all cursor-pointer"
              >
                Inspect →
              </button>
            </div>
          )}
        </div>

        {/* Execution Progress Bar */}
        {activeTask && (
          <div className="space-y-1.5 pt-2">
            <div className="flex justify-between text-xs text-textMuted font-medium font-mono">
              <span>Execution Progress</span>
              <span className="text-cyan font-bold">
                {activeTask.executed} of {activeTask.burst} ticks completed (
                {Math.round((activeTask.executed / activeTask.burst) * 100)}%)
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan via-violet to-cyan transition-all duration-300 rounded-full"
                style={{ width: `${(activeTask.executed / activeTask.burst) * 100}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* 3. Explainable Scheduling Card (Why was this process selected?) */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-cyan" />
            <h3 className="text-sm font-bold text-textPrimary">
              Why was this process selected?
            </h3>
          </div>

          {effectiveExplanation && (
            <button
              onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
              className="flex items-center space-x-1.5 text-xs text-cyan hover:underline font-mono cursor-pointer"
            >
              <span>{showTechnicalDetails ? 'Hide Priority Breakdown' : 'View Priority Score Breakdown'}</span>
              {showTechnicalDetails ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>

        <p className="text-sm text-textPrimary leading-relaxed">
          {getSimpleExplanation()}
        </p>

        {/* Expandable Technical Math Breakdown */}
        <AnimatePresence>
          {showTechnicalDetails && effectiveExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-white/10 space-y-3 text-xs font-mono overflow-hidden"
            >
              <div className="p-3 rounded-xl bg-secondary/60 border border-white/5 space-y-1 font-sans text-textMuted">
                <span className="text-textPrimary font-semibold text-xs block">
                  Self-Adaptive Scoring Formula (Lower Score = Higher Execution Priority):
                </span>
                <code className="text-cyan font-mono text-xs block">
                  Score = Base Priority - (Aging × Waited Ticks) - (Urgency Penalty)
                </code>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center font-mono">
                <div className="p-3 rounded-xl bg-secondary">
                  <span className="text-[10px] text-textMuted block">BASE PRIORITY</span>
                  <span className="font-bold text-textPrimary text-base">
                    {effectiveExplanation.base_priority ?? '--'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary">
                  <span className="text-[10px] text-textMuted block">
                    AGING BOOST ({effectiveExplanation.waited_ticks ?? 0}t waited)
                  </span>
                  <span className="font-bold text-success text-base">
                    -{effectiveExplanation.aging_discount ? effectiveExplanation.aging_discount.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary">
                  <span className="text-[10px] text-textMuted block">
                    DEADLINE URGENCY ({effectiveExplanation.slack_ticks ?? 0}t slack)
                  </span>
                  <span className="font-bold text-danger text-base">
                    -{effectiveExplanation.urgency_discount ? effectiveExplanation.urgency_discount.toFixed(2) : '0.00'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-secondary border border-cyan/40 shadow-sm">
                  <span className="text-[10px] text-cyan block font-bold">HEAP SCORE</span>
                  <span className="font-bold text-cyan text-base">
                    {effectiveExplanation.score !== null && effectiveExplanation.score !== undefined
                      ? effectiveExplanation.score.toFixed(2)
                      : '--'}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Interactive Gantt Timeline with Clickable Blocks & Replay Scrubber */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan" />
            <h3 className="text-sm font-bold text-textPrimary">
              Interactive Execution Gantt Timeline
            </h3>
          </div>
          <span className="text-xs text-textMuted font-mono">
            Click any block to inspect timing & history
          </span>
        </div>

        {/* Timeline Bar */}
        <div className="w-full h-14 bg-[#0B101B] rounded-2xl border border-white/5 p-1.5 flex items-center overflow-x-auto shadow-inner">
          {segments.length === 0 ? (
            <div className="w-full text-center text-xs text-textMuted font-mono">
              Press Start or Next Step to begin execution on timeline.
            </div>
          ) : (
            segments.map((seg, idx) => {
              const taskObj = seg.pid !== null ? state.tasks.find((t) => t.pid === seg.pid) : null;
              const color = taskObj ? taskObj.color : '#162032';
              const isSelected = seg.pid !== null && seg.pid === inspectedPid;
              const isReplayingThis =
                isReplayMode && replayTick >= seg.start && replayTick <= seg.end;

              return (
                <div
                  key={idx}
                  onClick={() => seg.pid && setInspectedPid(seg.pid)}
                  style={{ flex: seg.count, backgroundColor: color }}
                  title={
                    seg.pid
                      ? `Process P${seg.pid} executed for ${seg.count} ticks (Tick ${seg.start} to ${seg.end}). Click to inspect.`
                      : `CPU Idle for ${seg.count} ticks (Tick ${seg.start} to ${seg.end})`
                  }
                  className={`h-11 rounded-lg mx-0.5 flex flex-col items-center justify-center transition-all cursor-pointer hover:opacity-95 hover:scale-[1.02] ${
                    isSelected ? 'ring-2 ring-white shadow-lg' : ''
                  } ${isReplayingThis ? 'ring-2 ring-violet animate-pulse' : ''}`}
                >
                  <span className="font-mono font-bold text-[11px] text-[#07090E]">
                    {seg.pid ? `P${String(seg.pid).padStart(2, '0')}` : 'IDLE'}
                  </span>
                  <span className="text-[9px] font-mono text-[#07090E]/80 font-bold">
                    {seg.count}t
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Simulation Replay Scrubber Controls */}
        <div className="pt-2 border-t border-white/5 space-y-2">
          <div className="flex items-center justify-between text-xs text-textMuted">
            <span className="font-semibold text-textPrimary flex items-center space-x-1.5">
              <Rewind className="w-3.5 h-3.5 text-violet" />
              <span>Simulation Replay Scrubber:</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setReplayTick(Math.max(0, (replayTick ?? state.clock) - 1))}
                disabled={state.clock === 0}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-white/10 text-textPrimary font-mono text-[11px] disabled:opacity-40 cursor-pointer"
              >
                ⏪ -1 Tick
              </button>
              <button
                onClick={() => {
                  const nxt = (replayTick ?? 0) + 1;
                  if (nxt >= state.clock) setReplayTick(null);
                  else setReplayTick(nxt);
                }}
                disabled={replayTick === null || replayTick >= state.clock}
                className="px-2.5 py-1 rounded-lg bg-secondary hover:bg-white/10 text-textPrimary font-mono text-[11px] disabled:opacity-40 cursor-pointer"
              >
                +1 Tick ⏩
              </button>
              {isReplayMode && (
                <button
                  onClick={() => setReplayTick(null)}
                  className="px-2.5 py-1 rounded-lg bg-cyan/15 text-cyan hover:bg-cyan/25 font-mono text-[11px] cursor-pointer"
                >
                  🔴 Return to Live
                </button>
              )}
            </div>
          </div>

          <input
            type="range"
            min={0}
            max={Math.max(1, state.clock)}
            value={replayTick ?? state.clock}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              if (val >= state.clock) {
                setReplayTick(null);
              } else {
                setReplayTick(val);
              }
            }}
            disabled={state.clock === 0}
            className="w-full accent-cyan cursor-pointer"
          />
        </div>
      </div>

      {/* 5. Starvation Monitor Section */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-warning" />
            <h3 className="text-sm font-bold text-textPrimary">
              Starvation Monitor & Dynamic Priority Aging
            </h3>
          </div>
          <span className="text-xs text-textMuted font-mono">
            Starvation Threshold: {state.starvation_threshold} ticks waiting
          </span>
        </div>

        <p className="text-xs text-textMuted leading-relaxed">
          In static priority scheduling, low-priority tasks wait indefinitely (starvation). PulseQueue's aging algorithm automatically accumulates negative score discounts over waiting time, guaranteeing eventual CPU dispatch.
        </p>

        {waitingTasks.length === 0 ? (
          <div className="py-4 text-center text-xs text-textMuted font-mono">
            No processes are currently waiting in queue.
          </div>
        ) : (
          <div className="space-y-3">
            {waitingTasks.map((task) => {
              const waited = task.waited_ticks ?? 0;
              const threshold = state.starvation_threshold || 15;
              const ratio = Math.min(100, Math.round((waited / threshold) * 100));
              const isStarved = waited >= threshold;
              const isWarning = waited >= threshold * 0.5 && !isStarved;

              return (
                <div
                  key={task.pid}
                  className="p-4 rounded-2xl bg-secondary/50 border border-white/5 space-y-2 hover:border-cyan/30 transition-all"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2.5">
                      <span
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: task.color }}
                      />
                      <span className="font-mono font-bold text-textPrimary">
                        Process P{String(task.pid).padStart(2, '0')}
                      </span>
                      <span className="text-textMuted font-mono">
                        (Base Priority: {task.priority})
                      </span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                          isStarved
                            ? 'bg-danger/20 text-danger border-danger/40 animate-pulse'
                            : isWarning
                            ? 'bg-warning/20 text-warning border-warning/40'
                            : 'bg-success/20 text-success border-success/40'
                        }`}
                      >
                        {isStarved ? 'CRITICAL STARVATION' : isWarning ? 'WARNING' : 'HEALTHY'}
                      </span>
                      <button
                        onClick={() => setInspectedPid(task.pid)}
                        className="text-xs text-cyan hover:underline font-mono cursor-pointer"
                      >
                        Details →
                      </button>
                    </div>
                  </div>

                  {/* Progress towards threshold */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-textMuted">
                      <span>Waited: {waited} / {threshold} ticks</span>
                      <span className="text-success font-bold">
                        Aging Boost: -{(state.aging * waited).toFixed(2)} pts
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isStarved ? 'bg-danger' : isWarning ? 'bg-warning' : 'bg-cyan'
                        }`}
                        style={{ width: `${ratio}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 6. Process Waiting Queue List */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-3 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-violet" />
            <h3 className="text-sm font-bold text-textPrimary">
              Process Ready Queue ({state.ready_heap.length} waiting)
            </h3>
          </div>
          <span className="text-xs text-textMuted font-mono">Indexed Min-Heap Order</span>
        </div>

        {state.ready_heap.length === 0 ? (
          <div className="py-6 text-center text-xs text-textMuted font-mono">
            Queue is empty. No other processes are waiting right now.
          </div>
        ) : (
          <div className="flex items-center space-x-3 overflow-x-auto pb-2 scrollbar-thin">
            {state.ready_heap.map((item) => (
              <div
                key={item.pid}
                onClick={() => setInspectedPid(item.pid)}
                className={`flex-shrink-0 w-40 p-3.5 rounded-2xl border transition-all cursor-pointer hover:border-cyan/50 hover:scale-[1.02] ${
                  item.rank === 1
                    ? 'bg-cyan/15 border-cyan/40 shadow-cyan-glow'
                    : 'bg-secondary/60 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-sm" style={{ color: item.color }}>
                    {`P${String(item.pid).padStart(2, '0')}`}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-textMuted font-mono">
                    #{item.rank} Next
                  </span>
                </div>
                <div className="mt-2 text-xs font-sans text-textMuted space-y-0.5">
                  <div>Needs: <span className="text-textPrimary font-bold font-mono">{item.remaining}t</span></div>
                  <div>Waited: <span className="text-cyan font-mono">{item.waited}t</span></div>
                  <div className="text-[10px] text-violet font-mono">Score: {item.score.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Inspector for clicked process */}
      <ProcessInspectorModal
        task={inspectedTask}
        history={state.history}
        currentClock={state.clock}
        onClose={() => setInspectedPid(null)}
      />
    </div>
  );
};

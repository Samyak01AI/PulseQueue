import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { EngineState, TaskData, WhatIfResponse, WhatIfTaskInput } from '../../types';
import {
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';

interface WhatIfSectionProps {
  state: EngineState;
  onApplyToLive: (tasks: WhatIfTaskInput[]) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export const WhatIfSection: React.FC<WhatIfSectionProps> = ({
  state,
  onApplyToLive,
  onNavigate,
}) => {
  // Working copy of tasks for modification
  const [tasks, setTasks] = useState<WhatIfTaskInput[]>([]);
  const [selectedPid, setSelectedPid] = useState<number | null>(null);

  // Configuration options
  const [algorithm, setAlgorithm] = useState<string>('PulseQueue Adaptive');
  const [aging, setAging] = useState<number>(0.6);
  const [deadlineWeight, setDeadlineWeight] = useState<number>(2.5);
  const [rrQuantum, setRrQuantum] = useState<number>(3);

  // Simulation results
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState<string | null>(null);

  // Initialize tasks from engine state
  useEffect(() => {
    if (state.tasks.length > 0) {
      const initial: WhatIfTaskInput[] = state.tasks.map((t) => ({
        pid: t.pid,
        arrival: t.arrival,
        burst: t.burst,
        priority: t.priority,
        deadline: t.deadline,
        process_type: t.process_type,
      }));
      setTasks(initial);
      setSelectedPid(initial[0]?.pid || null);
    }
  }, [state.workload_name, state.tasks.length]);

  // Run What-If simulation
  const runSimulation = async (tasksToSimulate: WhatIfTaskInput[] = tasks) => {
    if (!tasksToSimulate.length) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.simulateWhatIf({
        tasks: tasksToSimulate,
        algorithm,
        aging,
        deadline_weight: deadlineWeight,
        rr_quantum: rrQuantum,
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'What-If simulation failed');
    } finally {
      setLoading(false);
    }
  };

  // Run on mount or when algorithm/weights change
  useEffect(() => {
    if (tasks.length > 0) {
      runSimulation(tasks);
    }
  }, [algorithm, aging, deadlineWeight, rrQuantum]);

  // Selected task details
  const activeEditTask = tasks.find((t) => t.pid === selectedPid) || null;

  const handleUpdateTaskField = (field: keyof WhatIfTaskInput, value: any) => {
    if (!selectedPid) return;
    const updated = tasks.map((t) => {
      if (t.pid === selectedPid) {
        return { ...t, [field]: value };
      }
      return t;
    });
    setTasks(updated);
    runSimulation(updated);
  };

  const handleAddNewTask = () => {
    const nextPid = tasks.length > 0 ? Math.max(...tasks.map((t) => t.pid)) + 1 : 1;
    const newTask: WhatIfTaskInput = {
      pid: nextPid,
      arrival: 0,
      burst: 4,
      priority: 3,
      deadline: 18,
      process_type: 'Interactive',
    };
    const updated = [...tasks, newTask];
    setTasks(updated);
    setSelectedPid(nextPid);
    runSimulation(updated);
  };

  const handleDeleteTask = (pid: number) => {
    const updated = tasks.filter((t) => t.pid !== pid);
    setTasks(updated);
    if (selectedPid === pid) {
      setSelectedPid(updated[0]?.pid || null);
    }
    runSimulation(updated);
  };

  const handleApplyChanges = async () => {
    try {
      setApplySuccess(null);
      await onApplyToLive(tasks);
      setApplySuccess('Changes applied to Live Simulation!');
      setTimeout(() => {
        onNavigate('simulation');
      }, 900);
    } catch (err: any) {
      setError(err.message || 'Failed to apply changes to live simulator');
    }
  };

  // Helper to render timeline segments
  const renderTimeline = (timeline: [number, number | null][], title: string) => {
    const visible = timeline.slice(0, 50);
    const segments: { pid: number | null; count: number; start: number }[] = [];
    if (visible.length > 0) {
      let curPid = visible[0][1];
      let startTick = visible[0][0];
      let count = 1;
      for (let i = 1; i < visible.length; i++) {
        const pid = visible[i][1];
        if (pid === curPid) count++;
        else {
          segments.push({ pid: curPid, count, start: startTick });
          curPid = pid;
          startTick = visible[i][0];
          count = 1;
        }
      }
      segments.push({ pid: curPid, count, start: startTick });
    }

    return (
      <div className="space-y-1.5">
        <span className="text-xs font-semibold text-textMuted uppercase tracking-wider block">
          {title}
        </span>
        <div className="w-full h-11 bg-[#0B101B] rounded-xl border border-white/5 p-1 flex items-center overflow-x-auto">
          {segments.map((seg, idx) => {
            const taskObj = state.tasks.find((t) => t.pid === seg.pid);
            const color = taskObj ? taskObj.color : '#162032';
            return (
              <div
                key={idx}
                style={{ flex: seg.count, backgroundColor: color }}
                title={
                  seg.pid
                    ? `P${seg.pid} executed for ${seg.count} ticks (t=${seg.start})`
                    : `CPU Idle for ${seg.count} ticks`
                }
                className="h-8 rounded mx-0.5 flex flex-col items-center justify-center transition-all cursor-pointer hover:opacity-90"
              >
                <span className="font-mono font-bold text-[10px] text-[#080B12]">
                  {seg.pid ? `P${String(seg.pid).padStart(2, '0')}` : 'IDLE'}
                </span>
                <span className="text-[8px] font-mono text-[#080B12]/80 font-bold">
                  {seg.count}t
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono">
            <Sliders className="w-3.5 h-3.5" />
            <span>Interactive What-If Scenario Simulator</span>
          </div>
          <h2 className="text-2xl font-bold text-textPrimary">
            What-If Simulator
          </h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl">
            Tweak process attributes (arrival, burst, priority, deadline) or modify algorithm weights to see how the schedule and execution metrics change instantly.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => runSimulation(tasks)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan text-[#080B12] font-semibold text-xs hover:bg-cyan/90 transition-all shadow-sm disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{loading ? 'Simulating...' : 'Recalculate'}</span>
          </button>

          <button
            onClick={handleApplyChanges}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-violet/20 hover:bg-violet/30 text-violet border border-violet/40 font-semibold text-xs transition-all shadow-sm"
          >
            <span>Apply to Live Simulator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {applySuccess && (
        <div className="p-4 rounded-xl bg-success/15 border border-success/30 text-success text-xs font-mono flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{applySuccess} Redirecting to Live Simulation...</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Grid: Left Controls + Right Side-by-Side Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Attribute Modifier Panel */}
        <div className="lg:col-span-5 space-y-6">
          {/* Process Selector Pills */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                Select Process to Tweak
              </span>
              <button
                onClick={handleAddNewTask}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan/15 text-cyan hover:bg-cyan/25 text-xs font-mono transition-all"
              >
                <Plus className="w-3 h-3" />
                <span>Add Task</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {tasks.map((t) => {
                const isSelected = t.pid === selectedPid;
                return (
                  <button
                    key={t.pid}
                    onClick={() => setSelectedPid(t.pid)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 ${
                      isSelected
                        ? 'bg-cyan text-[#080B12] shadow-sm'
                        : 'bg-secondary text-textMuted hover:text-textPrimary hover:bg-white/10'
                    }`}
                  >
                    <span>P{String(t.pid).padStart(2, '0')}</span>
                    {tasks.length > 1 && isSelected && (
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(t.pid);
                        }}
                        className="hover:text-danger ml-1 p-0.5 rounded cursor-pointer"
                        title="Remove task"
                      >
                        ×
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sliders for Selected Process */}
          {activeEditTask && (
            <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <span className="text-xs font-bold text-cyan font-mono">
                  Modifying Process P{String(activeEditTask.pid).padStart(2, '0')}
                </span>
                <span className="text-xs text-textMuted">Live Reactivity</span>
              </div>

              {/* Execution Burst Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">Execution Time (Burst):</span>
                  <span className="text-cyan font-mono font-bold">
                    {activeEditTask.burst} ticks
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={activeEditTask.burst}
                  onChange={(e) => handleUpdateTaskField('burst', parseInt(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>

              {/* Arrival Time Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">Arrival Time:</span>
                  <span className="text-cyan font-mono font-bold">
                    Tick {activeEditTask.arrival}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="25"
                  value={activeEditTask.arrival}
                  onChange={(e) => handleUpdateTaskField('arrival', parseInt(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>

              {/* Base Priority Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">Base Priority (1 = High):</span>
                  <span className="text-violet font-mono font-bold">
                    Level {activeEditTask.priority}
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={activeEditTask.priority}
                  onChange={(e) => handleUpdateTaskField('priority', parseInt(e.target.value))}
                  className="w-full accent-violet cursor-pointer"
                />
              </div>

              {/* Target Deadline Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">Target Deadline:</span>
                  <span className="text-warning font-mono font-bold">
                    Tick {activeEditTask.deadline}
                  </span>
                </div>
                <input
                  type="range"
                  min={activeEditTask.arrival + activeEditTask.burst}
                  max="40"
                  value={activeEditTask.deadline}
                  onChange={(e) => handleUpdateTaskField('deadline', parseInt(e.target.value))}
                  className="w-full accent-warning cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Algorithm & Tuning Controls */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
            <span className="text-xs font-bold text-textPrimary uppercase tracking-wider block">
              Algorithm & Weights Experimentation
            </span>

            <div className="space-y-1.5">
              <label className="text-xs text-textMuted block">Scheduling Policy:</label>
              <select
                value={algorithm}
                onChange={(e) => setAlgorithm(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-secondary border border-white/10 text-xs text-textPrimary font-mono focus:outline-none focus:border-cyan"
              >
                <option value="PulseQueue Adaptive">PulseQueue Adaptive</option>
                <option value="Static Priority">Static Priority</option>
                <option value="Shortest Job First (SRTF)">Shortest Job First (SRTF)</option>
                <option value="Round Robin">Round Robin</option>
                <option value="FCFS">First Come First Served (FCFS)</option>
              </select>
            </div>

            {algorithm === 'PulseQueue Adaptive' && (
              <>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-textMuted">Aging Rate (α):</span>
                    <span className="text-success font-mono font-bold">{aging.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={aging}
                    onChange={(e) => setAging(parseFloat(e.target.value))}
                    className="w-full accent-success cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-textMuted">Deadline Urgency Weight (β):</span>
                    <span className="text-danger font-mono font-bold">{deadlineWeight.toFixed(1)}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="5"
                    step="0.5"
                    value={deadlineWeight}
                    onChange={(e) => setDeadlineWeight(parseFloat(e.target.value))}
                    className="w-full accent-danger cursor-pointer"
                  />
                </div>
              </>
            )}

            {algorithm === 'Round Robin' && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-textMuted">Time Quantum:</span>
                  <span className="text-cyan font-mono font-bold">{rrQuantum} ticks</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={rrQuantum}
                  onChange={(e) => setRrQuantum(parseInt(e.target.value))}
                  className="w-full accent-cyan cursor-pointer"
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Comparative Side-by-Side Outcome */}
        <div className="lg:col-span-7 space-y-6">
          {result && (
            <>
              {/* Direct Differential Impact Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Diff Waiting */}
                <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-textMuted uppercase font-medium block">
                    Avg Waiting Time
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-lg font-mono font-bold text-textPrimary">
                      {result.simulated.avg_wait.toFixed(2)}t
                    </span>
                    <span
                      className={`text-xs font-mono font-bold flex items-center ${
                        result.diff.avg_wait <= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {result.diff.avg_wait <= 0 ? '↓' : '↑'}
                      {Math.abs(result.diff.avg_wait).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] text-textMuted block">
                    vs {result.baseline.avg_wait.toFixed(2)}t baseline
                  </span>
                </div>

                {/* Diff Turnaround */}
                <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-textMuted uppercase font-medium block">
                    Avg Turnaround
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-lg font-mono font-bold text-textPrimary">
                      {result.simulated.avg_turnaround.toFixed(2)}t
                    </span>
                    <span
                      className={`text-xs font-mono font-bold flex items-center ${
                        result.diff.avg_turnaround <= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {result.diff.avg_turnaround <= 0 ? '↓' : '↑'}
                      {Math.abs(result.diff.avg_turnaround).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-[10px] text-textMuted block">
                    vs {result.baseline.avg_turnaround.toFixed(2)}t baseline
                  </span>
                </div>

                {/* Diff Misses */}
                <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-textMuted uppercase font-medium block">
                    Deadline Misses
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span
                      className={`text-lg font-mono font-bold ${
                        result.simulated.deadline_misses === 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {result.simulated.deadline_misses}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        result.diff.deadline_misses <= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {result.diff.deadline_misses < 0
                        ? `${result.diff.deadline_misses}`
                        : result.diff.deadline_misses > 0
                        ? `+${result.diff.deadline_misses}`
                        : '±0'}
                    </span>
                  </div>
                  <span className="text-[10px] text-textMuted block">
                    vs {result.baseline.deadline_misses} baseline
                  </span>
                </div>

                {/* Diff CPU Utilization */}
                <div className="glass-panel p-4 rounded-xl border border-white/10 space-y-1">
                  <span className="text-[10px] text-textMuted uppercase font-medium block">
                    CPU Utilization
                  </span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-lg font-mono font-bold text-textPrimary">
                      {result.simulated.cpu_utilization.toFixed(1)}%
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${
                        result.diff.cpu_utilization >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {result.diff.cpu_utilization >= 0 ? '+' : ''}
                      {result.diff.cpu_utilization.toFixed(1)}%
                    </span>
                  </div>
                  <span className="text-[10px] text-textMuted block">
                    vs {result.baseline.cpu_utilization.toFixed(1)}% baseline
                  </span>
                </div>
              </div>

              {/* Side-by-Side Timelines */}
              <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-xs font-bold text-textPrimary uppercase tracking-wider">
                    Schedule Comparison Timelines
                  </span>
                  <span className="text-xs text-textMuted font-mono">First 50 Ticks</span>
                </div>

                {renderTimeline(result.baseline.timeline, 'Baseline PulseQueue Schedule')}
                {renderTimeline(result.simulated.timeline, `What-If Schedule (${result.simulated.algorithm_name})`)}
              </div>

              {/* Plain-English Takeaway */}
              <div className="glass-panel p-5 rounded-2xl border border-cyan/20 bg-cyan/[0.02] space-y-2">
                <span className="text-xs font-bold text-cyan uppercase tracking-wider block">
                  Plain-English Impact Analysis
                </span>
                <p className="text-xs text-textPrimary leading-relaxed">
                  {result.diff.is_improvement
                    ? `🎉 Excellent! Your modifications improved or matched performance across all metrics. Average waiting time changed by ${result.diff.avg_wait} ticks and deadline misses are ${result.simulated.deadline_misses}.`
                    : `⚠️ Notice the tradeoff: Changing these attributes altered the schedule order. Average waiting time shifted by ${result.diff.avg_wait > 0 ? `+${result.diff.avg_wait}` : result.diff.avg_wait} ticks with ${result.simulated.deadline_misses} deadline misses.`}
                </p>
                <p className="text-[11px] text-textMuted">
                  Click <strong>Apply to Live Simulator</strong> to run this exact modified workload in real-time step-by-step!
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ArenaResponse, ArenaResultItem } from '../../types';
import { Tooltip } from '../common/Tooltip';
import {
  Trophy,
  Zap,
  Clock,
  Timer,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sparkles,
  Sliders,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';

interface PerformanceSectionProps {
  currentWorkload: string;
}

// Friendly display names and colors
const ALGO_CONFIG: Record<
  string,
  { label: string; badge: string; color: string; desc: string }
> = {
  'PulseQueue Adaptive': {
    label: 'PulseQueue Adaptive',
    badge: 'Our Engine',
    color: '#35D6E8',
    desc: 'Self-adjusting priority with starvation prevention and deadline awareness',
  },
  'Static Priority': {
    label: 'Priority Scheduling',
    badge: 'Standard',
    color: '#FF667A',
    desc: 'Executes highest priority first; prone to starving lower-priority tasks',
  },
  'Shortest Job First (SRTF)': {
    label: 'SJF (Shortest Job First)',
    badge: 'Standard',
    color: '#39D98A',
    desc: 'Selects the task with the smallest burst time remaining',
  },
  'Round Robin': {
    label: 'Round Robin (RR)',
    badge: 'Standard',
    color: '#8B7CFF',
    desc: 'Shares CPU by cycling through each task for a fixed time quantum',
  },
  FCFS: {
    label: 'FCFS (First Come First Served)',
    badge: 'Standard',
    color: '#FFB454',
    desc: 'Executes tasks strictly in the order they arrived, without preemption',
  },
};

export const PerformanceSection: React.FC<PerformanceSectionProps> = ({ currentWorkload }) => {
  const [data, setData] = useState<ArenaResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'wait' | 'turnaround' | 'cpu' | 'misses' | 'switches'>('wait');
  const [quantum, setQuantum] = useState<number>(3);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showTimelines, setShowTimelines] = useState(true);

  const fetchBenchmark = async (q = quantum) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getArenaBenchmark(q);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to calculate performance comparison');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, [currentWorkload]);

  const resultsList: ArenaResultItem[] = data ? Object.values(data.results) : [];

  // Determine winners
  const getWinner = (metric: 'wait' | 'turnaround' | 'cpu' | 'misses' | 'switches'): string => {
    if (!resultsList.length) return '';
    let best = resultsList[0];
    for (const r of resultsList) {
      if (metric === 'wait' && r.avg_wait < best.avg_wait) best = r;
      if (metric === 'turnaround' && r.avg_turnaround < best.avg_turnaround) best = r;
      if (metric === 'cpu' && r.cpu_utilization > best.cpu_utilization) best = r;
      if (metric === 'misses' && r.deadline_misses < best.deadline_misses) best = r;
      if (metric === 'switches' && r.context_switches < best.context_switches) best = r;
    }
    return best.algorithm_name;
  };

  const waitWinner = getWinner('wait');
  const turnaroundWinner = getWinner('turnaround');
  const cpuWinner = getWinner('cpu');
  const missesWinner = getWinner('misses');
  const switchesWinner = getWinner('switches');

  // Max values for chart scaling
  const maxWait = Math.max(...resultsList.map((r) => r.avg_wait), 1);
  const maxTurnaround = Math.max(...resultsList.map((r) => r.avg_turnaround), 1);
  const maxMisses = Math.max(...resultsList.map((r) => r.deadline_misses), 1);
  const maxSwitches = Math.max(...resultsList.map((r) => r.context_switches), 1);

  // Helper to render a compact timeline
  const renderMiniTimeline = (timeline: [number, number | null][], color: string) => {
    const visible = timeline.slice(0, 45);
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
      <div className="w-full h-8 bg-[#0B101B] rounded-lg border border-white/5 p-0.5 flex items-center overflow-x-auto">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            style={{
              flex: seg.count,
              backgroundColor: seg.pid ? color : '#151E2D',
              opacity: seg.pid ? 0.9 : 0.4,
            }}
            title={seg.pid ? `P${seg.pid}: ${seg.count} ticks` : `Idle: ${seg.count} ticks`}
            className="h-6 rounded mx-0.5 flex items-center justify-center transition-all cursor-pointer text-[9px] font-mono font-bold text-[#080B12]"
          >
            {seg.pid ? `P${seg.pid}` : ''}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono">
            <Trophy className="w-3.5 h-3.5 text-warning" />
            <span>Algorithm Battle Arena & Performance Dashboard</span>
          </div>
          <h2 className="text-2xl font-bold text-textPrimary">
            5-Algorithm Battle Arena
          </h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl">
            Simultaneously evaluates identical workloads across FCFS, SJF, Round Robin, Static Priority, and PulseQueue Adaptive using real calculated execution metrics.
          </p>
        </div>

        {/* Quantum tuning and Refresh */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-secondary border border-white/10 text-xs font-mono">
            <span className="text-textMuted">RR Quantum:</span>
            <input
              type="number"
              min="1"
              max="10"
              value={quantum}
              onChange={(e) => {
                const q = Math.max(1, parseInt(e.target.value) || 1);
                setQuantum(q);
                fetchBenchmark(q);
              }}
              className="w-10 bg-transparent text-cyan font-bold text-center focus:outline-none"
            />
          </div>

          <button
            onClick={() => fetchBenchmark(quantum)}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan text-[#080B12] font-semibold text-xs hover:bg-cyan/90 transition-all shadow-sm disabled:opacity-50"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Benchmarking...' : 'Re-Run Arena'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 5 Performance Dashboard Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {/* Metric 1: Avg Wait */}
        <div
          onClick={() => setSelectedMetric('wait')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMetric === 'wait'
              ? 'border-cyan bg-cyan/5 shadow-sm'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-textMuted">
            <span className="font-medium">Avg Waiting</span>
            <Tooltip content="Average ticks a process spends waiting in queue before execution. Lower is better." />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-textPrimary">
              {data?.results['PulseQueue Adaptive']?.avg_wait.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-textMuted ml-1">ticks</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center space-x-1">
            {waitWinner === 'PulseQueue Adaptive' ? (
              <span className="text-warning font-semibold flex items-center">
                ★ Best Result
              </span>
            ) : (
              <span className="text-textMuted truncate">
                Winner: {ALGO_CONFIG[waitWinner]?.label?.split(' ')[0] || waitWinner}
              </span>
            )}
          </div>
        </div>

        {/* Metric 2: Avg Turnaround */}
        <div
          onClick={() => setSelectedMetric('turnaround')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMetric === 'turnaround'
              ? 'border-cyan bg-cyan/5 shadow-sm'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-textMuted">
            <span className="font-medium">Avg Turnaround</span>
            <Tooltip content="Total time from task arrival to completion. Lower is better." />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-textPrimary">
              {data?.results['PulseQueue Adaptive']?.avg_turnaround.toFixed(2) || '0.00'}
            </span>
            <span className="text-xs text-textMuted ml-1">ticks</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center space-x-1">
            {turnaroundWinner === 'PulseQueue Adaptive' ? (
              <span className="text-warning font-semibold flex items-center">
                ★ Best Result
              </span>
            ) : (
              <span className="text-textMuted truncate">
                Winner: {ALGO_CONFIG[turnaroundWinner]?.label?.split(' ')[0] || turnaroundWinner}
              </span>
            )}
          </div>
        </div>

        {/* Metric 3: CPU Utilization */}
        <div
          onClick={() => setSelectedMetric('cpu')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMetric === 'cpu'
              ? 'border-cyan bg-cyan/5 shadow-sm'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-textMuted">
            <span className="font-medium">CPU Utilization</span>
            <Tooltip content="Percentage of time the processor is busy executing tasks. Higher is better." />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-success">
              {data?.results['PulseQueue Adaptive']?.cpu_utilization.toFixed(1) || '0.0'}%
            </span>
          </div>
          <div className="mt-2 text-[11px] flex items-center space-x-1">
            {cpuWinner === 'PulseQueue Adaptive' ? (
              <span className="text-warning font-semibold flex items-center">
                ★ Best Result
              </span>
            ) : (
              <span className="text-textMuted truncate">
                Winner: {ALGO_CONFIG[cpuWinner]?.label?.split(' ')[0] || cpuWinner}
              </span>
            )}
          </div>
        </div>

        {/* Metric 4: Deadline Misses */}
        <div
          onClick={() => setSelectedMetric('misses')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMetric === 'misses'
              ? 'border-cyan bg-cyan/5 shadow-sm'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-textMuted">
            <span className="font-medium">Deadline Misses</span>
            <Tooltip content="Number of tasks that finished after their specified deadline. Zero is ideal." />
          </div>
          <div className="mt-2">
            <span
              className={`text-xl font-mono font-bold ${
                (data?.results['PulseQueue Adaptive']?.deadline_misses || 0) === 0
                  ? 'text-success'
                  : 'text-danger'
              }`}
            >
              {data?.results['PulseQueue Adaptive']?.deadline_misses ?? 0}
            </span>
            <span className="text-xs text-textMuted ml-1">tasks</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center space-x-1">
            {(data?.results['PulseQueue Adaptive']?.deadline_misses ?? 0) === 0 ? (
              <span className="text-success font-semibold flex items-center">
                <CheckCircle2 className="w-3 h-3 mr-1 inline" /> 0 Misses
              </span>
            ) : (
              <span className="text-textMuted truncate">
                Winner: {ALGO_CONFIG[missesWinner]?.label?.split(' ')[0] || missesWinner}
              </span>
            )}
          </div>
        </div>

        {/* Metric 5: Context Switches */}
        <div
          onClick={() => setSelectedMetric('switches')}
          className={`glass-panel p-4 rounded-2xl border transition-all cursor-pointer ${
            selectedMetric === 'switches'
              ? 'border-cyan bg-cyan/5 shadow-sm'
              : 'border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-textMuted">
            <span className="font-medium">Context Switches</span>
            <Tooltip content="Times CPU switched between different tasks. Fewer switches reduces CPU cache invalidations." />
          </div>
          <div className="mt-2">
            <span className="text-xl font-mono font-bold text-violet">
              {data?.results['PulseQueue Adaptive']?.context_switches ?? 0}
            </span>
            <span className="text-xs text-textMuted ml-1">switches</span>
          </div>
          <div className="mt-2 text-[11px] flex items-center space-x-1">
            {switchesWinner === 'PulseQueue Adaptive' ? (
              <span className="text-warning font-semibold flex items-center">
                ★ Best Result
              </span>
            ) : (
              <span className="text-textMuted truncate">
                Winner: {ALGO_CONFIG[switchesWinner]?.label?.split(' ')[0] || switchesWinner}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Side-by-Side 5-Algorithm Gantt Battle Arena */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-white/5">
          <div className="flex items-center space-x-2">
            <Zap className="w-4 h-4 text-cyan" />
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider">
              Simultaneous 5-Algorithm Execution Timelines
            </h3>
          </div>
          <span className="text-xs text-textMuted font-mono">
            First 45 Ticks per Algorithm
          </span>
        </div>

        <div className="space-y-4 pt-1">
          {resultsList.map((res) => {
            const config = ALGO_CONFIG[res.algorithm_name] || {
              label: res.algorithm_name,
              color: '#35D6E8',
            };
            const isPulseQueue = res.algorithm_name === 'PulseQueue Adaptive';

            return (
              <div key={res.algorithm_name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-bold text-textPrimary">
                      {config.label}
                    </span>
                    {isPulseQueue && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan/20 text-cyan border border-cyan/40">
                        Adaptive Engine
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-3 text-xs font-mono text-textMuted">
                    <span>Wait: <strong className="text-textPrimary">{res.avg_wait.toFixed(1)}t</strong></span>
                    <span>Misses: <strong className={res.deadline_misses === 0 ? 'text-success' : 'text-danger'}>{res.deadline_misses}</strong></span>
                    <span>Starved: <strong className={res.starvation_incidents === 0 ? 'text-success' : 'text-danger'}>{res.starvation_incidents}</strong></span>
                  </div>
                </div>

                {renderMiniTimeline(res.timeline, config.color)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Visual Metric Bar Comparison Grid */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-textPrimary">
              Visual Metric Comparison
            </h3>
            <p className="text-xs text-textMuted">
              Click any metric above or select below to compare all 5 algorithms side by side.
            </p>
          </div>

          <div className="flex items-center space-x-1 p-1 bg-secondary rounded-xl border border-white/5 text-xs">
            <button
              onClick={() => setSelectedMetric('wait')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMetric === 'wait'
                  ? 'bg-cyan text-[#080B12] font-semibold'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Waiting Time
            </button>
            <button
              onClick={() => setSelectedMetric('turnaround')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMetric === 'turnaround'
                  ? 'bg-cyan text-[#080B12] font-semibold'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Turnaround
            </button>
            <button
              onClick={() => setSelectedMetric('cpu')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMetric === 'cpu'
                  ? 'bg-cyan text-[#080B12] font-semibold'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              CPU %
            </button>
            <button
              onClick={() => setSelectedMetric('misses')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMetric === 'misses'
                  ? 'bg-cyan text-[#080B12] font-semibold'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Deadlines
            </button>
            <button
              onClick={() => setSelectedMetric('switches')}
              className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedMetric === 'switches'
                  ? 'bg-cyan text-[#080B12] font-semibold'
                  : 'text-textMuted hover:text-textPrimary'
              }`}
            >
              Switches
            </button>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="space-y-4 pt-2">
          {resultsList.map((res) => {
            const config = ALGO_CONFIG[res.algorithm_name] || {
              label: res.algorithm_name,
              badge: 'Algo',
              color: '#35D6E8',
              desc: '',
            };

            const isPulseQueue = res.algorithm_name === 'PulseQueue Adaptive';

            let valStr = '';
            let pct = 0;
            let isBest = false;

            if (selectedMetric === 'wait') {
              valStr = `${res.avg_wait.toFixed(2)} ticks`;
              pct = Math.min(100, Math.max(12, (res.avg_wait / maxWait) * 100));
              isBest = res.algorithm_name === waitWinner;
            } else if (selectedMetric === 'turnaround') {
              valStr = `${res.avg_turnaround.toFixed(2)} ticks`;
              pct = Math.min(100, Math.max(12, (res.avg_turnaround / maxTurnaround) * 100));
              isBest = res.algorithm_name === turnaroundWinner;
            } else if (selectedMetric === 'cpu') {
              valStr = `${res.cpu_utilization.toFixed(1)}%`;
              pct = Math.min(100, Math.max(12, res.cpu_utilization));
              isBest = res.algorithm_name === cpuWinner;
            } else if (selectedMetric === 'misses') {
              valStr = `${res.deadline_misses} misses`;
              pct = maxMisses > 0 ? Math.min(100, Math.max(8, (res.deadline_misses / maxMisses) * 100)) : 8;
              isBest = res.deadline_misses === 0;
            } else {
              valStr = `${res.context_switches} switches`;
              pct = maxSwitches > 0 ? Math.min(100, Math.max(10, (res.context_switches / maxSwitches) * 100)) : 10;
              isBest = res.algorithm_name === switchesWinner;
            }

            return (
              <div
                key={res.algorithm_name}
                className={`p-3.5 rounded-xl border transition-all ${
                  isPulseQueue
                    ? 'bg-cyan/[0.04] border-cyan/30'
                    : 'bg-secondary/40 border-white/5'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: config.color }}
                    />
                    <span className="font-semibold text-textPrimary">
                      {config.label}
                    </span>
                    {isPulseQueue && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan/20 text-cyan border border-cyan/40">
                        Our Scheduler
                      </span>
                    )}
                    {isBest && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-warning/20 text-warning border border-warning/40">
                        ★ Best
                      </span>
                    )}
                  </div>
                  <span className="font-mono font-bold text-textPrimary">
                    {valStr}
                  </span>
                </div>

                {/* Bar */}
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: isBest ? '#FFB454' : config.color,
                      opacity: isBest || isPulseQueue ? 1 : 0.65,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plain-English Takeaway Section */}
      <div className="glass-panel p-6 rounded-2xl border border-cyan/20 bg-gradient-to-br from-cyan/[0.03] to-transparent space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan" />
          <h3 className="text-sm font-bold text-cyan uppercase tracking-wider">
            Plain-English Takeaway: Why PulseQueue Excels
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed text-textMuted">
          <div className="p-4 rounded-xl bg-secondary/60 border border-white/5 space-y-2">
            <h4 className="font-bold text-textPrimary flex items-center space-x-1.5">
              <span className="text-warning text-sm">🛡️</span>
              <span>How PulseQueue Prevents Starvation</span>
            </h4>
            <p>
              In traditional Priority Scheduling, high-priority tasks always run first, leaving low-priority tasks waiting indefinitely (starvation).
            </p>
            <p className="text-cyan">
              <strong>PulseQueue's solution:</strong> Every tick a process waits in queue, PulseQueue gradually increases its score (aging). Eventually, even low-priority tasks rise to the top and run.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-secondary/60 border border-white/5 space-y-2">
            <h4 className="font-bold text-textPrimary flex items-center space-x-1.5">
              <span className="text-danger text-sm">⏱️</span>
              <span>How PulseQueue Avoids Deadline Misses</span>
            </h4>
            <p>
              Algorithms like FCFS and SJF ignore deadlines completely, meaning an urgent task arriving slightly late can fail without warning.
            </p>
            <p className="text-cyan">
              <strong>PulseQueue's solution:</strong> The scheduler continuously calculates remaining time until deadline (slack). If time is running short, the task is boosted immediately.
            </p>
          </div>
        </div>

        {/* Expandable Technical Telemetry */}
        <div className="pt-2 border-t border-white/5">
          <button
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center space-x-1.5 text-xs font-mono text-cyan hover:underline"
          >
            {showTechnicalDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
            <span>{showTechnicalDetails ? 'Hide Detailed Statistics Table' : 'View Detailed Statistics Table'}</span>
          </button>

          {showTechnicalDetails && data && (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-white/10 text-textMuted">
                    <th className="pb-2 font-semibold">Algorithm</th>
                    <th className="pb-2 font-semibold">Avg Wait</th>
                    <th className="pb-2 font-semibold">Avg Turnaround</th>
                    <th className="pb-2 font-semibold">CPU Util</th>
                    <th className="pb-2 font-semibold">Deadline Misses</th>
                    <th className="pb-2 font-semibold">Starvation Incidents</th>
                    <th className="pb-2 font-semibold">Switches</th>
                    <th className="pb-2 font-semibold">Makespan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {resultsList.map((res) => (
                    <tr key={res.algorithm_name} className="hover:bg-white/[0.02]">
                      <td className="py-2.5 font-bold" style={{ color: ALGO_CONFIG[res.algorithm_name]?.color || '#FFF' }}>
                        {ALGO_CONFIG[res.algorithm_name]?.label || res.algorithm_name}
                      </td>
                      <td className="py-2.5">{res.avg_wait.toFixed(2)}t</td>
                      <td className="py-2.5">{res.avg_turnaround.toFixed(2)}t</td>
                      <td className="py-2.5 text-success">{res.cpu_utilization.toFixed(1)}%</td>
                      <td className={`py-2.5 ${res.deadline_misses === 0 ? 'text-success' : 'text-danger font-bold'}`}>
                        {res.deadline_misses}
                      </td>
                      <td className={`py-2.5 ${res.starvation_incidents === 0 ? 'text-success' : 'text-danger font-bold'}`}>
                        {res.starvation_incidents}
                      </td>
                      <td className="py-2.5 text-textMuted">{res.context_switches}</td>
                      <td className="py-2.5 text-textMuted">{res.makespan}t</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

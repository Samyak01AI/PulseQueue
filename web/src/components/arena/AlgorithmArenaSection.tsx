import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { ArenaResponse, ArenaResultItem } from '../../types';
import { Play, Trophy, CheckCircle2, AlertTriangle, ShieldCheck, Zap, Activity } from 'lucide-react';

interface AlgorithmArenaSectionProps {
  currentWorkload: string;
}

const ALGO_COLORS: Record<string, string> = {
  'PulseQueue Adaptive': '#35D6E8',
  'Static Priority': '#FF667A',
  'Shortest Job First (SRTF)': '#39D98A',
  'Round Robin': '#8B7CFF',
  'FCFS': '#FFB454',
};

export const AlgorithmArenaSection: React.FC<AlgorithmArenaSectionProps> = ({ currentWorkload }) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ArenaResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [quantum, setQuantum] = useState(3);

  const runBenchmark = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getArenaBenchmark(quantum);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to execute arena benchmark');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runBenchmark();
  }, [currentWorkload]);

  const resultsList = data ? Object.values(data.results) : [];

  return (
    <div className="space-y-8">
      {/* Benchmark Action Bar */}
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
            <h2 className="text-base font-mono font-bold text-textPrimary uppercase tracking-wider">
              ALGORITHM ARENA // 5-WAY COMPARATIVE BENCHMARK
            </h2>
          </div>
          <p className="text-xs text-textMuted mt-1">
            Executes identical cloned workloads across 5 core CPU scheduling algorithms. Calculated strictly from live algorithm runs.
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-xs font-mono text-textMuted">
            <span>RR Quantum:</span>
            <input
              type="number"
              min="1"
              max="10"
              value={quantum}
              onChange={(e) => setQuantum(parseInt(e.target.value) || 3)}
              className="w-14 px-2 py-1 rounded-lg bg-secondary border border-white/10 text-cyan font-bold text-center focus:outline-none"
            />
          </div>

          <button
            onClick={runBenchmark}
            disabled={loading}
            className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan to-violet text-[#080B12] font-mono text-xs font-bold shadow-cyan-glow hover:opacity-90 disabled:opacity-50 transition-all"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>{loading ? 'BENCHMARKING...' : 'RUN BENCHMARK'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs font-mono flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Executive Verdict Card */}
      {data && (
        <div className="glass-panel p-6 rounded-2xl border-cyan/30 shadow-cyan-glow space-y-3">
          <div className="flex items-center space-x-2">
            <Trophy className="w-4 h-4 text-cyan" />
            <h3 className="text-xs font-mono font-bold text-cyan uppercase tracking-wider">
              EXECUTIVE DSA PERFORMANCE VERDICT // WORKLOAD: {data.workload_name} ({data.process_count} PROCESSES)
            </h3>
          </div>

          <div className="text-sm font-sans text-textPrimary leading-relaxed space-y-2">
            <p>
              Under identical input workloads, <span className="text-cyan font-bold font-mono">PulseQueue Adaptive</span> maintained{' '}
              <span className="text-success font-bold font-mono">{data.results['PulseQueue Adaptive']?.deadline_misses || 0} deadline misses</span> and{' '}
              <span className="text-success font-bold font-mono">{data.results['PulseQueue Adaptive']?.starvation_incidents || 0} starvation incidents</span>{' '}
              with an average waiting time of{' '}
              <span className="text-cyan font-bold font-mono">{data.results['PulseQueue Adaptive']?.avg_wait.toFixed(2)} ticks</span> and{' '}
              <span className="text-violet font-bold font-mono">{data.results['PulseQueue Adaptive']?.cpu_utilization.toFixed(1)}% CPU utilization</span>.
            </p>

            <ul className="text-xs text-textMuted font-mono space-y-1 list-disc list-inside">
              <li>
                <span className="text-textPrimary font-semibold">Starvation Elimination:</span>{' '}
                Static Priority incurred{' '}
                <span className="text-danger font-bold">{data.results['Static Priority']?.starvation_incidents || 0} starvation incident(s)</span>{' '}
                due to lack of priority aging. PulseQueue's linear aging coefficient prevented thread starvation.
              </li>
              <li>
                <span className="text-textPrimary font-semibold">Deadline Urgency Boosting:</span>{' '}
                FCFS experienced{' '}
                <span className="text-danger font-bold">{data.results['FCFS']?.deadline_misses || 0} deadline violations</span>{' '}
                due to non-preemptive blocking. PulseQueue's bounded slack penalty elevated processes before expiration.
              </li>
              <li>
                <span className="text-textPrimary font-semibold">Indexed Min-Heap Efficiency:</span>{' '}
                Supported O(log N) indexed updates and O(N) Floyd rebuilds per tick, ensuring real-time responsiveness.
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Scoreboard Table */}
      {data && (
        <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
          <h3 className="text-xs font-mono font-bold text-textPrimary uppercase tracking-wider">
            COMPETITION TELEMETRY SCOREBOARD
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-textMuted">
                  <th className="pb-3 font-semibold">ALGORITHM</th>
                  <th className="pb-3 font-semibold">AVG WAIT</th>
                  <th className="pb-3 font-semibold">AVG TURNAROUND</th>
                  <th className="pb-3 font-semibold">CPU UTIL</th>
                  <th className="pb-3 font-semibold">DEADLINE MISSES</th>
                  <th className="pb-3 font-semibold">SWITCHES</th>
                  <th className="pb-3 font-semibold">STARVED</th>
                  <th className="pb-3 font-semibold">MAKESPAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {resultsList.map((res) => {
                  const isWaitWin = res.algorithm_name === data.winners.avg_wait;
                  const isTurnWin = res.algorithm_name === data.winners.avg_turnaround;
                  const isMissWin = res.algorithm_name === data.winners.deadline_misses;
                  const isUtilWin = res.algorithm_name === data.winners.cpu_utilization;
                  const isStarvWin = res.algorithm_name === data.winners.starvation_incidents;

                  return (
                    <tr key={res.algorithm_name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 font-bold" style={{ color: ALGO_COLORS[res.algorithm_name] || '#F5F7FF' }}>
                        {res.algorithm_name}
                      </td>

                      <td className={`py-3 ${isWaitWin ? 'text-cyan font-bold' : ''}`}>
                        {res.avg_wait.toFixed(2)}t {isWaitWin && <span className="text-warning text-[10px]">★ BEST</span>}
                      </td>

                      <td className={`py-3 ${isTurnWin ? 'text-cyan font-bold' : ''}`}>
                        {res.avg_turnaround.toFixed(2)}t {isTurnWin && <span className="text-warning text-[10px]">★ BEST</span>}
                      </td>

                      <td className={`py-3 ${isUtilWin ? 'text-success font-bold' : ''}`}>
                        {res.cpu_utilization.toFixed(1)}% {isUtilWin && <span className="text-warning text-[10px]">★ BEST</span>}
                      </td>

                      <td className={`py-3 font-bold ${res.deadline_misses === 0 ? 'text-success' : 'text-danger'}`}>
                        {res.deadline_misses} ({res.deadline_miss_ratio.toFixed(0)}%) {isMissWin && <span className="text-warning text-[10px]">★ BEST</span>}
                      </td>

                      <td className="py-3 text-textMuted">{res.context_switches}</td>

                      <td className={`py-3 font-bold ${res.starvation_incidents === 0 ? 'text-success' : 'text-danger'}`}>
                        {res.starvation_incidents} {isStarvWin && <span className="text-warning text-[10px]">★ BEST</span>}
                      </td>

                      <td className="py-3 text-textMuted">{res.makespan}t</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Visual Metric Bar Comparison Grid */}
      {data && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 1. Avg Wait Time Comparison */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold text-textPrimary">AVERAGE WAITING TIME (TICKS)</span>
              <span className="text-cyan text-[11px]">Lower is better</span>
            </div>
            <div className="space-y-2 pt-2">
              {resultsList.map((r) => {
                const maxWait = Math.max(...resultsList.map((x) => x.avg_wait), 1);
                const pct = (r.avg_wait / maxWait) * 100;
                return (
                  <div key={r.algorithm_name} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-textMuted">{r.algorithm_name}</span>
                      <span className="font-bold" style={{ color: ALGO_COLORS[r.algorithm_name] }}>
                        {r.avg_wait.toFixed(2)}t
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: ALGO_COLORS[r.algorithm_name] || '#35D6E8',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. Deadline Misses Comparison */}
          <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="font-bold text-textPrimary">DEADLINE MISS COUNT</span>
              <span className="text-success text-[11px]">0 is optimal</span>
            </div>
            <div className="space-y-2 pt-2">
              {resultsList.map((r) => {
                const maxMiss = Math.max(...resultsList.map((x) => x.deadline_misses), 1);
                const pct = (r.deadline_misses / maxMiss) * 100;
                return (
                  <div key={r.algorithm_name} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-textMuted">{r.algorithm_name}</span>
                      <span className={`font-bold ${r.deadline_misses === 0 ? 'text-success' : 'text-danger'}`}>
                        {r.deadline_misses} misses ({r.deadline_miss_ratio.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.max(pct, r.deadline_misses > 0 ? 5 : 0)}%`,
                          backgroundColor: r.deadline_misses === 0 ? '#39D98A' : '#FF667A',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


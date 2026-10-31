import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../../services/api';
import { EngineState, RunRecord } from '../../types';
import {
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  Download,
  RotateCcw,
  AlertTriangle,
  Layers,
  Activity,
  Zap,
} from 'lucide-react';

interface AnalyticsSectionProps {
  state: EngineState;
}

export const AnalyticsSection: React.FC<AnalyticsSectionProps> = ({ state }) => {
  const [historyRecords, setHistoryRecords] = useState<RunRecord[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoadingHistory(true);
      const records = await api.getHistory();
      setHistoryRecords(records);
    } catch (e) {
      console.warn('Failed to fetch history:', e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [state.completed_count, state.clock]);

  const completedTasks = state.tasks.filter((t) => t.completion !== null);

  const handleExportCSV = () => {
    window.open('/api/history/export', '_blank');
  };

  const handleClearHistory = async () => {
    try {
      await api.clearHistory();
      setHistoryRecords([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header Card with CSV Export */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Deep Telemetry & Audit Logs</span>
          </div>
          <h2 className="text-2xl font-bold text-textPrimary">
            Performance Analytics & Diagnostics
          </h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl">
            Detailed diagnostic insights into process waiting distributions, turnaround composition, deadline slack adherence, and historical execution records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-cyan text-[#07090E] font-semibold text-xs hover:bg-cyan/90 transition-all shadow-cyan-glow cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit CSV</span>
          </button>

          <button
            onClick={handleClearHistory}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-secondary hover:bg-white/10 text-textMuted hover:text-danger border border-white/10 text-xs font-mono transition-all cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        </div>
      </div>

      {/* 4 Summary Telemetry Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-xs text-textMuted font-medium block">Avg Waiting Time</span>
          <div className="text-2xl font-mono font-bold text-violet">
            {state.avg_wait.toFixed(2)} ticks
          </div>
          <span className="text-[11px] text-textMuted block">Queue latency</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-xs text-textMuted font-medium block">Avg Turnaround</span>
          <div className="text-2xl font-mono font-bold text-textPrimary">
            {state.avg_turnaround.toFixed(2)} ticks
          </div>
          <span className="text-[11px] text-textMuted block">Total elapsed time</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-xs text-textMuted font-medium block">CPU Utilization</span>
          <div className="text-2xl font-mono font-bold text-success">
            {state.cpu_utilization.toFixed(1)}%
          </div>
          <span className="text-[11px] text-textMuted block">Core efficiency</span>
        </div>

        <div className="glass-panel p-5 rounded-2xl border border-white/10 space-y-1">
          <span className="text-xs text-textMuted font-medium block">Context Switches</span>
          <div className="text-2xl font-mono font-bold text-cyan">
            {state.context_switches}
          </div>
          <span className="text-[11px] text-textMuted block">Dispatches</span>
        </div>
      </div>

      {/* Process Time Composition: Waiting vs Burst */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-5 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider font-mono">
              Process Turnaround Composition (Burst vs Queued Wait)
            </h3>
            <p className="text-xs text-textMuted mt-0.5">
              Proportion of total turnaround spent actively computing on the CPU vs waiting in queue.
            </p>
          </div>

          <div className="flex items-center space-x-4 text-xs font-mono">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-success inline-block" />
              <span className="text-textMuted">Execution Burst</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-3 rounded-sm bg-violet inline-block" />
              <span className="text-textMuted">Queued Wait</span>
            </div>
          </div>
        </div>

        {completedTasks.length === 0 ? (
          <div className="py-16 text-center text-xs font-mono text-textMuted">
            Awaiting process completions to render turnaround composition profiles. Start the simulation to watch tasks finish.
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            {completedTasks.map((t) => {
              const wait = Math.max(0, (t.completion ?? state.clock) - t.arrival - t.burst);
              const totalTurn = (t.completion ?? state.clock) - t.arrival;
              const burstPct = totalTurn > 0 ? (t.burst / totalTurn) * 100 : 100;
              const waitPct = totalTurn > 0 ? (wait / totalTurn) * 100 : 0;

              return (
                <div key={t.pid} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs font-mono">
                    <span className="font-bold" style={{ color: t.color }}>
                      {`P${String(t.pid).padStart(2, '0')} (${t.process_type})`}
                    </span>
                    <span className="text-textMuted">
                      Total: <span className="text-textPrimary font-bold">{totalTurn}t</span> (Burst: {t.burst}t, Wait: {wait}t)
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-secondary overflow-hidden flex shadow-inner">
                    <div
                      style={{ width: `${burstPct}%` }}
                      className="h-full bg-success transition-all duration-300"
                      title={`Burst: ${t.burst} ticks (${burstPct.toFixed(0)}%)`}
                    />
                    <div
                      style={{ width: `${waitPct}%` }}
                      className="h-full bg-violet transition-all duration-300"
                      title={`Wait: ${wait} ticks (${waitPct.toFixed(0)}%)`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Per-Process Deadline Slack & Execution Audit Table */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 shadow-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider font-mono">
            Per-Process Deadline Slack & Execution Audit
          </h3>
          <span className="text-xs text-textMuted font-mono">
            All Workload Tasks ({state.tasks.length})
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-textMuted">
                <th className="pb-3 font-semibold">PID</th>
                <th className="pb-3 font-semibold">ARRIVAL</th>
                <th className="pb-3 font-semibold">BURST</th>
                <th className="pb-3 font-semibold">COMPLETION</th>
                <th className="pb-3 font-semibold">WAITING</th>
                <th className="pb-3 font-semibold">TURNAROUND</th>
                <th className="pb-3 font-semibold">NORM TURN</th>
                <th className="pb-3 font-semibold">DEADLINE</th>
                <th className="pb-3 font-semibold">FINAL SLACK</th>
                <th className="pb-3 font-semibold">OUTCOME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {state.tasks.map((t) => {
                const compStr = t.completion !== null ? `${t.completion}t` : '--';
                const waitVal = t.completion !== null ? Math.max(0, t.completion - t.arrival - t.burst) : Math.max(0, state.clock - t.arrival - (t.burst - t.remaining));
                const turnVal = t.completion !== null ? t.completion - t.arrival : state.clock - t.arrival;
                const normTurn = t.burst > 0 ? (turnVal / t.burst).toFixed(2) : '1.00';
                const finalSlack = t.completion !== null ? t.deadline - t.completion : t.deadline - state.clock - t.remaining;

                const isMissed = t.completion !== null ? t.completion > t.deadline : false;
                const isDone = t.completion !== null;

                return (
                  <tr key={t.pid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 font-bold" style={{ color: t.color }}>
                      {`P${String(t.pid).padStart(2, '0')}`}
                    </td>
                    <td className="py-3">{t.arrival}t</td>
                    <td className="py-3">{t.burst}t</td>
                    <td className="py-3 font-bold text-cyan">{compStr}</td>
                    <td className="py-3">{waitVal}t</td>
                    <td className="py-3">{turnVal}t</td>
                    <td className="py-3">{normTurn}x</td>
                    <td className="py-3">{t.deadline}t</td>
                    <td className={`py-3 font-bold ${finalSlack >= 0 ? 'text-success' : 'text-danger'}`}>
                      {finalSlack}t
                    </td>
                    <td className="py-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isDone
                            ? isMissed
                              ? 'text-danger bg-danger/10 border-danger/30'
                              : 'text-success bg-success/10 border-success/30'
                            : 'text-textMuted bg-white/5 border-white/10'
                        }`}
                      >
                        {isDone ? (isMissed ? 'MISSED' : 'ON-TIME') : t.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Execution Records */}
      {historyRecords.length > 0 && (
        <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 space-y-4 shadow-lg">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-textPrimary uppercase tracking-wider font-mono">
              Historical Benchmark Runs ({historyRecords.length})
            </h3>
            <span className="text-xs text-textMuted font-mono">Auto-logged on completion</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-textMuted">
                  <th className="pb-3 font-semibold">TIMESTAMP</th>
                  <th className="pb-3 font-semibold">ALGORITHM</th>
                  <th className="pb-3 font-semibold">WORKLOAD</th>
                  <th className="pb-3 font-semibold">TASKS</th>
                  <th className="pb-3 font-semibold">AVG WAIT</th>
                  <th className="pb-3 font-semibold">AVG TURN</th>
                  <th className="pb-3 font-semibold">CPU %</th>
                  <th className="pb-3 font-semibold">MISSES</th>
                  <th className="pb-3 font-semibold">SWITCHES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {historyRecords.map((r, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 text-textMuted">{r.timestamp}</td>
                    <td className="py-3 font-bold text-cyan">{r.algorithm}</td>
                    <td className="py-3 text-textMuted">{r.workload_name}</td>
                    <td className="py-3">{r.completed_processes}/{r.num_processes}</td>
                    <td className="py-3">{r.avg_wait.toFixed(2)}t</td>
                    <td className="py-3">{r.avg_turnaround.toFixed(2)}t</td>
                    <td className="py-3 text-success">{r.cpu_utilization.toFixed(1)}%</td>
                    <td className={`py-3 font-bold ${r.deadline_misses === 0 ? 'text-success' : 'text-danger'}`}>
                      {r.deadline_misses}
                    </td>
                    <td className="py-3 text-textMuted">{r.context_switches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { RunRecord } from '../../types';
import { Download, Trash2, History as HistoryIcon, Clock, CheckCircle } from 'lucide-react';

export const HistorySection: React.FC = () => {
  const [records, setRecords] = useState<RunRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.getHistory();
      setRecords(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleClear = async () => {
    if (confirm('Clear all historical simulation run logs?')) {
      await api.clearHistory();
      setRecords([]);
    }
  };

  const handleDownloadCSV = () => {
    window.open('/api/history/export', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-5 rounded-2xl flex flex-wrap items-center justify-between gap-4 border border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <HistoryIcon className="w-5 h-5 text-cyan" />
            <h2 className="text-base font-mono font-bold text-textPrimary uppercase tracking-wider">
              SIMULATION EXECUTION AUDIT LOG
            </h2>
          </div>
          <p className="text-xs text-textMuted mt-1">
            Persistent ledger of completed benchmark workloads with makespan, waiting statistics, and deadline audits.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCSV}
            disabled={records.length === 0}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan text-[#080B12] font-mono text-xs font-bold shadow-cyan-glow hover:opacity-90 disabled:opacity-40 transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT CSV AUDIT</span>
          </button>

          <button
            onClick={handleClear}
            disabled={records.length === 0}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-danger/10 text-danger border border-danger/20 font-mono text-xs hover:bg-danger/20 disabled:opacity-40 transition-all"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>CLEAR LOGS</span>
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-xs font-mono font-bold text-textPrimary uppercase tracking-wider">
          HISTORICAL RUN RECORDS ({records.length})
        </h3>

        {records.length === 0 ? (
          <div className="py-12 text-center text-xs font-mono text-textMuted">
            NO SIMULATION RUNS LOGGED YET
            <br />
            <span className="text-[11px] text-textMuted/60">
              Run or step any workload to completion to automatically archive performance telemetry.
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-white/10 text-textMuted">
                  <th className="pb-3 font-semibold">RUN ID</th>
                  <th className="pb-3 font-semibold">TIMESTAMP</th>
                  <th className="pb-3 font-semibold">ALGORITHM</th>
                  <th className="pb-3 font-semibold">WORKLOAD</th>
                  <th className="pb-3 font-semibold">TASKS</th>
                  <th className="pb-3 font-semibold">MAKESPAN</th>
                  <th className="pb-3 font-semibold">AVG WAIT</th>
                  <th className="pb-3 font-semibold">AVG TURN</th>
                  <th className="pb-3 font-semibold">CPU UTIL</th>
                  <th className="pb-3 font-semibold">MISSES</th>
                  <th className="pb-3 font-semibold">SWITCHES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {records.map((r) => (
                  <tr key={r.run_id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 font-bold text-cyan">{r.run_id}</td>
                    <td className="py-2.5 text-textMuted">{r.timestamp}</td>
                    <td className="py-2.5 font-bold text-textPrimary">{r.algorithm}</td>
                    <td className="py-2.5 text-textMuted">{r.workload_name}</td>
                    <td className="py-2.5">{r.completed_processes}/{r.num_processes}</td>
                    <td className="py-2.5">{r.makespan}t</td>
                    <td className="py-2.5">{r.avg_wait.toFixed(2)}t</td>
                    <td className="py-2.5">{r.avg_turnaround.toFixed(2)}t</td>
                    <td className="py-2.5 text-success font-bold">{r.cpu_utilization.toFixed(1)}%</td>
                    <td className={`py-2.5 font-bold ${r.deadline_misses === 0 ? 'text-success' : 'text-danger'}`}>
                      {r.deadline_misses}
                    </td>
                    <td className="py-2.5 text-textMuted">{r.context_switches}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


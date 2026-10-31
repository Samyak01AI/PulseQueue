import React from 'react';
import { TaskData } from '../../types';
import { X, Clock, Timer, CheckCircle2, AlertTriangle, Layers, Activity } from 'lucide-react';

interface ProcessInspectorModalProps {
  task: TaskData | null;
  history: [number, number | null][];
  currentClock: number;
  onClose: () => void;
}

export const ProcessInspectorModal: React.FC<ProcessInspectorModalProps> = ({
  task,
  history,
  currentClock,
  onClose,
}) => {
  if (!task) return null;

  // Filter ticks this process ran
  const executedTicks = history
    .filter(([_, pid]) => pid === task.pid)
    .map(([tick]) => tick);

  // Group continuous runs into intervals (e.g. T0-T2, T5-T7)
  const intervals: string[] = [];
  if (executedTicks.length > 0) {
    let start = executedTicks[0];
    let prev = executedTicks[0];
    for (let i = 1; i < executedTicks.length; i++) {
      if (executedTicks[i] === prev + 1) {
        prev = executedTicks[i];
      } else {
        intervals.push(start === prev ? `Tick ${start}` : `Ticks ${start}–${prev}`);
        start = executedTicks[i];
        prev = executedTicks[i];
      }
    }
    intervals.push(start === prev ? `Tick ${start}` : `Ticks ${start}–${prev}`);
  }

  // Calculate metrics
  const isCompleted = task.completion !== null;
  const finishTick = isCompleted ? task.completion! : currentClock;
  const turnaround = isCompleted ? finishTick - task.arrival : Math.max(0, currentClock - task.arrival);
  const waitingTime = isCompleted
    ? turnaround - task.burst
    : Math.max(0, currentClock - task.arrival - task.executed);

  const isMissed = isCompleted
    ? task.completion! > task.deadline
    : currentClock > task.deadline && task.remaining > 0;

  const slackMargin = task.deadline - finishTick;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-cyan/30 shadow-2xl overflow-hidden p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center space-x-3">
            <span
              className="w-4 h-4 rounded-full shadow-sm"
              style={{ backgroundColor: task.color }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-textPrimary font-mono">
                  Process P{String(task.pid).padStart(2, '0')}
                </h3>
                <span
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-bold"
                  style={{
                    backgroundColor: `${task.color}20`,
                    color: task.color,
                    border: `1px solid ${task.color}50`,
                  }}
                >
                  {task.process_type}
                </span>
              </div>
              <p className="text-xs text-textMuted">
                Execution history and runtime timing telemetry
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-textMuted hover:text-textPrimary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status & Deadline Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-secondary/80 border border-white/5">
            <span className="text-[10px] text-textMuted block uppercase font-medium">Status</span>
            <span
              className={`text-xs font-bold font-mono ${
                task.status === 'COMPLETED'
                  ? 'text-success'
                  : task.status === 'RUNNING'
                  ? 'text-cyan'
                  : task.status === 'STARVED'
                  ? 'text-danger'
                  : 'text-warning'
              }`}
            >
              {task.status}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/80 border border-white/5">
            <span className="text-[10px] text-textMuted block uppercase font-medium">Base Priority</span>
            <span className="text-xs font-bold font-mono text-textPrimary">
              Level {task.priority}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/80 border border-white/5">
            <span className="text-[10px] text-textMuted block uppercase font-medium">Turnaround</span>
            <span className="text-xs font-bold font-mono text-cyan">
              {turnaround} ticks
            </span>
          </div>

          <div className="p-3 rounded-xl bg-secondary/80 border border-white/5">
            <span className="text-[10px] text-textMuted block uppercase font-medium">Deadline</span>
            <span
              className={`text-xs font-bold font-mono flex items-center space-x-1 ${
                isMissed ? 'text-danger' : 'text-success'
              }`}
            >
              {isMissed ? (
                <>
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  <span>Missed</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  <span>Met ({slackMargin}t slack)</span>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Timing Breakdown Table */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center space-x-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan" />
            <span>Process Timing Details</span>
          </h4>

          <div className="p-4 rounded-xl bg-secondary/50 border border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <span className="text-textMuted block text-[11px]">Arrival Time:</span>
              <span className="text-textPrimary font-bold">Tick {task.arrival}</span>
            </div>
            <div>
              <span className="text-textMuted block text-[11px]">Required Burst:</span>
              <span className="text-textPrimary font-bold">{task.burst} ticks</span>
            </div>
            <div>
              <span className="text-textMuted block text-[11px]">Remaining:</span>
              <span className="text-cyan font-bold">{task.remaining} ticks</span>
            </div>
            <div>
              <span className="text-textMuted block text-[11px]">Executed Ticks:</span>
              <span className="text-success font-bold">{task.executed} ticks</span>
            </div>
            <div>
              <span className="text-textMuted block text-[11px]">Total Waiting Time:</span>
              <span className="text-violet font-bold">{waitingTime} ticks</span>
            </div>
            <div>
              <span className="text-textMuted block text-[11px]">Completion Tick:</span>
              <span className="text-textPrimary font-bold">
                {task.completion !== null ? `Tick ${task.completion}` : 'In Progress'}
              </span>
            </div>
          </div>
        </div>

        {/* Execution Intervals History */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-textPrimary uppercase tracking-wider flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan" />
            <span>CPU Execution Dispatches ({executedTicks.length} ticks held)</span>
          </h4>

          {intervals.length === 0 ? (
            <div className="p-3 rounded-xl bg-secondary/30 text-xs text-textMuted text-center font-mono">
              This process has not yet been dispatched onto the CPU.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {intervals.map((intv, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-cyan/15 text-cyan border border-cyan/30"
                >
                  {intv}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 pt-2 border-t border-white/5">
          <div className="flex justify-between text-xs text-textMuted font-medium">
            <span>Overall Completion Progress</span>
            <span className="text-cyan font-mono font-bold">
              {Math.round((task.executed / task.burst) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, (task.executed / task.burst) * 100)}%`,
                backgroundColor: task.color,
              }}
            />
          </div>
        </div>

        {/* Close Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-cyan text-[#080B12] font-semibold text-xs hover:bg-cyan/90 transition-all"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};


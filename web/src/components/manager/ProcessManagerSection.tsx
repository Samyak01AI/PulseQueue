import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { EngineState, ProcessType, WhatIfTaskInput } from '../../types';
import { Tooltip } from '../common/Tooltip';
import { WhatIfSection } from '../whatif/WhatIfSection';
import {
  Plus,
  Trash2,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sliders,
  ListPlus,
  ArrowRight,
  Flame,
  Clock,
  Layers,
} from 'lucide-react';

interface ProcessManagerSectionProps {
  state: EngineState;
  onAddTask: (task: { arrival: number; burst: number; priority: number; deadline: number; process_type: string }) => Promise<void>;
  onDeleteTask: (pid: number) => Promise<void>;
  onLoadPreset: (preset: string) => Promise<void>;
  onApplyWhatIfToLive: (tasks: WhatIfTaskInput[]) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export const ProcessManagerSection: React.FC<ProcessManagerSectionProps> = ({
  state,
  onAddTask,
  onDeleteTask,
  onLoadPreset,
  onApplyWhatIfToLive,
  onNavigate,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'whatif'>('inventory');

  // Form states
  const [arrival, setArrival] = useState(0);
  const [burst, setBurst] = useState(4);
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState(16);
  const [processType, setProcessType] = useState<ProcessType>('Interactive');

  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (arrival < 0 || priority < 0) {
      setFormError('Arrival Time and Priority must be 0 or greater.');
      return;
    }
    if (burst <= 0) {
      setFormError('Execution Time must be at least 1 tick.');
      return;
    }
    if (deadline > 0 && deadline < arrival + burst) {
      setFormError(`Deadline (${deadline}) cannot be earlier than Arrival (${arrival}) + Execution Time (${burst}).`);
      return;
    }

    try {
      setSubmitting(true);
      await onAddTask({
        arrival,
        burst,
        priority,
        deadline: deadline > 0 ? deadline : arrival + burst + 10,
        process_type: processType,
      });
      setFormSuccess('New process created successfully and added to the workload.');
    } catch (err: any) {
      setFormError(err.message || 'Failed to add process');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Banner with Sub-Tab Switcher */}
      <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono">
            <ListPlus className="w-3.5 h-3.5" />
            <span>Process Engineering & Workload Modeling</span>
          </div>
          <h2 className="text-2xl font-bold text-textPrimary">
            Process Manager & What-If Lab
          </h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl">
            Configure incoming processes with custom arrival times and burst requirements, or experiment with hypothetical schedules in the What-If Simulator.
          </p>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-secondary rounded-2xl border border-white/10 text-xs">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-xl font-medium transition-all cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'inventory'
                ? 'bg-cyan text-[#07090E] font-bold shadow-cyan-glow'
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            <ListPlus className="w-3.5 h-3.5" />
            <span>Process Inventory ({state.tasks.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('whatif')}
            className={`px-4 py-2 rounded-xl font-medium transition-all cursor-pointer flex items-center space-x-2 ${
              activeSubTab === 'whatif'
                ? 'bg-cyan text-[#07090E] font-bold shadow-cyan-glow'
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>What-If Simulator</span>
          </button>
        </div>
      </div>

      {/* Tab A: Process Inventory & Creation */}
      {activeSubTab === 'inventory' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Quick Presets Bar */}
          <div className="glass-panel p-4 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-mono text-textMuted">
              <Sparkles className="w-3.5 h-3.5 text-cyan" />
              <span>Load Verified Workload Presets:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => onLoadPreset('standard')}
                className="px-3 py-1.5 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan border border-cyan/30 text-xs font-mono font-semibold transition-all cursor-pointer"
              >
                Standard Demo
              </button>
              <button
                onClick={() => onLoadPreset('starvation')}
                className="px-3 py-1.5 rounded-xl bg-danger/15 hover:bg-danger/25 text-danger border border-danger/30 text-xs font-mono font-semibold transition-all cursor-pointer"
                title="Loads high vs low priority tasks demonstrating priority aging"
              >
                Starvation Hazard
              </button>
              <button
                onClick={() => onLoadPreset('deadline')}
                className="px-3 py-1.5 rounded-xl bg-warning/15 hover:bg-warning/25 text-warning border border-warning/30 text-xs font-mono font-semibold transition-all cursor-pointer"
                title="Loads tight deadline real-time processes"
              >
                Deadline Crunch
              </button>
              <button
                onClick={() => onLoadPreset('batch')}
                className="px-3 py-1.5 rounded-xl bg-secondary hover:bg-white/10 text-textMuted hover:text-textPrimary border border-white/10 text-xs font-mono transition-all cursor-pointer"
              >
                Heavy Batch
              </button>
            </div>
          </div>

          {/* Form + Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Create Form */}
            <div className="lg:col-span-5 glass-panel p-6 rounded-3xl border border-white/10 space-y-5 shadow-lg">
              <div>
                <h3 className="text-base font-bold text-textPrimary">Add a New Process</h3>
                <p className="text-xs text-textMuted mt-0.5">Enter execution parameters for this task.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Task Type */}
                <div>
                  <label className="flex items-center text-xs text-textMuted font-medium mb-1">
                    <span>Task Type</span>
                    <Tooltip content="Categorizes the process. Interactive tasks are user-facing; Batch tasks are background computation jobs." />
                  </label>
                  <select
                    value={processType}
                    onChange={(e) => setProcessType(e.target.value as ProcessType)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-white/10 text-textPrimary text-xs focus:border-cyan focus:outline-none"
                  >
                    <option value="Interactive">Interactive (e.g., UI application)</option>
                    <option value="Batch">Batch (e.g., File rendering)</option>
                    <option value="Real-Time">Real-Time (e.g., Audio stream)</option>
                    <option value="System">System (e.g., OS daemon)</option>
                  </select>
                </div>

                {/* Arrival & Burst */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center text-xs text-textMuted font-medium mb-1">
                      <span>Arrival Time</span>
                      <Tooltip content="Arrival Time: When this process arrives in the system (Clock Tick 0, 1, 2...)." />
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={arrival}
                      onChange={(e) => setArrival(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-white/10 text-textPrimary text-xs focus:border-cyan focus:outline-none font-mono"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-textMuted font-medium mb-1">
                      <span>Execution (Burst)</span>
                      <Tooltip content="Burst Time: How many ticks of CPU computation this process needs to finish." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={burst}
                      onChange={(e) => setBurst(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-white/10 text-textPrimary text-xs focus:border-cyan focus:outline-none font-mono"
                      placeholder="4"
                    />
                  </div>
                </div>

                {/* Priority & Deadline */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="flex items-center text-xs text-textMuted font-medium mb-1">
                      <span>Priority</span>
                      <Tooltip content="Base Priority: 1 represents highest urgency; 10 represents lower urgency." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={priority}
                      onChange={(e) => setPriority(parseInt(e.target.value) || 1)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-white/10 text-textPrimary text-xs focus:border-cyan focus:outline-none font-mono"
                      placeholder="3"
                    />
                    <span className="text-[10px] text-textMuted">1 = High, 10 = Normal</span>
                  </div>

                  <div>
                    <label className="flex items-center text-xs text-textMuted font-medium mb-1">
                      <span>Deadline (Optional)</span>
                      <Tooltip content="Target deadline: The tick by which this process should ideally complete." />
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={deadline}
                      onChange={(e) => setDeadline(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-secondary border border-white/10 text-textPrimary text-xs focus:border-cyan focus:outline-none font-mono"
                      placeholder="16"
                    />
                  </div>
                </div>

                {formError && (
                  <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {formSuccess && (
                  <div className="p-3 rounded-xl bg-success/10 border border-success/30 text-success text-xs flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>{formSuccess}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-cyan text-[#07090E] text-xs font-bold hover:bg-cyan/90 transition-all flex items-center justify-center space-x-2 shadow-cyan-glow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{submitting ? 'Adding...' : 'Add Process to Workload'}</span>
                </button>
              </form>
            </div>

            {/* Process List Table */}
            <div className="lg:col-span-7 glass-panel p-6 rounded-3xl border border-white/10 space-y-4 shadow-lg">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-textPrimary">
                  Configured Processes ({state.tasks.length})
                </h3>
                <span className="text-xs text-textMuted font-mono">
                  Active Workload: {state.workload_name}
                </span>
              </div>

              {state.tasks.length === 0 ? (
                <div className="py-16 text-center text-xs text-textMuted space-y-3">
                  <p>No processes currently configured.</p>
                  <button
                    onClick={() => onLoadPreset('standard')}
                    className="px-4 py-2 rounded-xl bg-cyan/15 text-cyan hover:bg-cyan/25 font-mono text-xs font-bold transition-all cursor-pointer"
                  >
                    Click to load standard demo processes
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs font-sans">
                    <thead>
                      <tr className="border-b border-white/10 text-textMuted">
                        <th className="pb-3 font-medium">Process</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Arrival</th>
                        <th className="pb-3 font-medium">Burst</th>
                        <th className="pb-3 font-medium">Priority</th>
                        <th className="pb-3 font-medium">Deadline</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {state.tasks.map((task) => {
                        const canDelete = task.remaining === task.burst && state.active_pid !== task.pid;
                        const statusBadges: Record<string, string> = {
                          RUNNING: 'text-cyan bg-cyan/15 border-cyan/30',
                          READY: 'text-violet bg-violet/15 border-violet/30',
                          STARVED: 'text-danger bg-danger/15 border-danger/30',
                          COMPLETED: 'text-success bg-success/15 border-success/30',
                          PENDING: 'text-textMuted bg-white/5 border-white/10',
                        };

                        return (
                          <tr key={task.pid} className="hover:bg-white/[0.02] transition-colors">
                            <td className="py-3 font-bold font-mono" style={{ color: task.color }}>
                              {`P${String(task.pid).padStart(2, '0')}`}
                            </td>
                            <td className="py-3 text-textMuted">{task.process_type}</td>
                            <td className="py-3 font-mono">{task.arrival}t</td>
                            <td className="py-3 font-mono">{task.burst}t</td>
                            <td className="py-3 font-mono">Level {task.priority}</td>
                            <td className="py-3 font-mono">{task.deadline}t</td>
                            <td className="py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                                  statusBadges[task.status] || 'text-textMuted'
                                }`}
                              >
                                {task.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => onDeleteTask(task.pid)}
                                disabled={!canDelete}
                                title={canDelete ? 'Delete process' : 'Cannot delete active or finished process'}
                                className={`p-1.5 rounded-lg transition-all ${
                                  canDelete ? 'text-danger hover:bg-danger/20 cursor-pointer' : 'text-textMuted/20 cursor-not-allowed'
                                }`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Tab B: What-If Scenario Simulator */}
      {activeSubTab === 'whatif' && (
        <WhatIfSection
          state={state}
          onApplyToLive={onApplyWhatIfToLive}
          onNavigate={onNavigate}
        />
      )}
    </div>
  );
};

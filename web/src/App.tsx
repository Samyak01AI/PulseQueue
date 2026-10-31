import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from './services/api';
import { EngineState, WhatIfTaskInput } from './types';

import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { DashboardSection } from './components/dashboard/DashboardSection';
import { ProcessManagerSection } from './components/manager/ProcessManagerSection';
import { LiveSchedulerSection } from './components/scheduler/LiveSchedulerSection';
import { PerformanceSection } from './components/performance/PerformanceSection';
import { AnalyticsSection } from './components/analytics/AnalyticsSection';
import { LearningSection } from './components/learning/LearningSection';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [state, setState] = useState<EngineState | null>(null);
  const [loading, setLoading] = useState(true);

  // Poll state from FastAPI backend
  const refreshState = async () => {
    try {
      const data = await api.getState();
      setState(data);
    } catch (e) {
      console.warn('API polling warning:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshState();
  }, []);

  // Live polling interval when simulation is running
  useEffect(() => {
    const interval = setInterval(() => {
      refreshState();
    }, state?.running ? (state?.speed_ms || 400) : 1000);

    return () => clearInterval(interval);
  }, [state?.running, state?.speed_ms]);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleToggleRun();
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleStep();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleReset();
      } else if (['1', '2', '3', '4', '5', '6'].includes(e.key)) {
        const tabs = ['overview', 'manager', 'simulation', 'arena', 'analytics', 'learning'];
        const idx = parseInt(e.key) - 1;
        if (tabs[idx]) {
          setCurrentTab(tabs[idx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state?.running]);

  const handleToggleRun = async () => {
    if (!state) return;
    try {
      const newState = state.running ? await api.pause() : await api.run();
      setState(newState);
    } catch (e) {
      console.error(e);
    }
  };

  const handleStep = async () => {
    try {
      const newState = await api.step();
      setState(newState);
    } catch (e) {
      console.error(e);
    }
  };

  const handleReset = async () => {
    try {
      const newState = await api.reset();
      setState(newState);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateConfig = async (cfg: Record<string, any>) => {
    try {
      const newState = await api.updateConfig(cfg);
      setState(newState);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddTask = async (task: { arrival: number; burst: number; priority: number; deadline: number; process_type: string }) => {
    const newState = await api.addTask(task);
    setState(newState);
  };

  const handleDeleteTask = async (pid: number) => {
    const newState = await api.deleteTask(pid);
    setState(newState);
  };

  const handleLoadPreset = async (name: string) => {
    try {
      const newState = await api.loadPreset(name);
      setState(newState);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadSampleAndSimulate = async () => {
    try {
      const newState = await api.loadPreset('standard');
      setState(newState);
      setCurrentTab('simulation');
    } catch (e) {
      console.error(e);
    }
  };

  const handleApplyWhatIfToLive = async (newTasks: WhatIfTaskInput[]) => {
    try {
      const newState = await api.loadCustomWorkload(newTasks);
      setState(newState);
    } catch (e) {
      console.error(e);
      throw e;
    }
  };

  if (!state && loading) {
    return (
      <div className="min-h-screen bg-[#07090E] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan to-violet flex items-center justify-center animate-spin shadow-cyan-glow">
          <span className="text-[#07090E] font-mono font-bold text-xl">◈</span>
        </div>
        <p className="font-mono text-xs text-cyan tracking-widest uppercase">
          INITIALIZING PULSEQUEUE 2026 CPU LABORATORY...
        </p>
      </div>
    );
  }

  const dummyState: EngineState = state || {
    clock: 0,
    running: false,
    speed_ms: 400,
    mode: 'Adaptive',
    aging: 0.6,
    deadline_weight: 2.5,
    starvation_threshold: 15,
    active_pid: null,
    active_color: null,
    workload_name: 'Standard Demo',
    total_tasks: 0,
    completed_count: 0,
    avg_wait: 0,
    avg_turnaround: 0,
    cpu_utilization: 0,
    deadline_misses: 0,
    context_switches: 0,
    done: false,
    tasks: [],
    ready_heap: [],
    history: [],
    latest_explanation: null,
    explanations: [],
    multicore: {
      num_cores: 4,
      clock: 0,
      overall_utilization: 0,
      load_imbalance_std_dev: 0,
      cores: [],
    },
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-[#F5F7FF] flex overflow-hidden selection:bg-cyan selection:text-[#07090E]">
      {/* 1. Left Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        clock={dummyState.clock}
        running={dummyState.running}
        done={dummyState.done}
        activePid={dummyState.active_pid}
        workloadName={dummyState.workload_name}
      />

      {/* 2. Main Content Canvas */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header Navigation */}
        <TopHeader
          currentTab={currentTab}
          clock={dummyState.clock}
          running={dummyState.running}
          done={dummyState.done}
          speedMs={dummyState.speed_ms}
          currentWorkload={dummyState.workload_name}
          onToggleRun={handleToggleRun}
          onStep={handleStep}
          onReset={handleReset}
          onSpeedChange={(spd) => handleUpdateConfig({ speed_ms: spd })}
          onLoadPreset={handleLoadPreset}
        />

        {/* Scrollable View Content with Motion Page Transitions */}
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 scrollbar-thin">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {currentTab === 'overview' && (
                <DashboardSection
                  state={dummyState}
                  onNavigate={setCurrentTab}
                  onToggleRun={handleToggleRun}
                  onLoadSample={handleLoadSampleAndSimulate}
                />
              )}

              {currentTab === 'manager' && (
                <ProcessManagerSection
                  state={dummyState}
                  onAddTask={handleAddTask}
                  onDeleteTask={handleDeleteTask}
                  onLoadPreset={handleLoadPreset}
                  onApplyWhatIfToLive={handleApplyWhatIfToLive}
                  onNavigate={setCurrentTab}
                />
              )}

              {currentTab === 'simulation' && (
                <LiveSchedulerSection
                  state={dummyState}
                  onToggleRun={handleToggleRun}
                  onStep={handleStep}
                  onReset={handleReset}
                  onUpdateConfig={handleUpdateConfig}
                />
              )}

              {currentTab === 'arena' && (
                <PerformanceSection
                  currentWorkload={dummyState.workload_name}
                />
              )}

              {currentTab === 'analytics' && (
                <AnalyticsSection
                  state={dummyState}
                />
              )}

              {currentTab === 'learning' && (
                <LearningSection
                  onLoadScenario={handleLoadPreset}
                  onNavigate={setCurrentTab}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Footer */}
          <footer className="border-t border-white/[0.07] py-8 mt-16 text-xs font-mono text-textMuted flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-cyan font-bold">◈ PULSEQUEUE X</span>
              <span>// 2026 Predictive & Self-Adaptive Scheduling Engine</span>
            </div>
            <div className="flex items-center space-x-4 text-[11px]">
              <span className="flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success" />
                <span>FastAPI Backend Active</span>
              </span>
              <span>•</span>
              <span>Three.js Spatial Die</span>
              <span>•</span>
              <span>Custom IndexedMinHeap DSA</span>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
};

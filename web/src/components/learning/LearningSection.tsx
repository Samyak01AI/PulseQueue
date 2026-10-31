import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  ShieldAlert,
  Clock,
  Layers,
  ChevronDown,
  ChevronUp,
  Play,
  ArrowRight,
  HelpCircle,
  Cpu,
  Flame,
} from 'lucide-react';

interface LearningSectionProps {
  onLoadScenario: (preset: string) => Promise<void>;
  onNavigate: (tab: string) => void;
}

export const LearningSection: React.FC<LearningSectionProps> = ({
  onLoadScenario,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'concepts' | 'scenarios' | 'glossary'>('concepts');
  const [expandedConcept, setExpandedConcept] = useState<number | null>(1);

  const concepts = [
    {
      id: 1,
      icon: '🍳',
      title: 'What is a CPU Scheduler? The Kitchen Chef Analogy',
      subtitle: 'Understanding the core problem of operating system scheduling',
      simpleSummary:
        'Think of the CPU as a master chef with only one cooking stove. Multiple customers (processes) arrive at different times with different orders (burst times). The scheduler is the restaurant manager who decides which customer’s dish gets the stove next.',
      details: [
        {
          label: 'Arrival Time',
          desc: 'When the order was placed. A process cannot be cooked before it arrives.',
        },
        {
          label: 'Burst Time',
          desc: 'How many minutes (ticks) on the stove the dish takes to cook.',
        },
        {
          label: 'Preemption',
          desc: 'Taking an unfinished dish off the stove temporarily because an urgent VIP customer just walked in.',
        },
        {
          label: 'Turnaround Time',
          desc: 'The total time from when the order was placed until the customer gets their finished meal.',
        },
      ],
      scenarioPreset: 'standard',
      scenarioLabel: 'Try the Standard Chef Demo',
    },
    {
      id: 2,
      icon: '🚀',
      title: 'The Starvation Trap & The Mars Pathfinder Crisis',
      subtitle: 'Why static priority fails and how PulseQueue Aging fixes it',
      simpleSummary:
        'In pure Priority Scheduling, high-priority tasks always go first. If high-priority tasks keep arriving, a low-priority task may wait forever — this is called Starvation. In 1997, NASA’s Mars Pathfinder spacecraft suffered from this exact bug on the Martian surface!',
      details: [
        {
          label: 'The Real Martian Crisis',
          desc: 'Pathfinder’s high-priority information bus task and medium-priority communications task repeatedly blocked the low-priority attitude control task, triggering repeated system resets on Mars.',
        },
        {
          label: 'The Aging Solution',
          desc: 'PulseQueue applies an aging coefficient (α). For every tick a task waits in queue, its effective priority increases. Eventually, even the lowest priority task rises to the very top and executes.',
        },
        {
          label: 'Formula',
          desc: 'Score = Base Priority - (α × Waited Ticks). A lower score means higher execution priority.',
        },
      ],
      scenarioPreset: 'starvation',
      scenarioLabel: 'Launch Mars Starvation Scenario',
    },
    {
      id: 3,
      icon: '⏱️',
      title: 'Real-Time Deadlines & Urgency Slack',
      subtitle: 'How PulseQueue predicts and prevents deadline failures',
      simpleSummary:
        'Many computer systems (like cars, medical devices, and gaming engines) have deadlines: if a task finishes 1 tick late, it has failed. Most basic schedulers (FCFS, SJF, Round Robin) completely ignore deadlines. PulseQueue continuously calculates Slack.',
      details: [
        {
          label: 'What is Slack?',
          desc: 'Slack = Deadline - Current Clock - Remaining Burst Time. It tells the scheduler exactly how many spare ticks exist before disaster strikes.',
        },
        {
          label: 'Urgency Penalty',
          desc: 'When Slack drops below 5 ticks, PulseQueue exponentially discounts the process’s score, giving it emergency preemption rights over other tasks.',
        },
        {
          label: 'Formula',
          desc: 'Urgency = β × max(0, 5 - Slack). If slack is tight, urgency spikes.',
        },
      ],
      scenarioPreset: 'deadline',
      scenarioLabel: 'Launch Deadline Crunch Scenario',
    },
    {
      id: 4,
      icon: '🧠',
      title: 'Custom DSA Engine: The Indexed Min-Heap',
      subtitle: 'Why standard heaps fail for self-adaptive schedulers',
      simpleSummary:
        'In dynamic scheduling, priorities change every single clock cycle because of aging. In a standard binary heap (like Python heapq or C++ std::priority_queue), updating an element takes O(N) linear time because you must search the array to find its position.',
      details: [
        {
          label: 'Our Solution: IndexedMinHeap',
          desc: 'We created an Indexed Binary Heap coupled with an internal HashMap index (pos[pid] → array_idx). Whenever priorities change, updates take O(log N) rather than O(N).',
        },
        {
          label: 'Floyd Rebuild Optimization',
          desc: 'Every tick, we rebuild the ready queue using Floyd’s bottom-up heapify algorithm in linear O(N) time, guaranteeing smooth real-time performance without UI lags.',
        },
      ],
      scenarioPreset: 'batch',
      scenarioLabel: 'Simulate Heavy Batch Heap Workload',
    },
  ];

  const glossaryItems = [
    {
      term: 'Waiting Time (t_wait)',
      definition: 'The total time a process spends waiting in the ready queue without CPU execution.',
      formula: 'Waiting Time = Turnaround Time - Burst Time',
    },
    {
      term: 'Turnaround Time (t_turn)',
      definition: 'The total elapsed time from when a process arrives until it completely finishes execution.',
      formula: 'Turnaround Time = Completion Tick - Arrival Tick',
    },
    {
      term: 'Preemption',
      definition: 'The operating system temporarily suspending a running process to give the CPU to a higher-priority task.',
      formula: 'Triggers context switch when newly arrived task score < active task score',
    },
    {
      term: 'Context Switch',
      definition: 'The administrative overhead when the CPU saves the state of the old process and restores the state of the new process.',
      formula: 'Minimizing context switches preserves CPU cache and efficiency',
    },
    {
      term: 'Starvation',
      definition: 'A situation where a ready process is perpetually denied CPU time because higher-priority processes keep arriving.',
      formula: 'Eliminated via Priority Aging (α > 0)',
    },
    {
      term: 'Convoy Effect',
      definition: 'A performance bottleneck in FCFS where short tasks are forced to wait behind a massive, slow batch process.',
      formula: 'Solved by Preemptive SJF / PulseQueue Dynamic Scoring',
    },
  ];

  const handleLaunchExperiment = async (preset: string) => {
    await onLoadScenario(preset);
    onNavigate('simulation');
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan/15 text-cyan border border-cyan/30 text-xs font-mono">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Interactive Educational CPU Lab</span>
          </div>
          <h2 className="text-2xl font-bold text-textPrimary">
            Learning Mode
          </h2>
          <p className="text-xs sm:text-sm text-textMuted max-w-xl">
            Explore CPU scheduling concepts with beginner-friendly analogies, real-world historical stories, and one-click hands-on simulations.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 bg-secondary rounded-xl border border-white/5 text-xs">
          <button
            onClick={() => setActiveTab('concepts')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'concepts'
                ? 'bg-cyan text-[#080B12] font-semibold'
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            Core Concepts
          </button>
          <button
            onClick={() => setActiveTab('glossary')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'glossary'
                ? 'bg-cyan text-[#080B12] font-semibold'
                : 'text-textMuted hover:text-textPrimary'
            }`}
          >
            Glossary & Formulas
          </button>
        </div>
      </div>

      {/* Tab 1: Core Concepts */}
      {activeTab === 'concepts' && (
        <div className="space-y-4">
          {concepts.map((concept) => {
            const isExpanded = expandedConcept === concept.id;
            return (
              <div
                key={concept.id}
                className="glass-panel rounded-2xl border border-white/10 overflow-hidden transition-all"
              >
                <div
                  onClick={() => setExpandedConcept(isExpanded ? null : concept.id)}
                  className="p-5 sm:p-6 flex items-center justify-between cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <span className="text-3xl">{concept.icon}</span>
                    <div>
                      <h3 className="text-base font-bold text-textPrimary">
                        {concept.title}
                      </h3>
                      <p className="text-xs text-textMuted mt-0.5">
                        {concept.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchExperiment(concept.scenarioPreset);
                      }}
                      className="hidden sm:flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-cyan/15 hover:bg-cyan/25 text-cyan text-xs font-mono transition-all"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{concept.scenarioLabel}</span>
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-textMuted" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-textMuted" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-6 sm:px-6 pt-2 border-t border-white/5 space-y-4 animate-in fade-in duration-200">
                    <p className="text-xs sm:text-sm text-textPrimary leading-relaxed bg-secondary/40 p-4 rounded-xl border border-white/5">
                      {concept.simpleSummary}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {concept.details.map((detail, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-secondary/60 border border-white/5 space-y-1"
                        >
                          <span className="text-xs font-bold text-cyan font-mono block">
                            {detail.label}
                          </span>
                          <p className="text-xs text-textMuted leading-relaxed">
                            {detail.desc}
                          </p>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-end pt-2 sm:hidden">
                      <button
                        onClick={() => handleLaunchExperiment(concept.scenarioPreset)}
                        className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan text-[#080B12] font-semibold text-xs"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{concept.scenarioLabel}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Glossary & Formulas */}
      {activeTab === 'glossary' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {glossaryItems.map((item, idx) => (
            <div
              key={idx}
              className="glass-panel p-5 rounded-2xl border border-white/10 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-textPrimary font-mono">
                  {item.term}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan/15 text-cyan font-mono">
                  Key Metric
                </span>
              </div>
              <p className="text-xs text-textMuted leading-relaxed">
                {item.definition}
              </p>
              <div className="pt-2 border-t border-white/5">
                <span className="text-[10px] text-textMuted font-mono block">Formula / Note:</span>
                <code className="text-xs font-mono text-cyan block mt-0.5">
                  {item.formula}
                </code>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};


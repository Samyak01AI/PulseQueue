export type ProcessType = 'Interactive' | 'Batch' | 'Real-Time' | 'System';

export type TaskStatus = 'PENDING' | 'READY' | 'RUNNING' | 'STARVED' | 'COMPLETED';

export interface TaskCreateRequest {
  arrival: number;
  burst: number;
  priority: number;
  deadline: number;
  process_type: string;
}

export interface TaskData {
  pid: number;
  color: string;
  arrival: number;
  burst: number;
  priority: number;
  deadline: number;
  process_type: ProcessType;
  remaining: number;
  executed: number;
  completion: number | null;
  score: number;
  slack: number;
  status: TaskStatus;
  waited_ticks?: number;
  starvation_risk?: 'Safe' | 'Warning' | 'Critical';
  aging_boost?: number;
}

export interface ReadyHeapItem {
  pid: number;
  rank: number;
  color: string;
  score: number;
  base_priority: number;
  remaining: number;
  waited: number;
  aging_discount: number;
  slack: number;
  urgency_discount: number;
}

export interface DecisionExplanation {
  clock: number;
  pid: number | null;
  color: string | null;
  reason: string;
  score: number | null;
  base_priority: number | null;
  aging_discount: number | null;
  urgency_discount: number | null;
  waited_ticks: number | null;
  slack_ticks: number | null;
  preempted_pid: number | null;
  ready_count: number;
}

export interface CoreData {
  core_id: number;
  active_pid: number | null;
  active_color: string | null;
  utilization: number;
  context_switches: number;
  recent_ticks: (number | null)[];
}

export interface MultiCoreState {
  num_cores: number;
  clock: number;
  overall_utilization: number;
  load_imbalance_std_dev: number;
  cores: CoreData[];
}

export interface EngineState {
  clock: number;
  running: boolean;
  speed_ms: number;
  mode: 'Adaptive' | 'Static';
  aging: number;
  deadline_weight: number;
  starvation_threshold: number;
  active_pid: number | null;
  active_color: string | null;
  workload_name: string;
  total_tasks: number;
  completed_count: number;
  avg_wait: number;
  avg_turnaround: number;
  cpu_utilization: number;
  deadline_misses: number;
  context_switches: number;
  done: boolean;
  tasks: TaskData[];
  ready_heap: ReadyHeapItem[];
  history: [number, number | null][];
  latest_explanation: DecisionExplanation | null;
  explanations?: DecisionExplanation[];
  multicore: MultiCoreState;
}

export interface WhatIfTaskInput {
  pid: number;
  arrival: number;
  burst: number;
  priority: number;
  deadline: number;
  process_type?: string;
}

export interface WhatIfRequest {
  tasks?: WhatIfTaskInput[];
  algorithm?: string;
  aging?: number;
  deadline_weight?: number;
  starvation_threshold?: number;
  rr_quantum?: number;
}

export interface WhatIfResponse {
  baseline: ArenaResultItem;
  simulated: ArenaResultItem;
  diff: {
    avg_wait: number;
    avg_turnaround: number;
    deadline_misses: number;
    cpu_utilization: number;
    is_improvement: boolean;
  };
}

export interface ArenaResultItem {
  algorithm_name: string;
  avg_wait: number;
  avg_turnaround: number;
  cpu_utilization: number;
  deadline_misses: number;
  deadline_miss_ratio: number;
  context_switches: number;
  starvation_incidents: number;
  makespan: number;
  completed_count: number;
  total_count: number;
  timeline: [number, number | null][];
  task_stats: Record<string, any>;
}

export interface ArenaResponse {
  results: Record<string, ArenaResultItem>;
  winners: Record<string, string>;
  workload_name: string;
  process_count: number;
}

export interface RunRecord {
  run_id: string;
  timestamp: string;
  algorithm: string;
  workload_name: string;
  num_processes: number;
  completed_processes: number;
  makespan: number;
  avg_wait: number;
  avg_turnaround: number;
  cpu_utilization: number;
  deadline_misses: number;
  context_switches: number;
}

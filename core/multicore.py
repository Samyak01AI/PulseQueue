"""
Multi-Core CPU Scheduling Engine

Simulates symmetric multi-processing (SMP) with 1, 2, 4, or 8 CPU cores.
Uses an IndexedMinHeap-backed global ready queue with dynamic load balancing.
"""
from typing import Dict, List, Tuple, Optional, Any
import math
from core.models import Task, DecisionExplanation
from core.heap import IndexedMinHeap


class MultiCoreScheduler:
    def __init__(self, num_cores: int = 4, aging: float = 0.6, deadline_weight: float = 2.5):
        self.num_cores = max(1, min(8, num_cores))
        self.aging = aging
        self.deadline_weight = deadline_weight
        self.tasks: Dict[int, Task] = {}
        self.clock: int = 0
        
        # Per-core state
        self.core_active: Dict[int, Optional[int]] = {c: None for c in range(self.num_cores)}
        self.core_history: Dict[int, List[Tuple[int, Optional[int]]]] = {c: [] for c in range(self.num_cores)}
        self.core_busy_ticks: Dict[int, int] = {c: 0 for c in range(self.num_cores)}
        self.core_context_switches: Dict[int, int] = {c: 0 for c in range(self.num_cores)}
        
        self.heap = IndexedMinHeap()
        self.explanations: List[DecisionExplanation] = []

    def set_cores(self, num_cores: int) -> None:
        self.num_cores = max(1, min(8, num_cores))
        self.reset()

    def add(self, task: Task) -> None:
        if task.pid in self.tasks:
            raise ValueError(f"Process ID P{task.pid} already exists")
        self.tasks[task.pid] = task

    def reset(self) -> None:
        self.clock = 0
        self.core_active = {c: None for c in range(self.num_cores)}
        self.core_history = {c: [] for c in range(self.num_cores)}
        self.core_busy_ticks = {c: 0 for c in range(self.num_cores)}
        self.core_context_switches = {c: 0 for c in range(self.num_cores)}
        self.explanations.clear()
        for t in self.tasks.values():
            t.remaining = t.burst
            t.completion = None
            t.first_run = None
            t.waiting_ticks = 0
            t.executed_ticks = 0
            t.core_id = None

    def done(self) -> bool:
        return bool(self.tasks) and all(t.remaining == 0 for t in self.tasks.values())

    def score(self, task: Task) -> float:
        waited = max(0, self.clock - task.arrival - (task.burst - task.remaining))
        slack = task.deadline - self.clock - task.remaining
        urgency = self.deadline_weight * max(0, 5 - slack)
        return task.priority - (self.aging * waited) - urgency

    def ready_tasks(self) -> List[Task]:
        return [t for t in self.tasks.values() if t.arrival <= self.clock and t.remaining > 0]

    def step(self) -> Dict[int, Optional[int]]:
        """
        Dispatches available ready tasks to cores.
        Returns mapping {core_id: active_pid}.
        """
        ready = self.ready_tasks()
        
        # Build heap of all currently available tasks
        pairs = [(t.pid, self.score(t)) for t in ready]
        self.heap.rebuild(pairs)

        # Extract top min(num_cores, ready_count) tasks
        dispatched: Dict[int, Optional[int]] = {}
        assigned_pids: List[int] = []

        # Affinity preference: Keep tasks on previous core if still among top priority
        top_candidates = []
        while not self.heap.is_empty() and len(top_candidates) < self.num_cores:
            pid = self.heap.pop()
            if pid is not None:
                top_candidates.append(pid)

        # Allocate to cores
        # First assign sticky affinity
        unassigned_cores = list(range(self.num_cores))
        for core_id in list(unassigned_cores):
            prev_pid = self.core_active.get(core_id)
            if prev_pid in top_candidates and prev_pid not in assigned_pids:
                dispatched[core_id] = prev_pid
                assigned_pids.append(prev_pid)
                unassigned_cores.remove(core_id)

        # Then assign remaining top candidates to remaining cores
        remaining_candidates = [pid for pid in top_candidates if pid not in assigned_pids]
        for core_id in unassigned_cores:
            if remaining_candidates:
                pid = remaining_candidates.pop(0)
                dispatched[core_id] = pid
                assigned_pids.append(pid)
            else:
                dispatched[core_id] = None

        # Execute 1 tick on each core
        for core_id in range(self.num_cores):
            pid = dispatched[core_id]
            prev_pid = self.core_active[core_id]

            if prev_pid is not None and prev_pid != pid:
                self.core_context_switches[core_id] += 1

            self.core_active[core_id] = pid
            self.core_history[core_id].append((self.clock, pid))

            if pid is not None:
                self.core_busy_ticks[core_id] += 1
                task = self.tasks[pid]
                task.core_id = core_id
                if task.first_run is None:
                    task.first_run = self.clock
                task.remaining -= 1
                task.executed_ticks += 1
                if task.remaining == 0:
                    task.completion = self.clock + 1

        # Increment waiting ticks for ready tasks not assigned to any core
        assigned_set = set(assigned_pids)
        for t in ready:
            if t.pid not in assigned_set:
                t.waiting_ticks += 1

        self.clock += 1
        return dispatched

    def core_utilization(self, core_id: int) -> float:
        history = self.core_history.get(core_id, [])
        if not history:
            return 0.0
        busy = self.core_busy_ticks.get(core_id, 0)
        return (busy / len(history)) * 100.0

    def overall_utilization(self) -> float:
        total_ticks = self.clock * self.num_cores
        if total_ticks == 0:
            return 0.0
        total_busy = sum(self.core_busy_ticks.values())
        return (total_busy / total_ticks) * 100.0

    def load_imbalance_std_dev(self) -> float:
        """Standard deviation of core utilization percentages."""
        if self.num_cores <= 1 or self.clock == 0:
            return 0.0
        utils = [self.core_utilization(c) for c in range(self.num_cores)]
        mean = sum(utils) / len(utils)
        variance = sum((u - mean) ** 2 for u in utils) / len(utils)
        return math.sqrt(variance)

    def stats(self) -> Tuple[float, float, int]:
        finished = [t for t in self.tasks.values() if t.completion is not None]
        if not finished:
            return 0.0, 0.0, 0.0
        avg_wait = sum(t.completion - t.arrival - t.burst for t in finished) / len(finished)
        avg_turn = sum(t.completion - t.arrival for t in finished) / len(finished)
        missed = sum(1 for t in finished if t.completion > t.deadline)
        return avg_wait, avg_turn, missed


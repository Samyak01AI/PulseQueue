"""
Scheduling Engine Implementations:
1. PulseQueue Adaptive Priority Scheduling (with aging & deadline slack awareness via IndexedMinHeap)
2. Static Priority Scheduling (preemptive baseline, reveals starvation)
3. Shortest Job First / Shortest Remaining Time First (SJF / SRTF)
4. Round Robin (RR with configurable time quantum)
5. First Come First Served (FCFS non-preemptive baseline)
"""
from abc import ABC, abstractmethod
from typing import Dict, List, Tuple, Optional, Any
from core.models import Task, DecisionExplanation, ProcessType
from core.heap import IndexedMinHeap


class BaseScheduler(ABC):
    """Abstract base class for CPU scheduling algorithms."""

    def __init__(self, name: str):
        self.name = name
        self.tasks: Dict[int, Task] = {}
        self.clock: int = 0
        self.history: List[Tuple[int, Optional[int]]] = []  # (clock_tick, active_pid)
        self.active: Optional[int] = None
        self.context_switches: int = 0
        self.last_dispatched: Optional[int] = None
        self.explanations: List[DecisionExplanation] = []
        self.starvation_threshold: int = 15

    def add(self, task: Task) -> None:
        if task.pid in self.tasks:
            raise ValueError(f"Process ID P{task.pid} already exists")
        if min(task.arrival, task.priority) < 0 or task.burst < 1 or task.deadline < 1:
            raise ValueError("Parameters must satisfy: arrival >= 0, priority >= 0, burst >= 1, deadline >= 1")
        self.tasks[task.pid] = task

    def remove(self, pid: int) -> bool:
        if pid in self.tasks:
            # Can only remove if not yet started or completed
            t = self.tasks[pid]
            if t.remaining == t.burst and self.active != pid:
                del self.tasks[pid]
                return True
        return False

    def clear(self) -> None:
        self.tasks.clear()
        self.clock = 0
        self.history.clear()
        self.active = None
        self.context_switches = 0
        self.last_dispatched = None
        self.explanations.clear()

    def done(self) -> bool:
        return bool(self.tasks) and all(t.remaining == 0 for t in self.tasks.values())

    def ready_tasks(self) -> List[Task]:
        return [t for t in self.tasks.values() if t.arrival <= self.clock and t.remaining > 0]

    def completed_tasks(self) -> List[Task]:
        return [t for t in self.tasks.values() if t.completion is not None]

    def starved_tasks(self) -> List[Task]:
        """Returns ready tasks that have been waiting beyond the starvation threshold."""
        res = []
        for t in self.ready_tasks():
            waited = max(0, self.clock - t.arrival - (t.burst - t.remaining))
            if waited >= self.starvation_threshold and self.active != t.pid:
                res.append(t)
        return res

    def stats(self) -> Tuple[float, float, int]:
        """Returns (avg_waiting_time, avg_turnaround_time, missed_deadlines_count)."""
        finished = self.completed_tasks()
        if not finished:
            return 0.0, 0.0, 0.0
        avg_wait = sum(t.completion - t.arrival - t.burst for t in finished) / len(finished)
        avg_turn = sum(t.completion - t.arrival for t in finished) / len(finished)
        missed = sum(1 for t in finished if t.completion > t.deadline)
        return avg_wait, avg_turn, missed

    def cpu_utilization(self) -> float:
        """Percentage of elapsed ticks where CPU was busy executing a process."""
        if not self.history:
            return 0.0
        busy_ticks = sum(1 for _, pid in self.history if pid is not None)
        return (busy_ticks / len(self.history)) * 100.0

    @abstractmethod
    def select_next(self, ready: List[Task]) -> Tuple[Optional[int], DecisionExplanation]:
        """Algorithmic selection policy."""
        pass

    def step(self) -> Optional[int]:
        """Simulates one clock cycle."""
        ready = self.ready_tasks()

        if not ready:
            self.history.append((self.clock, None))
            self.active = None
            explanation = DecisionExplanation(
                clock=self.clock,
                pid=None,
                reason="CPU Idle: No processes have arrived or all arrived processes are completed.",
                ready_count=0
            )
            self.explanations.append(explanation)
            self.clock += 1
            return None

        chosen_pid, explanation = self.select_next(ready)
        self.explanations.append(explanation)

        # Context switch tracking
        if self.last_dispatched is not None and self.last_dispatched != chosen_pid:
            self.context_switches += 1
        self.last_dispatched = chosen_pid
        self.active = chosen_pid

        if chosen_pid is not None:
            task = self.tasks[chosen_pid]
            if task.first_run is None:
                task.first_run = self.clock
            task.remaining -= 1
            task.executed_ticks += 1
            task.last_executed_tick = self.clock

            self.history.append((self.clock, chosen_pid))
            self.clock += 1

            if task.remaining == 0:
                task.completion = self.clock
        else:
            self.history.append((self.clock, None))
            self.clock += 1

        # Update waiting ticks for all other ready tasks
        for t in self.ready_tasks():
            if t.pid != chosen_pid:
                t.waiting_ticks += 1

        return chosen_pid


class PulseQueueScheduler(BaseScheduler):
    """
    Predictive & Self-Adaptive Scheduling Engine.
    
    Formula:
      score = base_priority - (aging * waiting_ticks) - (deadline_weight * max(0, 5 - slack))
      where:
        waiting_ticks = max(0, clock - arrival - (burst - remaining))
        slack = deadline - clock - remaining
    
    Uses an IndexedMinHeap to maintain the ready queue with O(log N) updates.
    Lower score = higher execution priority.
    """
    def __init__(self, aging: float = 0.6, deadline_weight: float = 2.5):
        super().__init__("PulseQueue Adaptive")
        self.mode = "Adaptive"
        self.aging = aging
        self.deadline_weight = deadline_weight
        self.heap = IndexedMinHeap()

    def score(self, task: Task) -> float:
        if self.mode == "Static":
            return float(task.priority)
        waited = max(0, self.clock - task.arrival - (task.burst - task.remaining))
        slack = task.deadline - self.clock - task.remaining
        urgency = self.deadline_weight * max(0, 5 - slack)
        return task.priority - (self.aging * waited) - urgency

    def score_breakdown(self, task: Task) -> Dict[str, Any]:
        waited = max(0, self.clock - task.arrival - (task.burst - task.remaining))
        slack = task.deadline - self.clock - task.remaining
        urgency = self.deadline_weight * max(0, 5 - slack)
        aging_val = self.aging * waited
        total = task.priority - aging_val - urgency if self.mode == "Adaptive" else float(task.priority)
        return {
            "base_priority": task.priority,
            "waited": waited,
            "aging_discount": aging_val,
            "slack": slack,
            "urgency_discount": urgency,
            "total_score": total
        }

    def select_next(self, ready: List[Task]) -> Tuple[Optional[int], DecisionExplanation]:
        # Rebuild indexed heap with current dynamic scores in O(N)
        pairs = [(t.pid, self.score(t)) for t in ready]
        self.heap.rebuild(pairs)

        chosen_pid = self.heap.pop()
        task = self.tasks[chosen_pid]
        breakdown = self.score_breakdown(task)

        # Check if preemption occurred
        preempted_pid = None
        if self.active is not None and self.active != chosen_pid:
            if self.active in self.tasks and self.tasks[self.active].remaining > 0:
                preempted_pid = self.active

        # Build human-readable explainability narrative
        if self.mode == "Adaptive":
            reason = (
                f"Selected P{chosen_pid:02d} (score: {breakdown['total_score']:.2f}). "
                f"Base priority: {task.priority}. "
                f"Waiting: {breakdown['waited']} ticks (aging -{breakdown['aging_discount']:.2f}). "
                f"Deadline slack: {breakdown['slack']} ticks (urgency penalty: -{breakdown['urgency_discount']:.2f})."
            )
            if preempted_pid:
                prev_task = self.tasks[preempted_pid]
                prev_score = self.score(prev_task)
                reason = f"⚡ PREEMPTION: P{chosen_pid:02d} (score {breakdown['total_score']:.2f}) preempted P{preempted_pid:02d} (score {prev_score:.2f}) because of urgent priority aging / tight deadline slack."
        else:
            reason = f"Static Priority selection: P{chosen_pid:02d} has lowest raw priority value ({task.priority})."

        explanation = DecisionExplanation(
            clock=self.clock,
            pid=chosen_pid,
            reason=reason,
            score=breakdown['total_score'],
            base_priority=task.priority,
            aging_discount=breakdown['aging_discount'],
            urgency_discount=breakdown['urgency_discount'],
            waited_ticks=breakdown['waited'],
            slack_ticks=breakdown['slack'],
            preempted_pid=preempted_pid,
            ready_count=len(ready)
        )
        return chosen_pid, explanation


class StaticPriorityScheduler(BaseScheduler):
    """Preemptive Static Priority: Process with lowest raw priority number executes."""
    def __init__(self):
        super().__init__("Static Priority")

    def select_next(self, ready: List[Task]) -> Tuple[Optional[int], DecisionExplanation]:
        # Sort by priority ascending, tie-break by PID
        sorted_tasks = sorted(ready, key=lambda t: (t.priority, t.pid))
        chosen = sorted_tasks[0]
        
        preempted_pid = self.active if (self.active and self.active != chosen.pid and self.tasks[self.active].remaining > 0) else None
        reason = f"Static Priority: Selected P{chosen.pid:02d} with raw priority {chosen.priority}."
        if preempted_pid:
            reason = f"Static Preemption: P{chosen.pid:02d} (prio {chosen.priority}) preempted P{preempted_pid:02d}."

        explanation = DecisionExplanation(
            clock=self.clock,
            pid=chosen.pid,
            reason=reason,
            score=float(chosen.priority),
            base_priority=chosen.priority,
            preempted_pid=preempted_pid,
            ready_count=len(ready)
        )
        return chosen.pid, explanation


class SJFScheduler(BaseScheduler):
    """Shortest Remaining Time First (SRTF) Preemptive."""
    def __init__(self):
        super().__init__("Shortest Job First (SRTF)")

    def select_next(self, ready: List[Task]) -> Tuple[Optional[int], DecisionExplanation]:
        sorted_tasks = sorted(ready, key=lambda t: (t.remaining, t.arrival, t.pid))
        chosen = sorted_tasks[0]

        preempted_pid = self.active if (self.active and self.active != chosen.pid and self.tasks[self.active].remaining > 0) else None
        reason = f"SRTF: Selected P{chosen.pid:02d} with shortest remaining burst ({chosen.remaining} ticks left)."
        if preempted_pid:
            reason = f"SRTF Preemption: P{chosen.pid:02d} remaining ({chosen.remaining}) < P{preempted_pid:02d} remaining ({self.tasks[preempted_pid].remaining})."

        explanation = DecisionExplanation(
            clock=self.clock,
            pid=chosen.pid,
            reason=reason,
            score=float(chosen.remaining),
            preempted_pid=preempted_pid,
            ready_count=len(ready)
        )
        return chosen.pid, explanation


class RRScheduler(BaseScheduler):
    """Round Robin Scheduling with configurable time quantum."""
    def __init__(self, quantum: int = 3):
        super().__init__("Round Robin")
        self.quantum = quantum
        self.current_slice: int = 0
        self.queue: List[int] = []

    def select_next(self, ready: List[Task]) -> Tuple[Optional[int], DecisionExplanation]:
        ready_pids = {t.pid for t in ready}
        
        # Add newly arrived tasks to the end of the round-robin queue
        for t in sorted(ready, key=lambda x: (x.arrival, x.pid)):
            if t.pid not in self.queue:
                self.queue.append(t.pid)
        
        # Remove any tasks from queue that are no longer ready
        self.queue = [pid for pid in self.queue if pid in ready_pids]

        if not self.queue:
            return None, DecisionExplanation(clock=self.clock, pid=None, reason="RR Queue Empty")

        # Check if current running process's time slice expired
        if self.active is not None and self.active in self.queue:
            if self.current_slice >= self.quantum:
                # Move current active to the back of the queue
                self.queue.remove(self.active)
                self.queue.append(self.active)
                self.current_slice = 0

        chosen_pid = self.queue[0]
        if chosen_pid == self.active:
            self.current_slice += 1
        else:
            self.current_slice = 1

        reason = f"Round Robin: P{chosen_pid:02d} running slice {self.current_slice}/{self.quantum}."
        explanation = DecisionExplanation(
            clock=self.clock,
            pid=chosen_pid,
            reason=reason,
            score=float(self.current_slice),
            ready_count=len(ready)
        )
        return chosen_pid, explanation


class FCFSScheduler(BaseScheduler):
    """First Come First Served (Non-Preemptive)."""
    def __init__(self):
        super().__init__("FCFS")

    def select_next(self, ready: List[Task]) -> Tuple[Optional[int], DecisionExplanation]:
        # If currently running task still has remaining time, let it continue (non-preemptive)
        if self.active is not None and self.active in self.tasks and self.tasks[self.active].remaining > 0:
            chosen = self.tasks[self.active]
            reason = f"FCFS: P{chosen.pid:02d} continuing execution non-preemptively ({chosen.remaining} ticks left)."
        else:
            sorted_tasks = sorted(ready, key=lambda t: (t.arrival, t.pid))
            chosen = sorted_tasks[0]
            reason = f"FCFS: P{chosen.pid:02d} arrived first at Tick {chosen.arrival}."

        explanation = DecisionExplanation(
            clock=self.clock,
            pid=chosen.pid,
            reason=reason,
            score=float(chosen.arrival),
            ready_count=len(ready)
        )
        return chosen.pid, explanation


# Backward-compatibility alias
Scheduler = PulseQueueScheduler


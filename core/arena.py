"""
Algorithm Arena: Multi-Algorithm Competitive Benchmark Engine

Executes identical workloads against:
1. PulseQueue Adaptive (Indexed Min-Heap, Aging, Deadline Urgency)
2. Static Priority (Preemptive)
3. Shortest Job First (SRTF Preemptive)
4. Round Robin (RR with Quantum=3)
5. First Come First Served (FCFS Non-Preemptive)

Computes actual performance metrics without hardcoded or fabricated data.
"""
from dataclasses import dataclass, field
from typing import Dict, List, Any, Optional
from core.models import Task
from core.scheduler import (
    PulseQueueScheduler,
    StaticPriorityScheduler,
    SJFScheduler,
    RRScheduler,
    FCFSScheduler,
    BaseScheduler
)


@dataclass
class ArenaResult:
    algorithm_name: str
    avg_wait: float
    avg_turnaround: float
    cpu_utilization: float
    deadline_misses: int
    deadline_miss_ratio: float
    context_switches: int
    starvation_incidents: int
    makespan: int
    completed_count: int
    total_count: int
    timeline: List[tuple] = field(default_factory=list)
    task_stats: Dict[int, Dict[str, Any]] = field(default_factory=dict)


class ArenaRunner:
    @staticmethod
    def run_all(initial_tasks: List[Task], starvation_threshold: int = 15, rr_quantum: int = 3) -> Dict[str, ArenaResult]:
        """
        Runs identical cloned workloads on all 5 algorithms to completion.
        Returns a dictionary of ArenaResult keyed by algorithm name.
        """
        algorithms: List[BaseScheduler] = [
            PulseQueueScheduler(aging=0.6, deadline_weight=2.5),
            StaticPriorityScheduler(),
            SJFScheduler(),
            RRScheduler(quantum=rr_quantum),
            FCFSScheduler()
        ]

        results: Dict[str, ArenaResult] = {}

        for scheduler in algorithms:
            scheduler.starvation_threshold = starvation_threshold
            # Populate cloned tasks
            scheduler.clear()
            for t in initial_tasks:
                scheduler.add(t.clone())

            starvation_set = set()

            # Run until done or safety timeout (e.g., 5000 ticks)
            safety_limit = 5000
            while not scheduler.done() and scheduler.clock < safety_limit:
                # Check for starvation
                starved = scheduler.starved_tasks()
                for st in starved:
                    starvation_set.add(st.pid)
                scheduler.step()

            avg_wait, avg_turn, misses = scheduler.stats()
            util = scheduler.cpu_utilization()
            finished = scheduler.completed_tasks()
            total = len(scheduler.tasks)
            miss_ratio = (misses / len(finished) * 100.0) if finished else 0.0

            task_details = {}
            for t in scheduler.tasks.values():
                c = t.completion if t.completion is not None else scheduler.clock
                wait = max(0, c - t.arrival - t.burst)
                turn = c - t.arrival
                task_details[t.pid] = {
                    "completion": t.completion,
                    "waiting": wait,
                    "turnaround": turn,
                    "missed": (t.completion > t.deadline) if t.completion else True,
                    "first_run": t.first_run
                }

            results[scheduler.name] = ArenaResult(
                algorithm_name=scheduler.name,
                avg_wait=round(avg_wait, 2),
                avg_turnaround=round(avg_turn, 2),
                cpu_utilization=round(util, 1),
                deadline_misses=misses,
                deadline_miss_ratio=round(miss_ratio, 1),
                context_switches=scheduler.context_switches,
                starvation_incidents=len(starvation_set),
                makespan=scheduler.clock,
                completed_count=len(finished),
                total_count=total,
                timeline=list(scheduler.history),
                task_stats=task_details
            )

        return results

    @staticmethod
    def simulate_single(
        tasks: List[Task],
        algorithm_name: str = "PulseQueue Adaptive",
        aging: float = 0.6,
        deadline_weight: float = 2.5,
        starvation_threshold: int = 15,
        rr_quantum: int = 3
    ) -> ArenaResult:
        """
        Simulates a single algorithm with custom parameters on cloned tasks.
        Returns calculated ArenaResult without altering the original tasks.
        """
        if algorithm_name == "Static Priority":
            sched = StaticPriorityScheduler()
        elif algorithm_name in ("Shortest Job First (SRTF)", "SJF", "SRTF"):
            sched = SJFScheduler()
        elif algorithm_name in ("Round Robin", "RR"):
            sched = RRScheduler(quantum=rr_quantum)
        elif algorithm_name in ("FCFS", "First Come First Served"):
            sched = FCFSScheduler()
        else:
            sched = PulseQueueScheduler(aging=aging, deadline_weight=deadline_weight)

        sched.starvation_threshold = starvation_threshold
        sched.clear()
        for t in tasks:
            sched.add(t.clone())

        starvation_set = set()
        safety_limit = 5000
        while not sched.done() and sched.clock < safety_limit:
            starved = sched.starved_tasks()
            for st in starved:
                starvation_set.add(st.pid)
            sched.step()

        avg_wait, avg_turn, misses = sched.stats()
        util = sched.cpu_utilization()
        finished = sched.completed_tasks()
        total = len(sched.tasks)
        miss_ratio = (misses / len(finished) * 100.0) if finished else 0.0

        task_details = {}
        for t in sched.tasks.values():
            c = t.completion if t.completion is not None else sched.clock
            wait = max(0, c - t.arrival - t.burst)
            turn = c - t.arrival
            task_details[t.pid] = {
                "completion": t.completion,
                "waiting": wait,
                "turnaround": turn,
                "missed": (t.completion > t.deadline) if t.completion else True,
                "first_run": t.first_run
            }

        return ArenaResult(
            algorithm_name=sched.name,
            avg_wait=round(avg_wait, 2),
            avg_turnaround=round(avg_turn, 2),
            cpu_utilization=round(util, 1),
            deadline_misses=misses,
            deadline_miss_ratio=round(miss_ratio, 1),
            context_switches=sched.context_switches,
            starvation_incidents=len(starvation_set),
            makespan=sched.clock,
            completed_count=len(finished),
            total_count=total,
            timeline=list(sched.history),
            task_stats=task_details
        )

    @staticmethod
    def identify_winners(results: Dict[str, ArenaResult]) -> Dict[str, str]:
        """
        Determines the best performing algorithm for each metric:
        - avg_wait (min)
        - avg_turnaround (min)
        - deadline_misses (min)
        - cpu_utilization (max)
        - starvation_incidents (min)
        - context_switches (min)
        """
        if not results:
            return {}

        return {
            "avg_wait": min(results.values(), key=lambda r: r.avg_wait).algorithm_name,
            "avg_turnaround": min(results.values(), key=lambda r: r.avg_turnaround).algorithm_name,
            "deadline_misses": min(results.values(), key=lambda r: (r.deadline_misses, r.avg_wait)).algorithm_name,
            "cpu_utilization": max(results.values(), key=lambda r: r.cpu_utilization).algorithm_name,
            "starvation_incidents": min(results.values(), key=lambda r: (r.starvation_incidents, r.avg_wait)).algorithm_name,
            "context_switches": min(results.values(), key=lambda r: r.context_switches).algorithm_name,
        }


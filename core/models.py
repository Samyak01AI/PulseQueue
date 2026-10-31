"""
PulseQueue X: Models and Data Structures
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional, Dict, Any, List


class ProcessType(Enum):
    INTERACTIVE = "Interactive"
    BATCH = "Batch"
    REAL_TIME = "Real-Time"
    SYSTEM = "System"


class TaskState(Enum):
    PENDING = "PENDING"
    READY = "READY"
    RUNNING = "RUNNING"
    STARVED = "STARVED"
    COMPLETED = "COMPLETED"


# Distinct cyberpunk / modern neon process palette
PROCESS_PALETTE = [
    "#00E5FF",  # 1: Cyan
    "#8B5CF6",  # 2: Violet
    "#22C55E",  # 3: Emerald
    "#F59E0B",  # 4: Amber
    "#EC4899",  # 5: Pink
    "#3B82F6",  # 6: Blue
    "#10B981",  # 7: Teal
    "#F97316",  # 8: Orange
    "#A855F7",  # 9: Purple
    "#06B6D4",  # 10: Light Cyan
    "#E11D48",  # 11: Rose
    "#84CC16",  # 12: Lime
]


def get_process_color(pid: int) -> str:
    return PROCESS_PALETTE[(pid - 1) % len(PROCESS_PALETTE)]


@dataclass
class Task:
    pid: int
    arrival: int
    burst: int
    priority: int
    deadline: int
    process_type: ProcessType = ProcessType.INTERACTIVE
    remaining: int = 0
    completion: Optional[int] = None
    first_run: Optional[int] = None
    waiting_ticks: int = 0
    executed_ticks: int = 0
    last_executed_tick: Optional[int] = None
    core_id: Optional[int] = None

    def __post_init__(self):
        if self.remaining <= 0 and self.burst > 0:
            self.remaining = self.burst

    def clone(self) -> 'Task':
        """Deep copy for running independent benchmarks with the same initial task set."""
        return Task(
            pid=self.pid,
            arrival=self.arrival,
            burst=self.burst,
            priority=self.priority,
            deadline=self.deadline,
            process_type=self.process_type,
            remaining=self.burst,
            completion=None,
            first_run=None,
            waiting_ticks=0,
            executed_ticks=0,
            last_executed_tick=None,
            core_id=None
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pid": self.pid,
            "arrival": self.arrival,
            "burst": self.burst,
            "priority": self.priority,
            "deadline": self.deadline,
            "process_type": self.process_type.value if isinstance(self.process_type, ProcessType) else str(self.process_type),
            "remaining": self.remaining,
            "completion": self.completion,
            "first_run": self.first_run,
            "waiting_ticks": self.waiting_ticks,
            "executed_ticks": self.executed_ticks,
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Task':
        pt = data.get("process_type", ProcessType.INTERACTIVE.value)
        try:
            pt_enum = ProcessType(pt)
        except ValueError:
            pt_enum = ProcessType.INTERACTIVE

        t = cls(
            pid=int(data["pid"]),
            arrival=int(data["arrival"]),
            burst=int(data["burst"]),
            priority=int(data["priority"]),
            deadline=int(data["deadline"]),
            process_type=pt_enum,
            remaining=int(data.get("remaining", data["burst"]))
        )
        t.completion = data.get("completion")
        t.first_run = data.get("first_run")
        t.waiting_ticks = data.get("waiting_ticks", 0)
        t.executed_ticks = data.get("executed_ticks", 0)
        return t


@dataclass
class DecisionExplanation:
    clock: int
    pid: Optional[int]
    reason: str
    score: Optional[float] = None
    base_priority: Optional[int] = None
    aging_discount: Optional[float] = None
    urgency_discount: Optional[float] = None
    waited_ticks: Optional[int] = None
    slack_ticks: Optional[int] = None
    preempted_pid: Optional[int] = None
    ready_count: int = 0


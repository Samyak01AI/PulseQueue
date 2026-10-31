"""
Workload Generator and Import/Export Utilities for PulseQueue X
"""
import csv
import json
import random
from typing import List, Dict, Any
from core.models import Task, ProcessType


class WorkloadManager:
    @staticmethod
    def get_standard_demo() -> List[Task]:
        """Balanced baseline workload."""
        return [
            Task(pid=1, arrival=0, burst=8, priority=8, deadline=22, process_type=ProcessType.BATCH),
            Task(pid=2, arrival=1, burst=4, priority=3, deadline=11, process_type=ProcessType.INTERACTIVE),
            Task(pid=3, arrival=2, burst=6, priority=6, deadline=16, process_type=ProcessType.REAL_TIME),
            Task(pid=4, arrival=4, burst=3, priority=2, deadline=12, process_type=ProcessType.INTERACTIVE),
            Task(pid=5, arrival=6, burst=5, priority=7, deadline=25, process_type=ProcessType.BATCH),
            Task(pid=6, arrival=8, burst=4, priority=4, deadline=20, process_type=ProcessType.SYSTEM),
            Task(pid=7, arrival=10, burst=2, priority=1, deadline=15, process_type=ProcessType.REAL_TIME),
        ]

    @staticmethod
    def get_starvation_hazard() -> List[Task]:
        """
        P01 has low priority (12) and arrives at t=0.
        Subsequent tasks arrive every 2 ticks with high priority (1 or 2).
        In Static Priority, P01 is completely starved.
        In PulseQueue Adaptive, aging gradually elevates P01's dynamic priority until it executes.
        """
        tasks = [
            Task(pid=1, arrival=0, burst=6, priority=12, deadline=40, process_type=ProcessType.BATCH),
        ]
        p_id = 2
        for t in range(2, 22, 3):
            tasks.append(
                Task(pid=p_id, arrival=t, burst=3, priority=random.choice([1, 2]), deadline=t + 10, process_type=ProcessType.INTERACTIVE)
            )
            p_id += 1
        return tasks

    @staticmethod
    def get_deadline_crunch() -> List[Task]:
        """Multiple tasks with extremely tight deadlines to test deadline urgency boosting."""
        return [
            Task(pid=1, arrival=0, burst=5, priority=5, deadline=8, process_type=ProcessType.REAL_TIME),
            Task(pid=2, arrival=1, burst=4, priority=7, deadline=7, process_type=ProcessType.REAL_TIME),
            Task(pid=3, arrival=2, burst=6, priority=4, deadline=15, process_type=ProcessType.INTERACTIVE),
            Task(pid=4, arrival=3, burst=3, priority=8, deadline=9, process_type=ProcessType.REAL_TIME),
            Task(pid=5, arrival=5, burst=4, priority=3, deadline=14, process_type=ProcessType.SYSTEM),
            Task(pid=6, arrival=7, burst=2, priority=6, deadline=12, process_type=ProcessType.REAL_TIME),
        ]

    @staticmethod
    def get_heavy_batch() -> List[Task]:
        """Long-running compute-bound tasks."""
        return [
            Task(pid=1, arrival=0, burst=14, priority=6, deadline=35, process_type=ProcessType.BATCH),
            Task(pid=2, arrival=2, burst=10, priority=4, deadline=28, process_type=ProcessType.BATCH),
            Task(pid=3, arrival=5, burst=16, priority=8, deadline=45, process_type=ProcessType.BATCH),
            Task(pid=4, arrival=8, burst=8,  priority=3, deadline=24, process_type=ProcessType.BATCH),
            Task(pid=5, arrival=12, burst=12, priority=5, deadline=38, process_type=ProcessType.BATCH),
        ]

    @staticmethod
    def get_interactive_burst() -> List[Task]:
        """High-frequency short bursts mimicking interactive UI/OS threads."""
        tasks = []
        for pid in range(1, 9):
            arr = (pid - 1) * 2
            tasks.append(
                Task(
                    pid=pid,
                    arrival=arr,
                    burst=random.randint(2, 4),
                    priority=random.randint(1, 5),
                    deadline=arr + random.randint(8, 14),
                    process_type=ProcessType.INTERACTIVE
                )
            )
        return tasks

    @staticmethod
    def generate_random(count: int = 8, max_arrival: int = 15, max_burst: int = 10) -> List[Task]:
        """Generates synthetic random workload."""
        types = list(ProcessType)
        tasks = []
        for i in range(1, count + 1):
            arr = random.randint(0, max_arrival)
            burst = random.randint(1, max_burst)
            prio = random.randint(1, 10)
            deadline = arr + burst + random.randint(2, 16)
            ptype = random.choice(types)
            tasks.append(Task(pid=i, arrival=arr, burst=burst, priority=prio, deadline=deadline, process_type=ptype))
        tasks.sort(key=lambda t: t.arrival)
        # Re-index PIDs for clean display
        for idx, t in enumerate(tasks, 1):
            t.pid = idx
        return tasks

    @staticmethod
    def export_json(tasks: List[Task], filepath: str) -> None:
        data = [t.to_dict() for t in tasks]
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2)

    @staticmethod
    def import_json(filepath: str) -> List[Task]:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return [Task.from_dict(item) for item in data]

    @staticmethod
    def export_csv(tasks: List[Task], filepath: str) -> None:
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['PID', 'Arrival', 'Burst', 'Priority', 'Deadline', 'ProcessType'])
            for t in tasks:
                writer.writerow([t.pid, t.arrival, t.burst, t.priority, t.deadline, t.process_type.value])

    @staticmethod
    def import_csv(filepath: str) -> List[Task]:
        tasks = []
        with open(filepath, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    pt_val = row.get('ProcessType', 'Interactive')
                    pt = ProcessType(pt_val)
                except ValueError:
                    pt = ProcessType.INTERACTIVE
                tasks.append(
                    Task(
                        pid=int(row['PID']),
                        arrival=int(row['Arrival']),
                        burst=int(row['Burst']),
                        priority=int(row['Priority']),
                        deadline=int(row['Deadline']),
                        process_type=pt
                    )
                )
        return tasks


"""
Execution History and Analytics Manager for PulseQueue X
"""
import csv
from dataclasses import dataclass, asdict
from datetime import datetime
from typing import List, Optional, Dict, Any


@dataclass
class RunRecord:
    timestamp: str
    run_id: str
    algorithm: str
    workload_name: str
    num_processes: int
    completed_processes: int
    makespan: int
    avg_wait: float
    avg_turnaround: float
    cpu_utilization: float
    deadline_misses: int
    context_switches: int

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ExecutionHistory:
    def __init__(self):
        self.records: List[RunRecord] = []

    def log_run(
        self,
        algorithm: str,
        workload_name: str,
        num_processes: int,
        completed_processes: int,
        makespan: int,
        avg_wait: float,
        avg_turnaround: float,
        cpu_utilization: float,
        deadline_misses: int,
        context_switches: int
    ) -> RunRecord:
        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        run_id = f"RUN-{len(self.records) + 1:03d}"
        record = RunRecord(
            timestamp=now_str,
            run_id=run_id,
            algorithm=algorithm,
            workload_name=workload_name,
            num_processes=num_processes,
            completed_processes=completed_processes,
            makespan=makespan,
            avg_wait=round(avg_wait, 2),
            avg_turnaround=round(avg_turnaround, 2),
            cpu_utilization=round(cpu_utilization, 1),
            deadline_misses=deadline_misses,
            context_switches=context_switches
        )
        self.records.insert(0, record)  # Most recent first
        return record

    def clear(self) -> None:
        self.records.clear()

    def export_csv(self, filepath: str) -> None:
        with open(filepath, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow([
                'RunID', 'Timestamp', 'Algorithm', 'Workload', 'TotalProcesses',
                'Completed', 'Makespan', 'AvgWait', 'AvgTurnaround',
                'CPUUtilPercent', 'DeadlineMisses', 'ContextSwitches'
            ])
            for r in self.records:
                writer.writerow([
                    r.run_id, r.timestamp, r.algorithm, r.workload_name,
                    r.num_processes, r.completed_processes, r.makespan,
                    r.avg_wait, r.avg_turnaround, r.cpu_utilization,
                    r.deadline_misses, r.context_switches
                ])


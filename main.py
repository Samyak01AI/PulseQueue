"""
PulseQueue X: Predictive & Self-Adaptive Process Scheduling Engine
Main Application Entry Point
"""
import sys

# Ensure GUI attaches to the user's interactive 'Default' desktop on Windows
if sys.platform == 'win32':
    try:
        import ctypes
        user32 = ctypes.windll.user32
        h_desk = user32.OpenDesktopW('Default', 0, False, 0x01FF)
        if h_desk:
            user32.SetThreadDesktop(h_desk)
    except Exception:
        pass

from core.models import Task, ProcessType, TaskState, DecisionExplanation, get_process_color, PROCESS_PALETTE
from core.heap import IndexedMinHeap
from core.scheduler import (
    BaseScheduler,
    PulseQueueScheduler,
    StaticPriorityScheduler,
    SJFScheduler,
    RRScheduler,
    FCFSScheduler,
    Scheduler
)
from core.multicore import MultiCoreScheduler
from core.arena import ArenaRunner, ArenaResult
from core.workloads import WorkloadManager
from core.analytics import ExecutionHistory, RunRecord

from app import PulseQueueXApp, PulseQueueApp


if __name__ == '__main__':
    app = PulseQueueXApp()
    app.mainloop()

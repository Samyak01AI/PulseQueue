"""
PulseQueue X: Automated Verification Test Suite
Tests data structures, all 5 scheduling algorithms, multi-core simulation, and UI view integrity.
"""
import sys
import unittest
import tempfile
import os
from core.models import Task, ProcessType, DecisionExplanation
from core.heap import IndexedMinHeap
from core.scheduler import (
    PulseQueueScheduler, StaticPriorityScheduler, SJFScheduler,
    RRScheduler, FCFSScheduler
)
from core.multicore import MultiCoreScheduler
from core.arena import ArenaRunner
from core.workloads import WorkloadManager
from core.analytics import ExecutionHistory


class TestIndexedMinHeap(unittest.TestCase):
    def test_heap_operations(self):
        heap = IndexedMinHeap()
        self.assertTrue(heap.is_empty())

        # Test insert
        heap.push_or_update(pid=1, key=10.5)
        heap.push_or_update(pid=2, key=5.0)
        heap.push_or_update(pid=3, key=15.2)
        heap.push_or_update(pid=4, key=2.0)

        self.assertEqual(len(heap), 4)
        self.assertTrue(heap.contains(2))
        self.assertEqual(heap.peek(), (2.0, 4))

        # Test decrease-key (key of pid 3 drops from 15.2 to 1.0)
        heap.push_or_update(pid=3, key=1.0)
        self.assertEqual(heap.peek(), (1.0, 3))
        self.assertEqual(heap.pop(), 3)

        # Next min should now be pid 4 (key 2.0)
        self.assertEqual(heap.pop(), 4)
        # Next min should be pid 2 (key 5.0)
        self.assertEqual(heap.pop(), 2)
        # Next min should be pid 1 (key 10.5)
        self.assertEqual(heap.pop(), 1)
        self.assertTrue(heap.is_empty())

    def test_rebuild_floyd(self):
        heap = IndexedMinHeap()
        pairs = [(10, 25.0), (20, 5.0), (30, 12.0), (40, 2.0), (50, 8.0)]
        heap.rebuild(pairs)

        self.assertEqual(len(heap), 5)
        self.assertEqual(heap.pop(), 40)  # key 2.0
        self.assertEqual(heap.pop(), 20)  # key 5.0
        self.assertEqual(heap.pop(), 50)  # key 8.0
        self.assertEqual(heap.pop(), 30)  # key 12.0
        self.assertEqual(heap.pop(), 10)  # key 25.0


class TestSchedulers(unittest.TestCase):
    def test_pulsequeue_adaptive_aging(self):
        scheduler = PulseQueueScheduler(aging=1.0, deadline_weight=0.0)
        # Task 1 arrives at t=0 with base priority 10
        scheduler.add(Task(pid=1, arrival=0, burst=4, priority=10, deadline=50))
        # Task 2 arrives at t=0 with base priority 8
        scheduler.add(Task(pid=2, arrival=0, burst=2, priority=8, deadline=50))

        # At t=0, Task 2 has score 8.0, Task 1 has score 10.0 -> Task 2 runs
        scheduler.step()
        self.assertEqual(scheduler.active, 2)
        self.assertEqual(scheduler.tasks[2].remaining, 1)

        # At t=1, Task 2 still runs
        scheduler.step()
        self.assertEqual(scheduler.active, 2)
        self.assertEqual(scheduler.tasks[2].remaining, 0)
        self.assertEqual(scheduler.tasks[2].completion, 2)

        # At t=2, Task 1 waited 2 ticks -> score = 10 - 1.0 * 2 = 8.0 -> Task 1 runs
        scheduler.step()
        self.assertEqual(scheduler.active, 1)

    def test_starvation_prevention(self):
        """
        Verify that PulseQueue prevents starvation when high-priority tasks keep arriving,
        whereas Static Priority would starve low-priority tasks.
        """
        pq = PulseQueueScheduler(aging=1.0, deadline_weight=0.0)
        sp = StaticPriorityScheduler()

        # Low-priority task arrives at 0
        t_low_pq = Task(pid=1, arrival=0, burst=2, priority=20, deadline=100)
        t_low_sp = Task(pid=1, arrival=0, burst=2, priority=20, deadline=100)
        pq.add(t_low_pq)
        sp.add(t_low_sp)

        # High priority tasks arriving at 0, 1, 2, 3, 4
        for i in range(2, 7):
            arr = i - 2
            pq.add(Task(pid=i, arrival=arr, burst=2, priority=2, deadline=100))
            sp.add(Task(pid=i, arrival=arr, burst=2, priority=2, deadline=100))

        # Run 8 steps
        for _ in range(8):
            pq.step()
            sp.step()

        # In Static Priority, P1 never gets dispatched (score remains 20 > 2)
        self.assertIsNone(sp.tasks[1].first_run)

        # In PulseQueue Adaptive, aging discount eventually forces P1 to execute!
        # At tick 6, waited=6, score = 20 - 6 = 14; with sufficient wait it runs!
        while not pq.done() and pq.clock < 30:
            pq.step()
        self.assertIsNotNone(pq.tasks[1].first_run)


class TestMultiCoreScheduler(unittest.TestCase):
    def test_multicore_dispatch(self):
        mc = MultiCoreScheduler(num_cores=2)
        mc.add(Task(pid=1, arrival=0, burst=4, priority=2, deadline=20))
        mc.add(Task(pid=2, arrival=0, burst=4, priority=3, deadline=20))
        mc.add(Task(pid=3, arrival=0, burst=4, priority=4, deadline=20))

        dispatched = mc.step()
        # Both Core 0 and Core 1 should have received a task
        self.assertEqual(len(dispatched), 2)
        self.assertIsNotNone(dispatched[0])
        self.assertIsNotNone(dispatched[1])
        self.assertEqual(mc.clock, 1)


class TestArenaRunner(unittest.TestCase):
    def test_arena_benchmark(self):
        tasks = WorkloadManager.get_standard_demo()
        results = ArenaRunner.run_all(tasks)
        self.assertEqual(len(results), 5)
        for name, res in results.items():
            self.assertGreater(res.makespan, 0)
            self.assertEqual(res.completed_count, len(tasks))

        winners = ArenaRunner.identify_winners(results)
        self.assertIn("avg_wait", winners)
        self.assertIn("deadline_misses", winners)


class TestWorkloadIO(unittest.TestCase):
    def test_json_and_csv_io(self):
        tasks = WorkloadManager.get_standard_demo()
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as f:
            j_path = f.name
        with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as f:
            c_path = f.name

        try:
            WorkloadManager.export_json(tasks, j_path)
            imported_j = WorkloadManager.import_json(j_path)
            self.assertEqual(len(imported_j), len(tasks))
            self.assertEqual(imported_j[0].pid, tasks[0].pid)

            WorkloadManager.export_csv(tasks, c_path)
            imported_c = WorkloadManager.import_csv(c_path)
            self.assertEqual(len(imported_c), len(tasks))
            self.assertEqual(imported_c[0].pid, tasks[0].pid)
        finally:
            if os.path.exists(j_path):
                os.remove(j_path)
            if os.path.exists(c_path):
                os.remove(c_path)


class TestUIViewsInstantiate(unittest.TestCase):
    def test_app_and_views(self):
        from app import PulseQueueXApp
        app = PulseQueueXApp()
        self.assertIsNotNone(app)
        
        # Test switching across all 8 views
        views = [
            "Overview", "Live Scheduler", "Process Manager",
            "Multi-Core Monitor", "Algorithm Arena", "Performance Analytics",
            "Execution History", "Settings & Theory"
        ]
        for v in views:
            app.switch_view(v)
            app.update_idletasks()

        # Step 3 ticks
        app.step_once()
        app.step_once()
        app.step_once()
        self.assertEqual(app.engine.clock, 3)

        # Reset
        app.reset_simulation()
        self.assertEqual(app.engine.clock, 0)

        app.destroy()


if __name__ == '__main__':
    unittest.main()


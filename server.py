"""
PulseQueue X: High-Performance FastAPI Backend
Bridges the Python Scheduling Engine, IndexedMinHeap, Multi-Core Simulator,
and Algorithm Arena to the 2026 Immersive 3D Web Experience.
"""
import asyncio
from typing import List, Dict, Optional, Any
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, Response
from pydantic import BaseModel, Field
import os

from core.models import Task, ProcessType, DecisionExplanation, get_process_color
from core.scheduler import PulseQueueScheduler, Scheduler
from core.multicore import MultiCoreScheduler
from core.arena import ArenaRunner, ArenaResult
from core.workloads import WorkloadManager
from core.analytics import ExecutionHistory, RunRecord


app = FastAPI(
    title="PulseQueue X Engine API",
    description="Real-time predictive & self-adaptive CPU scheduling backend",
    version="2.4.0"
)

# Enable CORS for local Vite dev server and web clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Engine Instances
scheduler = PulseQueueScheduler(aging=0.6, deadline_weight=2.5)
multicore = MultiCoreScheduler(num_cores=4, aging=0.6, deadline_weight=2.5)
history_manager = ExecutionHistory()

# Simulation Loop State
simulation_running = False
sim_speed_ms = 400
current_workload_name = "Standard Demo"
sim_task: Optional[asyncio.Task] = None


def init_default_workload():
    global current_workload_name
    scheduler.clear()
    multicore.tasks.clear()
    tasks = WorkloadManager.get_standard_demo()
    for t in tasks:
        scheduler.add(t.clone())
        multicore.add(t.clone())
    multicore.reset()
    current_workload_name = "Standard Demo"


init_default_workload()


# Request / Response Schemas
class TaskCreateRequest(BaseModel):
    arrival: int = Field(ge=0, description="Arrival time in clock ticks")
    burst: int = Field(gt=0, description="Execution burst duration in ticks")
    priority: int = Field(ge=0, description="Base priority score (lower is higher priority)")
    deadline: int = Field(gt=0, description="Deadline timestamp in ticks")
    process_type: str = Field(default="Interactive", description="Interactive, Batch, Real-Time, System")


class ConfigUpdateRequest(BaseModel):
    aging: Optional[float] = Field(None, ge=0.0, le=5.0)
    deadline_weight: Optional[float] = Field(None, ge=0.0, le=10.0)
    mode: Optional[str] = Field(None)
    speed_ms: Optional[int] = Field(None, ge=50, le=2000)
    starvation_threshold: Optional[int] = Field(None, ge=1, le=100)
    num_cores: Optional[int] = Field(None, ge=1, le=8)


# Helper serializer
def get_engine_state() -> Dict[str, Any]:
    tasks_list = []
    ready_heap = []
    
    # Ready queue scored via IndexedMinHeap
    ready_tasks = scheduler.ready_tasks()
    ready_sorted = sorted(
        ready_tasks,
        key=lambda t: (scheduler.score(t) if scheduler.mode == "Adaptive" else float(t.priority), t.pid)
    )
    for rank, t in enumerate(ready_sorted):
        breakdown = scheduler.score_breakdown(t) if scheduler.mode == "Adaptive" else {
            "base_priority": t.priority, "waited": 0, "aging_discount": 0.0,
            "slack": 0, "urgency_discount": 0.0, "total_score": float(t.priority)
        }
        ready_heap.append({
            "pid": t.pid,
            "rank": rank + 1,
            "color": get_process_color(t.pid),
            "score": round(breakdown["total_score"], 2),
            "base_priority": t.priority,
            "remaining": t.remaining,
            "waited": breakdown["waited"],
            "aging_discount": round(breakdown["aging_discount"], 2),
            "slack": breakdown["slack"],
            "urgency_discount": round(breakdown["urgency_discount"], 2)
        })

    for t in sorted(scheduler.tasks.values(), key=lambda x: x.pid):
        score_val = scheduler.score(t) if scheduler.mode == "Adaptive" else float(t.priority)
        waited = max(0, scheduler.clock - t.arrival - (t.burst - t.remaining)) if t.arrival <= scheduler.clock and t.remaining > 0 else t.waiting_ticks
        state_str = (
            "COMPLETED" if t.remaining == 0 else
            "RUNNING" if scheduler.active == t.pid else
            "STARVED" if (t.arrival <= scheduler.clock and waited >= scheduler.starvation_threshold) else
            "READY" if t.arrival <= scheduler.clock else
            "PENDING"
        )
        starvation_risk = (
            "Critical" if waited >= scheduler.starvation_threshold else
            "Warning" if waited >= (scheduler.starvation_threshold * 0.5) else
            "Safe"
        )
        tasks_list.append({
            "pid": t.pid,
            "color": get_process_color(t.pid),
            "arrival": t.arrival,
            "burst": t.burst,
            "priority": t.priority,
            "deadline": t.deadline,
            "process_type": t.process_type.value,
            "remaining": t.remaining,
            "executed": t.executed_ticks,
            "completion": t.completion,
            "score": round(score_val, 2),
            "slack": t.deadline - scheduler.clock - t.remaining,
            "status": state_str,
            "waited_ticks": waited,
            "starvation_risk": starvation_risk,
            "aging_boost": round(scheduler.aging * waited, 2) if scheduler.mode == "Adaptive" else 0.0
        })

    avg_wait, avg_turn, misses = scheduler.stats()
    util = scheduler.cpu_utilization()
    finished = scheduler.completed_tasks()

    # Latest explanation
    latest_exp = None
    if scheduler.explanations:
        exp = scheduler.explanations[-1]
        latest_exp = {
            "clock": exp.clock,
            "pid": exp.pid,
            "color": get_process_color(exp.pid) if exp.pid else None,
            "reason": exp.reason,
            "score": round(exp.score, 2) if exp.score is not None else None,
            "base_priority": exp.base_priority,
            "aging_discount": round(exp.aging_discount, 2) if exp.aging_discount is not None else None,
            "urgency_discount": round(exp.urgency_discount, 2) if exp.urgency_discount is not None else None,
            "waited_ticks": exp.waited_ticks,
            "slack_ticks": exp.slack_ticks,
            "preempted_pid": exp.preempted_pid,
            "ready_count": exp.ready_count
        }

    # All recent explanations for Simulation Replay
    all_explanations = []
    for exp in scheduler.explanations[-200:]:
        all_explanations.append({
            "clock": exp.clock,
            "pid": exp.pid,
            "color": get_process_color(exp.pid) if exp.pid else None,
            "reason": exp.reason,
            "score": round(exp.score, 2) if exp.score is not None else None,
            "base_priority": exp.base_priority,
            "aging_discount": round(exp.aging_discount, 2) if exp.aging_discount is not None else None,
            "urgency_discount": round(exp.urgency_discount, 2) if exp.urgency_discount is not None else None,
            "waited_ticks": exp.waited_ticks,
            "slack_ticks": exp.slack_ticks,
            "preempted_pid": exp.preempted_pid,
            "ready_count": exp.ready_count
        })

    # Multi-Core status
    cores_data = []
    for c in range(multicore.num_cores):
        cores_data.append({
            "core_id": c,
            "active_pid": multicore.core_active.get(c),
            "active_color": get_process_color(multicore.core_active[c]) if multicore.core_active.get(c) else None,
            "utilization": round(multicore.core_utilization(c), 1),
            "context_switches": multicore.core_context_switches.get(c, 0),
            "recent_ticks": [pid for _, pid in multicore.core_history.get(c, [])[-30:]]
        })

    return {
        "clock": scheduler.clock,
        "running": simulation_running,
        "speed_ms": sim_speed_ms,
        "mode": scheduler.mode,
        "aging": scheduler.aging,
        "deadline_weight": scheduler.deadline_weight,
        "starvation_threshold": scheduler.starvation_threshold,
        "active_pid": scheduler.active,
        "active_color": get_process_color(scheduler.active) if scheduler.active else None,
        "workload_name": current_workload_name,
        "total_tasks": len(scheduler.tasks),
        "completed_count": len(finished),
        "avg_wait": round(avg_wait, 2),
        "avg_turnaround": round(avg_turn, 2),
        "cpu_utilization": round(util, 1),
        "deadline_misses": misses,
        "context_switches": scheduler.context_switches,
        "done": scheduler.done(),
        "tasks": tasks_list,
        "ready_heap": ready_heap,
        "history": scheduler.history,
        "latest_explanation": latest_exp,
        "explanations": all_explanations,
        "multicore": {
            "num_cores": multicore.num_cores,
            "clock": multicore.clock,
            "overall_utilization": round(multicore.overall_utilization(), 1),
            "load_imbalance_std_dev": round(multicore.load_imbalance_std_dev(), 1),
            "cores": cores_data
        }
    }


# Endpoints
@app.get("/api/state")
def get_state():
    return get_engine_state()


@app.post("/api/step")
def step_simulation():
    global simulation_running
    if not scheduler.done():
        scheduler.step()
        if not multicore.done():
            multicore.step()
        if scheduler.done():
            simulation_running = False
            # Log run
            avg_wait, avg_turn, misses = scheduler.stats()
            util = scheduler.cpu_utilization()
            history_manager.log_run(
                algorithm=scheduler.name,
                workload_name=current_workload_name,
                num_processes=len(scheduler.tasks),
                completed_processes=len(scheduler.completed_tasks()),
                makespan=scheduler.clock,
                avg_wait=avg_wait,
                avg_turnaround=avg_turn,
                cpu_utilization=util,
                deadline_misses=misses,
                context_switches=scheduler.context_switches
            )
    return get_engine_state()


@app.post("/api/run")
def start_simulation():
    global simulation_running
    if not scheduler.done():
        simulation_running = True
    return get_engine_state()


@app.post("/api/pause")
def pause_simulation():
    global simulation_running
    simulation_running = False
    return get_engine_state()


@app.post("/api/reset")
def reset_simulation():
    global simulation_running
    simulation_running = False
    tasks = [t.clone() for t in scheduler.tasks.values()]
    scheduler.clear()
    for t in tasks:
        scheduler.add(t)
    multicore.tasks.clear()
    for t in scheduler.tasks.values():
        multicore.add(t.clone())
    multicore.reset()
    return get_engine_state()


@app.post("/api/config")
def update_config(cfg: ConfigUpdateRequest):
    global sim_speed_ms
    if cfg.aging is not None:
        scheduler.aging = cfg.aging
        multicore.aging = cfg.aging
    if cfg.deadline_weight is not None:
        scheduler.deadline_weight = cfg.deadline_weight
        multicore.deadline_weight = cfg.deadline_weight
    if cfg.mode is not None:
        scheduler.mode = cfg.mode
    if cfg.speed_ms is not None:
        sim_speed_ms = cfg.speed_ms
    if cfg.starvation_threshold is not None:
        scheduler.starvation_threshold = cfg.starvation_threshold
        multicore.starvation_threshold = cfg.starvation_threshold
    if cfg.num_cores is not None:
        multicore.set_cores(cfg.num_cores)
    return get_engine_state()


@app.post("/api/tasks")
def add_task(req: TaskCreateRequest):
    next_pid = max([t.pid for t in scheduler.tasks.values()] + [0]) + 1
    pt = ProcessType.INTERACTIVE
    for member in ProcessType:
        if member.value.lower() == req.process_type.lower():
            pt = member
            break
    
    task = Task(
        pid=next_pid,
        arrival=req.arrival,
        burst=req.burst,
        priority=req.priority,
        deadline=req.deadline,
        process_type=pt
    )
    scheduler.add(task)
    multicore.add(task.clone())
    return get_engine_state()


@app.delete("/api/tasks/{pid}")
def delete_task(pid: int):
    if not scheduler.remove(pid):
        raise HTTPException(status_code=400, detail="Cannot remove task that has already begun execution")
    multicore.remove(pid)
    return get_engine_state()


@app.post("/api/workload/preset/{preset_name}")
def load_preset(preset_name: str):
    global current_workload_name, simulation_running
    simulation_running = False
    mapping = {
        "standard": (WorkloadManager.get_standard_demo, "Standard Demo"),
        "starvation": (WorkloadManager.get_starvation_hazard, "Starvation Hazard"),
        "deadline": (WorkloadManager.get_deadline_crunch, "Deadline Crunch"),
        "batch": (WorkloadManager.get_heavy_batch, "Heavy Batch"),
        "interactive": (WorkloadManager.get_interactive_burst, "Interactive Burst"),
        "random": (lambda: WorkloadManager.generate_random(count=8), "Synthetic Random"),
    }
    key = preset_name.lower()
    if key not in mapping:
        raise HTTPException(status_code=404, detail="Unknown workload preset")
    
    loader, title = mapping[key]
    tasks = loader()
    scheduler.clear()
    multicore.tasks.clear()
    for t in tasks:
        scheduler.add(t.clone())
        multicore.add(t.clone())
    multicore.reset()
    current_workload_name = title
    return get_engine_state()


class CustomTaskItem(BaseModel):
    pid: Optional[int] = None
    arrival: int
    burst: int
    priority: int
    deadline: int
    process_type: Optional[str] = "Interactive"


@app.post("/api/workload/custom")
def load_custom_workload(tasks: List[CustomTaskItem]):
    """Loads a custom task set into the live simulation in an atomic operation."""
    global current_workload_name, simulation_running
    simulation_running = False
    scheduler.clear()
    multicore.tasks.clear()
    for idx, t in enumerate(tasks):
        pt = ProcessType.INTERACTIVE
        for member in ProcessType:
            if member.value.lower() == (t.process_type or "").lower():
                pt = member
                break
        pid_val = t.pid if t.pid is not None else (idx + 1)
        task = Task(
            pid=pid_val,
            arrival=t.arrival,
            burst=t.burst,
            priority=t.priority,
            deadline=t.deadline,
            process_type=pt
        )
        scheduler.add(task)
        multicore.add(task.clone())
    multicore.reset()
    current_workload_name = "What-If Custom Scenario"
    return get_engine_state()


@app.get("/api/arena")
def run_arena_benchmark(quantum: int = 3):
    tasks = list(scheduler.tasks.values())
    if not tasks:
        raise HTTPException(status_code=400, detail="No processes in workload to benchmark")
    
    results = ArenaRunner.run_all(tasks, starvation_threshold=scheduler.starvation_threshold, rr_quantum=quantum)
    winners = ArenaRunner.identify_winners(results)
    
    serialized_results = {}
    for name, r in results.items():
        serialized_results[name] = {
            "algorithm_name": r.algorithm_name,
            "avg_wait": r.avg_wait,
            "avg_turnaround": r.avg_turnaround,
            "cpu_utilization": r.cpu_utilization,
            "deadline_misses": r.deadline_misses,
            "deadline_miss_ratio": r.deadline_miss_ratio,
            "context_switches": r.context_switches,
            "starvation_incidents": r.starvation_incidents,
            "makespan": r.makespan,
            "completed_count": r.completed_count,
            "total_count": r.total_count,
            "timeline": r.timeline,
            "task_stats": r.task_stats
        }
        
    return {
        "results": serialized_results,
        "winners": winners,
        "workload_name": current_workload_name,
        "process_count": len(tasks)
    }


class WhatIfProcessItem(BaseModel):
    pid: int
    arrival: int
    burst: int
    priority: int
    deadline: int
    process_type: Optional[str] = "Interactive"


class WhatIfRequest(BaseModel):
    tasks: Optional[List[WhatIfProcessItem]] = None
    algorithm: Optional[str] = "PulseQueue Adaptive"
    aging: Optional[float] = 0.6
    deadline_weight: Optional[float] = 2.5
    starvation_threshold: Optional[int] = 15
    rr_quantum: Optional[int] = 3


@app.post("/api/what-if")
def simulate_what_if(req: WhatIfRequest):
    """
    What-If Simulator:
    Simulates modifications to process attributes or scheduling weights on an identical workload.
    Returns side-by-side timelines and differential impact metrics.
    """
    if req.tasks:
        base_tasks = []
        for t in req.tasks:
            try:
                pt = ProcessType(t.process_type)
            except ValueError:
                pt = ProcessType.INTERACTIVE
            base_tasks.append(
                Task(
                    pid=t.pid,
                    arrival=t.arrival,
                    burst=t.burst,
                    priority=t.priority,
                    deadline=t.deadline,
                    process_type=pt
                )
            )
    else:
        base_tasks = [t.clone() for t in scheduler.tasks.values()]

    if not base_tasks:
        raise HTTPException(status_code=400, detail="No processes available for What-If simulation")

    # 1. Baseline simulation: PulseQueue with default parameters
    baseline_result = ArenaRunner.simulate_single(
        tasks=[t.clone() for t in base_tasks],
        algorithm_name="PulseQueue Adaptive",
        aging=0.6,
        deadline_weight=2.5,
        starvation_threshold=15,
        rr_quantum=3
    )

    # 2. What-If simulation with customized parameters
    simulated_result = ArenaRunner.simulate_single(
        tasks=[t.clone() for t in base_tasks],
        algorithm_name=req.algorithm or "PulseQueue Adaptive",
        aging=req.aging if req.aging is not None else 0.6,
        deadline_weight=req.deadline_weight if req.deadline_weight is not None else 2.5,
        starvation_threshold=req.starvation_threshold if req.starvation_threshold is not None else 15,
        rr_quantum=req.rr_quantum if req.rr_quantum is not None else 3
    )

    def serialize_arena(r: ArenaResult):
        return {
            "algorithm_name": r.algorithm_name,
            "avg_wait": r.avg_wait,
            "avg_turnaround": r.avg_turnaround,
            "cpu_utilization": r.cpu_utilization,
            "deadline_misses": r.deadline_misses,
            "deadline_miss_ratio": r.deadline_miss_ratio,
            "context_switches": r.context_switches,
            "starvation_incidents": r.starvation_incidents,
            "makespan": r.makespan,
            "completed_count": r.completed_count,
            "total_count": r.total_count,
            "timeline": r.timeline,
            "task_stats": r.task_stats
        }

    diff_wait = round(simulated_result.avg_wait - baseline_result.avg_wait, 2)
    diff_turnaround = round(simulated_result.avg_turnaround - baseline_result.avg_turnaround, 2)
    diff_misses = simulated_result.deadline_misses - baseline_result.deadline_misses
    diff_util = round(simulated_result.cpu_utilization - baseline_result.cpu_utilization, 1)

    return {
        "baseline": serialize_arena(baseline_result),
        "simulated": serialize_arena(simulated_result),
        "diff": {
            "avg_wait": diff_wait,
            "avg_turnaround": diff_turnaround,
            "deadline_misses": diff_misses,
            "cpu_utilization": diff_util,
            "is_improvement": (diff_wait <= 0 and diff_misses <= 0)
        }
    }


@app.get("/api/history")
def get_history():
    return [r.to_dict() for r in history_manager.records]


@app.delete("/api/history")
def clear_history():
    history_manager.clear()
    return {"message": "Execution history cleared"}


@app.get("/api/history/export")
def export_history_csv():
    import tempfile
    with tempfile.NamedTemporaryFile(suffix=".csv", delete=False) as f:
        tmp_name = f.name
    history_manager.export_csv(tmp_name)
    with open(tmp_name, 'r', encoding='utf-8') as f:
        content = f.read()
    os.remove(tmp_name)
    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=pulsequeue_audit_report.csv"}
    )


# Background simulation runner task
@app.on_event("startup")
async def startup_event():
    async def simulation_loop():
        global simulation_running
        while True:
            if simulation_running and not scheduler.done():
                scheduler.step()
                if not multicore.done():
                    multicore.step()
                if scheduler.done():
                    simulation_running = False
                    avg_wait, avg_turn, misses = scheduler.stats()
                    util = scheduler.cpu_utilization()
                    history_manager.log_run(
                        algorithm=scheduler.name,
                        workload_name=current_workload_name,
                        num_processes=len(scheduler.tasks),
                        completed_processes=len(scheduler.completed_tasks()),
                        makespan=scheduler.clock,
                        avg_wait=avg_wait,
                        avg_turnaround=avg_turn,
                        cpu_utilization=util,
                        deadline_misses=misses,
                        context_switches=scheduler.context_switches
                    )
            await asyncio.sleep(sim_speed_ms / 1000.0)

    asyncio.create_task(simulation_loop())

    # Render Free-Tier Keep-Alive Pinger
    # Render automatically sets RENDER_EXTERNAL_URL to the public domain (e.g. https://pulsequeue.onrender.com)
    render_url = os.environ.get("RENDER_EXTERNAL_URL") or os.environ.get("PUBLIC_APP_URL")
    if render_url:
        import urllib.request
        print(f"[Keep-Alive] Render deployment detected: {render_url}")
        print("[Keep-Alive] Auto-pinger active — will ping every 12 minutes to keep instance awake 24/7.")

        def perform_ping(target_url: str):
            req = urllib.request.Request(
                target_url,
                headers={"User-Agent": "PulseQueue-KeepAlive/2.0"}
            )
            with urllib.request.urlopen(req, timeout=15) as resp:
                return resp.status

        async def keep_alive_loop():
            # Initial startup delay (5s in test mode, 60s in production)
            initial_delay = 5 if os.environ.get("TEST_PING") else 60
            await asyncio.sleep(initial_delay)
            target = f"{render_url.rstrip('/')}/api/state"
            interval = int(os.environ.get("PING_INTERVAL_SECONDS", "720"))  # 12 minutes default

            while True:
                try:
                    status = await asyncio.to_thread(perform_ping, target)
                    print(f"[Keep-Alive] Successfully pinged {target} (status {status}). Instance kept awake.")
                except Exception as e:
                    print(f"[Keep-Alive] Ping notice for {target}: {e}")
                await asyncio.sleep(interval)

        asyncio.create_task(keep_alive_loop())
    else:
        print("[Keep-Alive] Running in local mode. (RENDER_EXTERNAL_URL not set).")


# Mount web dist if exists
web_dist = os.path.join(os.path.dirname(__file__), "web", "dist")
if os.path.exists(web_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(web_dist, "assets")), name="assets")
    
    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        file_path = os.path.join(web_dist, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(web_dist, "index.html"))


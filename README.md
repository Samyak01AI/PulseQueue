# PULSEQUEUE X // 2026 SPATIAL 3D CPU SCHEDULING PLATFORM

[![Python](https://img.shields.io/badge/Python-3.9%2B-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20TypeScript-61DAFB.svg)](https://react.dev)
[![Three.js](https://img.shields.io/badge/3D-Three.js%20%2F%20R3F-35D6E8.svg)](https://threejs.org)
[![TailwindCSS](https://img.shields.io/badge/Design-Tailwind%20%2B%20Glass-8B7CFF.svg)](https://tailwindcss.com)
[![DSA](https://img.shields.io/badge/DSA-Indexed%20Min--Heap-39D98A.svg)]()

**PulseQueue X** is a spatial computing CPU scheduling and process orchestration platform designed for national-level Data Structures & Algorithms (DSA) competitions. Built with a spatial 3D interactive processor, real-time symmetric multiprocessing (SMP) core monitor, and a live Python FastAPI backend powered by custom `IndexedMinHeap` algorithms.

---

## ◈ 2026 Creative & Spatial Design System

PulseQueue X is styled after Apple Vision Pro spatial computing interfaces and developer control centers:

- **Spatial Dark Mode**: `#080B12` (Deep Void), `#101522` (Secondary Surface), `#151C2A` (Glass Panel)
- **Primary Accents**: `#35D6E8` (Spatial Cyan Glow), `#8B7CFF` (Electric Violet Glow)
- **Status Indicators**: `#39D98A` (Success / On-Time), `#FFB454` (Warning / Starved), `#FF667A` (Danger / Missed)
- **Surface**: Ultra-thin glassmorphic borders with backdrop blur (`backdrop-blur-xl`) and soft volumetric lighting.

---

## ◈ Key Spatial Web Features

### 1. Hero Overview & Interactive 3D Processor
- **Central 3D Octa-Core Processor** rendered via Three.js and React Three Fiber.
- Metallic substrate with gold pin grid contacts, ceramic die basin, and 8 individual core tiles.
- Interactive mouse parallax tilt and smooth idle rotation.
- Real-time emissive lighting that pulses cyan and violet when cores are executing workloads.
- Flowing particle data streams representing bus and cache throughput.
- Automatic **2D Precision Canvas Fallback** when WebGL is unavailable or reduced-motion is requested.
- Floating glassmorphic KPI panels tracking Total Tasks, Active Process, CPU Utilization %, Average Wait Time, and Deadline Misses.

### 2. 3D Symmetric Multiprocessing (SMP) Core Monitor
- 3D spatial module view of 1, 2, 4, or 8 simulated CPU cores.
- Clickable and inspectable core tiles displaying real-time thread affinity, per-core utilization gauges, context switch counts, and 30-tick mini activity heat strips.
- Real-time load balance standard deviation variance calculation (`Optimal`, `Moderate`, or `Imbalanced`).

### 3. Immersive Live Scheduler Command Center
- **Ready Queue Min-Heap Visualizer**: Ordered cards rendered directly from the `IndexedMinHeap` with dynamic score, base priority, aging discount, and slack.
- **Active Process Hero**: Displays dispatched thread with 3D progress bar, execution slice, and remaining burst.
- **Spatial 3D Execution Gantt Timeline**: Horizontal timeline with color-coded process blocks, idle stripes, and context switches across the last 60 clock ticks.
- **Decision Explainability Audit Card**: Mathematical formula breakdown:
  $$\text{Score} = \text{BasePriority} - (\alpha \times \text{WaitedTicks}) - (\beta \times \max(0, 5 - \text{Slack}))$$
  Includes real-time narrative explaining why each thread was selected and flagging preemption events.
- Dynamic tuning sliders for priority aging coefficient ($\alpha$), deadline urgency weight ($\beta$), and clock tick speed.

### 4. Algorithm Arena // 5-Way Competition Benchmark
- Executes identical workloads across 5 core CPU scheduling algorithms:
  1. **PulseQueue Adaptive** (IndexedMinHeap, aging, deadline urgency, preemptive)
  2. **Static Priority** (Preemptive baseline, exposing starvation of low-priority tasks)
  3. **Shortest Job First / SRTF** (Preemptive shortest remaining time first)
  4. **Round Robin** (Configurable time quantum)
  5. **First Come First Served (FCFS)** (Non-preemptive arrival order)
- Scoreboard with gold `★ BEST` badges for the winning algorithm per metric.
- Dynamic executive verdict card summarizing how PulseQueue eliminates starvation and guarantees deadline adherence.
- Animated visual bar comparison charts.

### 5. Workload Repository & Process Manager
- Curated presets: *Standard Demo*, *Starvation Hazard* (proves aging prevents starvation), *Deadline Crunch*, *Heavy Batch*, *Interactive Burst*, and *Synthetic Random*.
- Interactive task injection form with validation ($A \ge 0, B > 0, P \ge 0, D \ge A + B$).
- One-click JSON export.

### 6. Analytics & Execution History
- Stacked turnaround time composition chart (Burst Execution vs Queued Wait).
- Per-process deadline slack and normalized turnaround ($T / B$).
- Historical audit log with CSV report export.

---

## ◈ Quick Start

### 1. Start the FastAPI Backend & 3D Web Application
```bash
python -m uvicorn server:app --host 127.0.0.1 --port 8000
```
Open your browser to: **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

### 2. Frontend Development (Vite HMR)
```bash
cd web
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** (proxies API calls automatically to FastAPI on port 8000).

### 3. Run Automated Verification Test Suite
```bash
python test_suite.py
```

### 4. Optional: Run Desktop Application
```bash
python main.py
```

---

## ◈ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Run / Pause Simulation |
| `S` | Step Simulation by 1 Clock Tick |
| `R` | Reset Simulation to Initial State |
| `1` – `8` | Instant Tab Navigation (Overview, Scheduler, Cores, Manager, Arena, Analytics, History, Theory) |

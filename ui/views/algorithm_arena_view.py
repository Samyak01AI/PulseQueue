"""
Algorithm Arena View for PulseQueue X
Head-to-head competition benchmark across 5 CPU scheduling algorithms on identical workloads.
"""
import customtkinter as ctk
import tkinter as tk
from typing import Dict, Optional, Any
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    COLOR_BLUE, FONT_MONO, FONT_FAMILY, create_card
)
from ui.components.charts import GroupedBarChart
from core.arena import ArenaRunner, ArenaResult


# Algorithm Color Coding for consistency
ALGO_COLORS = {
    "PulseQueue Adaptive": COLOR_CYAN,
    "Static Priority": COLOR_DANGER,
    "Shortest Job First (SRTF)": COLOR_SUCCESS,
    "Round Robin": COLOR_PURPLE,
    "FCFS": COLOR_WARNING
}


class AlgorithmArenaView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.results: Dict[str, ArenaResult] = {}
        self.winners: Dict[str, str] = {}
        self.build_ui()

    def build_ui(self):
        # Top Benchmark Action Bar
        top_bar = create_card(self)
        top_bar.pack(fill="x", padx=16, pady=(12, 10))

        tb_inner = ctk.CTkFrame(top_bar, fg_color="transparent")
        tb_inner.pack(fill="x", padx=14, pady=10)

        ctk.CTkLabel(
            tb_inner,
            text="ALGORITHM ARENA  //  5-WAY COMPETITIVE BENCHMARK",
            font=(FONT_MONO, 12, "bold"),
            text_color=COLOR_CYAN
        ).pack(side="left")

        self.btn_run_arena = ctk.CTkButton(
            tb_inner,
            text="⚡ RUN ARENA BENCHMARK",
            font=(FONT_MONO, 11, "bold"),
            fg_color=COLOR_CYAN,
            hover_color="#0891B2",
            text_color="#080B12",
            height=32,
            command=self.run_benchmark
        )
        self.btn_run_arena.pack(side="right", padx=4)

        self.benchmark_status_lbl = ctk.CTkLabel(
            tb_inner,
            text="Workload ready. Press button to run competition.",
            font=(FONT_FAMILY, 10),
            text_color=TEXT_MUTED
        )
        self.benchmark_status_lbl.pack(side="right", padx=12)

        # Scrollable container for Scoreboard and Charts
        self.content_scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.content_scroll.pack(fill="both", expand=True, padx=16, pady=(0, 10))

        # 1. Executive Summary Card
        self.summary_card = create_card(self.content_scroll)
        self.summary_card.pack(fill="x", pady=(0, 10))

        sum_hdr = ctk.CTkFrame(self.summary_card, fg_color="transparent")
        sum_hdr.pack(fill="x", padx=14, pady=(8, 4))
        ctk.CTkLabel(
            sum_hdr,
            text="◈  EXECUTIVE PERFORMANCE VERDICT",
            font=(FONT_MONO, 11, "bold"),
            text_color=COLOR_CYAN
        ).pack(side="left")

        self.verdict_lbl = ctk.CTkLabel(
            self.summary_card,
            text="Awaiting benchmark run across current process workload.",
            font=(FONT_FAMILY, 11),
            text_color=TEXT_PRIMARY,
            wraplength=950,
            justify="left"
        )
        self.verdict_lbl.pack(anchor="w", padx=14, pady=(0, 10))

        # 2. Scoreboard Table
        score_card = create_card(self.content_scroll)
        score_card.pack(fill="x", pady=(0, 10))

        sc_hdr = ctk.CTkFrame(score_card, fg_color="transparent")
        sc_hdr.pack(fill="x", padx=14, pady=(10, 6))
        ctk.CTkLabel(
            sc_hdr,
            text="◈  COMPETITION TELEMETRY SCOREBOARD",
            font=(FONT_MONO, 11, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(side="left")

        self.table_container = ctk.CTkFrame(score_card, fg_color="#0C121E", corner_radius=8)
        self.table_container.pack(fill="x", padx=14, pady=(0, 12))

        self._render_scoreboard_headers()

        # 3. Vector Comparison Charts (2x2 Grid)
        charts_grid = ctk.CTkFrame(self.content_scroll, fg_color="transparent")
        charts_grid.pack(fill="x", pady=(0, 10))
        charts_grid.grid_columnconfigure(0, weight=1)
        charts_grid.grid_columnconfigure(1, weight=1)

        self.chart_wait = GroupedBarChart(charts_grid, "AVERAGE WAITING TIME", "Ticks", height=180, lower_is_better=True)
        self.chart_wait.grid(row=0, column=0, padx=(0, 5), pady=5, sticky="nsew")

        self.chart_turn = GroupedBarChart(charts_grid, "AVERAGE TURNAROUND TIME", "Ticks", height=180, lower_is_better=True)
        self.chart_turn.grid(row=0, column=1, padx=(5, 0), pady=5, sticky="nsew")

        self.chart_misses = GroupedBarChart(charts_grid, "DEADLINE MISSES", "Tasks", height=180, lower_is_better=True)
        self.chart_misses.grid(row=1, column=0, padx=(0, 5), pady=5, sticky="nsew")

        self.chart_util = GroupedBarChart(charts_grid, "CPU UTILIZATION", "%", height=180, lower_is_better=False)
        self.chart_util.grid(row=1, column=1, padx=(5, 0), pady=5, sticky="nsew")

    def _render_scoreboard_headers(self):
        hdr = ctk.CTkFrame(self.table_container, fg_color="#151F33", height=28, corner_radius=4)
        hdr.pack(fill="x", pady=(0, 4))
        cols = [
            ("ALGORITHM", 170),
            ("AVG WAIT", 85),
            ("AVG TURN", 85),
            ("CPU UTIL", 85),
            ("DEADLINE MISS", 100),
            ("SWITCHES", 85),
            ("STARVED", 85),
            ("MAKESPAN", 85),
        ]
        for name, w in cols:
            ctk.CTkLabel(
                hdr,
                text=name,
                font=(FONT_MONO, 9, "bold"),
                text_color=COLOR_CYAN if name in ("ALGORITHM", "DEADLINE MISS") else TEXT_MUTED,
                width=w,
                anchor="center"
            ).pack(side="left", padx=2)

    def run_benchmark(self):
        tasks = list(self.app.engine.tasks.values())
        if not tasks:
            self.benchmark_status_lbl.configure(text="No tasks loaded. Load demo or inject processes first.", text_color=COLOR_DANGER)
            return

        self.benchmark_status_lbl.configure(text="Running benchmark simulation across all 5 engines...", text_color=COLOR_CYAN)
        self.update_idletasks()

        # Run actual competition benchmark
        self.results = ArenaRunner.run_all(tasks, starvation_threshold=15, rr_quantum=3)
        self.winners = ArenaRunner.identify_winners(self.results)

        self.benchmark_status_lbl.configure(text=f"Benchmark completed on {len(tasks)} tasks.", text_color=COLOR_SUCCESS)
        self.refresh()

    def refresh(self):
        if not self.results:
            return

        # 1. Update Scoreboard Table
        for child in self.table_container.winfo_children():
            if child != self.table_container.winfo_children()[0]:
                child.destroy()

        for name, r in self.results.items():
            row = ctk.CTkFrame(self.table_container, fg_color="#101726", height=28)
            row.pack(fill="x", pady=1)

            col = ALGO_COLORS.get(name, TEXT_PRIMARY)
            is_pq = "PulseQueue" in name

            ctk.CTkLabel(row, text=name, font=(FONT_MONO, 10, "bold"), text_color=col, width=170, anchor="w").pack(side="left", padx=6)

            # Metrics with winner highlight
            wait_win = (name == self.winners.get("avg_wait"))
            turn_win = (name == self.winners.get("avg_turnaround"))
            miss_win = (name == self.winners.get("deadline_misses"))
            util_win = (name == self.winners.get("cpu_utilization"))
            starv_win = (name == self.winners.get("starvation_incidents"))

            ctk.CTkLabel(row, text=f"{r.avg_wait:.1f}t {'★' if wait_win else ''}", font=(FONT_MONO, 10, "bold" if wait_win else "normal"), text_color=COLOR_WARNING if wait_win else TEXT_PRIMARY, width=85).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.avg_turnaround:.1f}t {'★' if turn_win else ''}", font=(FONT_MONO, 10, "bold" if turn_win else "normal"), text_color=COLOR_WARNING if turn_win else TEXT_PRIMARY, width=85).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.cpu_utilization:.1f}% {'★' if util_win else ''}", font=(FONT_MONO, 10, "bold" if util_win else "normal"), text_color=COLOR_WARNING if util_win else TEXT_PRIMARY, width=85).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.deadline_misses} ({r.deadline_miss_ratio:.0f}%) {'★' if miss_win else ''}", font=(FONT_MONO, 10, "bold" if miss_win else "normal"), text_color=COLOR_SUCCESS if r.deadline_misses == 0 else COLOR_DANGER, width=100).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=str(r.context_switches), font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=85).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=str(r.starvation_incidents), font=(FONT_MONO, 10, "bold"), text_color=COLOR_SUCCESS if r.starvation_incidents == 0 else COLOR_DANGER, width=85).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.makespan}t", font=(FONT_MONO, 10), text_color=TEXT_MUTED, width=85).pack(side="left", padx=2)

        # 2. Update Charts
        wait_data = [(name, r.avg_wait, ALGO_COLORS.get(name, COLOR_CYAN)) for name, r in self.results.items()]
        self.chart_wait.update_data(wait_data, self.winners.get("avg_wait"))

        turn_data = [(name, r.avg_turnaround, ALGO_COLORS.get(name, COLOR_CYAN)) for name, r in self.results.items()]
        self.chart_turn.update_data(turn_data, self.winners.get("avg_turnaround"))

        miss_data = [(name, float(r.deadline_misses), ALGO_COLORS.get(name, COLOR_CYAN)) for name, r in self.results.items()]
        self.chart_misses.update_data(miss_data, self.winners.get("deadline_misses"))

        util_data = [(name, r.cpu_utilization, ALGO_COLORS.get(name, COLOR_CYAN)) for name, r in self.results.items()]
        self.chart_util.update_data(util_data, self.winners.get("cpu_utilization"))

        # 3. Dynamic Verdict
        pq_res = self.results.get("PulseQueue Adaptive")
        sp_res = self.results.get("Static Priority")
        fcfs_res = self.results.get("FCFS")
        if pq_res:
            verdict = (
                f"PulseQueue Adaptive achieved {pq_res.deadline_misses} deadline misses and {pq_res.starvation_incidents} starvation incidents "
                f"with an average waiting time of {pq_res.avg_wait:.1f}t and {pq_res.cpu_utilization:.1f}% CPU utilization.\n"
            )
            if sp_res and sp_res.starvation_incidents > pq_res.starvation_incidents:
                verdict += f"• Solved Starvation: Prevented {sp_res.starvation_incidents} starvation incidents that occurred under Static Priority.\n"
            if fcfs_res and fcfs_res.deadline_misses > pq_res.deadline_misses:
                verdict += f"• Deadline Urgency: Prevented {fcfs_res.deadline_misses - pq_res.deadline_misses} deadline violations that occurred under FCFS.\n"
            verdict += f"• Indexed Min-Heap Architecture: Rebuilding and O(log N) indexed updates maintained optimal scheduler throughput across {pq_res.makespan} ticks."
            self.verdict_lbl.configure(text=verdict)


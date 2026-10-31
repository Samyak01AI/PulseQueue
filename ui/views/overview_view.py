"""
Overview Dashboard View for PulseQueue X
"""
import customtkinter as ctk
import tkinter as tk
from typing import Dict, Any, List
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY, create_card
)
from ui.components.kpi_card import KPICard
from core.models import Task, get_process_color


class OverviewView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.build_ui()

    def build_ui(self):
        # Top KPI Cards Grid
        kpi_grid = ctk.CTkFrame(self, fg_color="transparent")
        kpi_grid.pack(fill="x", padx=16, pady=(12, 10))
        for i in range(6):
            kpi_grid.grid_columnconfigure(i, weight=1)

        self.kpi_total = KPICard(kpi_grid, "Total Tasks", "0", "◈", COLOR_CYAN, "Configured processes")
        self.kpi_total.grid(row=0, column=0, padx=4, sticky="ew")

        self.kpi_completed = KPICard(kpi_grid, "Completed", "0", "✔", COLOR_SUCCESS, "0.0% completion")
        self.kpi_completed.grid(row=0, column=1, padx=4, sticky="ew")

        self.kpi_wait = KPICard(kpi_grid, "Avg Waiting", "0.0t", "⏱", COLOR_PURPLE, "Ticks queued")
        self.kpi_wait.grid(row=0, column=2, padx=4, sticky="ew")

        self.kpi_turn = KPICard(kpi_grid, "Avg Turnaround", "0.0t", "↺", COLOR_CYAN, "Arrival to finish")
        self.kpi_turn.grid(row=0, column=3, padx=4, sticky="ew")

        self.kpi_util = KPICard(kpi_grid, "CPU Utilization", "0.0%", "⚡", COLOR_SUCCESS, "Non-idle cycles")
        self.kpi_util.grid(row=0, column=4, padx=4, sticky="ew")

        self.kpi_misses = KPICard(kpi_grid, "Deadline Misses", "0", "⚠", COLOR_DANGER, "Overdue finishes")
        self.kpi_misses.grid(row=0, column=5, padx=4, sticky="ew")

        # Middle split: CPU Activity & Quick Status
        mid_frame = ctk.CTkFrame(self, fg_color="transparent")
        mid_frame.pack(fill="x", padx=16, pady=(0, 10))
        mid_frame.grid_columnconfigure(0, weight=2)
        mid_frame.grid_columnconfigure(1, weight=1)

        # CPU Core Activity Panel
        cpu_panel = create_card(mid_frame)
        cpu_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        cpu_header = ctk.CTkFrame(cpu_panel, fg_color="transparent")
        cpu_header.pack(fill="x", padx=14, pady=(10, 6))
        ctk.CTkLabel(
            cpu_header,
            text="◈  CPU EXECUTION CORE STATUS",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(side="left")

        self.active_task_chip = ctk.CTkLabel(
            cpu_header,
            text="IDLE",
            font=(FONT_MONO, 10, "bold"),
            text_color=TEXT_MUTED,
            fg_color="#182335",
            corner_radius=8,
            height=20,
            padx=8
        )
        self.active_task_chip.pack(side="right")

        self.cpu_bars_container = ctk.CTkFrame(cpu_panel, fg_color="transparent")
        self.cpu_bars_container.pack(fill="x", padx=14, pady=(4, 10))

        self.core_meter_bars = []
        self.core_meter_labels = []
        for c_idx in range(4):
            c_row = ctk.CTkFrame(self.cpu_bars_container, fg_color="transparent")
            c_row.pack(fill="x", pady=2)
            lbl = ctk.CTkLabel(c_row, text=f"Core {c_idx:02d}", font=(FONT_MONO, 10), text_color=TEXT_MUTED, width=65, anchor="w")
            lbl.pack(side="left")
            bar = ctk.CTkProgressBar(c_row, fg_color="#10192A", progress_color=COLOR_CYAN, height=10, corner_radius=5)
            bar.set(0)
            bar.pack(side="left", fill="x", expand=True, padx=6)
            pct_lbl = ctk.CTkLabel(c_row, text="0.0%", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=45, anchor="e")
            pct_lbl.pack(side="right")
            self.core_meter_bars.append(bar)
            self.core_meter_labels.append(pct_lbl)

        # Quick Decision Insight Card
        decision_card = create_card(mid_frame)
        decision_card.grid(row=0, column=1, sticky="nsew", padx=(8, 0))

        dec_header = ctk.CTkFrame(decision_card, fg_color="transparent")
        dec_header.pack(fill="x", padx=14, pady=(10, 6))
        ctk.CTkLabel(
            dec_header,
            text="⚡ LIVE DISPATCH TELEMETRY",
            font=(FONT_MONO, 12, "bold"),
            text_color=COLOR_CYAN
        ).pack(side="left")

        self.overview_decision_lbl = ctk.CTkLabel(
            decision_card,
            text="Scheduler in standby. Press RUN or STEP to observe real-time dynamic priority decisions.",
            font=(FONT_FAMILY, 11),
            text_color=TEXT_PRIMARY,
            wraplength=340,
            justify="left"
        )
        self.overview_decision_lbl.pack(anchor="w", padx=14, pady=(4, 8))

        self.quick_policy_lbl = ctk.CTkLabel(
            decision_card,
            text="Policy: PulseQueue Adaptive | Aging: 0.60 | Deadline Weight: 2.50",
            font=(FONT_MONO, 10),
            text_color=COLOR_PURPLE
        )
        self.quick_policy_lbl.pack(anchor="w", padx=14, pady=(0, 10))

        # Bottom Live Queue Table Preview
        table_card = create_card(self)
        table_card.pack(fill="both", expand=True, padx=16, pady=(0, 12))

        tbl_header = ctk.CTkFrame(table_card, fg_color="transparent")
        tbl_header.pack(fill="x", padx=16, pady=(10, 6))
        ctk.CTkLabel(
            tbl_header,
            text="◈  LIVE WORKLOAD PROCESS QUEUE",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(side="left")

        self.queue_count_lbl = ctk.CTkLabel(
            tbl_header,
            text="0 Tasks in System",
            font=(FONT_FAMILY, 10),
            text_color=TEXT_MUTED
        )
        self.queue_count_lbl.pack(side="right")

        # Scrollable table container
        self.table_scroll = ctk.CTkScrollableFrame(table_card, fg_color="#0C121E", corner_radius=8)
        self.table_scroll.pack(fill="both", expand=True, padx=14, pady=(0, 12))

        self._render_table_headers()

    def _render_table_headers(self):
        hdr = ctk.CTkFrame(self.table_scroll, fg_color="#151F33", height=28, corner_radius=4)
        hdr.pack(fill="x", pady=(0, 4))
        
        cols = [
            ("PID", 55),
            ("TYPE", 90),
            ("ARRIVAL", 65),
            ("BURST", 65),
            ("REMAINING", 75),
            ("PRIORITY", 65),
            ("DEADLINE", 70),
            ("DYNAMIC SCORE", 95),
            ("STATUS", 90)
        ]
        for name, w in cols:
            ctk.CTkLabel(
                hdr,
                text=name,
                font=(FONT_MONO, 9, "bold"),
                text_color=COLOR_CYAN if "SCORE" in name else TEXT_MUTED,
                width=w,
                anchor="center"
            ).pack(side="left", padx=2)

    def refresh(self):
        engine = self.app.engine
        tasks = list(engine.tasks.values())
        finished = engine.completed_tasks()

        # Update KPIs
        self.kpi_total.update_value(str(len(tasks)), f"{len(engine.ready_tasks())} ready, {len(tasks) - len(engine.ready_tasks()) - len(finished)} pending")
        
        comp_pct = (len(finished) / len(tasks) * 100.0) if tasks else 0.0
        self.kpi_completed.update_value(f"{len(finished)}/{len(tasks)}", f"{comp_pct:.1f}% complete")

        avg_wait, avg_turn, misses = engine.stats()
        self.kpi_wait.update_value(f"{avg_wait:.1f}t", "Across completed")
        self.kpi_turn.update_value(f"{avg_turn:.1f}t", "Turnaround avg")

        util = engine.cpu_utilization()
        self.kpi_util.update_value(f"{util:.1f}%", f"{len(engine.history)} ticks recorded")

        miss_pct = (misses / len(finished) * 100.0) if finished else 0.0
        self.kpi_misses.update_value(str(misses), f"{miss_pct:.1f}% miss rate")

        # Active Task Chip
        if engine.active is not None and engine.active in engine.tasks:
            t = engine.tasks[engine.active]
            col = get_process_color(t.pid)
            self.active_task_chip.configure(
                text=f"▶ P{t.pid:02d} RUNNING",
                text_color="#080B12",
                fg_color=col
            )
        else:
            self.active_task_chip.configure(text="IDLE", text_color=TEXT_MUTED, fg_color="#182335")

        # Core bars (simulated SMP load derived from active process and history)
        busy_recent = [1 if pid is not None else 0 for _, pid in engine.history[-20:]]
        primary_load = (sum(busy_recent) / max(1, len(busy_recent))) if busy_recent else 0.0
        self.core_meter_bars[0].set(primary_load)
        self.core_meter_labels[0].configure(text=f"{primary_load * 100:.1f}%")

        # Multi-core engine reflection if active
        if hasattr(self.app, 'multicore') and self.app.multicore.clock > 0:
            for c_idx in range(min(4, self.app.multicore.num_cores)):
                u = self.app.multicore.core_utilization(c_idx) / 100.0
                self.core_meter_bars[c_idx].set(u)
                self.core_meter_labels[c_idx].configure(text=f"{u * 100:.1f}%")

        # Explanation
        if engine.explanations:
            latest = engine.explanations[-1]
            self.overview_decision_lbl.configure(text=latest.reason)

        self.quick_policy_lbl.configure(
            text=f"Policy: {getattr(engine, 'mode', 'Adaptive')} | Aging: {getattr(engine, 'aging', 0.6):.2f} | Deadline Weight: {getattr(engine, 'deadline_weight', 2.5):.2f}"
        )

        # Refresh Table
        for child in self.table_scroll.winfo_children():
            if child != self.table_scroll.winfo_children()[0]:  # Keep headers
                child.destroy()

        self.queue_count_lbl.configure(text=f"{len(tasks)} Processes Total")

        for t in sorted(tasks, key=lambda x: x.pid):
            row = ctk.CTkFrame(self.table_scroll, fg_color="#101726" if t.pid % 2 == 0 else "#0C121E", height=28)
            row.pack(fill="x", pady=1)

            # Determine state
            if t.remaining == 0:
                state_str = "COMPLETED"
                state_col = COLOR_SUCCESS
            elif engine.active == t.pid:
                state_str = "RUNNING"
                state_col = COLOR_CYAN
            elif t.arrival <= engine.clock:
                # Check for starvation
                waited = max(0, engine.clock - t.arrival - (t.burst - t.remaining))
                if waited >= getattr(engine, 'starvation_threshold', 15):
                    state_str = "STARVED"
                    state_col = COLOR_DANGER
                else:
                    state_str = "READY"
                    state_col = COLOR_PURPLE
            else:
                state_str = "PENDING"
                state_col = TEXT_MUTED

            score_val = engine.score(t) if hasattr(engine, 'score') else float(t.priority)

            # PID badge
            p_col = get_process_color(t.pid)
            ctk.CTkLabel(row, text=f"P{t.pid:02d}", font=(FONT_MONO, 10, "bold"), text_color=p_col, width=55).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=t.process_type.value, font=(FONT_FAMILY, 9), text_color=TEXT_MUTED, width=90).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.arrival}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=65).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.burst}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=65).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.remaining}t", font=(FONT_MONO, 10, "bold"), text_color=COLOR_CYAN if t.remaining > 0 else TEXT_MUTED, width=75).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=str(t.priority), font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=65).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.deadline}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=70).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{score_val:.2f}", font=(FONT_MONO, 10, "bold"), text_color=COLOR_CYAN, width=95).pack(side="left", padx=2)

            # State badge
            badge_f = ctk.CTkFrame(row, fg_color="transparent", width=90)
            badge_f.pack(side="left", padx=2)
            ctk.CTkLabel(
                badge_f,
                text=state_str,
                font=(FONT_MONO, 8, "bold"),
                text_color=state_col,
                fg_color="#182338",
                corner_radius=6,
                padx=6,
                height=18
            ).pack(anchor="center")


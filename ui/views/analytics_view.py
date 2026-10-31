"""
Performance Analytics View for PulseQueue X
Deep telemetry into waiting time distributions, turnaround compositions, and timeline load profiles.
"""
import customtkinter as ctk
import tkinter as tk
from typing import List, Dict, Any
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY, create_card
)
from ui.components.charts import StackedTurnaroundChart, TimelineUtilizationChart
from core.models import get_process_color


class PerformanceAnalyticsView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.build_ui()

    def build_ui(self):
        # Scrollable container
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True, padx=16, pady=(12, 12))

        # Top Charts Grid
        charts_row = ctk.CTkFrame(self.scroll, fg_color="transparent")
        charts_row.pack(fill="x", pady=(0, 10))
        charts_row.grid_columnconfigure(0, weight=1)
        charts_row.grid_columnconfigure(1, weight=1)

        # 1. Stacked Turnaround Chart
        self.stacked_chart = StackedTurnaroundChart(charts_row, height=220)
        self.stacked_chart.grid(row=0, column=0, padx=(0, 6), sticky="nsew")

        # 2. Timeline Load Chart
        self.util_chart = TimelineUtilizationChart(charts_row, height=220)
        self.util_chart.grid(row=0, column=1, padx=(6, 0), sticky="nsew")

        # Detailed Process Analytics Table
        table_card = create_card(self.scroll)
        table_card.pack(fill="x", pady=(0, 10))

        tbl_hdr = ctk.CTkFrame(table_card, fg_color="transparent")
        tbl_hdr.pack(fill="x", padx=16, pady=(10, 6))

        ctk.CTkLabel(
            tbl_hdr,
            text="◈  PER-PROCESS PERFORMANCE & DEADLINE SLACK AUDIT",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(side="left")

        self.table_scroll = ctk.CTkFrame(table_card, fg_color="#0C121E", corner_radius=8)
        self.table_scroll.pack(fill="x", padx=14, pady=(0, 12))

        self._render_headers()

    def _render_headers(self):
        hdr = ctk.CTkFrame(self.table_scroll, fg_color="#151F33", height=28, corner_radius=4)
        hdr.pack(fill="x", pady=(0, 4))
        cols = [
            ("PID", 55),
            ("ARRIVAL", 70),
            ("BURST", 65),
            ("COMPLETION", 85),
            ("WAITING", 75),
            ("TURNAROUND", 85),
            ("NORM TURN", 80),
            ("DEADLINE", 75),
            ("FINAL SLACK", 85),
            ("OUTCOME", 95)
        ]
        for name, w in cols:
            ctk.CTkLabel(
                hdr,
                text=name,
                font=(FONT_MONO, 9, "bold"),
                text_color=COLOR_CYAN if name in ("PID", "OUTCOME") else TEXT_MUTED,
                width=w,
                anchor="center"
            ).pack(side="left", padx=2)

    def refresh(self):
        engine = self.app.engine
        tasks = list(engine.tasks.values())
        finished = [t for t in tasks if t.completion is not None]

        # 1. Update Stacked Turnaround Chart
        task_data = []
        for t in finished:
            wait = max(0, t.completion - t.arrival - t.burst)
            turn = t.completion - t.arrival
            task_data.append({
                "pid": t.pid,
                "burst": t.burst,
                "waiting": wait,
                "turnaround": turn
            })
        self.stacked_chart.update_data(task_data)

        # 2. Update Timeline Load
        self.util_chart.update_history(engine.history)

        # 3. Update Detailed Table
        for child in self.table_scroll.winfo_children():
            if child != self.table_scroll.winfo_children()[0]:
                child.destroy()

        for t in sorted(tasks, key=lambda x: x.pid):
            row = ctk.CTkFrame(self.table_scroll, fg_color="#101726" if t.pid % 2 == 0 else "#0C121E", height=28)
            row.pack(fill="x", pady=1)

            p_col = get_process_color(t.pid)
            comp_str = f"{t.completion}t" if t.completion is not None else "--"
            wait_val = (t.completion - t.arrival - t.burst) if t.completion is not None else max(0, engine.clock - t.arrival - (t.burst - t.remaining))
            turn_val = (t.completion - t.arrival) if t.completion is not None else (engine.clock - t.arrival)
            norm_turn = (turn_val / t.burst) if t.burst > 0 else 1.0

            slack_at_finish = (t.deadline - t.completion) if t.completion is not None else (t.deadline - engine.clock - t.remaining)

            if t.completion is not None:
                if t.completion <= t.deadline:
                    outcome_str = "ON-TIME"
                    outcome_col = COLOR_SUCCESS
                else:
                    outcome_str = "MISSED"
                    outcome_col = COLOR_DANGER
            elif t.arrival <= engine.clock:
                outcome_str = "RUNNING" if engine.active == t.pid else "QUEUED"
                outcome_col = COLOR_CYAN if engine.active == t.pid else COLOR_PURPLE
            else:
                outcome_str = "PENDING"
                outcome_col = TEXT_MUTED

            ctk.CTkLabel(row, text=f"P{t.pid:02d}", font=(FONT_MONO, 10, "bold"), text_color=p_col, width=55).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.arrival}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=70).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.burst}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=65).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=comp_str, font=(FONT_MONO, 10), text_color=COLOR_SUCCESS if t.completion else TEXT_MUTED, width=85).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{wait_val}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=75).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{turn_val}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=85).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{norm_turn:.2f}x", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=80).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.deadline}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=75).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{slack_at_finish}t", font=(FONT_MONO, 10, "bold"), text_color=COLOR_SUCCESS if slack_at_finish >= 0 else COLOR_DANGER, width=85).pack(side="left", padx=2)

            f = ctk.CTkFrame(row, fg_color="transparent", width=95)
            f.pack(side="left", padx=2)
            ctk.CTkLabel(f, text=outcome_str, font=(FONT_MONO, 8, "bold"), text_color=outcome_col, fg_color="#182338", corner_radius=6, padx=6, height=18).pack(anchor="center")


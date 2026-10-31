"""
Live Scheduler View for PulseQueue X
Real-time animated priority queue, Gantt timeline, and explainability audit.
"""
import customtkinter as ctk
import tkinter as tk
from typing import Optional, List
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY, create_card
)
from ui.components.gantt_chart import GanttChart
from ui.components.explain_panel import DecisionExplainPanel
from core.models import Task, get_process_color


class LiveSchedulerView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.build_ui()

    def build_ui(self):
        # Scrollable container so all sections fit on any resolution without vertical clipping
        self.scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.scroll.pack(fill="both", expand=True, padx=0, pady=0)

        # Top Control Strip
        controls_card = create_card(self.scroll)
        controls_card.pack(fill="x", padx=16, pady=(12, 10))

        c_inner = ctk.CTkFrame(controls_card, fg_color="transparent")
        c_inner.pack(fill="x", padx=14, pady=10)

        # Simulation Action Buttons
        self.btn_run = ctk.CTkButton(
            c_inner,
            text="▶ RUN",
            font=(FONT_MONO, 11, "bold"),
            fg_color=COLOR_SUCCESS,
            hover_color="#16A34A",
            text_color="#080B12",
            width=80,
            height=32,
            command=self.app.toggle_run
        )
        self.btn_run.pack(side="left", padx=4)

        self.btn_step = ctk.CTkButton(
            c_inner,
            text="⏭ STEP",
            font=(FONT_MONO, 11, "bold"),
            fg_color="#1E293B",
            hover_color="#334155",
            text_color=TEXT_PRIMARY,
            width=80,
            height=32,
            command=self.app.step_once
        )
        self.btn_step.pack(side="left", padx=4)

        self.btn_reset = ctk.CTkButton(
            c_inner,
            text="↺ RESET",
            font=(FONT_MONO, 11, "bold"),
            fg_color="#3B1D28",
            hover_color="#502535",
            text_color=COLOR_DANGER,
            width=80,
            height=32,
            command=self.app.reset_simulation
        )
        self.btn_reset.pack(side="left", padx=4)

        # Separator
        ctk.CTkFrame(c_inner, fg_color="#1F2E45", width=1, height=28).pack(side="left", padx=10)

        # Policy Mode
        ctk.CTkLabel(c_inner, text="POLICY:", font=(FONT_MONO, 10, "bold"), text_color=TEXT_MUTED).pack(side="left", padx=(0, 4))
        self.mode_selector = ctk.CTkSegmentedButton(
            c_inner,
            values=["Adaptive", "Static"],
            font=(FONT_MONO, 10, "bold"),
            selected_color="#164E63",
            selected_hover_color="#0891B2",
            command=self._on_mode_change
        )
        self.mode_selector.set("Adaptive")
        self.mode_selector.pack(side="left", padx=4)

        # Aging Factor Slider
        ctk.CTkLabel(c_inner, text="AGING α:", font=(FONT_MONO, 10, "bold"), text_color=TEXT_MUTED).pack(side="left", padx=(12, 2))
        self.aging_slider = ctk.CTkSlider(
            c_inner,
            from_=0.0,
            to=2.0,
            number_of_steps=20,
            width=110,
            progress_color=COLOR_CYAN,
            button_color=COLOR_CYAN,
            command=self._on_aging_change
        )
        self.aging_slider.set(0.60)
        self.aging_slider.pack(side="left", padx=4)
        self.aging_lbl = ctk.CTkLabel(c_inner, text="0.60", font=(FONT_MONO, 10), text_color=COLOR_CYAN, width=32)
        self.aging_lbl.pack(side="left")

        # Deadline Weight Slider
        ctk.CTkLabel(c_inner, text="DEADLINE β:", font=(FONT_MONO, 10, "bold"), text_color=TEXT_MUTED).pack(side="left", padx=(10, 2))
        self.deadline_slider = ctk.CTkSlider(
            c_inner,
            from_=0.0,
            to=5.0,
            number_of_steps=25,
            width=110,
            progress_color=COLOR_PURPLE,
            button_color=COLOR_PURPLE,
            command=self._on_deadline_change
        )
        self.deadline_slider.set(2.50)
        self.deadline_slider.pack(side="left", padx=4)
        self.deadline_lbl = ctk.CTkLabel(c_inner, text="2.50", font=(FONT_MONO, 10), text_color=COLOR_PURPLE, width=32)
        self.deadline_lbl.pack(side="left")

        # Speed Slider
        ctk.CTkLabel(c_inner, text="SPEED:", font=(FONT_MONO, 10, "bold"), text_color=TEXT_MUTED).pack(side="left", padx=(12, 2))
        self.speed_slider = ctk.CTkSlider(
            c_inner,
            from_=50,
            to=1000,
            number_of_steps=19,
            width=90,
            progress_color="#3B82F6",
            button_color="#3B82F6",
            command=self._on_speed_change
        )
        self.speed_slider.set(400)
        self.speed_slider.pack(side="left", padx=4)
        self.speed_lbl = ctk.CTkLabel(c_inner, text="400ms", font=(FONT_MONO, 9), text_color=TEXT_MUTED, width=42)
        self.speed_lbl.pack(side="left")

        # Split: Active Task Hero Card (Left) & Ready Queue Heap (Right)
        mid_row = ctk.CTkFrame(self.scroll, fg_color="transparent")
        mid_row.pack(fill="x", padx=16, pady=(0, 10))
        mid_row.grid_columnconfigure(0, weight=1)
        mid_row.grid_columnconfigure(1, weight=2)

        # Active Process Hero Card
        hero_card = create_card(mid_row)
        hero_card.grid(row=0, column=0, sticky="nsew", padx=(0, 8))

        hero_hdr = ctk.CTkFrame(hero_card, fg_color="transparent")
        hero_hdr.pack(fill="x", padx=14, pady=(10, 4))
        ctk.CTkLabel(hero_hdr, text="CURRENTLY EXECUTING PROCESS", font=(FONT_MONO, 11, "bold"), text_color=TEXT_PRIMARY).pack(side="left")
        self.hero_status_pill = ctk.CTkLabel(hero_hdr, text="IDLE", font=(FONT_MONO, 9, "bold"), text_color=TEXT_MUTED, fg_color="#182335", corner_radius=6, padx=6)
        self.hero_status_pill.pack(side="right")

        self.hero_pid_lbl = ctk.CTkLabel(hero_card, text="CPU IDLE", font=(FONT_MONO, 24, "bold"), text_color=TEXT_MUTED)
        self.hero_pid_lbl.pack(anchor="w", padx=14, pady=(2, 0))

        self.hero_type_lbl = ctk.CTkLabel(hero_card, text="No process currently scheduled on core", font=(FONT_FAMILY, 10), text_color=TEXT_MUTED)
        self.hero_type_lbl.pack(anchor="w", padx=14, pady=(0, 6))

        # Progress bar
        self.hero_progress = ctk.CTkProgressBar(hero_card, progress_color=COLOR_CYAN, fg_color="#101726", height=8, corner_radius=4)
        self.hero_progress.set(0)
        self.hero_progress.pack(fill="x", padx=14, pady=(2, 6))

        self.hero_meta_frame = ctk.CTkFrame(hero_card, fg_color="#0C121E", corner_radius=6)
        self.hero_meta_frame.pack(fill="x", padx=14, pady=(4, 12))
        self.hero_stat_labels = {}
        for idx, (label, val) in enumerate([("Burst", "--"), ("Executed", "--"), ("Remaining", "--"), ("Slack", "--")]):
            f = ctk.CTkFrame(self.hero_meta_frame, fg_color="transparent")
            f.pack(side="left", expand=True, padx=4, pady=6)
            ctk.CTkLabel(f, text=label, font=(FONT_FAMILY, 9), text_color=TEXT_MUTED).pack()
            l = ctk.CTkLabel(f, text=val, font=(FONT_MONO, 11, "bold"), text_color=TEXT_PRIMARY)
            l.pack()
            self.hero_stat_labels[label] = l

        # Ready Queue Min-Heap Visualizer
        heap_card = create_card(mid_row)
        heap_card.grid(row=0, column=1, sticky="nsew", padx=(8, 0))

        heap_hdr = ctk.CTkFrame(heap_card, fg_color="transparent")
        heap_hdr.pack(fill="x", padx=14, pady=(10, 4))
        ctk.CTkLabel(heap_hdr, text="READY QUEUE  //  INDEXED MIN-HEAP PRIORITIES", font=(FONT_MONO, 11, "bold"), text_color=COLOR_CYAN).pack(side="left")
        self.heap_count_lbl = ctk.CTkLabel(heap_hdr, text="0 In Heap", font=(FONT_FAMILY, 10), text_color=TEXT_MUTED)
        self.heap_count_lbl.pack(side="right")

        # Horizontal or scrollable container for heap cards
        self.heap_scroll = ctk.CTkScrollableFrame(heap_card, fg_color="#0C121E", orientation="horizontal", height=115, corner_radius=8)
        self.heap_scroll.pack(fill="both", expand=True, padx=14, pady=(4, 12))

        # Horizontal Gantt Timeline
        self.gantt = GanttChart(self.scroll, height=125)
        self.gantt.pack(fill="x", padx=16, pady=(0, 10))

        # Explainability Audit Panel
        self.explain_panel = DecisionExplainPanel(self.scroll)
        self.explain_panel.pack(fill="x", padx=16, pady=(0, 12))

    def _on_mode_change(self, value):
        self.app.engine.mode = value
        self.app.refresh_all()

    def _on_aging_change(self, value):
        self.app.engine.aging = value
        self.aging_lbl.configure(text=f"{value:.2f}")
        self.app.refresh_all()

    def _on_deadline_change(self, value):
        self.app.engine.deadline_weight = value
        self.deadline_lbl.configure(text=f"{value:.2f}")
        self.app.refresh_all()

    def _on_speed_change(self, value):
        self.app.sim_speed_ms = int(value)
        self.speed_lbl.configure(text=f"{int(value)}ms")

    def refresh(self):
        engine = self.app.engine
        
        # Run button state
        if self.app.running:
            self.btn_run.configure(text="⏸ PAUSE", fg_color=COLOR_WARNING)
        else:
            self.btn_run.configure(text="▶ RUN", fg_color=COLOR_SUCCESS)

        # Active Hero Task
        if engine.active is not None and engine.active in engine.tasks:
            t = engine.tasks[engine.active]
            col = get_process_color(t.pid)
            self.hero_pid_lbl.configure(text=f"PROCESS P{t.pid:02d}", text_color=col)
            self.hero_type_lbl.configure(text=f"{t.process_type.value} Task | Arrived t={t.arrival} | Priority {t.priority}")
            self.hero_status_pill.configure(text="RUNNING", text_color="#080B12", fg_color=col)
            
            progress_pct = (t.executed_ticks / t.burst) if t.burst > 0 else 0
            self.hero_progress.set(progress_pct)

            slack = t.deadline - engine.clock - t.remaining
            self.hero_stat_labels["Burst"].configure(text=f"{t.burst}t")
            self.hero_stat_labels["Executed"].configure(text=f"{t.executed_ticks}t")
            self.hero_stat_labels["Remaining"].configure(text=f"{t.remaining}t", text_color=COLOR_CYAN)
            self.hero_stat_labels["Slack"].configure(
                text=f"{slack}t",
                text_color=COLOR_DANGER if slack <= 3 else COLOR_WARNING if slack <= 5 else COLOR_SUCCESS
            )
        else:
            self.hero_pid_lbl.configure(text="CPU IDLE", text_color=TEXT_MUTED)
            self.hero_type_lbl.configure(text="Awaiting task arrival or queue dispatch")
            self.hero_status_pill.configure(text="IDLE", text_color=TEXT_MUTED, fg_color="#182335")
            self.hero_progress.set(0)
            for l in self.hero_stat_labels.values():
                l.configure(text="--", text_color=TEXT_PRIMARY)

        # Ready Queue Min-Heap
        for child in self.heap_scroll.winfo_children():
            child.destroy()

        ready = engine.ready_tasks()
        # Sort by heap score (or use indexed heap sorted list)
        ready_sorted = sorted(ready, key=lambda t: (engine.score(t) if hasattr(engine, 'score') else float(t.priority), t.pid))
        self.heap_count_lbl.configure(text=f"{len(ready_sorted)} in Ready Heap")

        if not ready_sorted:
            ctk.CTkLabel(
                self.heap_scroll,
                text="READY QUEUE EMPTY — NO PENDING TASKS",
                font=(FONT_MONO, 10),
                text_color=TEXT_MUTED
            ).pack(pady=30, padx=20)
        else:
            for rank, t in enumerate(ready_sorted):
                score = engine.score(t) if hasattr(engine, 'score') else float(t.priority)
                waited = max(0, engine.clock - t.arrival - (t.burst - t.remaining))
                slack = t.deadline - engine.clock - t.remaining
                col = get_process_color(t.pid)

                # Card for heap entry
                card = ctk.CTkFrame(self.heap_scroll, fg_color="#121A29", border_color=col if rank == 0 else "#1F2E45", border_width=1, corner_radius=8, width=130)
                card.pack(side="left", padx=4, pady=4, fill="y")

                # Top PID badge & rank
                top_f = ctk.CTkFrame(card, fg_color="transparent")
                top_f.pack(fill="x", padx=8, pady=(6, 2))
                ctk.CTkLabel(top_f, text=f"P{t.pid:02d}", font=(FONT_MONO, 11, "bold"), text_color=col).pack(side="left")
                ctk.CTkLabel(top_f, text=f"#{rank + 1}", font=(FONT_MONO, 9), text_color=COLOR_CYAN if rank == 0 else TEXT_MUTED).pack(side="right")

                # Score
                ctk.CTkLabel(card, text=f"Score: {score:.2f}", font=(FONT_MONO, 11, "bold"), text_color=COLOR_CYAN).pack(anchor="w", padx=8)

                # Sub stats
                meta_txt = f"Base: {t.priority} | Rem: {t.remaining}t\nWait: {waited}t | Slack: {slack}t"
                ctk.CTkLabel(card, text=meta_txt, font=(FONT_MONO, 8), text_color=TEXT_MUTED, justify="left").pack(anchor="w", padx=8, pady=(2, 6))

        # Update Gantt timeline
        self.gantt.update_history(engine.history, engine.clock)

        # Update Explanation Panel
        if engine.explanations:
            self.explain_panel.update_explanation(engine.explanations[-1])


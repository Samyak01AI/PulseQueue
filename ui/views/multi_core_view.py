"""
Multi-Core Monitor View for PulseQueue X
Simulates and visualizes multi-core symmetric multiprocessing (1, 2, 4, 8 cores).
"""
import customtkinter as ctk
import tkinter as tk
from typing import List, Dict, Optional
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY, create_card
)
from ui.components.core_card import CoreMonitorCard
from core.multicore import MultiCoreScheduler


class MultiCoreView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.build_ui()

    def build_ui(self):
        # Top Control Bar
        top_bar = create_card(self)
        top_bar.pack(fill="x", padx=16, pady=(12, 10))

        tb_inner = ctk.CTkFrame(top_bar, fg_color="transparent")
        tb_inner.pack(fill="x", padx=14, pady=10)

        ctk.CTkLabel(
            tb_inner,
            text="MULTI-CORE CPU TOPOLOGY:",
            font=(FONT_MONO, 10, "bold"),
            text_color=COLOR_CYAN
        ).pack(side="left", padx=(0, 6))

        self.core_selector = ctk.CTkSegmentedButton(
            tb_inner,
            values=["1 Core", "2 Cores", "4 Cores", "8 Cores"],
            font=(FONT_MONO, 10, "bold"),
            selected_color="#164E63",
            selected_hover_color="#0891B2",
            command=self._on_cores_changed
        )
        self.core_selector.set("4 Cores")
        self.core_selector.pack(side="left", padx=4)

        # Simulation Controls for Multi-Core
        ctk.CTkFrame(tb_inner, fg_color="#1F2E45", width=1, height=26).pack(side="left", padx=10)

        self.btn_run = ctk.CTkButton(
            tb_inner,
            text="▶ RUN MULTI-CORE",
            font=(FONT_MONO, 10, "bold"),
            fg_color=COLOR_SUCCESS,
            hover_color="#16A34A",
            text_color="#080B12",
            height=30,
            command=self._toggle_multicore_run
        )
        self.btn_run.pack(side="left", padx=4)

        self.btn_step = ctk.CTkButton(
            tb_inner,
            text="⏭ STEP",
            font=(FONT_MONO, 10, "bold"),
            fg_color="#1E293B",
            hover_color="#334155",
            text_color=TEXT_PRIMARY,
            height=30,
            width=70,
            command=self._step_multicore
        )
        self.btn_step.pack(side="left", padx=4)

        self.btn_reset = ctk.CTkButton(
            tb_inner,
            text="↺ SYNC WORKLOAD",
            font=(FONT_MONO, 10, "bold"),
            fg_color="#3B1D28",
            hover_color="#502535",
            text_color=COLOR_DANGER,
            height=30,
            command=self._sync_workload
        )
        self.btn_reset.pack(side="left", padx=4)

        # Status telemetry badges
        self.imbalance_lbl = ctk.CTkLabel(
            tb_inner,
            text="Load Imbalance: 0.0% (OPTIMAL)",
            font=(FONT_MONO, 10, "bold"),
            text_color=COLOR_SUCCESS
        )
        self.imbalance_lbl.pack(side="right", padx=6)

        # Scrollable container for Cores Grid
        self.core_grid = ctk.CTkScrollableFrame(self, fg_color="transparent")
        self.core_grid.pack(fill="both", expand=True, padx=16, pady=(0, 10))

        self.core_cards: List[CoreMonitorCard] = []
        self._rebuild_core_grid(4)

        # Bottom Workload Balance Chart
        bottom_card = create_card(self)
        bottom_card.pack(fill="x", padx=16, pady=(0, 12))

        b_hdr = ctk.CTkFrame(bottom_card, fg_color="transparent")
        b_hdr.pack(fill="x", padx=14, pady=(8, 4))
        ctk.CTkLabel(
            b_hdr,
            text="MULTI-CORE LOAD DISTRIBUTION PROFILE",
            font=(FONT_MONO, 11, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(side="left")

        self.canvas_bars = tk.Canvas(bottom_card, bg="#0C121E", height=70, highlightthickness=0)
        self.canvas_bars.pack(fill="x", padx=14, pady=(0, 10))
        self.canvas_bars.bind("<Configure>", lambda e: self._draw_load_bars())

    def _rebuild_core_grid(self, num_cores: int):
        for card in self.core_cards:
            card.destroy()
        self.core_cards.clear()

        # Arrange in 2 columns
        self.core_grid.grid_columnconfigure(0, weight=1)
        self.core_grid.grid_columnconfigure(1, weight=1)

        for i in range(num_cores):
            row = i // 2
            col = i % 2
            card = CoreMonitorCard(self.core_grid, core_id=i)
            card.grid(row=row, column=col, padx=6, pady=6, sticky="nsew")
            self.core_cards.append(card)

    def _on_cores_changed(self, value: str):
        count = int(value.split()[0])
        self.app.multicore.set_cores(count)
        self._sync_workload()
        self._rebuild_core_grid(count)
        self.refresh()

    def _sync_workload(self):
        self.app.multicore.tasks.clear()
        for t in self.app.engine.tasks.values():
            self.app.multicore.add(t.clone())
        self.app.multicore.reset()
        self.refresh()

    def _toggle_multicore_run(self):
        if hasattr(self.app, 'multicore_running') and self.app.multicore_running:
            self.app.multicore_running = False
            self.btn_run.configure(text="▶ RUN MULTI-CORE", fg_color=COLOR_SUCCESS)
        else:
            if not self.app.multicore.tasks:
                self._sync_workload()
            self.app.multicore_running = True
            self.btn_run.configure(text="⏸ PAUSE", fg_color=COLOR_WARNING)
            self._multicore_tick()

    def _multicore_tick(self):
        if getattr(self.app, 'multicore_running', False):
            if not self.app.multicore.done():
                self.app.multicore.step()
                self.refresh()
                self.after(self.app.sim_speed_ms, self._multicore_tick)
            else:
                self.app.multicore_running = False
                self.btn_run.configure(text="▶ RUN MULTI-CORE", fg_color=COLOR_SUCCESS)
                self.refresh()

    def _step_multicore(self):
        if not self.app.multicore.tasks:
            self._sync_workload()
        if not self.app.multicore.done():
            self.app.multicore.step()
            self.refresh()

    def _draw_load_bars(self):
        c = self.canvas_bars
        c.delete("all")
        w = c.winfo_width()
        h = c.winfo_height()
        if w <= 50 or h <= 20:
            return

        mc = self.app.multicore
        n = mc.num_cores
        slot_w = w / n
        bar_w = min(slot_w * 0.7, 80)

        for i in range(n):
            center = (i * slot_w) + (slot_w / 2)
            u = mc.core_utilization(i)
            bar_h = (u / 100.0) * (h - 25)
            x1 = center - bar_w / 2
            x2 = center + bar_w / 2
            y1 = h - 20 - bar_h
            y2 = h - 20

            c.create_rectangle(x1, y1, x2, y2, fill=COLOR_CYAN, outline="")
            c.create_text(center, y1 - 7, text=f"{u:.1f}%", fill=TEXT_PRIMARY, font=(FONT_MONO, 8, "bold"))
            c.create_text(center, h - 8, text=f"Core {i:02d}", fill=TEXT_MUTED, font=(FONT_MONO, 8))

    def refresh(self):
        mc = self.app.multicore
        for i, card in enumerate(self.core_cards):
            if i < mc.num_cores:
                active_pid = mc.core_active.get(i)
                util = mc.core_utilization(i)
                history = mc.core_history.get(i, [])
                card.update_core(active_pid, util, history)

        std_dev = mc.load_imbalance_std_dev()
        status_txt = "OPTIMAL" if std_dev < 10 else "MODERATE" if std_dev < 25 else "IMBALANCED"
        status_col = COLOR_SUCCESS if std_dev < 10 else COLOR_WARNING if std_dev < 25 else COLOR_DANGER
        self.imbalance_lbl.configure(text=f"Load Imbalance: {std_dev:.1f}% ({status_txt})", text_color=status_col)

        self._draw_load_bars()


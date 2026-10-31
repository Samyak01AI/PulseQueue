"""
Multi-Core CPU Monitor Card
Visualizes individual core status, utilization, and activity heat strip.
"""
import tkinter as tk
import customtkinter as ctk
from typing import Optional, List, Tuple
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY
)
from core.models import get_process_color


class CoreMonitorCard(ctk.CTkFrame):
    def __init__(self, parent, core_id: int, **kwargs):
        super().__init__(
            parent,
            fg_color=CARD_BG,
            border_color=CARD_BORDER,
            border_width=1,
            corner_radius=12,
            **kwargs
        )
        self.core_id = core_id

        # Header row
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=14, pady=(10, 4))

        self.title_lbl = ctk.CTkLabel(
            header,
            text=f"CORE {core_id:02d}",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        )
        self.title_lbl.pack(side="left")

        self.status_badge = ctk.CTkLabel(
            header,
            text="IDLE",
            font=(FONT_MONO, 10, "bold"),
            text_color=TEXT_MUTED,
            fg_color="#182335",
            corner_radius=8,
            height=20,
            padx=8
        )
        self.status_badge.pack(side="right")

        # Active Process Display
        proc_frame = ctk.CTkFrame(self, fg_color="#0F1726", corner_radius=8)
        proc_frame.pack(fill="x", padx=14, pady=6)

        self.proc_lbl = ctk.CTkLabel(
            proc_frame,
            text="NO ACTIVE TASK",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_MUTED
        )
        self.proc_lbl.pack(side="left", padx=10, pady=6)

        self.util_lbl = ctk.CTkLabel(
            proc_frame,
            text="0.0% UTIL",
            font=(FONT_MONO, 11, "bold"),
            text_color=COLOR_CYAN
        )
        self.util_lbl.pack(side="right", padx=10, pady=6)

        # Utilization Progress Bar
        self.progress = ctk.CTkProgressBar(
            self,
            progress_color=COLOR_CYAN,
            fg_color="#1A2538",
            height=6,
            corner_radius=3
        )
        self.progress.set(0)
        self.progress.pack(fill="x", padx=14, pady=(2, 6))

        # Recent Activity Heat Strip
        ctk.CTkLabel(
            self,
            text="RECENT ACTIVITY (LAST 30 TICKS)",
            font=(FONT_FAMILY, 9),
            text_color=TEXT_MUTED
        ).pack(anchor="w", padx=14, pady=(2, 2))

        self.canvas = tk.Canvas(self, bg="#0C121E", height=24, highlightthickness=0)
        self.canvas.pack(fill="x", padx=14, pady=(0, 10))

    def update_core(
        self,
        active_pid: Optional[int],
        utilization: float,
        history: List[Tuple[int, Optional[int]]]
    ):
        util_pct = max(0.0, min(100.0, utilization))
        self.progress.set(util_pct / 100.0)
        self.util_lbl.configure(text=f"{util_pct:.1f}% UTIL")

        if active_pid is not None:
            col = get_process_color(active_pid)
            self.status_badge.configure(text="ACTIVE", text_color="#080B12", fg_color=col)
            self.proc_lbl.configure(text=f"▶ P{active_pid:02d} RUNNING", text_color=col)
        else:
            self.status_badge.configure(text="IDLE", text_color=TEXT_MUTED, fg_color="#182335")
            self.proc_lbl.configure(text="IDLE (NO TASK)", text_color=TEXT_MUTED)

        # Draw mini heat strip
        c = self.canvas
        c.delete("all")
        w = c.winfo_width()
        h = c.winfo_height()
        if w <= 10 or not history:
            return

        visible = history[-30:] if len(history) > 30 else history
        unit = w / len(visible)

        for i, (_, pid) in enumerate(visible):
            x1 = i * unit
            x2 = (i + 1) * unit
            fill_col = "#151F30" if pid is None else get_process_color(pid)
            c.create_rectangle(x1, 2, x2 - 1, h - 2, fill=fill_col, outline="")


"""
High-Performance Vector Charting Components for PulseQueue X
Direct Tkinter Canvas rendering for zero latency, dark theme fidelity, and smooth animations.
"""
import tkinter as tk
import customtkinter as ctk
from typing import List, Dict, Tuple, Optional, Any
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY
)
from core.models import get_process_color


class GroupedBarChart(ctk.CTkFrame):
    """
    Renders grouped comparison bars across algorithms.
    Used in Algorithm Arena to compare Waiting Time, Turnaround, Misses, etc.
    """
    def __init__(
        self,
        parent,
        title: str,
        metric_name: str = "Ticks",
        height: int = 240,
        lower_is_better: bool = True,
        **kwargs
    ):
        super().__init__(
            parent,
            fg_color=CARD_BG,
            border_color=CARD_BORDER,
            border_width=1,
            corner_radius=12,
            **kwargs
        )
        self.metric_name = metric_name
        self.lower_is_better = lower_is_better
        self.data: List[Tuple[str, float, str]] = []  # [(label, value, color)]
        self.best_label: Optional[str] = None

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=16, pady=(10, 4))

        self.title_lbl = ctk.CTkLabel(
            header,
            text=title,
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        )
        self.title_lbl.pack(side="left")

        self.subtitle_lbl = ctk.CTkLabel(
            header,
            text=f"({ 'Lower is better' if lower_is_better else 'Higher is better' })",
            font=(FONT_FAMILY, 10),
            text_color=COLOR_CYAN if lower_is_better else COLOR_SUCCESS
        )
        self.subtitle_lbl.pack(side="left", padx=8)

        self.canvas = tk.Canvas(
            self,
            bg="#0C121E",
            height=height,
            highlightthickness=0
        )
        self.canvas.pack(fill="both", expand=True, padx=14, pady=(0, 10))
        self.canvas.bind("<Configure>", lambda e: self.redraw())

    def update_data(self, data: List[Tuple[str, float, str]], best_label: Optional[str] = None):
        """
        data: list of (algorithm_name, metric_value, hex_color)
        """
        self.data = data
        self.best_label = best_label
        self.redraw()

    def redraw(self):
        c = self.canvas
        c.delete("all")
        w = c.winfo_width()
        h = c.winfo_height()
        if w <= 50 or h <= 50 or not self.data:
            c.create_text(
                w // 2, h // 2,
                text="NO BENCHMARK DATA AVAILABLE — RUN ARENA TEST",
                fill=TEXT_MUTED, font=(FONT_MONO, 10)
            )
            return

        pad_left = 50
        pad_right = 20
        pad_top = 25
        pad_bottom = 50

        draw_w = w - pad_left - pad_right
        draw_h = h - pad_top - pad_bottom

        # Determine scale
        max_val = max([val for _, val, _ in self.data] + [1.0])
        max_scale = max_val * 1.15

        # Horizontal gridlines
        grid_steps = 4
        for i in range(grid_steps + 1):
            y_val = max_scale * (i / grid_steps)
            y_pos = pad_top + draw_h - (i / grid_steps * draw_h)
            c.create_line(pad_left, y_pos, pad_left + draw_w, y_pos, fill="#182338", width=1)
            c.create_text(
                pad_left - 8, y_pos,
                text=f"{y_val:.1f}", fill=TEXT_MUTED, font=(FONT_MONO, 8), anchor="e"
            )

        # Baseline
        c.create_line(pad_left, pad_top + draw_h, pad_left + draw_w, pad_top + draw_h, fill="#25354F", width=1.5)

        # Draw bars
        n = len(self.data)
        slot_w = draw_w / n
        bar_w = min(slot_w * 0.65, 48)

        for i, (label, val, col) in enumerate(self.data):
            slot_center = pad_left + (i * slot_w) + (slot_w / 2)
            x1 = slot_center - (bar_w / 2)
            x2 = slot_center + (bar_w / 2)
            bar_h = (val / max_scale) * draw_h if max_scale > 0 else 0
            y1 = pad_top + draw_h - bar_h
            y2 = pad_top + draw_h

            is_best = (label == self.best_label)
            outline_col = "#FFFFFF" if is_best else ""
            outline_w = 2 if is_best else 0

            # Draw bar rectangle
            c.create_rectangle(
                x1, y1, x2, y2,
                fill=col, outline=outline_col, width=outline_w
            )

            # Top accent cap
            c.create_line(x1, y1, x2, y1, fill="#FFFFFF", width=1)

            # Value text on top
            val_text = f"{val:.1f}" if isinstance(val, float) else f"{val}"
            c.create_text(
                slot_center, y1 - 10,
                text=val_text, fill=COLOR_CYAN if is_best else TEXT_PRIMARY,
                font=(FONT_MONO, 9, "bold" if is_best else "normal")
            )

            if is_best:
                c.create_text(
                    slot_center, y1 - 22,
                    text="★ BEST", fill=COLOR_WARNING, font=(FONT_MONO, 8, "bold")
                )

            # Label on bottom (shortened or wrapped)
            short_label = label.replace("PulseQueue Adaptive", "PulseQueue").replace("Shortest Job First (SRTF)", "SRTF").replace("Static Priority", "Static")
            c.create_text(
                slot_center, pad_top + draw_h + 16,
                text=short_label, fill=TEXT_MUTED if not is_best else COLOR_CYAN,
                font=(FONT_MONO, 9, "bold" if is_best else "normal")
            )


class StackedTurnaroundChart(ctk.CTkFrame):
    """
    Stacked bar chart for each task: Burst Time (green) + Waiting Time (violet) = Turnaround Time.
    """
    def __init__(self, parent, height: int = 220, **kwargs):
        super().__init__(
            parent,
            fg_color=CARD_BG,
            border_color=CARD_BORDER,
            border_width=1,
            corner_radius=12,
            **kwargs
        )
        self.task_data: List[Dict[str, Any]] = []

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=16, pady=(10, 4))

        title_lbl = ctk.CTkLabel(
            header,
            text="PROCESS TIME COMPOSITION  //  WAITING VS BURST EXECUTION",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        )
        title_lbl.pack(side="left")

        # Legend
        legend = ctk.CTkFrame(header, fg_color="transparent")
        legend.pack(side="right")
        for text, col in [("Burst", COLOR_SUCCESS), ("Wait", COLOR_PURPLE)]:
            box = ctk.CTkFrame(legend, fg_color=col, width=10, height=10, corner_radius=2)
            box.pack(side="left", padx=(8, 3))
            ctk.CTkLabel(legend, text=text, font=(FONT_FAMILY, 9), text_color=TEXT_MUTED).pack(side="left")

        self.canvas = tk.Canvas(self, bg="#0C121E", height=height, highlightthickness=0)
        self.canvas.pack(fill="both", expand=True, padx=14, pady=(0, 10))
        self.canvas.bind("<Configure>", lambda e: self.redraw())

    def update_data(self, task_data: List[Dict[str, Any]]):
        self.task_data = task_data
        self.redraw()

    def redraw(self):
        c = self.canvas
        c.delete("all")
        w = c.winfo_width()
        h = c.winfo_height()
        if w <= 50 or h <= 50 or not self.task_data:
            c.create_text(
                w // 2, h // 2,
                text="AWAITING PROCESS COMPLETIONS TO RENDER COMPOSITION",
                fill=TEXT_MUTED, font=(FONT_MONO, 10)
            )
            return

        pad_left = 50
        pad_right = 20
        pad_top = 25
        pad_bottom = 35

        draw_w = w - pad_left - pad_right
        draw_h = h - pad_top - pad_bottom

        # Find max turnaround
        max_turn = max([t["turnaround"] for t in self.task_data] + [1])
        max_scale = max_turn * 1.15

        # Grid lines
        for i in range(4):
            y_val = max_scale * (i / 3)
            y_pos = pad_top + draw_h - (i / 3 * draw_h)
            c.create_line(pad_left, y_pos, pad_left + draw_w, y_pos, fill="#182338", width=1)
            c.create_text(pad_left - 8, y_pos, text=f"{int(y_val)}", fill=TEXT_MUTED, font=(FONT_MONO, 8), anchor="e")

        c.create_line(pad_left, pad_top + draw_h, pad_left + draw_w, pad_top + draw_h, fill="#25354F", width=1.5)

        n = len(self.task_data)
        slot_w = draw_w / n
        bar_w = min(slot_w * 0.6, 40)

        for i, t in enumerate(self.task_data):
            center = pad_left + (i * slot_w) + (slot_w / 2)
            x1 = center - bar_w / 2
            x2 = center + bar_w / 2

            burst_h = (t["burst"] / max_scale) * draw_h
            wait_h = (t["waiting"] / max_scale) * draw_h

            # Lower bar: Burst (green)
            y_burst_bottom = pad_top + draw_h
            y_burst_top = y_burst_bottom - burst_h
            c.create_rectangle(x1, y_burst_top, x2, y_burst_bottom, fill=COLOR_SUCCESS, outline="")

            # Upper bar: Waiting (purple)
            y_wait_top = y_burst_top - wait_h
            c.create_rectangle(x1, y_wait_top, x2, y_burst_top, fill=COLOR_PURPLE, outline="")

            # Total turnaround on top
            c.create_text(
                center, y_wait_top - 8,
                text=f"{t['turnaround']}", fill=TEXT_PRIMARY, font=(FONT_MONO, 8, "bold")
            )

            # PID label below
            c.create_text(
                center, pad_top + draw_h + 14,
                text=f"P{t['pid']:02d}", fill=get_process_color(t['pid']), font=(FONT_MONO, 9, "bold")
            )


class TimelineUtilizationChart(ctk.CTkFrame):
    """Area line chart of rolling CPU utilization across ticks."""
    def __init__(self, parent, height: int = 180, **kwargs):
        super().__init__(
            parent,
            fg_color=CARD_BG,
            border_color=CARD_BORDER,
            border_width=1,
            corner_radius=12,
            **kwargs
        )
        self.history: List[Tuple[int, Optional[int]]] = []

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=16, pady=(10, 4))

        ctk.CTkLabel(
            header,
            text="CPU LOAD PROFILE  //  UTILIZATION TREND",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(side="left")

        self.rate_lbl = ctk.CTkLabel(
            header,
            text="0.0% ACTIVE",
            font=(FONT_MONO, 11, "bold"),
            text_color=COLOR_CYAN
        )
        self.rate_lbl.pack(side="right")

        self.canvas = tk.Canvas(self, bg="#0C121E", height=height, highlightthickness=0)
        self.canvas.pack(fill="both", expand=True, padx=14, pady=(0, 10))
        self.canvas.bind("<Configure>", lambda e: self.redraw())

    def update_history(self, history: List[Tuple[int, Optional[int]]]):
        self.history = history
        if history:
            busy = sum(1 for _, pid in history if pid is not None)
            pct = (busy / len(history)) * 100.0
            self.rate_lbl.configure(text=f"{pct:.1f}% ACTIVE")
        self.redraw()

    def redraw(self):
        c = self.canvas
        c.delete("all")
        w = c.winfo_width()
        h = c.winfo_height()
        if w <= 50 or h <= 40 or not self.history:
            c.create_text(w // 2, h // 2, text="AWAITING SCHEDULER ACTIVITY", fill=TEXT_MUTED, font=(FONT_MONO, 10))
            return

        pad_left = 45
        pad_right = 20
        pad_top = 15
        pad_bottom = 25

        draw_w = w - pad_left - pad_right
        draw_h = h - pad_top - pad_bottom

        # Grid lines (0%, 50%, 100%)
        for pct, y_norm in [(0, 1.0), (50, 0.5), (100, 0.0)]:
            y = pad_top + (y_norm * draw_h)
            c.create_line(pad_left, y, pad_left + draw_w, y, fill="#182338", width=1)
            c.create_text(pad_left - 8, y, text=f"{pct}%", fill=TEXT_MUTED, font=(FONT_MONO, 8), anchor="e")

        # Calculate moving average of utilization (window size 5 ticks)
        window = 5
        rolling = []
        n = len(self.history)
        for i in range(n):
            start = max(0, i - window + 1)
            chunk = self.history[start:i + 1]
            busy = sum(1 for _, pid in chunk if pid is not None)
            rolling.append(busy / len(chunk))

        if not rolling:
            return

        pts = []
        step = draw_w / max(1, n - 1)
        for i, val in enumerate(rolling):
            x = pad_left + (i * step)
            y = pad_top + draw_h - (val * draw_h)
            pts.extend([x, y])

        # Fill polygon under curve
        poly_pts = [pad_left, pad_top + draw_h] + pts + [pad_left + (len(rolling) - 1) * step, pad_top + draw_h]
        if len(poly_pts) >= 6:
            c.create_polygon(poly_pts, fill="#0E293E", outline="")
            c.create_line(pts, fill=COLOR_CYAN, width=2)


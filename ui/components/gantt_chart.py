"""
High-Performance Vector Gantt Chart for PulseQueue X
Renders real-time execution timelines, context switches, and process blocks on Tkinter Canvas.
"""
import tkinter as tk
import customtkinter as ctk
from typing import List, Tuple, Optional, Dict
from ui.theme import (
    CARD_BG, CARD_BORDER, BG_DARK, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_DANGER, FONT_MONO, FONT_FAMILY
)
from core.models import get_process_color


class GanttChart(ctk.CTkFrame):
    def __init__(
        self,
        parent,
        title: str = "EXECUTION GANTT TIMELINE",
        height: int = 130,
        max_visible_ticks: int = 50,
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
        self.max_visible_ticks = max_visible_ticks
        self.history: List[Tuple[int, Optional[int]]] = []
        self.current_clock = 0
        self.tooltip_text = ""

        # Header bar
        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=16, pady=(10, 4))

        title_lbl = ctk.CTkLabel(
            header,
            text=f"◈  {title}",
            font=(FONT_MONO, 12, "bold"),
            text_color=TEXT_PRIMARY
        )
        title_lbl.pack(side="left")

        self.info_lbl = ctk.CTkLabel(
            header,
            text="Awaiting simulation...",
            font=(FONT_FAMILY, 10),
            text_color=TEXT_MUTED
        )
        self.info_lbl.pack(side="right")

        # Canvas for drawing timeline
        self.canvas = tk.Canvas(
            self,
            bg="#0C121E",
            height=height,
            highlightthickness=0,
            cursor="crosshair"
        )
        self.canvas.pack(fill="both", expand=True, padx=14, pady=(0, 10))
        self.canvas.bind("<Configure>", lambda e: self.redraw())
        self.canvas.bind("<Motion>", self._on_hover)
        self.canvas.bind("<Leave>", self._on_leave)

        self._block_hitboxes: List[Dict] = []

    def update_history(self, history: List[Tuple[int, Optional[int]]], current_clock: int):
        self.history = history
        self.current_clock = current_clock
        self.redraw()

    def redraw(self):
        c = self.canvas
        c.delete("all")
        self._block_hitboxes.clear()

        width = c.winfo_width()
        height = c.winfo_height()
        if width <= 50 or height <= 30:
            return

        if not self.history:
            c.create_text(
                width // 2, height // 2 - 5,
                text="AWAITING SCHEDULER START — NO EXECUTION HISTORY",
                fill=TEXT_MUTED,
                font=(FONT_MONO, 11)
            )
            return

        # Determine visible slice
        if len(self.history) > self.max_visible_ticks:
            visible_history = self.history[-self.max_visible_ticks:]
        else:
            visible_history = self.history

        total_visible = len(visible_history)
        if total_visible == 0:
            return

        pad_left = 30
        pad_right = 30
        draw_width = width - pad_left - pad_right
        unit = draw_width / total_visible

        block_top = 22
        block_bottom = height - 36
        block_height = block_bottom - block_top

        # Draw subtle horizontal lane background
        c.create_rectangle(
            pad_left, block_top - 2,
            pad_left + draw_width, block_bottom + 2,
            fill="#101726", outline="#1F2E45", width=1
        )

        # Compact contiguous ticks into process segments
        segments = []
        cur_pid = visible_history[0][1]
        start_idx = 0
        for i in range(1, total_visible):
            pid = visible_history[i][1]
            if pid != cur_pid:
                segments.append((cur_pid, start_idx, i - 1))
                cur_pid = pid
                start_idx = i
        segments.append((cur_pid, start_idx, total_visible - 1))

        # Draw segments
        for pid, s_idx, e_idx in segments:
            x1 = pad_left + (s_idx * unit)
            x2 = pad_left + ((e_idx + 1) * unit)
            ticks_count = e_idx - s_idx + 1

            if pid is None:
                # IDLE block
                c.create_rectangle(
                    x1, block_top, x2, block_bottom,
                    fill="#151C2C", outline="#1F2A3D", width=1
                )
                if x2 - x1 >= 28:
                    c.create_text(
                        (x1 + x2) / 2, (block_top + block_bottom) / 2,
                        text="IDLE", fill="#475569", font=(FONT_MONO, 9, "bold")
                    )
            else:
                color = get_process_color(pid)
                # Outer glow / border
                c.create_rectangle(
                    x1 + 1, block_top + 1, x2 - 1, block_bottom - 1,
                    fill=color, outline="#FFFFFF", width=0
                )
                # Accent highlight top border
                c.create_line(x1 + 1, block_top + 1, x2 - 1, block_top + 1, fill="#FFFFFF", width=1)

                if x2 - x1 >= 22:
                    text_col = "#080B12"
                    c.create_text(
                        (x1 + x2) / 2, (block_top + block_bottom) / 2 - 4,
                        text=f"P{pid:02d}", fill=text_col, font=(FONT_MONO, 10, "bold")
                    )
                    c.create_text(
                        (x1 + x2) / 2, (block_top + block_bottom) / 2 + 8,
                        text=f"{ticks_count}t", fill=text_col, font=(FONT_MONO, 8)
                    )

            # Record hitbox for tooltip
            first_tick = visible_history[s_idx][0]
            last_tick = visible_history[e_idx][0]
            self._block_hitboxes.append({
                "x1": x1, "x2": x2,
                "pid": pid,
                "ticks": ticks_count,
                "start": first_tick,
                "end": last_tick
            })

        # Draw time tick rulers along bottom
        ruler_y = height - 20
        c.create_line(pad_left, ruler_y, pad_left + draw_width, ruler_y, fill="#25354F", width=1)

        # Step calculation for ruler labels
        step = 5 if total_visible > 20 else 1
        for i in range(0, total_visible, step):
            tick_num = visible_history[i][0]
            x = pad_left + (i * unit)
            c.create_line(x, ruler_y, x, ruler_y + 4, fill="#3A4D6B", width=1)
            c.create_text(
                x, ruler_y + 11,
                text=str(tick_num), fill=TEXT_MUTED, font=(FONT_MONO, 8)
            )

        # Draw current tick marker line
        cur_x = pad_left + draw_width
        c.create_line(cur_x, block_top - 6, cur_x, ruler_y + 2, fill=COLOR_CYAN, width=2)
        c.create_polygon(
            cur_x - 4, block_top - 8,
            cur_x + 4, block_top - 8,
            cur_x, block_top - 2,
            fill=COLOR_CYAN, outline=""
        )

        start_tick = visible_history[0][0]
        self.info_lbl.configure(text=f"Showing Ticks {start_tick} → {self.current_clock} (Total: {len(self.history)})")

    def _on_hover(self, event):
        for hb in self._block_hitboxes:
            if hb["x1"] <= event.x <= hb["x2"]:
                if hb["pid"] is None:
                    self.info_lbl.configure(text=f"Hover: CPU IDLE for {hb['ticks']} ticks (t={hb['start']}..{hb['end']})")
                else:
                    self.info_lbl.configure(text=f"Hover: Process P{hb['pid']:02d} executed for {hb['ticks']} ticks (t={hb['start']}..{hb['end']})")
                return

    def _on_leave(self, event):
        if self.history:
            start_tick = self.history[-min(len(self.history), self.max_visible_ticks)][0]
            self.info_lbl.configure(text=f"Showing Ticks {start_tick} → {self.current_clock} (Total: {len(self.history)})")


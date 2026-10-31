"""
Execution History View for PulseQueue X
Maintains persistent logs of completed simulation runs and exports CSV audit reports.
"""
import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog, messagebox
from typing import List
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY, create_card
)
from core.analytics import RunRecord


class ExecutionHistoryView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.build_ui()

    def build_ui(self):
        # Action bar
        top_bar = create_card(self)
        top_bar.pack(fill="x", padx=16, pady=(12, 10))

        tb_inner = ctk.CTkFrame(top_bar, fg_color="transparent")
        tb_inner.pack(fill="x", padx=14, pady=10)

        ctk.CTkLabel(
            tb_inner,
            text="EXECUTION RUN AUDIT LOG",
            font=(FONT_MONO, 12, "bold"),
            text_color=COLOR_CYAN
        ).pack(side="left")

        ctk.CTkButton(
            tb_inner,
            text="⬇ EXPORT CSV REPORT",
            font=(FONT_MONO, 10, "bold"),
            fg_color="#164E63",
            hover_color="#0891B2",
            text_color=TEXT_PRIMARY,
            height=30,
            command=self._export_csv
        ).pack(side="right", padx=4)

        ctk.CTkButton(
            tb_inner,
            text="🗑 CLEAR LOGS",
            font=(FONT_MONO, 10, "bold"),
            fg_color="#3B1D28",
            hover_color="#502535",
            text_color=COLOR_DANGER,
            height=30,
            command=self._clear_logs
        ).pack(side="right", padx=4)

        self.runs_count_lbl = ctk.CTkLabel(
            tb_inner,
            text="0 Simulation Runs Logged",
            font=(FONT_FAMILY, 10),
            text_color=TEXT_MUTED
        )
        self.runs_count_lbl.pack(side="right", padx=12)

        # History Table Card
        table_card = create_card(self)
        table_card.pack(fill="both", expand=True, padx=16, pady=(0, 12))

        self.scroll_table = ctk.CTkScrollableFrame(table_card, fg_color="#0C121E", corner_radius=8)
        self.scroll_table.pack(fill="both", expand=True, padx=14, pady=12)

        self._render_headers()

    def _render_headers(self):
        hdr = ctk.CTkFrame(self.scroll_table, fg_color="#151F33", height=28, corner_radius=4)
        hdr.pack(fill="x", pady=(0, 4))
        cols = [
            ("RUN ID", 75),
            ("TIMESTAMP", 140),
            ("ALGORITHM", 160),
            ("WORKLOAD", 110),
            ("TASKS", 70),
            ("MAKESPAN", 80),
            ("AVG WAIT", 80),
            ("AVG TURN", 80),
            ("CPU UTIL", 80),
            ("MISSES", 70),
            ("SWITCHES", 80),
        ]
        for name, w in cols:
            ctk.CTkLabel(
                hdr,
                text=name,
                font=(FONT_MONO, 9, "bold"),
                text_color=COLOR_CYAN if name in ("RUN ID", "ALGORITHM") else TEXT_MUTED,
                width=w,
                anchor="center"
            ).pack(side="left", padx=2)

    def _export_csv(self):
        if not self.app.history_manager.records:
            messagebox.showinfo("Export", "No execution history records to export.")
            return

        file_path = filedialog.asksaveasfilename(defaultextension=".csv", filetypes=[("CSV Files", "*.csv")])
        if file_path:
            try:
                self.app.history_manager.export_csv(file_path)
                messagebox.showinfo("Export", "Audit report successfully exported to CSV.")
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export CSV:\n{e}")

    def _clear_logs(self):
        self.app.history_manager.clear()
        self.refresh()

    def refresh(self):
        records = self.app.history_manager.records
        self.runs_count_lbl.configure(text=f"{len(records)} Simulation Runs Logged")

        for child in self.scroll_table.winfo_children():
            if child != self.scroll_table.winfo_children()[0]:
                child.destroy()

        if not records:
            ctk.CTkLabel(
                self.scroll_table,
                text="NO SIMULATION RUNS RECORDED YET\nExecute or complete a workload to populate the historical audit log.",
                font=(FONT_MONO, 11),
                text_color=TEXT_MUTED,
                justify="center"
            ).pack(pady=60)
            return

        for r in records:
            row = ctk.CTkFrame(self.scroll_table, fg_color="#101726", height=28)
            row.pack(fill="x", pady=1)

            ctk.CTkLabel(row, text=r.run_id, font=(FONT_MONO, 10, "bold"), text_color=COLOR_CYAN, width=75).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=r.timestamp, font=(FONT_MONO, 9), text_color=TEXT_MUTED, width=140).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=r.algorithm, font=(FONT_MONO, 10, "bold"), text_color=TEXT_PRIMARY, width=160, anchor="w").pack(side="left", padx=2)
            ctk.CTkLabel(row, text=r.workload_name, font=(FONT_FAMILY, 9), text_color=TEXT_MUTED, width=110).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.completed_processes}/{r.num_processes}", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=70).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.makespan}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=80).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.avg_wait:.1f}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=80).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.avg_turnaround:.1f}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=80).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{r.cpu_utilization:.1f}%", font=(FONT_MONO, 10), text_color=COLOR_SUCCESS, width=80).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=str(r.deadline_misses), font=(FONT_MONO, 10, "bold"), text_color=COLOR_SUCCESS if r.deadline_misses == 0 else COLOR_DANGER, width=70).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=str(r.context_switches), font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=80).pack(side="left", padx=2)


"""
Process Manager View for PulseQueue X
Workload composition, interactive process creation, preset benchmarks, and JSON/CSV import/export.
"""
import customtkinter as ctk
import tkinter as tk
from tkinter import filedialog, messagebox
from typing import List, Optional
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY, create_card
)
from core.models import Task, ProcessType, get_process_color
from core.workloads import WorkloadManager


class ProcessManagerView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.build_ui()

    def build_ui(self):
        # Top Action & Preset Bar
        top_bar = create_card(self)
        top_bar.pack(fill="x", padx=16, pady=(12, 10))

        tb_inner = ctk.CTkFrame(top_bar, fg_color="transparent")
        tb_inner.pack(fill="x", padx=14, pady=10)

        ctk.CTkLabel(
            tb_inner,
            text="WORKLOAD PRESETS:",
            font=(FONT_MONO, 10, "bold"),
            text_color=COLOR_CYAN
        ).pack(side="left", padx=(0, 6))

        presets = [
            ("Standard Demo", self._load_standard),
            ("Starvation Hazard", self._load_starvation),
            ("Deadline Crunch", self._load_deadline),
            ("Heavy Batch", self._load_batch),
            ("Interactive Burst", self._load_interactive),
            ("Synthetic Random", self._load_random)
        ]
        for name, cmd in presets:
            ctk.CTkButton(
                tb_inner,
                text=name,
                font=(FONT_MONO, 9, "bold"),
                fg_color="#182335",
                hover_color="#24344F",
                text_color=TEXT_PRIMARY,
                height=28,
                command=cmd
            ).pack(side="left", padx=3)

        # Right side Import/Export
        ctk.CTkButton(
            tb_inner,
            text="⬆ IMPORT",
            font=(FONT_MONO, 9, "bold"),
            fg_color="#164E63",
            hover_color="#0891B2",
            text_color=TEXT_PRIMARY,
            height=28,
            width=70,
            command=self._import_workload
        ).pack(side="right", padx=3)

        ctk.CTkButton(
            tb_inner,
            text="⬇ EXPORT",
            font=(FONT_MONO, 9, "bold"),
            fg_color="#312E81",
            hover_color="#4338CA",
            text_color=TEXT_PRIMARY,
            height=28,
            width=70,
            command=self._export_workload
        ).pack(side="right", padx=3)

        # Main Split: Add Process Form (Left 320px) vs Process Table (Right Expand)
        main_split = ctk.CTkFrame(self, fg_color="transparent")
        main_split.pack(fill="both", expand=True, padx=16, pady=(0, 12))
        main_split.grid_columnconfigure(0, weight=0, minsize=310)
        main_split.grid_columnconfigure(1, weight=1)
        main_split.grid_rowconfigure(0, weight=1)

        # Left: Task Injection Drawer
        form_card = create_card(main_split)
        form_card.grid(row=0, column=0, sticky="nsew", padx=(0, 10))

        ctk.CTkLabel(
            form_card,
            text="TASK INJECTION PANEL",
            font=(FONT_MONO, 13, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(anchor="w", padx=16, pady=(16, 8))

        ctk.CTkLabel(
            form_card,
            text="Define execution parameters to inject new process threads into the scheduling pipeline.",
            font=(FONT_FAMILY, 10),
            text_color=TEXT_MUTED,
            wraplength=270,
            justify="left"
        ).pack(anchor="w", padx=16, pady=(0, 12))

        # Inputs
        self.inputs = {}
        fields = [
            ("Process Type", "Interactive", ["Interactive", "Batch", "Real-Time", "System"]),
            ("Arrival Time (ticks)", "0", None),
            ("Burst Time (ticks)", "5", None),
            ("Base Priority (lower = higher)", "4", None),
            ("Deadline (ticks)", "18", None),
        ]

        for label, default, options in fields:
            ctk.CTkLabel(form_card, text=label.upper(), font=(FONT_MONO, 9, "bold"), text_color=TEXT_MUTED).pack(anchor="w", padx=16, pady=(6, 2))
            if options:
                menu = ctk.CTkOptionMenu(
                    form_card,
                    values=options,
                    fg_color="#0C121E",
                    button_color="#182335",
                    button_hover_color="#24344F",
                    dropdown_fg_color="#151E2D",
                    height=32,
                    font=(FONT_FAMILY, 11)
                )
                menu.set(default)
                menu.pack(fill="x", padx=16, pady=(0, 4))
                self.inputs[label] = menu
            else:
                ent = ctk.CTkEntry(
                    form_card,
                    fg_color="#0C121E",
                    border_color="#1F2E45",
                    text_color=TEXT_PRIMARY,
                    height=32,
                    font=(FONT_MONO, 11)
                )
                ent.insert(0, default)
                ent.pack(fill="x", padx=16, pady=(0, 4))
                self.inputs[label] = ent

        self.form_status = ctk.CTkLabel(
            form_card,
            text="",
            font=(FONT_FAMILY, 10),
            text_color=COLOR_SUCCESS,
            wraplength=270
        )
        self.form_status.pack(anchor="w", padx=16, pady=(8, 4))

        # Add Button
        ctk.CTkButton(
            form_card,
            text="+ INJECT PROCESS",
            font=(FONT_MONO, 11, "bold"),
            fg_color=COLOR_CYAN,
            hover_color="#0891B2",
            text_color="#080B12",
            height=36,
            command=self._on_add_task
        ).pack(fill="x", padx=16, pady=(8, 14))

        # Right: Workload Process Table
        table_card = create_card(main_split)
        table_card.grid(row=0, column=1, sticky="nsew")

        tbl_hdr = ctk.CTkFrame(table_card, fg_color="transparent")
        tbl_hdr.pack(fill="x", padx=16, pady=(12, 6))

        ctk.CTkLabel(
            tbl_hdr,
            text="WORKLOAD PROCESS REPOSITORY",
            font=(FONT_MONO, 13, "bold"),
            text_color=TEXT_PRIMARY
        ).pack(side="left")

        self.table_stats_lbl = ctk.CTkLabel(
            tbl_hdr,
            text="0 Processes",
            font=(FONT_MONO, 10),
            text_color=TEXT_MUTED
        )
        self.table_stats_lbl.pack(side="right")

        self.scroll_table = ctk.CTkScrollableFrame(table_card, fg_color="#0C121E", corner_radius=8)
        self.scroll_table.pack(fill="both", expand=True, padx=14, pady=(0, 12))

        self._render_headers()

    def _render_headers(self):
        hdr = ctk.CTkFrame(self.scroll_table, fg_color="#151F33", height=28, corner_radius=4)
        hdr.pack(fill="x", pady=(0, 4))
        cols = [
            ("PID", 55),
            ("TYPE", 100),
            ("ARRIVAL", 70),
            ("BURST", 70),
            ("PRIO", 60),
            ("DEADLINE", 75),
            ("REMAINING", 85),
            ("STATUS", 95),
            ("ACTION", 75)
        ]
        for name, w in cols:
            ctk.CTkLabel(
                hdr,
                text=name,
                font=(FONT_MONO, 9, "bold"),
                text_color=COLOR_CYAN if name in ("PID", "STATUS") else TEXT_MUTED,
                width=w,
                anchor="center"
            ).pack(side="left", padx=2)

    def _on_add_task(self):
        try:
            ptype_str = self.inputs["Process Type"].get()
            arrival = int(self.inputs["Arrival Time (ticks)"].get())
            burst = int(self.inputs["Burst Time (ticks)"].get())
            prio = int(self.inputs["Base Priority (lower = higher)"].get())
            deadline = int(self.inputs["Deadline (ticks)"].get())

            if min(arrival, prio) < 0:
                raise ValueError("Arrival and Priority must be non-negative (>= 0)")
            if burst <= 0:
                raise ValueError("Burst time must be positive (> 0)")
            if deadline < arrival + burst:
                raise ValueError(f"Deadline ({deadline}) cannot be less than Arrival + Burst ({arrival + burst})")

            pt = ProcessType(ptype_str)
            pid = self.app.next_pid
            self.app.next_pid += 1

            task = Task(pid=pid, arrival=arrival, burst=burst, priority=prio, deadline=deadline, process_type=pt)
            self.app.engine.add(task)
            self.form_status.configure(text=f"✔ Process P{pid:02d} successfully injected!", text_color=COLOR_SUCCESS)
            self.app.refresh_all()
        except ValueError as exc:
            self.form_status.configure(text=f"✖ {exc}", text_color=COLOR_DANGER)

    def _delete_task(self, pid: int):
        if self.app.engine.remove(pid):
            self.form_status.configure(text=f"Process P{pid:02d} removed.", text_color=COLOR_WARNING)
            self.app.refresh_all()
        else:
            self.form_status.configure(text=f"Cannot remove P{pid:02d} (already executed or finished).", text_color=COLOR_DANGER)

    def _load_standard(self):
        self.app.load_workload(WorkloadManager.get_standard_demo())

    def _load_starvation(self):
        self.app.load_workload(WorkloadManager.get_starvation_hazard())

    def _load_deadline(self):
        self.app.load_workload(WorkloadManager.get_deadline_crunch())

    def _load_batch(self):
        self.app.load_workload(WorkloadManager.get_heavy_batch())

    def _load_interactive(self):
        self.app.load_workload(WorkloadManager.get_interactive_burst())

    def _load_random(self):
        self.app.load_workload(WorkloadManager.generate_random(count=8))

    def _import_workload(self):
        file_path = filedialog.askopenfilename(filetypes=[("JSON Files", "*.json"), ("CSV Files", "*.csv")])
        if file_path:
            try:
                if file_path.endswith('.json'):
                    tasks = WorkloadManager.import_json(file_path)
                else:
                    tasks = WorkloadManager.import_csv(file_path)
                self.app.load_workload(tasks)
                messagebox.showinfo("Success", f"Imported {len(tasks)} processes successfully.")
            except Exception as e:
                messagebox.showerror("Import Error", f"Failed to import file:\n{e}")

    def _export_workload(self):
        file_path = filedialog.asksaveasfilename(defaultextension=".json", filetypes=[("JSON Files", "*.json"), ("CSV Files", "*.csv")])
        if file_path:
            try:
                tasks = list(self.app.engine.tasks.values())
                if file_path.endswith('.csv'):
                    WorkloadManager.export_csv(tasks, file_path)
                else:
                    WorkloadManager.export_json(tasks, file_path)
                messagebox.showinfo("Success", f"Exported {len(tasks)} processes successfully.")
            except Exception as e:
                messagebox.showerror("Export Error", f"Failed to export file:\n{e}")

    def refresh(self):
        engine = self.app.engine
        tasks = list(engine.tasks.values())
        self.table_stats_lbl.configure(text=f"{len(tasks)} Processes Total")

        for child in self.scroll_table.winfo_children():
            if child != self.scroll_table.winfo_children()[0]:
                child.destroy()

        for t in sorted(tasks, key=lambda x: x.pid):
            row = ctk.CTkFrame(self.scroll_table, fg_color="#101726" if t.pid % 2 == 0 else "#0C121E", height=30)
            row.pack(fill="x", pady=1)

            if t.remaining == 0:
                st = "COMPLETED"
                sc = COLOR_SUCCESS
            elif engine.active == t.pid:
                st = "RUNNING"
                sc = COLOR_CYAN
            elif t.arrival <= engine.clock:
                waited = max(0, engine.clock - t.arrival - (t.burst - t.remaining))
                if waited >= getattr(engine, 'starvation_threshold', 15):
                    st = "STARVED"
                    sc = COLOR_DANGER
                else:
                    st = "READY"
                    sc = COLOR_PURPLE
            else:
                st = "PENDING"
                sc = TEXT_MUTED

            p_col = get_process_color(t.pid)
            ctk.CTkLabel(row, text=f"P{t.pid:02d}", font=(FONT_MONO, 10, "bold"), text_color=p_col, width=55).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=t.process_type.value, font=(FONT_FAMILY, 9), text_color=TEXT_MUTED, width=100).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.arrival}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=70).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.burst}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=70).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=str(t.priority), font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=60).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.deadline}t", font=(FONT_MONO, 10), text_color=TEXT_PRIMARY, width=75).pack(side="left", padx=2)
            ctk.CTkLabel(row, text=f"{t.remaining}t", font=(FONT_MONO, 10, "bold"), text_color=COLOR_CYAN if t.remaining > 0 else TEXT_MUTED, width=85).pack(side="left", padx=2)

            st_frame = ctk.CTkFrame(row, fg_color="transparent", width=95)
            st_frame.pack(side="left", padx=2)
            ctk.CTkLabel(st_frame, text=st, font=(FONT_MONO, 8, "bold"), text_color=sc, fg_color="#182338", corner_radius=6, padx=6, height=18).pack(anchor="center")

            del_btn = ctk.CTkButton(
                row,
                text="✕",
                font=(FONT_MONO, 9, "bold"),
                fg_color="#2D1520" if (t.remaining == t.burst and engine.active != t.pid) else "#181D26",
                hover_color="#451E2E",
                text_color=COLOR_DANGER if (t.remaining == t.burst and engine.active != t.pid) else "#475569",
                width=28,
                height=22,
                state="normal" if (t.remaining == t.burst and engine.active != t.pid) else "disabled",
                command=lambda p=t.pid: self._delete_task(p)
            )
            del_btn.pack(side="left", padx=(10, 2))


"""
PulseQueue X: Main Application Shell
Command Center Interface with Collapsible Sidebar, Real-Time Top Navigation, and View Router.
"""
import customtkinter as ctk
import tkinter as tk
from typing import Dict, Optional, List
from ui.theme import (
    BG_DARK, BG_SECONDARY, CARD_BG, CARD_BORDER,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    TEXT_PRIMARY, TEXT_MUTED, FONT_MONO, FONT_FAMILY
)
from core.models import Task
from core.scheduler import PulseQueueScheduler
from core.multicore import MultiCoreScheduler
from core.analytics import ExecutionHistory
from core.workloads import WorkloadManager

from ui.views.overview_view import OverviewView
from ui.views.live_scheduler_view import LiveSchedulerView
from ui.views.process_manager_view import ProcessManagerView
from ui.views.multi_core_view import MultiCoreView
from ui.views.algorithm_arena_view import AlgorithmArenaView
from ui.views.analytics_view import PerformanceAnalyticsView
from ui.views.history_view import ExecutionHistoryView
from ui.views.settings_view import SettingsView


ctk.set_appearance_mode("dark")


class PulseQueueXApp(ctk.CTk):
    def __init__(self):
        super().__init__()
        self.title("PulseQueue X | Predictive & Self-Adaptive CPU Scheduling Dashboard")
        
        # Responsive dynamic sizing to fit any screen resolution with room for taskbar
        screen_w = self.winfo_screenwidth()
        screen_h = self.winfo_screenheight()
        win_w = min(1380, max(980, int(screen_w * 0.92)))
        win_h = min(780, max(560, int(screen_h * 0.88)))
        x = max(0, (screen_w - win_w) // 2)
        y = max(0, (screen_h - win_h) // 2 - 20)
        self.geometry(f"{win_w}x{win_h}+{x}+{y}")
        self.minsize(960, 560)
        self.configure(fg_color=BG_DARK)

        # Core Engines
        self.engine = PulseQueueScheduler(aging=0.6, deadline_weight=2.5)
        self.multicore = MultiCoreScheduler(num_cores=4, aging=0.6, deadline_weight=2.5)
        self.history_manager = ExecutionHistory()

        # State Variables
        self.running: bool = False
        self.timer_id: Optional[str] = None
        self.sim_speed_ms: int = 400
        self.next_pid: int = 1
        self.current_workload_name: str = "Standard Demo"
        self.sidebar_expanded: bool = True

        # Build UI Shell
        self._build_shell()
        self._setup_keybindings()

        # Load initial demo workload
        self.load_workload(WorkloadManager.get_standard_demo())

        # Select default view (Overview)
        self.switch_view("Overview")

        # Ensure window is visible on foreground desktop
        self.deiconify()
        self.lift()
        self.attributes('-topmost', True)
        self.after(500, lambda: self.attributes('-topmost', False))
        self.focus_force()

        self.protocol("WM_DELETE_WINDOW", self.close)

    def _build_shell(self):
        # Master Layout Container
        self.shell = ctk.CTkFrame(self, fg_color="transparent")
        self.shell.pack(fill="both", expand=True)

        # 1. Left Sidebar
        self.sidebar = ctk.CTkFrame(
            self.shell,
            fg_color=BG_SECONDARY,
            corner_radius=0,
            border_width=1,
            border_color="#182335",
            width=230
        )
        self.sidebar.pack(side="left", fill="y")
        self.sidebar.pack_propagate(False)

        # 2. Right Body (TopNav + Dynamic View Content)
        self.right_container = ctk.CTkFrame(self.shell, fg_color="transparent")
        self.right_container.pack(side="right", fill="both", expand=True)

        self._build_sidebar()
        self._build_top_nav()

        # Dynamic View Container
        self.view_container = ctk.CTkFrame(self.right_container, fg_color="transparent")
        self.view_container.pack(fill="both", expand=True)

        # Initialize all views once for instant tab switching
        self.views = {
            "Overview": OverviewView(self.view_container, self),
            "Live Scheduler": LiveSchedulerView(self.view_container, self),
            "Process Manager": ProcessManagerView(self.view_container, self),
            "Multi-Core Monitor": MultiCoreView(self.view_container, self),
            "Algorithm Arena": AlgorithmArenaView(self.view_container, self),
            "Performance Analytics": PerformanceAnalyticsView(self.view_container, self),
            "Execution History": ExecutionHistoryView(self.view_container, self),
            "Settings & Theory": SettingsView(self.view_container, self)
        }
        self.current_view_name = "Overview"

    def _build_sidebar(self):
        # Brand Header
        self.brand_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        self.brand_frame.pack(fill="x", padx=16, pady=(18, 14))

        brand_row = ctk.CTkFrame(self.brand_frame, fg_color="transparent")
        brand_row.pack(fill="x")

        self.logo_icon = ctk.CTkLabel(
            brand_row,
            text="◈",
            font=(FONT_MONO, 22, "bold"),
            text_color=COLOR_CYAN
        )
        self.logo_icon.pack(side="left")

        self.logo_text_frame = ctk.CTkFrame(brand_row, fg_color="transparent")
        self.logo_text_frame.pack(side="left", padx=(10, 0))

        self.logo_title = ctk.CTkLabel(
            self.logo_text_frame,
            text="PULSEQUEUE X",
            font=(FONT_MONO, 14, "bold"),
            text_color=TEXT_PRIMARY
        )
        self.logo_title.pack(anchor="w")

        self.logo_sub = ctk.CTkLabel(
            self.logo_text_frame,
            text="ADAPTIVE SCHEDULING ENGINE",
            font=(FONT_FAMILY, 8),
            text_color=TEXT_MUTED
        )
        self.logo_sub.pack(anchor="w")

        # Divider
        ctk.CTkFrame(self.sidebar, fg_color="#182335", height=1).pack(fill="x", padx=14, pady=(0, 12))

        # Navigation Menu List
        self.nav_buttons: Dict[str, ctk.CTkButton] = {}
        nav_items = [
            ("Overview", "◈"),
            ("Live Scheduler", "⚡"),
            ("Process Manager", "⚙"),
            ("Multi-Core Monitor", "❖"),
            ("Algorithm Arena", "⚔"),
            ("Performance Analytics", "📊"),
            ("Execution History", "⏱"),
            ("Settings & Theory", "⌨")
        ]

        self.nav_menu_frame = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        self.nav_menu_frame.pack(fill="x", padx=10)

        for name, icon in nav_items:
            btn = ctk.CTkButton(
                self.nav_menu_frame,
                text=f"  {icon}  {name}" if self.sidebar_expanded else f" {icon} ",
                font=(FONT_FAMILY, 11, "bold"),
                anchor="w" if self.sidebar_expanded else "center",
                fg_color="transparent",
                hover_color="#162236",
                text_color=TEXT_MUTED,
                height=38,
                corner_radius=8,
                command=lambda n=name: self.switch_view(n)
            )
            btn.pack(fill="x", pady=2)
            self.nav_buttons[name] = btn

        # Bottom Sidebar: Collapsible Toggle & System Version
        self.sidebar_bottom = ctk.CTkFrame(self.sidebar, fg_color="transparent")
        self.sidebar_bottom.pack(side="bottom", fill="x", padx=12, pady=14)

        self.btn_collapse = ctk.CTkButton(
            self.sidebar_bottom,
            text="◀ COLLAPSE" if self.sidebar_expanded else "▶",
            font=(FONT_MONO, 9, "bold"),
            fg_color="#121A28",
            hover_color="#1D2A40",
            text_color=TEXT_MUTED,
            height=28,
            command=self._toggle_sidebar
        )
        self.btn_collapse.pack(fill="x", pady=(0, 6))

        self.sys_info_lbl = ctk.CTkLabel(
            self.sidebar_bottom,
            text="v2.4 COMPETITION BUILD" if self.sidebar_expanded else "v2.4",
            font=(FONT_MONO, 8),
            text_color="#475569"
        )
        self.sys_info_lbl.pack(anchor="center")

    def _toggle_sidebar(self):
        self.sidebar_expanded = not self.sidebar_expanded
        if self.sidebar_expanded:
            self.sidebar.configure(width=230)
            self.logo_text_frame.pack(side="left", padx=(10, 0))
            self.btn_collapse.configure(text="◀ COLLAPSE")
            self.sys_info_lbl.configure(text="v2.4 COMPETITION BUILD")
            for name, btn in self.nav_buttons.items():
                icon = btn.cget("text").split()[0]
                btn.configure(text=f"  {icon}  {name}", anchor="w")
        else:
            self.sidebar.configure(width=68)
            self.logo_text_frame.pack_forget()
            self.btn_collapse.configure(text="▶")
            self.sys_info_lbl.configure(text="v2.4")
            for name, btn in self.nav_buttons.items():
                icon = btn.cget("text").split()[0]
                btn.configure(text=f" {icon} ", anchor="center")

    def _build_top_nav(self):
        self.top_nav = ctk.CTkFrame(self.right_container, fg_color=BG_SECONDARY, height=58, corner_radius=0, border_width=1, border_color="#182335")
        self.top_nav.pack(fill="x")
        self.top_nav.pack_propagate(False)

        tn_inner = ctk.CTkFrame(self.top_nav, fg_color="transparent")
        tn_inner.pack(fill="both", expand=True, padx=20)

        # Left: Current Page Title & Subtitle
        title_box = ctk.CTkFrame(tn_inner, fg_color="transparent")
        title_box.pack(side="left", pady=10)

        self.page_title_lbl = ctk.CTkLabel(
            title_box,
            text="OVERVIEW DASHBOARD",
            font=(FONT_MONO, 14, "bold"),
            text_color=TEXT_PRIMARY
        )
        self.page_title_lbl.pack(anchor="w")

        self.page_sub_lbl = ctk.CTkLabel(
            title_box,
            text="High-level CPU telemetry and performance summary",
            font=(FONT_FAMILY, 9),
            text_color=TEXT_MUTED
        )
        self.page_sub_lbl.pack(anchor="w")

        # Right: Quick Global Controls & Status Badges
        controls_box = ctk.CTkFrame(tn_inner, fg_color="transparent")
        controls_box.pack(side="right", pady=12)

        # Simulation Status Pill
        self.status_pill = ctk.CTkLabel(
            controls_box,
            text="● SYSTEM READY",
            font=(FONT_MONO, 10, "bold"),
            text_color=COLOR_CYAN,
            fg_color="#0C1B2A",
            corner_radius=10,
            padx=10,
            height=26
        )
        self.status_pill.pack(side="left", padx=6)

        # Simulation Clock Badge
        self.clock_badge = ctk.CTkLabel(
            controls_box,
            text="TICK 000",
            font=(FONT_MONO, 12, "bold"),
            text_color=COLOR_PURPLE,
            fg_color="#18132B",
            corner_radius=10,
            padx=12,
            height=26
        )
        self.clock_badge.pack(side="left", padx=6)

        # Quick Control Buttons in TopNav
        self.top_btn_run = ctk.CTkButton(
            controls_box,
            text="▶",
            font=(FONT_MONO, 11, "bold"),
            fg_color=COLOR_SUCCESS,
            hover_color="#16A34A",
            text_color="#080B12",
            width=36,
            height=26,
            corner_radius=6,
            command=self.toggle_run
        )
        self.top_btn_run.pack(side="left", padx=3)

        self.top_btn_step = ctk.CTkButton(
            controls_box,
            text="⏭",
            font=(FONT_MONO, 11, "bold"),
            fg_color="#1E293B",
            hover_color="#334155",
            text_color=TEXT_PRIMARY,
            width=36,
            height=26,
            corner_radius=6,
            command=self.step_once
        )
        self.top_btn_step.pack(side="left", padx=3)

        self.top_btn_reset = ctk.CTkButton(
            controls_box,
            text="↺",
            font=(FONT_MONO, 11, "bold"),
            fg_color="#3B1D28",
            hover_color="#502535",
            text_color=COLOR_DANGER,
            width=36,
            height=26,
            corner_radius=6,
            command=self.reset_simulation
        )
        self.top_btn_reset.pack(side="left", padx=3)

    def switch_view(self, name: str):
        if name not in self.views:
            return

        # Update sidebar styling
        for v_name, btn in self.nav_buttons.items():
            if v_name == name:
                btn.configure(fg_color="#162236", text_color=COLOR_CYAN)
            else:
                btn.configure(fg_color="transparent", text_color=TEXT_MUTED)

        # Hide current view
        for v in self.views.values():
            v.pack_forget()

        # Show target view
        self.views[name].pack(fill="both", expand=True)
        self.current_view_name = name

        # Update TopNav Header
        subtitles = {
            "Overview": "High-level CPU telemetry, ready queue, and performance summary",
            "Live Scheduler": "Real-time dynamic priority scheduling, IndexedMinHeap, and Gantt timeline",
            "Process Manager": "Workload repository, custom process injection, and JSON/CSV import/export",
            "Multi-Core Monitor": "Symmetric multiprocessing (SMP) load distribution across 1 to 8 CPU cores",
            "Algorithm Arena": "5-way head-to-head competition benchmark on identical workloads",
            "Performance Analytics": "Waiting time distributions, turnaround composition, and timeline utilization",
            "Execution History": "Historical audit logs of previous simulation runs and CSV export",
            "Settings & Theory": "Engine tuning parameters, keyboard shortcuts, and DSA architecture specifications"
        }
        self.page_title_lbl.configure(text=name.upper())
        self.page_sub_lbl.configure(text=subtitles.get(name, "System Telemetry View"))

        # Refresh the target view
        self.views[name].refresh()

    def _setup_keybindings(self):
        self.bind("<space>", lambda e: self.toggle_run())
        self.bind("<s>", lambda e: self.step_once())
        self.bind("<S>", lambda e: self.step_once())
        self.bind("<r>", lambda e: self.reset_simulation())
        self.bind("<R>", lambda e: self.reset_simulation())

        nav_keys = ["1", "2", "3", "4", "5", "6", "7", "8"]
        nav_names = list(self.views.keys()) if hasattr(self, 'views') else []
        for idx, key in enumerate(nav_keys):
            if idx < len(nav_names):
                self.bind(key, lambda e, n=nav_names[idx]: self.switch_view(n))

    def load_workload(self, tasks: List[Task], name: str = "Standard Demo"):
        self.stop_simulation()
        self.current_workload_name = name
        self.engine.clear()
        self.next_pid = 1

        for t in tasks:
            cloned = t.clone()
            self.engine.add(cloned)
            if cloned.pid >= self.next_pid:
                self.next_pid = cloned.pid + 1

        # Sync multicore
        self.multicore.tasks.clear()
        for t in self.engine.tasks.values():
            self.multicore.add(t.clone())
        self.multicore.reset()

        self.status_pill.configure(text="● WORKLOAD LOADED", text_color=COLOR_CYAN, fg_color="#0C1B2A")
        self.refresh_all()

    def step_once(self):
        if self.engine.done():
            self.stop_simulation()
            self.status_pill.configure(text="● WORKLOAD COMPLETED", text_color=COLOR_SUCCESS, fg_color="#0E281E")
            return

        self.engine.step()
        self.clock_badge.configure(text=f"TICK {self.engine.clock:03d}")

        if self.engine.done():
            self.stop_simulation()
            self.status_pill.configure(text="● WORKLOAD COMPLETED", text_color=COLOR_SUCCESS, fg_color="#0E281E")
            self._log_completed_run()
        else:
            self.status_pill.configure(text="● RUNNING", text_color=COLOR_CYAN, fg_color="#0C1B2A")

        self.refresh_all()

    def _tick(self):
        self.timer_id = None
        if self.running:
            self.step_once()
            if self.running and not self.engine.done():
                self.timer_id = self.after(self.sim_speed_ms, self._tick)

    def toggle_run(self):
        if self.running:
            self.stop_simulation()
        else:
            if self.engine.done():
                return
            self.running = True
            self.top_btn_run.configure(text="⏸", fg_color=COLOR_WARNING)
            self.status_pill.configure(text="● SIMULATION ACTIVE", text_color=COLOR_CYAN, fg_color="#0C1B2A")
            self._tick()
            self.refresh_all()

    def stop_simulation(self):
        self.running = False
        if self.timer_id is not None:
            self.after_cancel(self.timer_id)
            self.timer_id = None
        self.top_btn_run.configure(text="▶", fg_color=COLOR_SUCCESS)
        if self.engine.done():
            self.status_pill.configure(text="● COMPLETED", text_color=COLOR_SUCCESS, fg_color="#0E281E")
        else:
            self.status_pill.configure(text="● PAUSED", text_color=COLOR_WARNING, fg_color="#241B10")
        self.refresh_all()

    def reset_simulation(self):
        self.stop_simulation()
        tasks = [t.clone() for t in self.engine.tasks.values()]
        self.engine.clear()
        for t in tasks:
            self.engine.add(t)

        self.multicore.tasks.clear()
        for t in self.engine.tasks.values():
            self.multicore.add(t.clone())
        self.multicore.reset()

        self.clock_badge.configure(text="TICK 000")
        self.status_pill.configure(text="● RESET", text_color=COLOR_CYAN, fg_color="#0C1B2A")
        self.refresh_all()

    def _log_completed_run(self):
        """Automatically saves finished run into Execution History."""
        avg_wait, avg_turn, misses = self.engine.stats()
        util = self.engine.cpu_utilization()
        self.history_manager.log_run(
            algorithm=getattr(self.engine, 'name', 'PulseQueue Adaptive'),
            workload_name=self.current_workload_name,
            num_processes=len(self.engine.tasks),
            completed_processes=len(self.engine.completed_tasks()),
            makespan=self.engine.clock,
            avg_wait=avg_wait,
            avg_turnaround=avg_turn,
            cpu_utilization=util,
            deadline_misses=misses,
            context_switches=self.engine.context_switches
        )

    def refresh_all(self):
        if hasattr(self, 'views') and self.current_view_name in self.views:
            self.views[self.current_view_name].refresh()

    def close(self):
        self.stop_simulation()
        self.destroy()


# Compatibility entry point
PulseQueueApp = PulseQueueXApp


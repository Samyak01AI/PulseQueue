"""
Settings and Technical Architecture Documentation View for PulseQueue X
"""
import customtkinter as ctk
import tkinter as tk
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_SUCCESS, COLOR_WARNING, COLOR_DANGER,
    FONT_MONO, FONT_FAMILY, create_card
)


class SettingsView(ctk.CTkFrame):
    def __init__(self, parent, app, **kwargs):
        super().__init__(parent, fg_color="transparent", **kwargs)
        self.app = app
        self.build_ui()

    def build_ui(self):
        scroll = ctk.CTkScrollableFrame(self, fg_color="transparent")
        scroll.pack(fill="both", expand=True, padx=16, pady=(12, 12))

        # 1. Parameter Configuration Card
        cfg_card = create_card(scroll)
        cfg_card.pack(fill="x", pady=(0, 12))

        hdr = ctk.CTkFrame(cfg_card, fg_color="transparent")
        hdr.pack(fill="x", padx=16, pady=(12, 6))
        ctk.CTkLabel(hdr, text="◈  SCHEDULING ENGINE SYSTEM TUNING", font=(FONT_MONO, 12, "bold"), text_color=COLOR_CYAN).pack(side="left")

        # Form fields
        grid = ctk.CTkFrame(cfg_card, fg_color="transparent")
        grid.pack(fill="x", padx=16, pady=(4, 12))
        grid.grid_columnconfigure(0, weight=1)
        grid.grid_columnconfigure(1, weight=1)

        # Starvation Threshold
        row1 = ctk.CTkFrame(grid, fg_color="transparent")
        row1.grid(row=0, column=0, padx=8, pady=6, sticky="ew")
        ctk.CTkLabel(row1, text="STARVATION DETECTION THRESHOLD (TICKS)", font=(FONT_MONO, 9, "bold"), text_color=TEXT_MUTED).pack(anchor="w")
        self.ent_starv = ctk.CTkEntry(row1, fg_color="#0C121E", border_color="#1F2E45", text_color=TEXT_PRIMARY, height=32, font=(FONT_MONO, 11))
        self.ent_starv.insert(0, str(getattr(self.app.engine, 'starvation_threshold', 15)))
        self.ent_starv.pack(fill="x", pady=(2, 0))

        # RR Quantum
        row2 = ctk.CTkFrame(grid, fg_color="transparent")
        row2.grid(row=0, column=1, padx=8, pady=6, sticky="ew")
        ctk.CTkLabel(row2, text="ROUND ROBIN DEFAULT TIME QUANTUM", font=(FONT_MONO, 9, "bold"), text_color=TEXT_MUTED).pack(anchor="w")
        self.ent_quantum = ctk.CTkEntry(row2, fg_color="#0C121E", border_color="#1F2E45", text_color=TEXT_PRIMARY, height=32, font=(FONT_MONO, 11))
        self.ent_quantum.insert(0, "3")
        self.ent_quantum.pack(fill="x", pady=(2, 0))

        # Apply settings button
        ctk.CTkButton(
            cfg_card,
            text="APPLY SYSTEM TUNING",
            font=(FONT_MONO, 10, "bold"),
            fg_color="#164E63",
            hover_color="#0891B2",
            text_color=TEXT_PRIMARY,
            height=32,
            command=self._apply_settings
        ).pack(anchor="e", padx=16, pady=(0, 14))

        # 2. Keyboard Shortcuts Guide
        keys_card = create_card(scroll)
        keys_card.pack(fill="x", pady=(0, 12))

        k_hdr = ctk.CTkFrame(keys_card, fg_color="transparent")
        k_hdr.pack(fill="x", padx=16, pady=(12, 6))
        ctk.CTkLabel(k_hdr, text="◈  KEYBOARD SHORTCUT ACCELERATORS", font=(FONT_MONO, 12, "bold"), text_color=TEXT_PRIMARY).pack(side="left")

        keys = [
            ("SPACE", "Toggle Run / Pause Simulation"),
            ("S", "Step Simulation by 1 Clock Tick"),
            ("R", "Reset Simulation to Initial Task State"),
            ("1 - 7", "Instant View Switching (Overview, Live, Manager, Cores, Arena, Analytics, History)")
        ]
        k_grid = ctk.CTkFrame(keys_card, fg_color="#0C121E", corner_radius=8)
        k_grid.pack(fill="x", padx=16, pady=(4, 14))
        for key, desc in keys:
            r = ctk.CTkFrame(k_grid, fg_color="transparent")
            r.pack(fill="x", padx=12, pady=4)
            ctk.CTkLabel(r, text=f"[{key}]", font=(FONT_MONO, 10, "bold"), text_color=COLOR_CYAN, width=70, anchor="w").pack(side="left")
            ctk.CTkLabel(r, text=desc, font=(FONT_FAMILY, 10), text_color=TEXT_MUTED).pack(side="left")

        # 3. Technical DSA Architecture Reference Card
        dsa_card = create_card(scroll)
        dsa_card.pack(fill="x", pady=(0, 12))

        d_hdr = ctk.CTkFrame(dsa_card, fg_color="transparent")
        d_hdr.pack(fill="x", padx=16, pady=(12, 6))
        ctk.CTkLabel(d_hdr, text="◈  ALGORITHMIC SPECIFICATIONS & COMPLEXITY", font=(FONT_MONO, 12, "bold"), text_color=COLOR_PURPLE).pack(side="left")

        dsa_text = (
            "1. INDEXED MIN-HEAP DATA STRUCTURE:\n"
            "   • Representation: 0-indexed contiguous array storing (score, pid) tuples.\n"
            "   • Hash Mapping: Inverted hash table pos[pid] -> array index enables O(1) existence and position queries.\n"
            "   • Priority Decrease/Increase Key: O(log N) through sift_up / sift_down from indexed position.\n"
            "   • Floyd's Linear-Time Heapification: O(N) rebuild on clock tick for global ready queue recalculation.\n\n"
            "2. ADAPTIVE SCHEDULING FORMULA:\n"
            "   • Dynamic Score = BasePriority - (α × WaitedTicks) - (β × max(0, 5 - SlackTicks))\n"
            "   • WaitedTicks = max(0, Clock - Arrival - ExecutedTicks)\n"
            "   • SlackTicks = Deadline - Clock - RemainingBurst\n"
            "   • Lower score executes first. Ties broken deterministically by Process ID (PID).\n\n"
            "3. STARVATION PREVENTION & DEADLINE ADHERENCE:\n"
            "   • Linear aging coefficient α prevents starvation of long-waiting low-priority processes.\n"
            "   • Quadratic-style bounded slack urgency penalty β elevates tasks within critical 5-tick deadline window."
        )

        dsa_lbl = ctk.CTkLabel(
            dsa_card,
            text=dsa_text,
            font=(FONT_MONO, 10),
            text_color=TEXT_PRIMARY,
            justify="left"
        )
        dsa_lbl.pack(anchor="w", padx=16, pady=(4, 14))

    def _apply_settings(self):
        try:
            st = int(self.ent_starv.get())
            self.app.engine.starvation_threshold = st
            if hasattr(self.app, 'multicore'):
                self.app.multicore.starvation_threshold = st
            self.app.refresh_all()
        except ValueError:
            pass

    def refresh(self):
        pass


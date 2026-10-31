"""
Decision Explainability Panel for PulseQueue X
Provides mathematical and algorithmic reasoning for every process selection.
"""
import customtkinter as ctk
from typing import Optional
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, COLOR_PURPLE, COLOR_WARNING, COLOR_SUCCESS,
    FONT_MONO, FONT_FAMILY
)
from core.models import DecisionExplanation, get_process_color


class DecisionExplainPanel(ctk.CTkFrame):
    def __init__(self, parent, **kwargs):
        super().__init__(
            parent,
            fg_color=CARD_BG,
            border_color=CARD_BORDER,
            border_width=1,
            corner_radius=12,
            **kwargs
        )

        header = ctk.CTkFrame(self, fg_color="transparent")
        header.pack(fill="x", padx=16, pady=(12, 6))

        title = ctk.CTkLabel(
            header,
            text="⚡ SCHEDULING DECISION ENGINE  //  EXPLAINABILITY AUDIT",
            font=(FONT_MONO, 12, "bold"),
            text_color=COLOR_CYAN
        )
        title.pack(side="left")

        self.clock_badge = ctk.CTkLabel(
            header,
            text="TICK 000",
            font=(FONT_MONO, 10, "bold"),
            text_color=COLOR_PURPLE,
            fg_color="#1F1635",
            corner_radius=6,
            padx=8,
            height=20
        )
        self.clock_badge.pack(side="right")

        # Main explanation narrative text
        self.narrative_lbl = ctk.CTkLabel(
            self,
            text="Simulation initialized. Press RUN or STEP to observe real-time algorithmic dispatch decisions.",
            font=(FONT_FAMILY, 11),
            text_color=TEXT_PRIMARY,
            wraplength=700,
            justify="left"
        )
        self.narrative_lbl.pack(anchor="w", padx=16, pady=(0, 10))

        # Mathematical Formula Breakdown Grid
        self.calc_frame = ctk.CTkFrame(self, fg_color="#0C121E", corner_radius=8, border_width=1, border_color="#182338")
        self.calc_frame.pack(fill="x", padx=16, pady=(0, 12))

        self.pills = {}
        fields = [
            ("PID", "--"),
            ("Base Prio", "--"),
            ("Waited Ticks", "--"),
            ("Aging Discount", "--"),
            ("Deadline Slack", "--"),
            ("Urgency Penalty", "--"),
            ("Dynamic Score", "--")
        ]

        for i, (name, val) in enumerate(fields):
            box = ctk.CTkFrame(self.calc_frame, fg_color="transparent")
            box.pack(side="left", expand=True, padx=8, pady=8)

            ctk.CTkLabel(box, text=name, font=(FONT_FAMILY, 9), text_color=TEXT_MUTED).pack()
            v_lbl = ctk.CTkLabel(
                box,
                text=val,
                font=(FONT_MONO, 12, "bold"),
                text_color=COLOR_CYAN if "Score" in name else TEXT_PRIMARY
            )
            v_lbl.pack()
            self.pills[name] = v_lbl

    def update_explanation(self, exp: Optional[DecisionExplanation]):
        if not exp:
            return

        self.clock_badge.configure(text=f"TICK {exp.clock:03d}")
        self.narrative_lbl.configure(text=exp.reason)

        if exp.pid is not None:
            self.pills["PID"].configure(
                text=f"P{exp.pid:02d}",
                text_color=get_process_color(exp.pid)
            )
        else:
            self.pills["PID"].configure(text="IDLE", text_color=TEXT_MUTED)

        self.pills["Base Prio"].configure(
            text=str(exp.base_priority) if exp.base_priority is not None else "--"
        )
        self.pills["Waited Ticks"].configure(
            text=f"{exp.waited_ticks}t" if exp.waited_ticks is not None else "--"
        )
        self.pills["Aging Discount"].configure(
            text=f"-{exp.aging_discount:.2f}" if exp.aging_discount is not None else "--",
            text_color=COLOR_SUCCESS if exp.aging_discount and exp.aging_discount > 0 else TEXT_MUTED
        )
        self.pills["Deadline Slack"].configure(
            text=f"{exp.slack_ticks}t" if exp.slack_ticks is not None else "--",
            text_color=COLOR_WARNING if exp.slack_ticks is not None and exp.slack_ticks <= 5 else TEXT_MUTED
        )
        self.pills["Urgency Penalty"].configure(
            text=f"-{exp.urgency_discount:.2f}" if exp.urgency_discount is not None else "--",
            text_color=COLOR_DANGER if exp.urgency_discount and exp.urgency_discount > 0 else TEXT_MUTED
        )
        self.pills["Dynamic Score"].configure(
            text=f"{exp.score:.2f}" if exp.score is not None else "--",
            text_color=COLOR_CYAN
        )


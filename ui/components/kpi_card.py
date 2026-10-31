"""
KPI Card Component for PulseQueue X Dashboard
"""
import customtkinter as ctk
from typing import Optional
from ui.theme import (
    CARD_BG, CARD_BORDER, TEXT_PRIMARY, TEXT_MUTED,
    COLOR_CYAN, FONT_MONO, FONT_FAMILY, create_card
)


class KPICard(ctk.CTkFrame):
    def __init__(
        self,
        parent,
        title: str,
        value: str = "0",
        icon: str = "◈",
        accent_color: str = COLOR_CYAN,
        subtext: str = "",
        trend: Optional[str] = None,
        width: int = 180,
        height: int = 110,
        **kwargs
    ):
        super().__init__(
            parent,
            fg_color=CARD_BG,
            border_color=CARD_BORDER,
            border_width=1,
            corner_radius=12,
            width=width,
            height=height,
            **kwargs
        )
        self.accent_color = accent_color

        # Accent top line indicator
        accent_bar = ctk.CTkFrame(self, fg_color=accent_color, height=3, corner_radius=2)
        accent_bar.pack(fill="x", padx=14, pady=(0, 8))

        # Header with icon and title
        header_frame = ctk.CTkFrame(self, fg_color="transparent")
        header_frame.pack(fill="x", padx=14, pady=(0, 2))

        self.icon_label = ctk.CTkLabel(
            header_frame,
            text=icon,
            font=(FONT_MONO, 13, "bold"),
            text_color=accent_color
        )
        self.icon_label.pack(side="left")

        self.title_label = ctk.CTkLabel(
            header_frame,
            text=f"  {title.upper()}",
            font=(FONT_FAMILY, 11, "bold"),
            text_color=TEXT_MUTED
        )
        self.title_label.pack(side="left")

        # Main Value Display
        self.value_label = ctk.CTkLabel(
            self,
            text=value,
            font=(FONT_MONO, 24, "bold"),
            text_color=TEXT_PRIMARY
        )
        self.value_label.pack(anchor="w", padx=14, pady=(2, 2))

        # Bottom trend or description
        footer_frame = ctk.CTkFrame(self, fg_color="transparent")
        footer_frame.pack(fill="x", padx=14, pady=(0, 8))

        self.subtext_label = ctk.CTkLabel(
            footer_frame,
            text=subtext or (trend if trend else "Real-time metric"),
            font=(FONT_FAMILY, 10),
            text_color=TEXT_MUTED
        )
        self.subtext_label.pack(side="left")

    def update_value(self, value: str, subtext: Optional[str] = None):
        self.value_label.configure(text=value)
        if subtext is not None:
            self.subtext_label.configure(text=subtext)


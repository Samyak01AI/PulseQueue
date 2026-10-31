"""
PulseQueue X Theme & Design System

Palette:
- Background: #080B12
- Secondary background: #101622
- Card background: #151E2D
- Card Border: #1F2E45
- Primary Accent: #00E5FF
- Secondary Accent: #8B5CF6
- Success: #22C55E
- Warning: #F59E0B
- Danger: #EF4444
- Main Text: #F1F5F9
- Muted Text: #94A3B8
"""
import customtkinter as ctk
import tkinter as tk
from typing import Optional, Tuple

# Colors
BG_DARK = "#080B12"
BG_SECONDARY = "#101622"
CARD_BG = "#151E2D"
CARD_BORDER = "#1F2E45"
CARD_HOVER_BORDER = "#2E4366"

COLOR_CYAN = "#00E5FF"
COLOR_PURPLE = "#8B5CF6"
COLOR_SUCCESS = "#22C55E"
COLOR_WARNING = "#F59E0B"
COLOR_DANGER = "#EF4444"
COLOR_BLUE = "#3B82F6"

TEXT_PRIMARY = "#F1F5F9"
TEXT_MUTED = "#94A3B8"
TEXT_SUBTLE = "#64748B"

# Fonts
FONT_FAMILY = "Segoe UI"
FONT_MONO = "Consolas"


def font_title(bold: bool = True) -> Tuple[str, int, str]:
    return (FONT_FAMILY, 20, "bold" if bold else "normal")


def font_subtitle(bold: bool = True) -> Tuple[str, int, str]:
    return (FONT_FAMILY, 15, "bold" if bold else "normal")


def font_body(size: int = 12, bold: bool = False) -> Tuple[str, int, str]:
    return (FONT_FAMILY, size, "bold" if bold else "normal")


def font_mono(size: int = 12, bold: bool = False) -> Tuple[str, int, str]:
    return (FONT_MONO, size, "bold" if bold else "normal")


def create_card(parent, **kwargs) -> ctk.CTkFrame:
    """Helper to create a standard styled card panel."""
    fg = kwargs.pop("fg_color", CARD_BG)
    border_color = kwargs.pop("border_color", CARD_BORDER)
    border_width = kwargs.pop("border_width", 1)
    corner_radius = kwargs.pop("corner_radius", 12)
    return ctk.CTkFrame(
        parent,
        fg_color=fg,
        border_color=border_color,
        border_width=border_width,
        corner_radius=corner_radius,
        **kwargs
    )


def create_badge(parent, text: str, bg_color: str, fg_color: str = "#FFFFFF", size: int = 10) -> ctk.CTkLabel:
    """Creates a pill-shaped status badge label."""
    return ctk.CTkLabel(
        parent,
        text=f"  {text}  ",
        fg_color=bg_color,
        text_color=fg_color,
        corner_radius=10,
        font=(FONT_MONO, size, "bold"),
        height=20
    )


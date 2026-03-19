from pathlib import Path

BACK_DIR = Path(__file__).resolve().parents[2]   # -> back
QR_TEMPLATES_DIR = BACK_DIR / "static" / "qr_templates"

QR_TEMPLATES = {
    "table_sticker_v1": {
        "background_path": QR_TEMPLATES_DIR / "table_sticker_v1.png",
        "qr_x": 150,
        "qr_y": 195,
        "qr_size": 850,
        "output_format": "PNG",
        "layer_order": "qr_under_overlay",
        "canvas_color": (255, 255, 255, 255),
    },

    # старый A5 — оставляем как рабочий предыдущий вариант
    "menu_a5_v1": {
        "background_path": QR_TEMPLATES_DIR / "qr_menu_a5_template.png",
        "qr_x": 190,
        "qr_y": 525,
        "qr_size": 1380,
        "output_format": "PDF",
        "layer_order": "qr_over_background",

        "draw_restaurant_name": True,
        "restaurant_name_centered": False,
        "restaurant_name_x": 760,
        "restaurant_name_y": 255,
        "restaurant_name_max_width": 720,
        "restaurant_name_font_size": 88,
        "restaurant_name_min_font_size": 42,
        "restaurant_name_color": (17, 17, 17),
    },

    # новый черный A5 — QR снизу, overlay сверху
    "menu_a5_v2": {
        "background_path": QR_TEMPLATES_DIR / "Tur LOGO A5.png",

        # весь лист A5
        "canvas_size": (1748, 2480),
        "canvas_color": (0, 0, 0, 255),

        # White panel to cover the QR area so black canvas doesn't bleed through.
        # Spans full width, from the top of the QR padding to the bottom of the canvas.
        # qr_y (520) - qr_padding (95) = 425 → panel starts at y=425
        # panel_height = 2480 - 425 = 2055 → reaches the very bottom
        "draw_background_panel": True,
        "panel_x": 0,
        "panel_y": 0,         # covers full canvas top to bottom
        "panel_width": 1748,
        "panel_height": 2480, # full canvas height
        "panel_color": (255, 255, 255, 255),
        "panel_radius": 0,

        # QR делаем крупнее и опускаем ниже
        "qr_x": 180,
        "qr_y": 590,
        "qr_size": 1400,

        # белая подложка под QR
        "qr_padding": 95,
        "qr_background_color": (255, 255, 255, 255),
        "qr_background_radius": 0,

        "output_format": "PDF",
        "pdf_background_color": (255, 255, 255),  # white — canvas is now fully white
        "pdf_resolution": 300,
        "layer_order": "qr_under_overlay",

        # название ресторана
        "draw_restaurant_name": True,
        "restaurant_name_centered": True,
        "restaurant_name_y": 150,
        "restaurant_name_max_width": 1380,
        "restaurant_name_font_size": 160,
        "restaurant_name_min_font_size": 42,
        "restaurant_name_color": (17, 17, 17),
    },
}
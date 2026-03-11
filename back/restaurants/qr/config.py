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
    },
    "menu_a5_v1": {
        "background_path": QR_TEMPLATES_DIR / "qr_menu_a5_template.png",
        "qr_x": 190,
        "qr_y": 525,
        "qr_size": 1380,
        "output_format": "PDF",
        "layer_order": "qr_over_background",

        "draw_restaurant_name": True,
        "restaurant_name_x": 760,
        "restaurant_name_y": 255,
        "restaurant_name_max_width": 720,
        "restaurant_name_font_size": 88,
        "restaurant_name_min_font_size": 42,
        "restaurant_name_color": (17, 17, 17),
    },
}
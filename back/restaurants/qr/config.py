from pathlib import Path
from django.conf import settings

QR_TEMPLATES = {
    "table_sticker_v1": {
        "background_path": settings.BASE_DIR / "static" / "qr_templates" / "table_sticker_v1.png",
        "qr_x": 69,
        "qr_y": 196,
        "qr_size": 450,
    }
}

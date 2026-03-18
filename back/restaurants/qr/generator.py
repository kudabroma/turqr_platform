from io import BytesIO
from pathlib import Path

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw, ImageFont

from .config import QR_TEMPLATES


QR_DIR = Path(__file__).resolve().parent
FONTS_DIR = QR_DIR / "fonts"
MANROPE_BOLD_PATH = FONTS_DIR / "Manrope-Bold.ttf"


def build_menu_url(slug: str) -> str:
    return f"https://{slug}.turqr.com/menu"


def generate_qr_pil_image(url: str) -> Image.Image:
    qr = qrcode.QRCode(
        version=None,
        error_correction=qrcode.constants.ERROR_CORRECT_H,
        box_size=12,
        border=4,
    )

    qr.add_data(url)
    qr.make(fit=True)

    image = qr.make_image(
        image_factory=StyledPilImage,
        module_drawer=RoundedModuleDrawer(radius_ratio=1),
        eye_drawer=RoundedModuleDrawer(radius_ratio=1),
        color_mask=SolidFillColorMask(
            front_color=(17, 17, 17),
            back_color=(255, 255, 255),
        ),
    ).convert("RGBA")

    return image


def generate_qr_png_bytes(url: str, size: int = 512) -> BytesIO:
    qr_image = generate_qr_pil_image(url)
    qr_image = qr_image.resize((size, size), Image.Resampling.LANCZOS)

    output = BytesIO()
    qr_image.save(output, format="PNG")
    output.seek(0)
    return output


def _fit_text_to_width(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_path: Path,
    max_width: int,
    start_size: int,
    min_size: int = 28,
) -> ImageFont.FreeTypeFont:
    font_size = start_size
    font = ImageFont.truetype(str(font_path), font_size)

    while font_size > min_size:
        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]

        if text_width <= max_width:
            return font

        font_size -= 2
        font = ImageFont.truetype(str(font_path), font_size)

    return font


def _draw_restaurant_name(
    image: Image.Image,
    restaurant_name: str,
    template: dict,
) -> Image.Image:
    if not restaurant_name:
        return image

    if not MANROPE_BOLD_PATH.exists():
        raise FileNotFoundError(f"Font file not found: {MANROPE_BOLD_PATH}")

    draw = ImageDraw.Draw(image)

    text = restaurant_name.strip()
    if not text:
        return image

    max_width = int(template.get("restaurant_name_max_width", image.size[0] - 200))
    start_font_size = int(template.get("restaurant_name_font_size", 72))
    min_font_size = int(template.get("restaurant_name_min_font_size", 28))
    text_fill = template.get("restaurant_name_color", (255, 255, 255))
    text_y = int(template.get("restaurant_name_y", 80))
    centered = bool(template.get("restaurant_name_centered", False))

    font = _fit_text_to_width(
        draw=draw,
        text=text,
        font_path=MANROPE_BOLD_PATH,
        max_width=max_width,
        start_size=start_font_size,
        min_size=min_font_size,
    )

    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]

    if centered:
        image_width = image.size[0]
        text_x = (image_width - text_width) // 2
    else:
        text_x = int(template.get("restaurant_name_x", 0))

    draw.text(
        (text_x, text_y),
        text,
        fill=text_fill,
        font=font,
    )

    return image


def _draw_background_panel(
    image: Image.Image,
    template: dict,
) -> Image.Image:
    if not template.get("draw_background_panel"):
        return image

    panel_x = int(template.get("panel_x", 0))
    panel_y = int(template.get("panel_y", 0))
    panel_w = int(template.get("panel_width", image.size[0]))
    panel_h = int(template.get("panel_height", image.size[1]))
    panel_radius = int(template.get("panel_radius", 0))
    panel_color = template.get("panel_color", (255, 255, 255, 255))

    panel = Image.new("RGBA", image.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(panel)

    if panel_radius > 0:
        draw.rounded_rectangle(
            (panel_x, panel_y, panel_x + panel_w, panel_y + panel_h),
            radius=panel_radius,
            fill=panel_color,
        )
    else:
        draw.rectangle(
            (panel_x, panel_y, panel_x + panel_w, panel_y + panel_h),
            fill=panel_color,
        )

    return Image.alpha_composite(image, panel)


def compose_qr_template(
    slug: str,
    template_key: str = "table_sticker_v1",
    restaurant_name: str | None = None,
) -> BytesIO:
    if template_key not in QR_TEMPLATES:
        raise ValueError(f"Unknown template: {template_key}")

    template = QR_TEMPLATES[template_key]

    background_path = Path(template["background_path"])
    qr_x = int(template["qr_x"])
    qr_y = int(template["qr_y"])
    qr_size = int(template["qr_size"])
    output_format = template.get("output_format", "PNG").upper()
    layer_order = template.get("layer_order", "qr_under_overlay")
    canvas_color = template.get("canvas_color", (255, 255, 255, 255))

    if not background_path.exists():
        raise FileNotFoundError(f"Background template not found: {background_path}")

    menu_url = build_menu_url(slug)

    overlay = Image.open(background_path).convert("RGBA")

    canvas_size = template.get("canvas_size")
    if canvas_size:
        width, height = int(canvas_size[0]), int(canvas_size[1])
        if overlay.size != (width, height):
            overlay = overlay.resize((width, height), Image.Resampling.LANCZOS)
    else:
        width, height = overlay.size

    qr_image = generate_qr_pil_image(menu_url)
    qr_image = qr_image.resize((qr_size, qr_size), Image.Resampling.LANCZOS)

    qr_padding = int(template.get("qr_padding", 0))
    qr_bg_color = template.get("qr_background_color", (255, 255, 255, 255))
    qr_bg_radius = int(template.get("qr_background_radius", 0))

    if layer_order == "qr_under_overlay":
        canvas = Image.new("RGBA", (width, height), canvas_color)

        # Большая белая панель внутри A5
        canvas = _draw_background_panel(canvas, template)

        # Белая подложка именно под QR
        if qr_padding > 0:
            qr_bg_size = qr_size + qr_padding * 2
            qr_bg = Image.new("RGBA", (qr_bg_size, qr_bg_size), (0, 0, 0, 0))

            if qr_bg_radius > 0:
                qr_bg_draw = ImageDraw.Draw(qr_bg)
                qr_bg_draw.rounded_rectangle(
                    (0, 0, qr_bg_size - 1, qr_bg_size - 1),
                    radius=qr_bg_radius,
                    fill=qr_bg_color,
                )
            else:
                qr_bg = Image.new("RGBA", (qr_bg_size, qr_bg_size), qr_bg_color)

            canvas.alpha_composite(qr_bg, (qr_x - qr_padding, qr_y - qr_padding))

        canvas.alpha_composite(qr_image, (qr_x, qr_y))
        result = Image.alpha_composite(canvas, overlay)

    elif layer_order == "qr_over_background":
        result = overlay.copy()

        if qr_padding > 0:
            qr_bg_size = qr_size + qr_padding * 2
            qr_bg = Image.new("RGBA", (qr_bg_size, qr_bg_size), (0, 0, 0, 0))

            if qr_bg_radius > 0:
                qr_bg_draw = ImageDraw.Draw(qr_bg)
                qr_bg_draw.rounded_rectangle(
                    (0, 0, qr_bg_size - 1, qr_bg_size - 1),
                    radius=qr_bg_radius,
                    fill=qr_bg_color,
                )
            else:
                qr_bg = Image.new("RGBA", (qr_bg_size, qr_bg_size), qr_bg_color)

            result.alpha_composite(qr_bg, (qr_x - qr_padding, qr_y - qr_padding))

        result.alpha_composite(qr_image, (qr_x, qr_y))

    else:
        raise ValueError(f"Unsupported layer_order: {layer_order}")

    if template.get("draw_restaurant_name") and restaurant_name:
        result = _draw_restaurant_name(
            image=result,
            restaurant_name=restaurant_name,
            template=template,
        )

    output = BytesIO()

    if output_format == "PNG":
        result.save(output, format="PNG")

    elif output_format == "PDF":
        pdf_background_color = template.get("pdf_background_color", (255, 255, 255))

        # FIX: Use alpha_composite onto a solid RGBA base, then convert to RGB.
        # The old paste(result, mask=alpha_channel) approach left transparent
        # regions unfilled when canvas_color was dark, causing black bleed in the PDF.
        rgb_base = Image.new("RGBA", result.size, (*pdf_background_color, 255))
        rgb_base.alpha_composite(result)
        rgb_image = rgb_base.convert("RGB")

        pdf_resolution = int(template.get("pdf_resolution", 300))
        rgb_image.save(output, format="PDF", resolution=pdf_resolution)

    else:
        raise ValueError(f"Unsupported output format: {output_format}")

    output.seek(0)
    return output
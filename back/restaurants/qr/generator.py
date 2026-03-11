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

    text = text.upper()

    text_x = int(template.get("restaurant_name_x", 0))
    text_y = int(template.get("restaurant_name_y", 0))
    max_width = int(template.get("restaurant_name_max_width", 600))
    start_font_size = int(template.get("restaurant_name_font_size", 96))
    min_font_size = int(template.get("restaurant_name_min_font_size", 36))
    text_fill = template.get("restaurant_name_color", (17, 17, 17))

    font = _fit_text_to_width(
        draw=draw,
        text=text,
        font_path=MANROPE_BOLD_PATH,
        max_width=max_width,
        start_size=start_font_size,
        min_size=min_font_size,
    )

    draw.text(
        (text_x, text_y),
        text,
        fill=text_fill,
        font=font,
    )

    return image


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

    if not background_path.exists():
        raise FileNotFoundError(f"Background template not found: {background_path}")

    menu_url = build_menu_url(slug)

    background = Image.open(background_path).convert("RGBA")
    width, height = background.size

    qr_image = generate_qr_pil_image(menu_url)
    qr_image = qr_image.resize(
        (qr_size, qr_size),
        Image.Resampling.LANCZOS,
    )

    if layer_order == "qr_under_overlay":
        # sticker: white canvas -> QR -> overlay on top
        canvas = Image.new("RGBA", (width, height), (255, 255, 255, 255))
        canvas.paste(qr_image, (qr_x, qr_y), qr_image)
        result = Image.alpha_composite(canvas, background)

    elif layer_order == "qr_over_background":
        # A5: background -> QR on top
        result = background.copy()
        result.paste(qr_image, (qr_x, qr_y), qr_image)

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
        rgb_image = Image.new("RGB", result.size, (255, 255, 255))
        if result.mode == "RGBA":
            rgb_image.paste(result, mask=result.getchannel("A"))
        else:
            rgb_image = result.convert("RGB")

        rgb_image.save(output, format="PDF", resolution=300)

    else:
        raise ValueError(f"Unsupported output format: {output_format}")

    output.seek(0)
    return output
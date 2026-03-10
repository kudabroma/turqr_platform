from io import BytesIO

import qrcode
from qrcode.image.styledpil import StyledPilImage
from qrcode.image.styles.moduledrawers import RoundedModuleDrawer
from qrcode.image.styles.colormasks import SolidFillColorMask
from PIL import Image, ImageDraw

from .config import QR_TEMPLATES


def build_menu_url(slug: str) -> str:
    return f"https://{slug}.turqr.com/menu"


def create_rounded_qr_block(
    qr_image: Image.Image,
    block_size: int,
    radius: int = 32,
    padding: int = 18,
) -> Image.Image:
    block = Image.new("RGBA", (block_size, block_size), (255, 255, 255, 0))

    mask = Image.new("L", (block_size, block_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [(0, 0), (block_size - 1, block_size - 1)],
        radius=radius,
        fill=255,
    )

    white_bg = Image.new("RGBA", (block_size, block_size), (255, 255, 255, 255))
    block.paste(white_bg, (0, 0))

    inner_size = block_size - padding * 2
    qr_resized = qr_image.resize((inner_size, inner_size), Image.LANCZOS)

    qr_layer = Image.new("RGBA", (block_size, block_size), (0, 0, 0, 0))
    qr_layer.paste(qr_resized, (padding, padding), qr_resized)

    block = Image.alpha_composite(block, qr_layer)

    rounded = Image.new("RGBA", (block_size, block_size), (0, 0, 0, 0))
    rounded.paste(block, (0, 0), mask)

    return rounded


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
        # Скругляем внутренние пиксели
        module_drawer=RoundedModuleDrawer(radius_ratio=1),
        # Скругляем 3 больших квадрата (глаза)
        eye_drawer=RoundedModuleDrawer(radius_ratio=1), 
        # Правильно задаем цвета для StyledPilImage (RGB: 17, 17, 17 = #111111)
        color_mask=SolidFillColorMask(front_color=(17, 17, 17), back_color=(255, 255, 255))
    ).convert("RGBA")

    return image


def compose_qr_template(slug: str, template_key: str = "table_sticker_v1") -> BytesIO:
    template = QR_TEMPLATES[template_key]
    background_path = template["background_path"]
    qr_x = template["qr_x"]
    qr_y = template["qr_y"]
    qr_size = template["qr_size"]

    menu_url = build_menu_url(slug)

    background = Image.open(background_path).convert("RGBA")
    qr_image = generate_qr_pil_image(menu_url)

    qr_block = create_rounded_qr_block(
        qr_image=qr_image,
        block_size=qr_size,
        radius=40,
        padding=22,
    )

    background.paste(qr_block, (qr_x, qr_y), qr_block)

    output = BytesIO()
    background.save(output, format="PNG")
    output.seek(0)
    return output
def generate_qr_png_bytes(url: str, size: int = 512) -> BytesIO:
    qr_image = generate_qr_pil_image(url)
    qr_image = qr_image.resize((size, size), Image.LANCZOS)

    output = BytesIO()
    qr_image.save(output, format="PNG")
    output.seek(0)
    return output
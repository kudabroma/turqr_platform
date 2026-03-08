from io import BytesIO

import segno
from PIL import Image

from .config import QR_TEMPLATES
from PIL import Image, ImageDraw

def build_menu_url(slug: str) -> str:
    return f"https://{slug}.turqr.com/menu"

def create_rounded_qr_block(qr_image: Image.Image, block_size: int, radius: int = 24, padding: int = 18) -> Image.Image:
    block = Image.new("RGBA", (block_size, block_size), (255, 255, 255, 0))

    mask = Image.new("L", (block_size, block_size), 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle(
        [(0, 0), (block_size - 1, block_size - 1)],
        radius=radius,
        fill=255,
    )

    white_bg = Image.new("RGBA", (block_size, block_size), (255, 255, 255, 255))
    block.paste(white_bg, (0, 0), mask)

    inner_size = block_size - padding * 2
    qr_resized = qr_image.resize((inner_size, inner_size), Image.LANCZOS)

    block.paste(qr_resized, (padding, padding), qr_resized)
    return block
def generate_qr_pil_image(url: str, scale: int = 12) -> Image.Image:
    qr = segno.make(url, error="h")
    buffer = BytesIO()
    qr.save(buffer, kind="png", scale=scale, border=4)
    buffer.seek(0)
    image = Image.open(buffer).convert("RGBA")
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
        radius=24,
        padding=18,
    )

    background.paste(qr_block, (qr_x, qr_y), qr_block)

    output = BytesIO()
    background.save(output, format="PNG")
    output.seek(0)
    return output
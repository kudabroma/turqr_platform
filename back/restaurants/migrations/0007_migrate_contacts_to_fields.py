from django.db import migrations
import re

EMAIL_RE = re.compile(r"[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}", re.IGNORECASE)
PHONE_RE = re.compile(r"(\+?\d[\d\-\s().]{5,}\d)")

def forwards(apps, schema_editor):
    Restaurant = apps.get_model("restaurants", "Restaurant")

    for r in Restaurant.objects.all():
        contacts = (r.contacts or "").strip()
        if not contacts:
            continue

        # не перетираем, если уже заполнено
        email = (r.email or "").strip()
        phone = (r.phone or "").strip()
        address = (r.address or "").strip()

        lines = [ln.strip() for ln in re.split(r"\r?\n", contacts) if ln.strip()]

        found_email = ""
        found_phone = ""

        if not email:
            m = EMAIL_RE.search(contacts)
            if m:
                found_email = m.group(0).strip()

        if not phone:
            m = PHONE_RE.search(contacts)
            if m:
                found_phone = m.group(0).strip()

        # адрес: всё, что осталось (best-effort)
        rest_lines = []
        for ln in lines:
            if found_email and found_email in ln:
                continue
            if found_phone and found_phone in ln:
                continue
            rest_lines.append(ln)

        found_address = ""
        if not address and rest_lines:
            # если осталась одна строка — вероятно address, если несколько — тоже ок
            found_address = "\n".join(rest_lines).strip()

        changed = False
        if found_email and not email:
            r.email = found_email
            changed = True
        if found_phone and not phone:
            r.phone = found_phone
            changed = True
        if found_address and not address:
            r.address = found_address
            changed = True

        if changed:
            r.save(update_fields=["email", "phone", "address"])

def backwards(apps, schema_editor):
    # Откат не делаем (чтобы не портить contacts)
    pass

class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0006_restaurant_address_restaurant_email_restaurant_phone"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]

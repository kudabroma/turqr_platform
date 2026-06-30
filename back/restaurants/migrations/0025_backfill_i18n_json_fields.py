from django.db import migrations


def _pack(tr=None, en=None, ru=None):
    """Build i18n dict, omitting keys whose value is empty/None."""
    result = {}
    if tr and tr.strip():
        result["tr"] = tr.strip()
    if en and en.strip():
        result["en"] = en.strip()
    if ru and ru.strip():
        result["ru"] = ru.strip()
    return result


def forwards(apps, schema_editor):
    Dish = apps.get_model("restaurants", "Dish")
    Category = apps.get_model("restaurants", "Category")
    Restaurant = apps.get_model("restaurants", "Restaurant")

    dishes = []
    for dish in Dish.objects.all():
        dish.name_i18n = _pack(
            tr=dish.name_tr,
            en=dish.name_en,
            ru=dish.name_ru,
        )
        dish.description_i18n = _pack(
            tr=dish.description_tr,
            en=dish.description_en,
            ru=dish.description_ru,
        )
        dishes.append(dish)
    Dish.objects.bulk_update(dishes, ["name_i18n", "description_i18n"])

    categories = []
    for cat in Category.objects.all():
        cat.name_i18n = _pack(
            tr=cat.name_tr,
            en=cat.name_en,
            ru=cat.name_ru,
        )
        categories.append(cat)
    Category.objects.bulk_update(categories, ["name_i18n"])

    restaurants = []
    for rest in Restaurant.objects.all():
        rest.description_i18n = _pack(
            tr=rest.description_tr,
            en=rest.description_en,
            ru=rest.description_ru,
        )
        restaurants.append(rest)
    Restaurant.objects.bulk_update(restaurants, ["description_i18n"])


def backwards(apps, schema_editor):
    Dish = apps.get_model("restaurants", "Dish")
    Category = apps.get_model("restaurants", "Category")
    Restaurant = apps.get_model("restaurants", "Restaurant")

    dishes = []
    for dish in Dish.objects.all():
        i18n = dish.name_i18n or {}
        dish.name_tr = i18n.get("tr", "") or ""
        dish.name_en = i18n.get("en", "") or ""
        dish.name_ru = i18n.get("ru", "") or ""

        d18n = dish.description_i18n or {}
        dish.description_tr = d18n.get("tr", "") or ""
        dish.description_en = d18n.get("en", "") or ""
        dish.description_ru = d18n.get("ru", "") or ""
        dishes.append(dish)
    Dish.objects.bulk_update(
        dishes,
        ["name_tr", "name_en", "name_ru", "description_tr", "description_en", "description_ru"],
    )

    categories = []
    for cat in Category.objects.all():
        i18n = cat.name_i18n or {}
        cat.name_tr = i18n.get("tr", "") or ""
        cat.name_en = i18n.get("en", "") or ""
        cat.name_ru = i18n.get("ru", "") or ""
        categories.append(cat)
    Category.objects.bulk_update(categories, ["name_tr", "name_en", "name_ru"])

    restaurants = []
    for rest in Restaurant.objects.all():
        i18n = rest.description_i18n or {}
        rest.description_tr = i18n.get("tr", "") or ""
        rest.description_en = i18n.get("en", "") or ""
        rest.description_ru = i18n.get("ru", "") or ""
        restaurants.append(rest)
    Restaurant.objects.bulk_update(
        restaurants, ["description_tr", "description_en", "description_ru"]
    )


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0024_add_i18n_json_fields'),
    ]

    operations = [
        migrations.RunPython(forwards, reverse_code=backwards),
    ]

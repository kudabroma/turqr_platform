from django.db import migrations

def forwards(apps, schema_editor):
    Category = apps.get_model("restaurants", "Category")
    Dish = apps.get_model("restaurants", "Dish")

    # Category: name -> name_tr (если name_tr пустой)
    for c in Category.objects.all().only("id", "name", "name_tr"):
        if (not c.name_tr) and c.name:
            c.name_tr = c.name
            c.save(update_fields=["name_tr"])

    # Dish: name -> name_tr, description -> description_tr (если пустые)
    for d in Dish.objects.all().only("id", "name", "description", "name_tr", "description_tr"):
        changed = False
        if (not d.name_tr) and d.name:
            d.name_tr = d.name
            changed = True
        if (not d.description_tr) and d.description:
            d.description_tr = d.description
            changed = True
        if changed:
            d.save(update_fields=["name_tr", "description_tr"])

def backwards(apps, schema_editor):
    # можно оставить пустым
    pass

class Migration(migrations.Migration):
    dependencies = [
        ("restaurants", "0014_alter_category_options_alter_dish_options_and_more"),
    ]

    operations = [
        migrations.RunPython(forwards, backwards),
    ]  
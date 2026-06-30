from django.db import migrations, models
import restaurants.models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0025_backfill_i18n_json_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='restaurant',
            name='enabled_languages',
            field=models.JSONField(
                default=restaurants.models._default_languages,
                verbose_name='Доступные языки',
                help_text='Список языков меню, например ["tr", "ru", "en"]',
            ),
        ),
    ]

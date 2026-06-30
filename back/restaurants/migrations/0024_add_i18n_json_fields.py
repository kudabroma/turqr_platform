from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('restaurants', '0023_restaurant_description_ru'),
    ]

    operations = [
        migrations.AddField(
            model_name='category',
            name='name_i18n',
            field=models.JSONField(default=dict, verbose_name='Название (i18n JSON)'),
        ),
        migrations.AddField(
            model_name='dish',
            name='name_i18n',
            field=models.JSONField(default=dict, verbose_name='Название (i18n JSON)'),
        ),
        migrations.AddField(
            model_name='dish',
            name='description_i18n',
            field=models.JSONField(default=dict, verbose_name='Описание (i18n JSON)'),
        ),
        migrations.AddField(
            model_name='restaurant',
            name='description_i18n',
            field=models.JSONField(default=dict, verbose_name='Описание (i18n JSON)'),
        ),
    ]

from django.db import migrations, models


def set_currency_to_npr(apps, schema_editor):
    CustomUser = apps.get_model('users', 'CustomUser')
    CustomUser.objects.exclude(currency='NPR').update(currency='NPR')


class Migration(migrations.Migration):

    dependencies = [
        ('users', '0002_alter_customuser_email_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='customuser',
            name='category_savings_goals',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.RunPython(set_currency_to_npr, migrations.RunPython.noop),
    ]

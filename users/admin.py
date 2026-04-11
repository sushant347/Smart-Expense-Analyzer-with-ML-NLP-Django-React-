from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser

class CustomUserAdmin(UserAdmin):
    model = CustomUser
    list_display = ['username', 'email', 'monthly_income', 'savings_goal', 'currency', 'is_staff']
    fieldsets = UserAdmin.fieldsets + (
        ('Finance Profile', {'fields': ('monthly_income', 'savings_goal', 'currency')}),
    )

admin.site.register(CustomUser, CustomUserAdmin)

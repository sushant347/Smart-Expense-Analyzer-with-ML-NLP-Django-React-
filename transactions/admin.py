from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('date', 'description', 'amount', 'transaction_type', 'category', 'user')
    list_filter = ('transaction_type', 'category', 'source', 'date')
    search_fields = ('description', 'category')

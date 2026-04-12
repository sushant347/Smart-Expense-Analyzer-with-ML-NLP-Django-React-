from django.contrib import admin
from .models import ModelTrainingRun, Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('date', 'description', 'amount', 'transaction_type', 'category', 'user')
    list_filter = ('transaction_type', 'category', 'source', 'date')
    search_fields = ('description', 'category')


@admin.register(ModelTrainingRun)
class ModelTrainingRunAdmin(admin.ModelAdmin):
    list_display = ('user', 'version', 'trigger_source', 'corrected_samples', 'training_size', 'created_at')
    list_filter = ('trigger_source', 'created_at')
    search_fields = ('user__username', 'notes')

from django.db import models
from django.conf import settings

class Transaction(models.Model):
    TRANSACTION_TYPES = (
        ('CREDIT', 'Credit'),
        ('DEBIT', 'Debit'),
    )
    
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    date = models.DateField()
    description = models.TextField()
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=100, default='Other')
    source = models.CharField(max_length=50, default='MANUAL')
    confidence_score = models.FloatField(default=1.0)
    is_uncertain = models.BooleanField(default=False)
    is_manually_corrected = models.BooleanField(default=False)
    corrected_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.date} - {self.description} ({self.amount})"


class ModelTrainingRun(models.Model):
    TRIGGER_CHOICES = (
        ('MANUAL', 'Manual'),
        ('AUTO', 'Auto'),
        ('SCHEDULED', 'Scheduled'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='model_training_runs')
    version = models.PositiveIntegerField()
    trigger_source = models.CharField(max_length=15, choices=TRIGGER_CHOICES, default='MANUAL')
    corrected_samples = models.PositiveIntegerField(default=0)
    training_size = models.PositiveIntegerField(default=0)
    model_path = models.CharField(max_length=255, blank=True)
    notes = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        unique_together = ('user', 'version')

    def __str__(self):
        return f"{self.user.username} v{self.version} ({self.trigger_source})"

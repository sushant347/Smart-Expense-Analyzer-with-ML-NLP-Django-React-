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

    def __str__(self):
        return f"{self.date} - {self.description} ({self.amount})"

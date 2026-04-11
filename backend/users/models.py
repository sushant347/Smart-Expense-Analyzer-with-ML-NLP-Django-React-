from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    savings_goal = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency = models.CharField(max_length=10, default='NPR')

    def __str__(self):
        return self.username

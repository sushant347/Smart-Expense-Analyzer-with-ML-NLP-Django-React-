from django.urls import path
from .views import NextMonthPredictionView

urlpatterns = [
    path('next-month/', NextMonthPredictionView.as_view(), name='predictions-next-month'),
]

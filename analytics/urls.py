from django.urls import path
from .views import AnalyticsSummaryView, ExpenseForecastView

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('forecast/', ExpenseForecastView.as_view(), name='analytics-forecast'),
]

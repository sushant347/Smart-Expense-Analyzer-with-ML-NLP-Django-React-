from django.urls import path
from .views import AnalyticsSummaryView, ExpenseForecastView, MultiMonthComparisonView, RecurringExpensesView

urlpatterns = [
    path('summary/', AnalyticsSummaryView.as_view(), name='analytics-summary'),
    path('forecast/', ExpenseForecastView.as_view(), name='analytics-forecast'),
    path('comparison/', MultiMonthComparisonView.as_view(), name='analytics-comparison'),
    path('recurring/', RecurringExpensesView.as_view(), name='analytics-recurring'),
]

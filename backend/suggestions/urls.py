from django.urls import path
from .views import SuggestionSimulationView, SuggestionsView

urlpatterns = [
    path('', SuggestionsView.as_view(), name='suggestions-list'),
    path('simulate/', SuggestionSimulationView.as_view(), name='suggestions-simulate'),
]

from django.urls import path
from .views import SuggestionsView

urlpatterns = [
    path('', SuggestionsView.as_view(), name='suggestions-list'),
]

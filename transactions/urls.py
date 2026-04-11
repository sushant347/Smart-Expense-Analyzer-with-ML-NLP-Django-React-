from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CSVUploadView, MLRetrainView

router = DefaultRouter()
router.register(r'', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('upload/', CSVUploadView.as_view(), name='transaction-upload'),
    path('retrain/', MLRetrainView.as_view(), name='transaction-retrain'),
    path('', include(router.urls)),
]

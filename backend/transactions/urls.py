from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CSVUploadView, MLRetrainHistoryView, MLRetrainView, TransactionViewSet, WalletSyncView

router = DefaultRouter()
router.register(r'', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('upload/', CSVUploadView.as_view(), name='transaction-upload'),
    path('retrain/', MLRetrainView.as_view(), name='transaction-retrain'),
    path('retrain/history/', MLRetrainHistoryView.as_view(), name='transaction-retrain-history'),
    path('sync-wallet/', WalletSyncView.as_view(), name='transaction-sync-wallet'),
    path('', include(router.urls)),
]

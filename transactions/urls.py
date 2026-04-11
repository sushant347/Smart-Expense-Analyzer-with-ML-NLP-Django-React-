from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, CSVUploadView

router = DefaultRouter()
router.register(r'', TransactionViewSet, basename='transaction')

urlpatterns = [
    path('upload/', CSVUploadView.as_view(), name='transaction-upload'),
    path('', include(router.urls)),
]

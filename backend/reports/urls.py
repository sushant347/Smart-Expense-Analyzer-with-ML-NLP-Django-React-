from django.urls import path
from .views import PDFReportView

urlpatterns = [
    path('export/', PDFReportView.as_view(), name='report-export'),
]

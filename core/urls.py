from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path('admin/', admin.site.urls),
    # Auth
    path('api/auth/login/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # Apps
    path('api/transactions/', include('transactions.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/predictions/', include('predictions.urls')),
    path('api/reports/', include('reports.urls')),
    path('api/users/', include('users.urls')),
]

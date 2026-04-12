from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import CustomTokenObtainPairView, ProfileView, RegisterView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='user-register'),
    path('profile/', ProfileView.as_view(), name='user-profile'),
    path('auth/login/', CustomTokenObtainPairView.as_view(), name='user-token-obtain-pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='user-token-refresh'),
]

import pytest
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_test_user():
    def make_user(username='testuser', email='test@demo.com', password='password123'):
        return User.objects.create_user(username=username, email=email, password=password)
    return make_user

@pytest.fixture
def auth_client(api_client, create_test_user):
    user = create_test_user()
    api_client.force_authenticate(user=user)
    return api_client, user

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from users.models import CustomUser


class AuthFlowTests(APITestCase):
	def test_register_login_and_profile_flow(self):
		register_payload = {
			'username': 'testuser',
			'email': 'testuser@example.com',
			'password': 'StrongPass123!',
			'monthly_income': '50000.00',
			'savings_goal': '10000.00',
			'currency': 'NPR',
		}
		register_response = self.client.post(reverse('user-register'), register_payload, format='json')
		self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
		self.assertTrue(CustomUser.objects.filter(username='testuser').exists())

		login_response = self.client.post(
			reverse('token_obtain_pair'),
			{'username': 'testuser', 'password': 'StrongPass123!'},
			format='json',
		)
		self.assertEqual(login_response.status_code, status.HTTP_200_OK)
		self.assertIn('access', login_response.data)
		self.assertIn('refresh', login_response.data)
		self.assertIn('user', login_response.data)

		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}")
		profile_response = self.client.get(reverse('user-profile'))
		self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
		self.assertEqual(profile_response.data['username'], 'testuser')

		patch_response = self.client.patch(
			reverse('user-profile'),
			{'monthly_income': '65000.00'},
			format='json',
		)
		self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
		self.assertEqual(str(patch_response.data['monthly_income']), '65000.00')

	def test_profile_requires_auth(self):
		response = self.client.get(reverse('user-profile'))
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

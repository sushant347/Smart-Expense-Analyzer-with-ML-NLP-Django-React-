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
		login_payload = login_response.data.get('data', login_response.data)
		self.assertIn('access', login_payload)
		self.assertIn('refresh', login_payload)
		self.assertIn('user', login_payload)

		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login_payload['access']}")
		profile_response = self.client.get(reverse('user-profile'))
		self.assertEqual(profile_response.status_code, status.HTTP_200_OK)
		profile_payload = profile_response.data.get('data', profile_response.data)
		self.assertEqual(profile_payload['username'], 'testuser')

		patch_response = self.client.patch(
			reverse('user-profile'),
			{
				'monthly_income': '65000.00',
				'currency': 'USD',
				'category_savings_goals': {
					'Food': 12000,
					'Transport': 5000,
				},
			},
			format='json',
		)
		self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
		patch_payload = patch_response.data.get('data', patch_response.data)
		self.assertEqual(str(patch_payload['monthly_income']), '65000.00')
		self.assertEqual(patch_payload['currency'], 'NPR')
		self.assertEqual(patch_payload['category_savings_goals']['Food'], 12000.0)
		self.assertEqual(patch_payload['category_savings_goals']['Transport'], 5000.0)

	def test_profile_requires_auth(self):
		response = self.client.get(reverse('user-profile'))
		self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

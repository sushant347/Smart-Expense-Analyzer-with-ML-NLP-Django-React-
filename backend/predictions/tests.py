from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Transaction
from users.models import CustomUser


class PredictionAPITests(APITestCase):
	def setUp(self):
		self.user = CustomUser.objects.create_user(
			username='pred_user',
			email='pred@example.com',
			password='StrongPass123!',
		)
		login = self.client.post(
			reverse('token_obtain_pair'),
			{'username': 'pred_user', 'password': 'StrongPass123!'},
			format='json',
		)
		token_payload = login.data.get('data', login.data)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_payload['access']}")

		for day in range(1, 16):
			Transaction.objects.create(
				user=self.user,
				date=f'2026-03-{day:02d}',
				description=f'Food spend {day}',
				amount='100.00',
				transaction_type='DEBIT',
				category='Food',
				source='MANUAL',
			)

		for day in range(1, 6):
			Transaction.objects.create(
				user=self.user,
				date=f'2026-04-{day:02d}',
				description=f'Actual food {day}',
				amount='120.00',
				transaction_type='DEBIT',
				category='Food',
				source='MANUAL',
			)

	def test_prediction_payload_contains_predicted_vs_actual(self):
		response = self.client.get(reverse('predictions-next-month'), {'year': 2026, 'month': 4})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		payload = response.data.get('data', response.data)
		self.assertIn('predictions', payload)
		self.assertIn('total_projected', payload)
		self.assertIn('total_actual', payload)
		self.assertIn('gap', payload)
		self.assertGreaterEqual(payload['total_projected'], 0)

	def test_prediction_query_requires_both_year_and_month(self):
		response = self.client.get(reverse('predictions-next-month'), {'year': 2026})
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

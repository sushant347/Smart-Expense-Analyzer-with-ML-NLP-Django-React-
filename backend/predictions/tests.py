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
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

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
		self.assertIn('predictions', response.data)
		self.assertIn('total_projected', response.data)
		self.assertIn('total_actual', response.data)
		self.assertIn('gap', response.data)
		self.assertGreaterEqual(response.data['total_projected'], 0)

	def test_prediction_query_requires_both_year_and_month(self):
		response = self.client.get(reverse('predictions-next-month'), {'year': 2026})
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

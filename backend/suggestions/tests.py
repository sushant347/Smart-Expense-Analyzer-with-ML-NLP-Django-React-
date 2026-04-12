from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Transaction
from users.models import CustomUser


class SuggestionsAPITests(APITestCase):
	def setUp(self):
		self.user = CustomUser.objects.create_user(
			username='suggest_user',
			email='suggest@example.com',
			password='StrongPass123!',
			monthly_income='50000.00',
			savings_goal='200000.00',
		)
		login = self.client.post(
			reverse('token_obtain_pair'),
			{'username': 'suggest_user', 'password': 'StrongPass123!'},
			format='json',
		)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

		Transaction.objects.bulk_create(
			[
				Transaction(
					user=self.user,
					date='2026-04-01',
					description='Mall',
					amount='6000.00',
					transaction_type='DEBIT',
					category='Shopping',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-04-02',
					description='Restaurant',
					amount='4000.00',
					transaction_type='DEBIT',
					category='Food',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-04-03',
					description='Rent',
					amount='15000.00',
					transaction_type='DEBIT',
					category='Rent',
					source='MANUAL',
				),
			]
		)

	def test_suggestions_payload_contains_budget_and_tips(self):
		response = self.client.get(reverse('suggestions-list'))
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('budget_actual', response.data)
		self.assertIn('budget_recommended', response.data)
		self.assertIn('tips', response.data)

	def test_simulation_endpoint_returns_save_projection(self):
		response = self.client.post(
			reverse('suggestions-simulate'),
			{'category': 'Shopping', 'reduce_percent': 25},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response.data['category'], 'Shopping')
		self.assertGreater(response.data['monthly_extra_saving'], 0)

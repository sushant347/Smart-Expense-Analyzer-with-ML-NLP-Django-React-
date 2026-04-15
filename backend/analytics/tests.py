from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Transaction
from users.models import CustomUser


class AnalyticsAPITests(APITestCase):
	def setUp(self):
		self.user = CustomUser.objects.create_user(
			username='analytics_user',
			email='analytics@example.com',
			password='StrongPass123!',
			monthly_income='10000.00',
		)
		login = self.client.post(
			reverse('token_obtain_pair'),
			{'username': 'analytics_user', 'password': 'StrongPass123!'},
			format='json',
		)
		token_payload = login.data.get('data', login.data)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_payload['access']}")

		Transaction.objects.bulk_create(
			[
				Transaction(
					user=self.user,
					date='2026-02-05',
					description='Room Rent',
					amount='15000.00',
					transaction_type='DEBIT',
					category='Rent',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-03-05',
					description='Room Rent',
					amount='15000.00',
					transaction_type='DEBIT',
					category='Rent',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-01-05',
					description='Room Rent',
					amount='15000.00',
					transaction_type='DEBIT',
					category='Rent',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-04-01',
					description='Groceries',
					amount='1000.00',
					transaction_type='DEBIT',
					category='Food',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-04-03',
					description='Mall shopping',
					amount='2500.00',
					transaction_type='DEBIT',
					category='Shopping',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-04-10',
					description='Movie',
					amount='1000.00',
					transaction_type='DEBIT',
					category='Entertainment',
					source='MANUAL',
				),
				Transaction(
					user=self.user,
					date='2026-04-11',
					description='Salary',
					amount='12000.00',
					transaction_type='CREDIT',
					category='Other',
					source='MANUAL',
				),
			]
		)

	def test_summary_includes_required_dashboard_metrics(self):
		response = self.client.get(reverse('analytics-summary'), {'year': 2026, 'month': 4})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		payload = response.data.get('data', response.data)

		self.assertIn('monthly_category_breakdown', payload)
		self.assertIn('weekly_trends', payload)
		self.assertIn('top_categories', payload)
		self.assertIn('savings_rate', payload)

		self.assertEqual(payload['total_expense'], 4500.0)
		self.assertTrue(payload['bad_habit_detected'])
		self.assertGreater(payload['non_essential_ratio'], 30)

	def test_forecast_returns_prediction_payload(self):
		response = self.client.get(reverse('analytics-forecast'))
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		payload = response.data.get('data', response.data)
		self.assertIn('projected_next_month', payload)
		self.assertIn('data_points_used', payload)

	def test_summary_falls_back_to_profile_income_when_no_credit_rows(self):
		Transaction.objects.filter(user=self.user, transaction_type='CREDIT').delete()

		response = self.client.get(reverse('analytics-summary'), {'year': 2026, 'month': 4})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		payload = response.data.get('data', response.data)
		self.assertEqual(payload['recorded_income'], 0.0)
		self.assertEqual(payload['profile_income'], 10000.0)
		self.assertEqual(payload['total_income'], 10000.0)
		self.assertEqual(payload['income_mode'], 'profile')

	def test_comparison_endpoint_returns_multi_month_series(self):
		response = self.client.get(reverse('analytics-comparison'), {'year': 2026, 'month': 4, 'span': 4})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		payload = response.data.get('data', response.data)
		self.assertEqual(payload['span'], 4)
		self.assertEqual(len(payload['series']), 4)
		self.assertEqual(payload['series'][-1]['label'], '2026-04')

	def test_recurring_endpoint_detects_repeated_expense(self):
		response = self.client.get(reverse('analytics-recurring'), {'months': 6, 'min_occurrences': 3})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		payload = response.data.get('data', response.data)
		self.assertGreaterEqual(payload['count'], 1)
		descriptions = [item['description'] for item in payload['recurring_expenses']]
		self.assertIn('Room Rent', descriptions)

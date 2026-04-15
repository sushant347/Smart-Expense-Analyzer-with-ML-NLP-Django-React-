from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Transaction
from users.models import CustomUser


class ReportsAPITests(APITestCase):
	def setUp(self):
		self.user = CustomUser.objects.create_user(
			username='report_user',
			email='report@example.com',
			password='StrongPass123!',
		)
		login = self.client.post(
			reverse('token_obtain_pair'),
			{'username': 'report_user', 'password': 'StrongPass123!'},
			format='json',
		)
		token_payload = login.data.get('data', login.data)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {token_payload['access']}")

		Transaction.objects.create(
			user=self.user,
			date='2026-04-01',
			description='Salary',
			amount='50000.00',
			transaction_type='CREDIT',
			category='Other',
			source='MANUAL',
		)
		Transaction.objects.create(
			user=self.user,
			date='2026-04-03',
			description='Groceries',
			amount='3000.00',
			transaction_type='DEBIT',
			category='Food',
			source='MANUAL',
		)

	def test_export_returns_pdf(self):
		response = self.client.get(reverse('report-export'), {'year': 2026, 'month': 4})
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertEqual(response['Content-Type'], 'application/pdf')
		self.assertIn('attachment; filename="kharchi_report_2026_04.pdf"', response['Content-Disposition'])
		self.assertGreater(len(response.content), 0)

	def test_invalid_month_returns_400(self):
		response = self.client.get(reverse('report-export'), {'year': 2026, 'month': 13})
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

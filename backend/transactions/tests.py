from io import StringIO

import pandas as pd
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from transactions.models import Transaction
from transactions.parsers import BANK, ESEWA, KHALTI, detect_csv_source, parse_transactions_frame
from users.models import CustomUser


class CSVParserTests(APITestCase):
	def test_detect_csv_source_variants(self):
		self.assertEqual(detect_csv_source(['Txn Date', 'Particulars', 'Withdrawal']), BANK)
		self.assertEqual(detect_csv_source(['Date', 'Service', 'Txn ID', 'Amount']), KHALTI)
		self.assertEqual(detect_csv_source(['eSewa Txn', 'Paid To', 'Amount']), ESEWA)

	def test_parse_bank_frame(self):
		frame = pd.DataFrame(
			{
				'Txn Date': ['2026-04-01', '2026-04-02'],
				'Particulars': ['Taxi', 'Salary'],
				'Withdrawal': ['500', '0'],
				'Deposit': ['0', '50000'],
			}
		)
		source, rows = parse_transactions_frame(frame)
		self.assertEqual(source, BANK)
		self.assertEqual(len(rows), 2)
		self.assertEqual(rows[0]['transaction_type'], 'DEBIT')
		self.assertEqual(rows[1]['transaction_type'], 'CREDIT')


class CSVUploadTests(APITestCase):
	def setUp(self):
		self.user = CustomUser.objects.create_user(
			username='csvuser',
			email='csvuser@example.com',
			password='StrongPass123!',
		)
		login = self.client.post(
			reverse('token_obtain_pair'),
			{'username': 'csvuser', 'password': 'StrongPass123!'},
			format='json',
		)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

	def test_upload_csv_creates_user_transactions(self):
		csv_data = StringIO(
			'Txn Date,Particulars,Withdrawal,Deposit\n'
			'2026-04-01,Pathao,450,0\n'
			'2026-04-02,Office Salary,0,50000\n'
		)
		csv_data.name = 'bank.csv'

		response = self.client.post(reverse('transaction-upload'), {'file': csv_data}, format='multipart')
		self.assertEqual(response.status_code, status.HTTP_201_CREATED)
		self.assertEqual(response.data['source'], BANK)
		self.assertEqual(Transaction.objects.filter(user=self.user).count(), 2)


class TransactionAPITests(APITestCase):
	def setUp(self):
		self.user = CustomUser.objects.create_user(
			username='apiuser',
			email='apiuser@example.com',
			password='StrongPass123!',
		)
		self.other_user = CustomUser.objects.create_user(
			username='otheruser',
			email='otheruser@example.com',
			password='StrongPass123!',
		)
		login = self.client.post(
			reverse('token_obtain_pair'),
			{'username': 'apiuser', 'password': 'StrongPass123!'},
			format='json',
		)
		self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {login.data['access']}")

	def test_manual_create_and_filter_by_category(self):
		payload_1 = {
			'date': '2026-04-10',
			'description': 'Groceries',
			'amount': '1200.00',
			'transaction_type': 'DEBIT',
			'category': 'Food',
			'source': 'MANUAL',
		}
		payload_2 = {
			'date': '2026-04-11',
			'description': 'Taxi',
			'amount': '400.00',
			'transaction_type': 'DEBIT',
			'category': 'Transport',
			'source': 'MANUAL',
		}

		create_1 = self.client.post(reverse('transaction-list'), payload_1, format='json')
		create_2 = self.client.post(reverse('transaction-list'), payload_2, format='json')

		self.assertEqual(create_1.status_code, status.HTTP_201_CREATED)
		self.assertEqual(create_2.status_code, status.HTTP_201_CREATED)

		Transaction.objects.create(
			user=self.other_user,
			date='2026-04-12',
			description='Other User Spending',
			amount='500.00',
			transaction_type='DEBIT',
			category='Food',
			source='MANUAL',
		)

		filtered = self.client.get(reverse('transaction-list'), {'category': 'Food'})
		self.assertEqual(filtered.status_code, status.HTTP_200_OK)
		self.assertEqual(len(filtered.data), 1)
		self.assertEqual(filtered.data[0]['description'], 'Groceries')

	def test_reject_invalid_amount(self):
		response = self.client.post(
			reverse('transaction-list'),
			{
				'date': '2026-04-10',
				'description': 'Invalid row',
				'amount': '0',
				'transaction_type': 'DEBIT',
				'category': 'Other',
				'source': 'MANUAL',
			},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
		self.assertIn('amount', response.data)

	def test_category_correction_marks_transaction_as_confident(self):
		txn = Transaction.objects.create(
			user=self.user,
			date='2026-04-10',
			description='Unknown charge',
			amount='900.00',
			transaction_type='DEBIT',
			category='Other',
			confidence_score=0.22,
			is_uncertain=True,
			source='CSV_BANK',
		)
		response = self.client.post(
			reverse('transaction-correct-category', kwargs={'pk': txn.id}),
			{'category': 'Food'},
			format='json',
		)
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		txn.refresh_from_db()
		self.assertEqual(txn.category, 'Food')
		self.assertEqual(txn.confidence_score, 1.0)
		self.assertFalse(txn.is_uncertain)
		self.assertTrue(txn.is_manually_corrected)

	def test_retrain_endpoint_with_no_manual_corrections(self):
		response = self.client.post(reverse('transaction-retrain'), {}, format='json')
		self.assertEqual(response.status_code, status.HTTP_200_OK)
		self.assertIn('Retraining skipped', response.data['message'])

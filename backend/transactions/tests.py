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

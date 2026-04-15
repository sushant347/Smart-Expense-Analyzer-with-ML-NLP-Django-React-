import pytest
from django.urls import reverse
from transactions.models import Transaction
from datetime import date

pytestmark = pytest.mark.django_db

def test_create_transaction(auth_client):
    client, user = auth_client
    
    payload = {
        "date": "2023-10-01",
        "description": "Grocery shopping at Walmart",
        "amount": "150.50",
        "transaction_type": "DEBIT",
    }
    
    url = reverse('transaction-list')
    response = client.post(url, payload, format='json')
    
    assert response.status_code == 201
    data = response.data
    assert data['description'] == "Grocery shopping at Walmart"
    
    # Test Auto-Categorization ML (Testing Phase 2 integration)
    assert 'category' in data
    assert data['source'] == 'MANUAL'
    
    assert Transaction.objects.count() == 1

def test_fetch_transactions(auth_client):
    client, user = auth_client
    
    Transaction.objects.create(
        user=user,
        date=date(2023, 10, 1),
        description="Salary",
        amount=5000.00,
        transaction_type="CREDIT",
        category="Income",
        source="MANUAL"
    )
    
    url = reverse('transaction-list')
    response = client.get(url)
    
    assert response.status_code == 200
    data = response.data
    assert 'results' in data
    assert len(data['results']) == 1
    assert data['results'][0]['description'] == "Salary"

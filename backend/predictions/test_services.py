from datetime import date

import pytest

from predictions.services import build_month_prediction
from transactions.models import Transaction

pytestmark = pytest.mark.django_db


def test_build_month_prediction_returns_empty_payload_without_history(create_test_user):
    user = create_test_user(username='pred_edge_empty', email='pred_edge_empty@example.com')

    payload = build_month_prediction(user=user, year=2026, month=4)

    assert payload['target_year'] == 2026
    assert payload['target_month'] == 4
    assert payload['predictions'] == []
    assert payload['total_projected'] == 0.0
    assert payload['total_actual'] == 0.0
    assert payload['gap'] == 0.0
    assert 'Not enough history' in payload['message']


def test_build_month_prediction_rejects_invalid_month(create_test_user):
    user = create_test_user(username='pred_edge_month', email='pred_edge_month@example.com')

    with pytest.raises(ValueError, match='Month must be between 1 and 12'):
        build_month_prediction(user=user, year=2026, month=13)


def test_build_month_prediction_calculates_category_projection_and_gap(create_test_user):
    user = create_test_user(username='pred_edge_gap', email='pred_edge_gap@example.com')

    # Historical data (before target month)
    for day in [1, 8, 15]:
        Transaction.objects.create(
            user=user,
            date=date(2026, 3, day),
            description=f'Food tx {day}',
            amount='100.00',
            transaction_type='DEBIT',
            category='Food',
            source='MANUAL',
        )

    for day in [2, 10, 20]:
        Transaction.objects.create(
            user=user,
            date=date(2026, 3, day),
            description=f'Rent tx {day}',
            amount='200.00',
            transaction_type='DEBIT',
            category='Rent',
            source='MANUAL',
        )

    # Actual data in target month
    Transaction.objects.create(
        user=user,
        date=date(2026, 4, 3),
        description='Food actual',
        amount='150.00',
        transaction_type='DEBIT',
        category='Food',
        source='MANUAL',
    )

    payload = build_month_prediction(user=user, year=2026, month=4)
    by_category = {row['category']: row for row in payload['predictions']}

    assert by_category['Food']['actual_amount'] == 150.0
    assert by_category['Food']['data_points'] == 3
    assert 0.0 < by_category['Food']['projected_amount'] < 1500.0

    assert by_category['Rent']['actual_amount'] == 0.0
    assert by_category['Rent']['data_points'] == 3
    assert by_category['Food']['projected_amount'] < by_category['Rent']['projected_amount'] < 3000.0

    assert payload['total_projected'] == round(
        by_category['Food']['projected_amount'] + by_category['Rent']['projected_amount'],
        2,
    )
    assert payload['total_actual'] == 150.0
    assert payload['gap'] == round(payload['total_projected'] - payload['total_actual'], 2)
    assert payload['gap_vs_target_actual'] == payload['gap']
    assert payload['months_of_data'] == 1

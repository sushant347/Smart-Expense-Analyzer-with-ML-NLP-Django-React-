from datetime import date

import pytest

from suggestions.services import build_suggestions, simulate_reduction
from transactions.models import Transaction

pytestmark = pytest.mark.django_db


def test_simulate_reduction_clamps_percent_and_improves_goal_timeline(create_test_user):
    user = create_test_user(username='suggest_edge_clamp', email='suggest_edge_clamp@example.com')
    user.monthly_income = '50000.00'
    user.savings_goal = '100000.00'
    user.save(update_fields=['monthly_income', 'savings_goal'])

    Transaction.objects.create(
        user=user,
        date=date.today(),
        description='Shopping burst',
        amount='40000.00',
        transaction_type='DEBIT',
        category='Shopping',
        source='MANUAL',
    )

    payload = simulate_reduction(user=user, reduce_percent=150, category='Shopping')

    assert payload['reduce_percent'] == 100.0
    assert payload['current_monthly_savings'] == 10000.0
    assert payload['monthly_extra_saving'] == 40000.0
    assert payload['projected_monthly_savings'] == 50000.0
    assert payload['months_to_goal_current'] == 10.0
    assert payload['months_to_goal_projected'] == 2.0


def test_simulate_reduction_handles_zero_baseline_savings(create_test_user):
    user = create_test_user(username='suggest_edge_zero', email='suggest_edge_zero@example.com')
    user.monthly_income = '20000.00'
    user.savings_goal = '60000.00'
    user.save(update_fields=['monthly_income', 'savings_goal'])

    Transaction.objects.create(
        user=user,
        date=date.today(),
        description='Food overspend',
        amount='22000.00',
        transaction_type='DEBIT',
        category='Food',
        source='MANUAL',
    )

    payload = simulate_reduction(user=user, reduce_percent=10, category='Food')

    assert payload['current_monthly_savings'] == 0.0
    assert payload['months_to_goal_current'] is None
    assert payload['monthly_extra_saving'] == 2200.0
    assert payload['months_to_goal_projected'] == round(60000.0 / 2200.0, 2)


def test_build_suggestions_handles_zero_income_without_crashing(create_test_user):
    user = create_test_user(username='suggest_edge_income', email='suggest_edge_income@example.com')
    user.monthly_income = '0.00'
    user.savings_goal = '0.00'
    user.save(update_fields=['monthly_income', 'savings_goal'])

    Transaction.objects.create(
        user=user,
        date=date.today(),
        description='Groceries',
        amount='5000.00',
        transaction_type='DEBIT',
        category='Food',
        source='MANUAL',
    )

    payload = build_suggestions(user=user)

    assert payload['budget_recommended'] == {
        'needs': 0.0,
        'wants': 0.0,
        'savings': 0.0,
    }
    assert payload['budget_actual']['wants'] == 5000.0
    assert payload['monthly_income'] == 0.0
    assert payload['non_essential_ratio'] == 100.0


def test_build_suggestions_includes_category_goal_progress_and_notifications(create_test_user):
    user = create_test_user(username='suggest_goal_notify', email='suggest_goal_notify@example.com')
    user.monthly_income = '60000.00'
    user.savings_goal = '20000.00'
    user.category_savings_goals = {
        'Food': 6000,
        'Transport': 2500,
    }
    user.save(update_fields=['monthly_income', 'savings_goal', 'category_savings_goals'])

    Transaction.objects.create(
        user=user,
        date=date.today(),
        description='Food overspend',
        amount='7000.00',
        transaction_type='DEBIT',
        category='Food',
        source='MANUAL',
    )
    Transaction.objects.create(
        user=user,
        date=date.today(),
        description='Transport spending',
        amount='2300.00',
        transaction_type='DEBIT',
        category='Transport',
        source='MANUAL',
    )

    payload = build_suggestions(user=user)

    progress = {row['category']: row for row in payload['category_goal_progress']}
    assert progress['Food']['status'] == 'exceeded'
    assert progress['Transport']['status'] == 'reached'

    titles = [row.get('title') for row in payload['notifications']]
    assert 'Food goal exceeded' in titles
    assert 'Transport goal reached' in titles
    assert 'Savings goal reached' in titles


def test_build_suggestions_emits_high_expense_notification_when_spending_is_near_income(create_test_user):
    user = create_test_user(username='suggest_high_expense', email='suggest_high_expense@example.com')
    user.monthly_income = '10000.00'
    user.savings_goal = '0.00'
    user.save(update_fields=['monthly_income', 'savings_goal'])

    Transaction.objects.create(
        user=user,
        date=date.today(),
        description='Rent payment',
        amount='9200.00',
        transaction_type='DEBIT',
        category='Rent',
        source='MANUAL',
    )

    payload = build_suggestions(user=user)
    titles = [row.get('title') for row in payload['notifications']]

    assert 'High expense alert' in titles

from __future__ import annotations

from calendar import monthrange
from datetime import date
from pathlib import Path
import sys

from django.db.models import Sum
from django.db.models.functions import TruncWeek

from transactions.models import Transaction

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from ml.predictor import ExpensePredictor

NON_ESSENTIAL_CATEGORIES = {'Shopping', 'Entertainment', 'Other'}


def get_month_bounds(year: int, month: int) -> tuple[date, date]:
    if month < 1 or month > 12:
        raise ValueError('Month must be between 1 and 12.')
    return date(year, month, 1), date(year, month, monthrange(year, month)[1])


def build_analytics_summary(user, year: int, month: int) -> dict:
    start_date, end_date = get_month_bounds(year, month)

    month_txns = Transaction.objects.filter(user=user, date__gte=start_date, date__lte=end_date)
    debit_txns = month_txns.filter(transaction_type='DEBIT')
    credit_txns = month_txns.filter(transaction_type='CREDIT')

    total_expense = float(debit_txns.aggregate(total=Sum('amount'))['total'] or 0)
    recorded_income = float(credit_txns.aggregate(total=Sum('amount'))['total'] or 0)
    profile_income = float(user.monthly_income or 0)

    if recorded_income > 0:
        total_income = recorded_income
        income_mode = 'transactions'
    elif profile_income > 0:
        total_income = profile_income
        income_mode = 'profile'
    else:
        total_income = 0.0
        income_mode = 'none'

    base_income = total_income

    category_breakdown_qs = (
        debit_txns.values('category').annotate(total=Sum('amount')).order_by('-total')
    )
    monthly_category_breakdown = [
        {'category': row['category'], 'total': float(row['total'])} for row in category_breakdown_qs
    ]

    weekly_trends_qs = (
        debit_txns.annotate(week=TruncWeek('date'))
        .values('week')
        .annotate(total=Sum('amount'))
        .order_by('week')
    )
    weekly_trends = [
        {
            'week_start': row['week'].date().isoformat() if hasattr(row['week'], 'date') else str(row['week']),
            'amount': float(row['total']),
        }
        for row in weekly_trends_qs
    ]

    non_essential_total = sum(
        row['total'] for row in monthly_category_breakdown if row['category'] in NON_ESSENTIAL_CATEGORIES
    )
    non_essential_ratio = round((non_essential_total / total_expense) * 100, 2) if total_expense > 0 else 0.0
    bad_habit_detected = non_essential_ratio > 30

    bad_habits = []
    if bad_habit_detected:
        bad_habits.append(
            f'Non-essential spending is {non_essential_ratio}% of monthly expenses. Consider reducing Shopping/Entertainment.'
        )

    savings_rate = 0.0
    if base_income > 0:
        savings_rate = round(((base_income - total_expense) / base_income) * 100, 2)

    return {
        'year': year,
        'month': month,
        'total_expense': total_expense,
        'total_income': total_income,
        'recorded_income': recorded_income,
        'profile_income': profile_income,
        'income_mode': income_mode,
        'savings_rate': savings_rate,
        'monthly_category_breakdown': monthly_category_breakdown,
        'top_categories': monthly_category_breakdown[:5],
        'weekly_trends': weekly_trends,
        'non_essential_ratio': non_essential_ratio,
        'bad_habit_detected': bad_habit_detected,
        'bad_habits': bad_habits,
    }


def build_expense_forecast(user) -> dict:
    history = (
        Transaction.objects.filter(user=user, transaction_type='DEBIT')
        .values('date')
        .annotate(total=Sum('amount'))
        .order_by('date')
    )

    daily_expenses = [{'date': row['date'], 'total': float(row['total'])} for row in history]

    predictor = ExpensePredictor()
    projected = predictor.predict_next_month(daily_expenses)

    return {
        'projected_next_month': projected,
        'data_points_used': len(daily_expenses),
    }

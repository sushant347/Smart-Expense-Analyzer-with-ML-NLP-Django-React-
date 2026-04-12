from __future__ import annotations

from calendar import monthrange
from datetime import date, timedelta
from pathlib import Path
from statistics import median
import sys
from collections import defaultdict

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


def _shift_month(year: int, month: int, offset: int) -> tuple[int, int]:
    # offset can be negative/positive; convert to absolute month index for safe rollover
    absolute = (year * 12 + (month - 1)) + offset
    return absolute // 12, (absolute % 12) + 1


def _normalize_description(text: str) -> str:
    return ' '.join((text or '').strip().lower().split())


def _estimated_monthly_impact(avg_amount: float, interval_days: float) -> float:
    if interval_days <= 0:
        return avg_amount
    if interval_days <= 9:
        return avg_amount * 4
    if interval_days <= 18:
        return avg_amount * 2
    return avg_amount


def _cadence_from_interval(interval_days: float) -> str:
    if interval_days <= 9:
        return 'weekly'
    if interval_days <= 18:
        return 'biweekly'
    if interval_days <= 40:
        return 'monthly'
    return 'irregular'


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


def build_multi_month_comparison(user, year: int, month: int, span: int = 6) -> dict:
    span = max(2, min(span, 12))
    profile_income = float(user.monthly_income or 0)

    series = []
    previous_expense = None

    for offset in range(-(span - 1), 1):
        y, m = _shift_month(year, month, offset)
        start_date, end_date = get_month_bounds(y, m)

        month_txns = Transaction.objects.filter(user=user, date__gte=start_date, date__lte=end_date)
        debit_total = float(month_txns.filter(transaction_type='DEBIT').aggregate(total=Sum('amount'))['total'] or 0)
        credit_total = float(month_txns.filter(transaction_type='CREDIT').aggregate(total=Sum('amount'))['total'] or 0)

        effective_income = credit_total if credit_total > 0 else profile_income
        savings = effective_income - debit_total
        savings_rate = round((savings / effective_income) * 100, 2) if effective_income > 0 else 0.0

        expense_change_pct = None
        if previous_expense is not None and previous_expense > 0:
            expense_change_pct = round(((debit_total - previous_expense) / previous_expense) * 100, 2)

        series.append(
            {
                'year': y,
                'month': m,
                'label': f'{y}-{str(m).zfill(2)}',
                'expense': debit_total,
                'income': effective_income,
                'recorded_income': credit_total,
                'savings': savings,
                'savings_rate': savings_rate,
                'expense_change_pct': expense_change_pct,
            }
        )

        previous_expense = debit_total

    return {
        'span': span,
        'series': series,
    }


def build_recurring_expenses(user, months: int = 6, min_occurrences: int = 3) -> dict:
    months = max(2, min(months, 12))
    min_occurrences = max(2, min(min_occurrences, 10))

    today = date.today()
    start_year, start_month = _shift_month(today.year, today.month, -(months - 1))
    start_date = date(start_year, start_month, 1)

    txns = (
        Transaction.objects.filter(
            user=user,
            transaction_type='DEBIT',
            date__gte=start_date,
            date__lte=today,
        )
        .order_by('date')
        .values('description', 'date', 'amount', 'category')
    )

    grouped = defaultdict(list)
    for txn in txns:
        key = _normalize_description(txn['description'])
        if not key:
            continue
        grouped[key].append(txn)

    recurring_items = []

    for _, entries in grouped.items():
        if len(entries) < min_occurrences:
            continue

        month_keys = {(item['date'].year, item['date'].month) for item in entries}
        if len(month_keys) < 2:
            continue

        amounts = [float(item['amount']) for item in entries]
        dates = [item['date'] for item in entries]
        date_deltas = [
            (dates[idx] - dates[idx - 1]).days
            for idx in range(1, len(dates))
            if (dates[idx] - dates[idx - 1]).days > 0
        ]

        typical_interval = float(median(date_deltas)) if date_deltas else 30.0
        cadence = _cadence_from_interval(typical_interval)
        predicted_next = dates[-1] + timedelta(days=max(1, int(round(typical_interval))))
        predicted_impact = round(_estimated_monthly_impact(sum(amounts) / len(amounts), typical_interval), 2)

        confidence = min(95, int(45 + len(entries) * 6 + min(len(month_keys), 6) * 4))

        recurring_items.append(
            {
                'description': entries[0]['description'],
                'category': entries[0]['category'],
                'occurrences': len(entries),
                'avg_amount': round(sum(amounts) / len(amounts), 2),
                'last_amount': round(amounts[-1], 2),
                'first_seen': dates[0].isoformat(),
                'last_seen': dates[-1].isoformat(),
                'estimated_next_date': predicted_next.isoformat(),
                'cadence': cadence,
                'predicted_monthly_impact': predicted_impact,
                'confidence': confidence,
            }
        )

    recurring_items.sort(key=lambda item: item['predicted_monthly_impact'], reverse=True)

    return {
        'months_analyzed': months,
        'min_occurrences': min_occurrences,
        'recurring_expenses': recurring_items,
        'count': len(recurring_items),
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

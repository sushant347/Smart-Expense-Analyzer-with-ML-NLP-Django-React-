from __future__ import annotations

from calendar import monthrange
from datetime import date
from pathlib import Path
import sys

from django.db.models import Sum

from transactions.models import Transaction

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from ml.predictor import ExpensePredictor


def _month_bounds(year: int, month: int) -> tuple[date, date]:
    if month < 1 or month > 12:
        raise ValueError('Month must be between 1 and 12.')
    start = date(year, month, 1)
    end = date(year, month, monthrange(year, month)[1])
    return start, end


def _resolve_target(year: int | None, month: int | None) -> tuple[int, int]:
    if year is not None and month is not None:
        return year, month

    today = date.today()
    if today.month == 12:
        return today.year + 1, 1
    return today.year, today.month + 1


def build_month_prediction(user, year: int | None = None, month: int | None = None) -> dict:
    target_year, target_month = _resolve_target(year, month)
    target_start, target_end = _month_bounds(target_year, target_month)

    history = (
        Transaction.objects.filter(user=user, transaction_type='DEBIT', date__lt=target_start)
        .values('date', 'category')
        .annotate(total=Sum('amount'))
        .order_by('date')
    )

    if not history:
        return {
            'target_year': target_year,
            'target_month': target_month,
            'message': 'Not enough history for prediction.',
            'predictions': [],
            'total_projected': 0.0,
            'total_actual': 0.0,
            'gap': 0.0,
        }

    actual_qs = (
        Transaction.objects.filter(
            user=user,
            transaction_type='DEBIT',
            date__gte=target_start,
            date__lte=target_end,
        )
        .values('category')
        .annotate(total=Sum('amount'))
    )
    actual_by_category = {row['category']: float(row['total']) for row in actual_qs}

    categories = sorted({row['category'] for row in history})
    predictor = ExpensePredictor()
    predictions = []

    for category in categories:
        category_data = [
            {'date': row['date'], 'total': float(row['total'])}
            for row in history
            if row['category'] == category
        ]
        projected_amount = predictor.predict_next_month(category_data)
        actual_amount = actual_by_category.get(category, 0.0)

        predictions.append(
            {
                'category': category,
                'projected_amount': round(float(projected_amount), 2),
                'actual_amount': round(float(actual_amount), 2),
                'data_points': len(category_data),
            }
        )

    predictions.sort(key=lambda row: row['projected_amount'], reverse=True)

    total_projected = round(sum(row['projected_amount'] for row in predictions), 2)
    total_actual = round(sum(actual_by_category.values()), 2)

    return {
        'target_year': target_year,
        'target_month': target_month,
        'predictions': predictions,
        'total_projected': total_projected,
        'total_actual': total_actual,
        'gap': round(total_projected - total_actual, 2),
        'months_of_data': 6,
    }

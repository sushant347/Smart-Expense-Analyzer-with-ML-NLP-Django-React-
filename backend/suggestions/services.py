from __future__ import annotations

from calendar import monthrange
from datetime import date

from django.db.models import Sum

from transactions.models import Transaction

NEEDS_CATEGORIES = {'Rent', 'Health', 'Education', 'Transport', 'Transfer'}
WANTS_CATEGORIES = {'Shopping', 'Entertainment', 'Food'}


def current_month_bounds() -> tuple[date, date]:
    today = date.today()
    start = today.replace(day=1)
    end = today.replace(day=monthrange(today.year, today.month)[1])
    return start, end


def build_suggestions(user) -> dict:
    start, end = current_month_bounds()

    txns = Transaction.objects.filter(user=user, date__gte=start, date__lte=end)
    debit_txns = txns.filter(transaction_type='DEBIT')

    current_expenses = float(debit_txns.aggregate(total=Sum('amount'))['total'] or 0)
    current_income = float(user.monthly_income or 0)

    spend_by_category_qs = debit_txns.values('category').annotate(total=Sum('amount')).order_by('-total')
    spend_by_category = [
        {'category': row['category'], 'total': float(row['total'])} for row in spend_by_category_qs
    ]

    needs_total = sum(row['total'] for row in spend_by_category if row['category'] in NEEDS_CATEGORIES)
    wants_total = sum(row['total'] for row in spend_by_category if row['category'] in WANTS_CATEGORIES)
    savings_amount = max(0.0, current_income - current_expenses)

    rec_needs = current_income * 0.5
    rec_wants = current_income * 0.3
    rec_savings = current_income * 0.2

    tips = []
    if current_income > 0 and wants_total > rec_wants:
        overshoot = wants_total - rec_wants
        tips.append(
            {
                'type': 'warning',
                'message': f'Wants spending is NPR {wants_total:,.0f}, around NPR {overshoot:,.0f} above your 30% budget target.',
            }
        )

    if current_income > 0 and savings_amount < rec_savings:
        shortfall = rec_savings - savings_amount
        tips.append(
            {
                'type': 'info',
                'message': f'Savings are below target by NPR {shortfall:,.0f}. Small cuts in Shopping/Entertainment can close this gap.',
            }
        )

    if user.savings_goal and savings_amount > 0:
        months_to_goal = float(user.savings_goal) / savings_amount
        tips.append(
            {
                'type': 'info',
                'message': f'At current pace, your NPR {float(user.savings_goal):,.0f} goal can be reached in {months_to_goal:.1f} months.',
            }
        )

    non_essential_ratio = round((wants_total / current_expenses) * 100, 2) if current_expenses > 0 else 0.0

    return {
        'budget_actual': {
            'needs': round(float(needs_total), 2),
            'wants': round(float(wants_total), 2),
            'savings': round(float(savings_amount), 2),
        },
        'budget_recommended': {
            'needs': round(float(rec_needs), 2),
            'wants': round(float(rec_wants), 2),
            'savings': round(float(rec_savings), 2),
        },
        'tips': tips,
        'monthly_income': round(float(current_income), 2),
        'savings_goal': round(float(user.savings_goal or 0), 2),
        'non_essential_ratio': non_essential_ratio,
        'spend_by_category': spend_by_category,
    }


def simulate_reduction(user, reduce_percent: float, category: str) -> dict:
    reduce_percent = max(0.0, min(100.0, float(reduce_percent)))

    start, end = current_month_bounds()
    txns = Transaction.objects.filter(
        user=user,
        date__gte=start,
        date__lte=end,
        transaction_type='DEBIT',
    )

    category_spend = float(txns.filter(category=category).aggregate(total=Sum('amount'))['total'] or 0)
    total_expense = float(txns.aggregate(total=Sum('amount'))['total'] or 0)
    monthly_income = float(user.monthly_income or 0)

    current_savings = max(0.0, monthly_income - total_expense)
    monthly_extra_saving = category_spend * (reduce_percent / 100.0)
    projected_savings = current_savings + monthly_extra_saving

    months_to_goal_current = None
    months_to_goal_projected = None
    goal = float(user.savings_goal or 0)

    if goal > 0 and current_savings > 0:
        months_to_goal_current = round(goal / current_savings, 2)
    if goal > 0 and projected_savings > 0:
        months_to_goal_projected = round(goal / projected_savings, 2)

    return {
        'category': category,
        'reduce_percent': round(reduce_percent, 2),
        'current_category_spend': round(category_spend, 2),
        'monthly_extra_saving': round(monthly_extra_saving, 2),
        'yearly_extra_saving': round(monthly_extra_saving * 12, 2),
        'current_monthly_savings': round(current_savings, 2),
        'projected_monthly_savings': round(projected_savings, 2),
        'months_to_goal_current': months_to_goal_current,
        'months_to_goal_projected': months_to_goal_projected,
    }

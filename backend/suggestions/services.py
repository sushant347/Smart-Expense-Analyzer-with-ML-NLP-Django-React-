from __future__ import annotations

from calendar import monthrange
from datetime import date

from django.db.models import Sum

from transactions.models import Transaction

NEEDS_CATEGORIES = {'Rent', 'Health', 'Education', 'Transport', 'Transfer'}
WANTS_CATEGORIES = {'Shopping', 'Entertainment', 'Food'}
NOTIFICATION_PRIORITY = {'danger': 0, 'warning': 1, 'info': 2}


def _normalize_category_goals(raw_goals: object) -> dict[str, float]:
    if not isinstance(raw_goals, dict):
        return {}

    normalized: dict[str, float] = {}
    for raw_category, raw_goal in raw_goals.items():
        category = str(raw_category).strip()
        if not category:
            continue

        try:
            goal_value = float(raw_goal)
        except (TypeError, ValueError):
            continue

        if goal_value < 0:
            continue

        normalized[category] = round(goal_value, 2)

    return normalized


def _build_category_goal_progress(spend_lookup: dict[str, float], category_goals: dict[str, float]):
    progress_rows = []
    notifications = []

    for category, goal in sorted(category_goals.items()):
        actual = float(spend_lookup.get(category, 0.0))
        utilization_pct = round((actual / goal) * 100, 2) if goal > 0 else 0.0
        remaining = round(goal - actual, 2)
        status = 'on_track'

        if goal <= 0:
            status = 'not_set'
        elif actual > goal:
            status = 'exceeded'
            notifications.append(
                {
                    'type': 'danger',
                    'title': f'{category} goal exceeded',
                    'message': f'You overspent {category} by NPR {actual - goal:,.0f} this month.',
                }
            )
        elif actual >= goal * 0.9:
            status = 'reached'
            notifications.append(
                {
                    'type': 'warning',
                    'title': f'{category} goal reached',
                    'message': f'{category} has reached {utilization_pct:.0f}% of its NPR {goal:,.0f} goal.',
                }
            )
        elif actual >= goal * 0.75:
            status = 'approaching'

        progress_rows.append(
            {
                'category': category,
                'goal': round(goal, 2),
                'actual': round(actual, 2),
                'remaining': round(remaining, 2),
                'utilization_pct': utilization_pct,
                'status': status,
            }
        )

    return progress_rows, notifications


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
    spend_lookup = {row['category']: row['total'] for row in spend_by_category}

    category_goals = _normalize_category_goals(getattr(user, 'category_savings_goals', {}))
    category_goal_progress, goal_notifications = _build_category_goal_progress(spend_lookup, category_goals)

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

    notifications = list(goal_notifications)

    savings_goal_value = float(user.savings_goal or 0)
    if savings_goal_value > 0 and savings_amount >= savings_goal_value:
        notifications.append(
            {
                'type': 'info',
                'title': 'Savings goal reached',
                'message': f'Great progress: your monthly savings of NPR {savings_amount:,.0f} reached your NPR {savings_goal_value:,.0f} goal.',
            }
        )

    if current_income > 0:
        spend_ratio = (current_expenses / current_income) * 100
        if current_expenses > current_income:
            notifications.append(
                {
                    'type': 'danger',
                    'title': 'High expense alert',
                    'message': f'Expenses are {spend_ratio:.1f}% of income this month. You are overspending by NPR {current_expenses - current_income:,.0f}.',
                }
            )
        elif spend_ratio >= 85:
            notifications.append(
                {
                    'type': 'warning',
                    'title': 'High expense alert',
                    'message': f'Expenses are already {spend_ratio:.1f}% of income this month. Consider cutting variable spend.',
                }
            )

    notifications.sort(key=lambda row: NOTIFICATION_PRIORITY.get(row.get('type', 'info'), 99))

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
        'category_savings_goals': category_goals,
        'category_goal_progress': category_goal_progress,
        'notifications': notifications,
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

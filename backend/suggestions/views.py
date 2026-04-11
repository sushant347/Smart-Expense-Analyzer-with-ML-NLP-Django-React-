from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum, Avg, Q
from datetime import date, timedelta
import calendar
from transactions.models import Transaction

class SuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        today = date.today()
        
        # Current month range
        start_of_month = today.replace(day=1)
        _, last_day = calendar.monthrange(today.year, today.month)
        end_of_month = today.replace(day=last_day)
        
        # 1. Monthly Totals
        txns = Transaction.objects.filter(user=user, date__gte=start_of_month, date__lte=end_of_month)
        current_expenses = txns.filter(transaction_type='DEBIT').aggregate(Sum('amount'))['amount__sum'] or 0
        current_income = user.monthly_income or 0

        # 2. 50/30/20 Mapping
        # Needs: Rent, Health, Education, Transport, Other
        needs_cats = ['Rent', 'Health', 'Education', 'Transport', 'Other']
        wants_cats = ['Shopping', 'Entertainment', 'Food']
        
        needs_total = txns.filter(transaction_type='DEBIT', category__in=needs_cats).aggregate(Sum('amount'))['amount__sum'] or 0
        wants_total = txns.filter(transaction_type='DEBIT', category__in=wants_cats).aggregate(Sum('amount'))['amount__sum'] or 0
        
        # Recommendations
        rec_needs = float(current_income) * 0.5
        rec_wants = float(current_income) * 0.3
        rec_savings = float(current_income) * 0.2
        
        # 3. Smart Tips
        tips = []
        
        # Tip 1: Food Spending (if 20% above avg)
        # Previous 3 months average for Food
        three_months_ago = start_of_month - timedelta(days=90)
        avg_food_data = Transaction.objects.filter(
            user=user, 
            category='Food', 
            transaction_type='DEBIT',
            date__lt=start_of_month,
            date__gte=three_months_ago
        ).values('date__month').annotate(monthly_total=Sum('amount'))
        
        avg_food = sum(item['monthly_total'] for item in avg_food_data) / len(avg_food_data) if avg_food_data else 0
        
        current_food = txns.filter(category='Food', transaction_type='DEBIT').aggregate(Sum('amount'))['amount__sum'] or 0
        
        if avg_food > 0 and float(current_food) > float(avg_food) * 1.2:
            diff_percent = ((float(current_food) / float(avg_food)) - 1) * 100
            tips.append({
                "type": "warning",
                "message": f"You spent NPR {float(current_food):,.0f} on food this month, {diff_percent:.0f}% above your average. Reducing dining out by 2x/week could save you ~NPR 2,000/month."
            })
            
        # Tip 2: Savings Timeline
        current_savings = float(current_income) - float(current_expenses)
        
        if user.savings_goal and current_savings > 0:
            months_to_goal = float(user.savings_goal) / current_savings
            tips.append({
                "type": "info",
                "message": f"At this savings rate, you'll reach your goal of NPR {float(user.savings_goal):,.0f} in {months_to_goal:.1f} months."
            })
        elif user.savings_goal and current_savings <= 0:
             tips.append({
                "type": "danger",
                "message": "Your current spending exceeds your income. You won't reach your savings goal unless you reduce expenses."
            })

        return Response({
            "budget_actual": {
                "needs": float(needs_total),
                "wants": float(wants_total),
                "savings": max(0, float(current_income) - float(needs_total) - float(wants_total))
            },
            "budget_recommended": {
                "needs": float(rec_needs),
                "wants": float(rec_wants),
                "savings": float(rec_savings)
            },
            "tips": tips,
            "monthly_income": float(current_income),
            "savings_goal": float(user.savings_goal or 0)
        })

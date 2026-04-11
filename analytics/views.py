from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum
from datetime import datetime, timedelta
import calendar
from transactions.models import Transaction

class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        # Determine target month (default current)
        year = request.query_params.get('year', datetime.now().year)
        month = request.query_params.get('month', datetime.now().month)
        
        try:
            year, month = int(year), int(month)
        except ValueError:
            return Response({"error": "Invalid year or month format."}, status=400)
            
        start_date = datetime(year, month, 1)
        end_date = datetime(year, month, calendar.monthrange(year, month)[1])

        # Base user filter mapped over targets
        base_qs = Transaction.objects.filter(user=user, date__gte=start_date, date__lte=end_date)
        
        # 1. Total Expenses and Income
        total_expense = base_qs.filter(transaction_type='DEBIT').aggregate(Sum('amount'))['amount__sum'] or 0.0
        total_income = base_qs.filter(transaction_type='CREDIT').aggregate(Sum('amount'))['amount__sum'] or 0.0
        
        # 2. Monthly spending breakdown by category
        category_breakdown_qs = base_qs.filter(transaction_type='DEBIT').values('category').annotate(total=Sum('amount')).order_by('-total')
        category_breakdown = list(category_breakdown_qs)
        
        # 3. Top 5 categories
        top_categories = category_breakdown[:5]

        # 4. Bad habit detection logic (Non-essential > 30% User Income)
        # Assuming non-essentials: Shopping, Entertainment, etc.
        bad_habits = []
        user_income = user.monthly_income or total_income  # Fallback to recorded income if profile not set
        
        if user_income and float(user_income) > 0:
            non_essential_cats = ['Shopping', 'Entertainment', 'Other']
            for cat in category_breakdown:
                if cat['category'] in non_essential_cats:
                    ratio = float(cat['total']) / float(user_income)
                    if ratio > 0.30:
                        bad_habits.append(f"Heads up! You spent {ratio*100:.1f}% of your monthly income strictly on {cat['category']}.")
        
        # Calculate daily trend (simplified to group by date)
        trend_qs = base_qs.filter(transaction_type='DEBIT').values('date').annotate(total=Sum('amount')).order_by('date')
        daily_trend = [{'date': t['date'], 'amount': float(t['total'])} for t in trend_qs]

        return Response({
            "total_expense": float(total_expense),
            "total_income": float(total_income),
            "savings_rate": round(((float(user_income) - float(total_expense)) / float(user_income)) * 100, 2) if user_income and float(user_income) > 0 else 0.0,
            "category_breakdown": category_breakdown,
            "top_categories": top_categories,
            "bad_habits": bad_habits,
            "daily_trend": daily_trend
        })

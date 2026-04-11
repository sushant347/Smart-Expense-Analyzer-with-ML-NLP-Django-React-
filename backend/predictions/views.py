from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from django.db.models import Sum
from transactions.models import Transaction
from datetime import date, timedelta
import calendar
import sys, os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from ml.predictor import ExpensePredictor


def get_months_data(user, months_back=6):
    """Returns daily debit totals for the last N months."""
    end = date.today()
    start = (end.replace(day=1) - timedelta(days=1)).replace(day=1)
    # Go back months_back months
    for _ in range(months_back - 1):
        start = (start - timedelta(days=1)).replace(day=1)

    history = (
        Transaction.objects
        .filter(user=user, transaction_type='DEBIT', date__gte=start, date__lte=end)
        .values('date', 'category')
        .annotate(total=Sum('amount'))
        .order_by('date')
    )
    return list(history)


class NextMonthPredictionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        history = get_months_data(user, months_back=6)

        if not history:
            return Response({
                "message": "Not enough data. Upload at least a month of transactions.",
                "predictions": []
            })

        # Group by category
        categories = list(set(h['category'] for h in history))
        predictor = ExpensePredictor()
        predictions = []

        for cat in categories:
            cat_data = [{'date': h['date'], 'total': float(h['total'])} for h in history if h['category'] == cat]
            projected = predictor.predict_next_month(cat_data)
            predictions.append({
                "category": cat,
                "projected_amount": projected,
                "data_points": len(cat_data)
            })

        predictions.sort(key=lambda x: x["projected_amount"], reverse=True)

        # Overall total prediction
        total_projected = sum(p["projected_amount"] for p in predictions)

        return Response({
            "predictions": predictions,
            "total_projected": round(total_projected, 2),
            "months_of_data": 6
        })

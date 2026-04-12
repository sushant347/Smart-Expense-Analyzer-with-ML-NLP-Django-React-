from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from datetime import datetime

from .services import (
    build_analytics_summary,
    build_expense_forecast,
    build_multi_month_comparison,
    build_recurring_expenses,
)

class AnalyticsSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user
        
        year = request.query_params.get('year', datetime.now().year)
        month = request.query_params.get('month', datetime.now().month)
        
        try:
            year, month = int(year), int(month)
        except ValueError:
            return Response({"error": "Invalid year or month format."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = build_analytics_summary(user=user, year=year, month=month)
        except ValueError as error:
            return Response({"error": str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(payload)

class ExpenseForecastView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        return Response(build_expense_forecast(user=request.user))


class MultiMonthComparisonView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        now = datetime.now()
        year = request.query_params.get('year', now.year)
        month = request.query_params.get('month', now.month)
        span = request.query_params.get('span', 6)

        try:
            year = int(year)
            month = int(month)
            span = int(span)
        except ValueError:
            return Response({'error': 'Invalid query params. year, month, and span must be integers.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = build_multi_month_comparison(user=request.user, year=year, month=month, span=span)
        except ValueError as error:
            return Response({'error': str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(payload)


class RecurringExpensesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        months = request.query_params.get('months', 6)
        min_occurrences = request.query_params.get('min_occurrences', 3)

        try:
            months = int(months)
            min_occurrences = int(min_occurrences)
        except ValueError:
            return Response({'error': 'Invalid query params. months and min_occurrences must be integers.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response(build_recurring_expenses(user=request.user, months=months, min_occurrences=min_occurrences))

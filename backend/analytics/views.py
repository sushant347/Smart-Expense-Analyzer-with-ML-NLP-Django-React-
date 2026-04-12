from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from datetime import datetime

from .services import build_analytics_summary, build_expense_forecast

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

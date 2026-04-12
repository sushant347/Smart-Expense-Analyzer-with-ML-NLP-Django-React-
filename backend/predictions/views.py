from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .services import build_month_prediction


class NextMonthPredictionView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        raw_year = request.query_params.get('year')
        raw_month = request.query_params.get('month')

        year = None
        month = None

        if raw_year is not None or raw_month is not None:
            if raw_year is None or raw_month is None:
                return Response(
                    {'error': 'Both year and month are required when querying a specific month.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            try:
                year = int(raw_year)
                month = int(raw_month)
            except ValueError:
                return Response({'error': 'Invalid year or month format.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            payload = build_month_prediction(user=request.user, year=year, month=month)
        except ValueError as error:
            return Response({'error': str(error)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(payload)

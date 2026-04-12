from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status

from .services import build_suggestions, simulate_reduction

class SuggestionsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response(build_suggestions(user=request.user))


class SuggestionSimulationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            reduce_percent = float(request.data.get('reduce_percent', 0))
        except (TypeError, ValueError):
            return Response({'error': 'reduce_percent must be a number.'}, status=status.HTTP_400_BAD_REQUEST)

        category = str(request.data.get('category', 'Shopping')).strip() or 'Shopping'
        return Response(simulate_reduction(user=request.user, reduce_percent=reduce_percent, category=category))

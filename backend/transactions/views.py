import pandas as pd
from pathlib import Path
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Transaction
from .parsers import CSVParserError, parse_transactions_frame
from .serializers import TransactionSerializer
import sys
import os

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from ml.categorizer import TransactionCategorizer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure users only see their own transactions
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

    @action(detail=True, methods=['post'])
    def correct_category(self, request, pk=None):
        transaction = self.get_object()
        new_category = request.data.get('category')
        if not new_category:
            return Response({"error": "Category is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        transaction.category = new_category
        transaction.is_manually_corrected = True
        transaction.save()
        return Response({"message": f"Successfully updated category to {new_category}."})

class MLRetrainView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
        user_id = request.user.id
        corrected_transactions = Transaction.objects.filter(user=request.user, is_manually_corrected=True)
        
        if not corrected_transactions.exists():
            return Response({"message": "No manually corrected transactions found. Retraining skipped."}, status=status.HTTP_200_OK)

        descriptions = [t.description for t in corrected_transactions]
        categories = [t.category for t in corrected_transactions]

        categorizer = TransactionCategorizer(user_id=user_id)
        categorizer.train(descriptions, categories)

        return Response({"message": f"Successfully retrained specific model using {len(descriptions)} corrected rows."}, status=status.HTTP_200_OK)

class CSVUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            df = pd.read_csv(file_obj)
            detected_source, parsed_rows = parse_transactions_frame(df)

            transactions_to_create = []

            for row in parsed_rows:
                transactions_to_create.append(
                    Transaction(
                        user=request.user,
                        date=row['date'],
                        amount=row['amount'],
                        description=row['description'],
                        transaction_type=row['transaction_type'],
                        source=row['source'],
                    )
                )

            if not transactions_to_create:
                return Response(
                    {"error": "No valid rows found in uploaded CSV."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            # Build categorizer for predictions
            categorizer = TransactionCategorizer(user_id=request.user.id)

            for t in transactions_to_create:
                cat, conf = categorizer.predict(t.description)
                t.category = cat
                t.confidence_score = conf

            # Bulk create to improve insertion speed
            Transaction.objects.bulk_create(transactions_to_create)
            
            return Response(
                {
                    "message": f"Successfully parsed and imported {len(transactions_to_create)} transactions.",
                    "source": detected_source,
                },
                status=status.HTTP_201_CREATED
            )
        except CSVParserError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({"error": f"Error parsing CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

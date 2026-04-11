import pandas as pd
from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Transaction
from .serializers import TransactionSerializer
import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
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
            
            # Simple heuristic checking for parsing
            columns = [c.lower().strip() for c in df.columns]
            
            transactions_to_create = []
            
            for index, row in df.iterrows():
                # Attempt to extract generic fields mapping to our model
                # This logic can be expanded based on exact Khalti/eSewa formats
                try:
                    date_val = None
                    # Fallback lookup common column names
                    date_col = next((c for c in columns if 'date' in c), None)
                    if date_col:
                        raw_date = row.iloc[columns.index(date_col)]
                        date_val = pd.to_datetime(raw_date).date()
                    else:
                        date_val = datetime.now().date()
                        
                    amt_col = next((c for c in columns if 'amount' in c or 'rs' in c or 'npr' in c), None)
                    amount_val = float(row.iloc[columns.index(amt_col)]) if amt_col else 0.0
                    
                    desc_col = next((c for c in columns if 'desc' in c or 'detail' in c or 'remarks' in c or 'particular' in c), None)
                    desc_val = str(row.iloc[columns.index(desc_col)]) if desc_col else "CSV Import"
                    
                    # Basic debit/credit check from amount sign or column
                    trans_type = 'DEBIT'
                    if amount_val < 0:
                        trans_type = 'DEBIT'
                        amount_val = abs(amount_val)
                    elif 'credit' in columns or 'deposit' in columns:
                        # Highly dependent on actual generic format
                        pass 
                    
                    transactions_to_create.append(
                        Transaction(
                            user=request.user,
                            date=date_val,
                            amount=amount_val,
                            description=desc_val,
                            transaction_type=trans_type,
                            source='CSV_IMPORT'
                        )
                    )
                except Exception as row_e:
                    # Skip rows that don't match or can't be parsed
                    continue
            
            # Build categorizer for predictions
            categorizer = TransactionCategorizer(user_id=request.user.id)

            for t in transactions_to_create:
                cat, conf = categorizer.predict(t.description)
                t.category = cat
                t.confidence_score = conf

            # Bulk create to improve insertion speed
            Transaction.objects.bulk_create(transactions_to_create)
            
            return Response(
                {"message": f"Successfully parsed and imported {len(transactions_to_create)} transactions."},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response({"error": f"Error parsing CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

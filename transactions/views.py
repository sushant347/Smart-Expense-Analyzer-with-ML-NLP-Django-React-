import pandas as pd
from datetime import datetime
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Transaction
from .serializers import TransactionSerializer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Ensure users only see their own transactions
        return Transaction.objects.filter(user=self.request.user).order_by('-date')

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
            
            # Bulk create to improve insertion speed
            Transaction.objects.bulk_create(transactions_to_create)
            
            return Response(
                {"message": f"Successfully parsed and imported {len(transactions_to_create)} transactions."},
                status=status.HTTP_201_CREATED
            )
            
        except Exception as e:
            return Response({"error": f"Error parsing CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

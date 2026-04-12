import pandas as pd
import json
from pathlib import Path
from django.utils.dateparse import parse_date
from django.utils import timezone
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import ModelTrainingRun, Transaction
from .pagination import TransactionPagination
from .parsers import CSVParserError, parse_transactions_frame
from .serializers import TransactionSerializer, VALID_CATEGORIES
from .retraining import maybe_run_auto_retraining, run_retraining_for_user
import sys
import os
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from ml.categorizer import TransactionCategorizer

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = TransactionPagination

    def perform_create(self, serializer):
        transaction = serializer.save()

        # If caller didn't provide a category, infer one from ML.
        if not self.request.data.get('category'):
            categorizer = TransactionCategorizer(user_id=self.request.user.id)
            category, confidence = categorizer.predict(transaction.description)
            transaction.category = category
            transaction.confidence_score = confidence
            transaction.is_uncertain = confidence < categorizer.uncertain_threshold
            transaction.save(update_fields=['category', 'confidence_score', 'is_uncertain'])

    def get_queryset(self):
        # Ensure users only see their own transactions
        queryset = Transaction.objects.filter(user=self.request.user)

        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        category = self.request.query_params.get('category')
        transaction_type = self.request.query_params.get('transaction_type')
        search = self.request.query_params.get('search')
        ordering = self.request.query_params.get('ordering', '-date')

        parsed_start = parse_date(start_date) if start_date else None
        parsed_end = parse_date(end_date) if end_date else None

        if parsed_start:
            queryset = queryset.filter(date__gte=parsed_start)
        if parsed_end:
            queryset = queryset.filter(date__lte=parsed_end)
        if category:
            queryset = queryset.filter(category=category)
        if transaction_type in {'CREDIT', 'DEBIT'}:
            queryset = queryset.filter(transaction_type=transaction_type)
        if search:
            queryset = queryset.filter(description__icontains=search.strip())

        allowed_ordering = {'date', '-date', 'amount', '-amount'}
        if ordering not in allowed_ordering:
            ordering = '-date'

        return queryset.order_by(ordering)

    @action(detail=True, methods=['post'])
    def correct_category(self, request, pk=None):
        transaction = self.get_object()
        new_category = request.data.get('category')
        if new_category not in VALID_CATEGORIES:
            return Response(
                {"error": "Category must be one of the supported categories."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        transaction.category = new_category
        transaction.confidence_score = 1.0
        transaction.is_uncertain = False
        transaction.is_manually_corrected = True
        transaction.corrected_at = timezone.now()
        transaction.save(update_fields=['category', 'confidence_score', 'is_uncertain', 'is_manually_corrected', 'corrected_at'])

        auto_run, pending_or_trained, threshold = maybe_run_auto_retraining(request.user)
        payload = {"message": f"Successfully updated category to {new_category}."}

        if auto_run:
            payload['auto_retrained'] = True
            payload['model_version'] = auto_run.version
            payload['trained_rows'] = pending_or_trained
        else:
            payload['auto_retrained'] = False
            payload['pending_corrections'] = pending_or_trained
            payload['auto_retrain_threshold'] = threshold

        return Response(payload)

class MLRetrainView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'retrain'

    def post(self, request, *args, **kwargs):
        run, trained_rows = run_retraining_for_user(
            user=request.user,
            trigger_source='MANUAL',
            notes='Manual retraining endpoint triggered.',
        )

        if not run:
            return Response({"message": "No manually corrected transactions found. Retraining skipped."}, status=status.HTTP_200_OK)

        return Response(
            {
                "message": f"Successfully retrained model using {trained_rows} corrected rows.",
                "model_version": run.version,
                "trigger_source": run.trigger_source,
            },
            status=status.HTTP_200_OK,
        )


class MLRetrainHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        history = ModelTrainingRun.objects.filter(user=request.user).order_by('-created_at')[:20]
        payload = [
            {
                'version': run.version,
                'trigger_source': run.trigger_source,
                'corrected_samples': run.corrected_samples,
                'training_size': run.training_size,
                'model_path': run.model_path,
                'notes': run.notes,
                'created_at': run.created_at,
            }
            for run in history
        ]
        return Response({'history': payload, 'count': len(payload)})

class CSVUploadView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    throttle_scope = 'csv_upload'

    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({"error": "No file uploaded"}, status=status.HTTP_400_BAD_REQUEST)

        if not file_obj.name.lower().endswith('.csv'):
            return Response({"error": "Only .csv files are supported."}, status=status.HTTP_400_BAD_REQUEST)

        max_file_size = int(os.getenv('CSV_MAX_FILE_SIZE', str(5 * 1024 * 1024)))
        if file_obj.size > max_file_size:
            return Response(
                {"error": f"CSV is too large. Max allowed size is {max_file_size // (1024 * 1024)} MB."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        try:
            df = pd.read_csv(file_obj, dtype=str, keep_default_na=False)
            max_rows = int(os.getenv('CSV_MAX_ROWS', '20000'))
            if len(df.index) > max_rows:
                return Response(
                    {"error": f"CSV has too many rows ({len(df.index)}). Limit is {max_rows}."},
                    status=status.HTTP_400_BAD_REQUEST,
                )

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
                t.is_uncertain = conf < categorizer.uncertain_threshold

            # Bulk create to improve insertion speed
            Transaction.objects.bulk_create(transactions_to_create)

            total_rows = int(len(df.index))
            imported_rows = len(transactions_to_create)
            skipped_rows = max(total_rows - imported_rows, 0)
            
            return Response(
                {
                    "message": f"Successfully parsed and imported {imported_rows} transactions.",
                    "source": detected_source,
                    "total_rows": total_rows,
                    "imported_rows": imported_rows,
                    "skipped_rows": skipped_rows,
                },
                status=status.HTTP_201_CREATED
            )
        except CSVParserError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response({"error": f"Error parsing CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class WalletSyncView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_scope = 'wallet_sync'

    def post(self, request, *args, **kwargs):
        provider = str(request.data.get('provider', '')).strip().upper()
        if provider not in {'ESEWA', 'KHALTI'}:
            return Response({'error': 'provider must be ESEWA or KHALTI.'}, status=status.HTTP_400_BAD_REQUEST)

        sync_url = os.getenv(f'{provider}_SYNC_URL')
        api_key = os.getenv(f'{provider}_API_KEY')

        if not sync_url or not api_key:
            return Response(
                {'error': f'{provider} live sync is not configured. Set {provider}_SYNC_URL and {provider}_API_KEY.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        from_date = request.data.get('from_date')
        to_date = request.data.get('to_date')
        save_records = str(request.data.get('save', 'true')).lower() == 'true'

        query_params = {}
        if from_date:
            query_params['from_date'] = from_date
        if to_date:
            query_params['to_date'] = to_date

        target_url = sync_url
        if query_params:
            joiner = '&' if '?' in sync_url else '?'
            target_url = f"{sync_url}{joiner}{urlencode(query_params)}"

        try:
            req = Request(
                target_url,
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Accept': 'application/json',
                },
                method='GET',
            )
            with urlopen(req, timeout=15) as response:
                raw = response.read().decode('utf-8')
            parsed = json.loads(raw)
        except HTTPError as error:
            return Response({'error': f'{provider} sync failed with status {error.code}.'}, status=status.HTTP_502_BAD_GATEWAY)
        except URLError:
            return Response({'error': f'{provider} sync endpoint unreachable.'}, status=status.HTTP_502_BAD_GATEWAY)
        except Exception as error:
            return Response({'error': f'{provider} sync failed: {str(error)}'}, status=status.HTTP_502_BAD_GATEWAY)

        records = parsed.get('transactions') if isinstance(parsed, dict) else parsed
        if not isinstance(records, list):
            return Response({'error': 'Invalid sync payload format.'}, status=status.HTTP_502_BAD_GATEWAY)

        if not records:
            return Response({'message': f'No transactions returned from {provider}.', 'imported': 0, 'provider': provider})

        categorizer = TransactionCategorizer(user_id=request.user.id)
        imported = 0
        skipped = 0

        for row in records:
            date_value = parse_date(str(row.get('date', '')).strip())
            description = str(row.get('description') or row.get('remarks') or f'{provider} synced transaction').strip()

            try:
                amount = float(row.get('amount', 0) or 0)
            except (TypeError, ValueError):
                amount = 0.0

            transaction_type = str(row.get('transaction_type', 'DEBIT')).strip().upper()
            if transaction_type not in {'DEBIT', 'CREDIT'}:
                transaction_type = 'DEBIT'

            if not date_value or amount <= 0:
                skipped += 1
                continue

            if not save_records:
                imported += 1
                continue

            exists = Transaction.objects.filter(
                user=request.user,
                date=date_value,
                description=description,
                amount=amount,
                source=f'API_{provider}',
            ).exists()
            if exists:
                skipped += 1
                continue

            category, confidence = categorizer.predict(description)
            Transaction.objects.create(
                user=request.user,
                date=date_value,
                description=description,
                amount=amount,
                transaction_type=transaction_type,
                source=f'API_{provider}',
                category=category,
                confidence_score=confidence,
                is_uncertain=confidence < categorizer.uncertain_threshold,
            )
            imported += 1

        return Response(
            {
                'provider': provider,
                'imported': imported,
                'skipped': skipped,
                'saved': save_records,
            }
        )

from __future__ import annotations

import sys
from pathlib import Path

from django.contrib.auth import get_user_model
from django.db import close_old_connections

from core.tasks import ml_shared_task
from .models import Transaction

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from ml.categorizer import TransactionCategorizer


@ml_shared_task(name='transactions.categorize_transactions')
def categorize_transactions_task(user_id: int, transaction_ids: list[int]):
    close_old_connections()

    ids = [int(tx_id) for tx_id in (transaction_ids or []) if tx_id]
    if not ids:
        return {'updated': 0, 'skipped': 0}

    categorizer = TransactionCategorizer(user_id=user_id)
    txns = list(Transaction.objects.filter(user_id=user_id, id__in=ids))

    for txn in txns:
        category, confidence = categorizer.predict(txn.description)
        txn.category = category
        txn.confidence_score = confidence
        txn.is_uncertain = confidence < categorizer.uncertain_threshold

    if txns:
        Transaction.objects.bulk_update(txns, ['category', 'confidence_score', 'is_uncertain'])

    close_old_connections()
    return {
        'updated': len(txns),
        'skipped': max(len(ids) - len(txns), 0),
    }


@ml_shared_task(name='transactions.retrain_user_model')
def retrain_user_model_task(user_id: int, trigger_source: str = 'MANUAL', notes: str = ''):
    close_old_connections()

    User = get_user_model()
    try:
        user = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        close_old_connections()
        return {'run_id': None, 'trained_rows': 0, 'error': 'User not found.'}

    from .retraining import run_retraining_for_user

    run, trained_rows = run_retraining_for_user(user, trigger_source=trigger_source, notes=notes)

    close_old_connections()
    return {
        'run_id': run.id if run else None,
        'trained_rows': trained_rows,
        'version': run.version if run else None,
    }

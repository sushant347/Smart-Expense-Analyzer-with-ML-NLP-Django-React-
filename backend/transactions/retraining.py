from __future__ import annotations

import os
import sys
from pathlib import Path

from transactions.models import ModelTrainingRun, Transaction

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from ml.categorizer import TransactionCategorizer
from core.tasks import dispatch_task


AUTO_RETRAIN_THRESHOLD = int(os.getenv('ML_AUTO_RETRAIN_THRESHOLD', '5'))


def _next_model_version(user) -> int:
    last = ModelTrainingRun.objects.filter(user=user).order_by('-version').first()
    return (last.version + 1) if last else 1


def run_retraining_for_user(user, trigger_source: str = 'MANUAL', notes: str = ''):
    corrected_qs = Transaction.objects.filter(user=user, is_manually_corrected=True)
    if not corrected_qs.exists():
        return None, 0

    descriptions = list(corrected_qs.values_list('description', flat=True))
    categories = list(corrected_qs.values_list('category', flat=True))

    categorizer = TransactionCategorizer(user_id=user.id)
    categorizer.train(descriptions, categories)

    run = ModelTrainingRun.objects.create(
        user=user,
        version=_next_model_version(user),
        trigger_source=trigger_source,
        corrected_samples=len(descriptions),
        training_size=len(descriptions),
        model_path=categorizer.model_path,
        notes=notes,
    )

    return run, len(descriptions)

def enqueue_retraining(user, trigger_source: str = 'MANUAL', notes: str = ''):
    from .tasks import retrain_user_model_task

    return dispatch_task(
        retrain_user_model_task,
        user.id,
        trigger_source,
        notes,
    )


def background_retrain(user, trigger_source: str = 'MANUAL', notes: str = ''):
    """Backward-compatible alias for queued retraining dispatch."""
    return enqueue_retraining(user, trigger_source, notes)

def maybe_run_auto_retraining(user):
    last_run = ModelTrainingRun.objects.filter(user=user).order_by('-created_at').first()

    corrected_qs = Transaction.objects.filter(user=user, is_manually_corrected=True)
    if last_run:
        corrected_qs = corrected_qs.filter(corrected_at__gt=last_run.created_at)

    pending_count = corrected_qs.count()

    if pending_count < AUTO_RETRAIN_THRESHOLD:
        return None, pending_count, AUTO_RETRAIN_THRESHOLD

    # Trigger asynchronously to prevent HTTP blocking
    enqueue_retraining(
        user=user,
        trigger_source='AUTO',
        notes=f'Auto retrain triggered after {pending_count} new corrections.',
    )
    return True, pending_count, AUTO_RETRAIN_THRESHOLD

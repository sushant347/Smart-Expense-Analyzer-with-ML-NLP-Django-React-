import logging
import threading
from types import SimpleNamespace

from django.db import close_old_connections

try:
    from celery import shared_task as celery_shared_task
except Exception:  # pragma: no cover - optional dependency fallback
    celery_shared_task = None

logger = logging.getLogger(__name__)


class LocalAsyncResult(SimpleNamespace):
    def __init__(self, task_id=None, state='QUEUED'):
        super().__init__(id=task_id, state=state)


def run_in_background(func):
    """
    Decorator to run a function in a background thread.
    Useful for offloading ML model training or heavy data processing
    that should not block the main HTTP request/response cycle.
    """

    def wrapper(*args, **kwargs):
        def thread_target():
            try:
                close_old_connections()
                func(*args, **kwargs)
            except Exception as e:
                logger.error(f"Background task {func.__name__} failed: {str(e)}", exc_info=True)
            finally:
                close_old_connections()

        thread = threading.Thread(target=thread_target, name=f"bg_task_{func.__name__}")
        thread.daemon = True
        thread.start()
        return thread

    return wrapper


def ml_shared_task(*task_args, **task_kwargs):
    """
    Celery-first task decorator with local async fallback when Celery is unavailable.
    """
    if celery_shared_task is not None:
        return celery_shared_task(*task_args, **task_kwargs)

    def decorator(func):
        def _delay(*args, **kwargs):
            run_in_background(func)(*args, **kwargs)
            return LocalAsyncResult()

        def _apply_async(args=None, kwargs=None, **_):
            return _delay(*(args or ()), **(kwargs or {}))

        func.delay = _delay
        func.apply_async = _apply_async
        return func

    if task_args and callable(task_args[0]) and len(task_args) == 1 and not task_kwargs:
        return decorator(task_args[0])
    return decorator


def dispatch_task(task_callable, *args, **kwargs):
    """
    Dispatch to Celery when possible. If broker/Celery is not available,
    gracefully fall back to local background execution.
    """
    if hasattr(task_callable, 'delay'):
        try:
            return task_callable.delay(*args, **kwargs)
        except Exception as exc:
            logger.warning('Task dispatch failed, using local background fallback: %s', exc)

    target = task_callable.run if hasattr(task_callable, 'run') else task_callable
    run_in_background(target)(*args, **kwargs)
    return LocalAsyncResult()

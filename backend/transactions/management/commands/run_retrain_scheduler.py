from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

from transactions.retraining import maybe_run_auto_retraining


class Command(BaseCommand):
    help = 'Run automatic retraining checks for all users based on correction thresholds.'

    def handle(self, *args, **options):
        User = get_user_model()
        total_runs = 0

        for user in User.objects.all().iterator():
            run, pending_or_trained, threshold = maybe_run_auto_retraining(user)
            if run:
                total_runs += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f'Auto retrain complete for {user.username}: version={run.version}, rows={pending_or_trained}'
                    )
                )
            else:
                self.stdout.write(
                    f'Skipped {user.username}: pending corrections={pending_or_trained}, threshold={threshold}'
                )

        self.stdout.write(self.style.SUCCESS(f'Scheduler finished. retrain_runs={total_runs}'))

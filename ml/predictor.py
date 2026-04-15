import numpy as np
from sklearn.linear_model import LinearRegression

class ExpensePredictor:
    def __init__(self):
        self.model = LinearRegression()

    def _build_dense_series(self, sorted_expenses):
        base_date = sorted_expenses[0]['date']
        last_date = sorted_expenses[-1]['date']
        observed_days = max((last_date - base_date).days + 1, 1)

        per_day_totals = {}
        for record in sorted_expenses:
            day_index = (record['date'] - base_date).days
            per_day_totals[day_index] = per_day_totals.get(day_index, 0.0) + float(record['total'])

        X = np.arange(observed_days).reshape(-1, 1)
        y = np.array([per_day_totals.get(idx, 0.0) for idx in range(observed_days)], dtype=float)
        return X, y, observed_days
    
    def predict_next_month(self, daily_expenses):
        """
        Receives a dictionary/list of dicts with {'date': datetime.date, 'total': float}
        Predicts total spend for the NEXT 30 days securely.
        """
        if not daily_expenses:
            return 0.0
            
        # Build a dense daily timeline so missing dates contribute as zero.
        sorted_expenses = sorted(daily_expenses, key=lambda x: x['date'])
        X, y, observed_days = self._build_dense_series(sorted_expenses)

        observed_total = float(np.sum(y))
        baseline_monthly = (observed_total / observed_days) * 30 if observed_days > 0 else 0.0

        # For short history windows, use the baseline average and avoid trend overfitting.
        if observed_days < 14:
            return round(max(0.0, baseline_monthly), 2)
        
        # Fit linear trajectory and project next 30 days.
        self.model.fit(X, y)

        last_day = int(X[-1][0])
        future_X = np.arange(last_day + 1, last_day + 31).reshape(-1, 1)
        trend_predictions = self.model.predict(future_X)
        trend_predictions = np.maximum(trend_predictions, 0.0)
        trend_monthly = float(np.sum(trend_predictions))

        if baseline_monthly <= 0:
            return round(trend_monthly, 2)

        # Blend trend with baseline and clamp extremes for realistic forecasts.
        blended = (baseline_monthly * 0.7) + (trend_monthly * 0.3)
        lower_bound = baseline_monthly * 0.55
        upper_bound = baseline_monthly * 1.75
        projected = float(np.clip(blended, lower_bound, upper_bound))

        return round(projected, 2)

import numpy as np
from sklearn.linear_model import LinearRegression
from datetime import timedelta

class ExpensePredictor:
    def __init__(self):
        self.model = LinearRegression()
    
    def predict_next_month(self, daily_expenses):
        """
        Receives a dictionary/list of dicts with {'date': datetime.date, 'total': float}
        Predicts total spend for the NEXT 30 days securely.
        """
        if not daily_expenses:
            return 0.0
            
        # Extract dates and amount mappings
        sorted_expenses = sorted(daily_expenses, key=lambda x: x['date'])
        base_date = sorted_expenses[0]['date']
        
        # Build features: X = days since start, y = total spent that day
        X = []
        y = []
        
        for record in sorted_expenses:
            days_since_start = (record['date'] - base_date).days
            X.append([days_since_start])
            y.append(record['total'])
            
        # Fallback Mechanism: If less than 7 distinct days are available, Linear Regression
        # could swing wildly (e.g., 2 transactions creating an infinite slope).
        if len(X) < 7:
            daily_avg = sum(y) / len(y)
            return round(daily_avg * 30, 2)
            
        X = np.array(X)
        y = np.array(y)
        
        # Fit Linear trajectory
        self.model.fit(X, y)
        
        # Predict the next 30 days iteratively
        last_day = X[-1][0]
        future_X = np.array([[last_day + i] for i in range(1, 31)])
        predictions = self.model.predict(future_X)
        
        # Floor predictions at 0 (can't have negative spending fundamentally)
        predictions = np.maximum(predictions, 0)
        
        return round(float(np.sum(predictions)), 2)

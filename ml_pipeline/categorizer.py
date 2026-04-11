import os
import pandas as pd
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from django.conf import settings

class TransactionCategorizer:
    def __init__(self, user_id):
        self.user_id = user_id
        # Define storage path for the personalized model
        self.model_dir = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'models')
        os.makedirs(self.model_dir, exist_ok=True)
        self.model_path = os.path.join(self.model_dir, f'categorizer_user_{self.user_id}.joblib')
        
        self.pipeline = None
        self._load_or_init_model()

    def _load_or_init_model(self):
        if os.path.exists(self.model_path):
            try:
                self.pipeline = joblib.load(self.model_path)
            except Exception:
                self._build_base_model()
        else:
            self._build_base_model()

    def _build_base_model(self):
        # Generate new base pipeline
        self.pipeline = Pipeline([
            ('tfidf', TfidfVectorizer(ngram_range=(1, 2), stop_words='english', lowercase=True)),
            ('clf', LogisticRegression(max_iter=1000, class_weight='balanced'))
        ])
        
        # Train on the global synthetic dataset to give it baseline knowledge
        try:
            base_data_path = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'synthetic_data.csv')
            df = pd.read_csv(base_data_path)
            if not df.empty:
                self.pipeline.fit(df['description'], df['category'])
                self._save_model()
        except FileNotFoundError:
            pass # Fails gracefully if synthetic data doesn't exist

    def _save_model(self):
        if self.pipeline:
            joblib.dump(self.pipeline, self.model_path)

    def train(self, descriptions, categories):
        """
        Retrains the user's specific model merging their explicit data with baseline logic.
        """
        if not descriptions or len(descriptions) == 0:
            return
            
        # Extract synthetic generic baseline
        base_data_path = os.path.join(settings.BASE_DIR, 'ml_pipeline', 'synthetic_data.csv')
        try:
            df_base = pd.read_csv(base_data_path)
            base_descriptions = df_base['description'].tolist()
            base_categories = df_base['category'].tolist()
        except FileNotFoundError:
            base_descriptions, base_categories = [], []
            
        # Merge new explicit user corrected labels overriding weight indirectly via frequency
        combined_descriptions = base_descriptions + list(descriptions)
        combined_categories = base_categories + list(categories)

        if combined_descriptions:
            self.pipeline.fit(combined_descriptions, combined_categories)
            self._save_model()

    def predict(self, description):
        """
        Returns (predicted_category, confidence_score)
        """
        if not self.pipeline:
            return "Other", 0.0
            
        try:
            proba = self.pipeline.predict_proba([description])[0]
            max_idx = proba.argmax()
            confidence = proba[max_idx]
            category = self.pipeline.classes_[max_idx]
            return str(category), float(confidence)
        except Exception:
            # If the model hasn't been fit properly or predicting unknown tokens fails
            return "Other", 0.0

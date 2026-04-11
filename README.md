# 💰 AI-Powered NPR Finance Analyzer

A full-stack personal finance analyzer tailored for the Nepali market, featuring automated categorization, ML-based forecasting, and smart budgeting suggestions.

## 🚀 Features

- **📥 Data Input**: Support for eSewa, Khalti, and standard bank CSV exports. Includes a manual expense entry form.
- **🤖 AI Categorization**: NLP-based (TF-IDF + Logistic Regression) transaction labeling into categories like Food, Rent, Transport, etc.
- **📊 Analytics Dashboard**: Comprehensive breakdown of monthly spending, savings rate calculator, and "bad habit" detection.
- **🔮 ML Forecasting**: Predictive modeling (Linear Regression) to forecast next month's spending based on historical trends.
- **💡 Smart Suggestions**: Personal advice based on the 50/30/20 rule and interactive savings simulations.
- **📄 Reports**: Export professional monthly financial reports in PDF format.
- **👤 User System**: Secure JWT-based authentication with per-user data isolation.

## 🛠️ Tech Stack

- **Backend**: Django REST Framework, PostgreSQL
- **Frontend**: React, Tailwind CSS, Recharts, Lucide Icons
- **Machine Learning**: Scikit-learn, Pandas, NumPy
- **Reporting**: ReportLab

## 📁 Project Structure

```text
expense/
├── backend/            # Django Application
│   ├── core/           # Project settings & URLs
│   ├── users/          # Auth & user profiles
│   ├── transactions/   # Data parsing & management
│   ├── analytics/      # Aggregation & summary logic
│   ├── suggestions/    # Smart advice engine
│   ├── ...             # Other Django apps
│   ├── manage.py       # Django cli
│   └── venv/           # Python environment
├── frontend/           # React Application (Vite)
├── ml/                 # Machine Learning Models & Data
│   ├── categorizer.py  # NLP classifier
│   ├── predictor.py    # Regression forecaster
│   └── ...
└── README.md
```

## ⚙️ Installation & Setup

### Backend
1. Clone the repository.
2. Navigate to `backend/`.
3. Activate the virtual environment: `.\venv\Scripts\activate` (Windows).
4. Install dependencies: `pip install -r requirements.txt`.
5. Run migrations: `python manage.py migrate`.
6. Start the server: `python manage.py runserver`.

### Frontend
1. Navigate to `frontend/`.
2. Install dependencies: `npm install`.
3. Start the dev server: `npm run dev`.

## 🧠 ML Note
The categorization model uses **Active Learning**. When you manually correct a category in the Transactions list, you can trigger a retraining process to personalize the model to your specific spending habits.

## 📝 License
MIT License

# Kharchi (Nepal)

Full-stack personal finance tracker with categorization, forecasting, budgeting suggestions, and PDF reporting.

## Core Features

- CSV import with source detection (Bank, eSewa, Khalti)
- Manual transaction entry
- Transaction categorization with confidence and uncertain flag
- Monthly analytics and weekly trends
- Next-month spending prediction
- Savings suggestions and budget simulation
- JWT authentication and per-user data isolation
- Monthly PDF report export

## Tech Stack

- Backend: Django, Django REST Framework, Simple JWT
- Database: PostgreSQL (production), SQLite fallback (local development)
- Frontend: React (Vite), Tailwind CSS, Recharts
- ML: scikit-learn, pandas, numpy
- Reporting: reportlab

## Project Structure

```text
expense/
├── backend/
│   ├── core/
│   ├── users/
│   ├── transactions/
│   ├── analytics/
│   ├── predictions/
│   ├── suggestions/
│   ├── reports/
│   ├── manage.py
│   └── requirements.txt
├── frontend/
├── ml/
└── README.md
```

## Local Setup

### 1. Backend

```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Notes:
- By default in development, backend uses SQLite fallback so it runs even if PostgreSQL is not running.
- To force PostgreSQL locally, set `DJANGO_USE_SQLITE=False`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend default URL: `http://127.0.0.1:5173`  
Backend default URL: `http://127.0.0.1:8000`

## Environment Variables

### Django

- `DJANGO_DEBUG` (default: `True`)
- `DJANGO_SECRET_KEY`
- `DJANGO_ALLOWED_HOSTS` (comma-separated)
- `DJANGO_CORS_ALLOWED_ORIGINS` (comma-separated)
- `DJANGO_USE_SQLITE` (`True` or `False`)

### PostgreSQL (used when `DJANGO_USE_SQLITE=False`)

- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_PORT`

## API Overview

- Auth
	- `POST /api/auth/login/`
	- `POST /api/auth/refresh/`
	- `POST /api/users/register/`
	- `GET/PATCH /api/users/profile/`
- Transactions
	- `GET/POST /api/transactions/`
	- `POST /api/transactions/upload/`
	- `POST /api/transactions/{id}/correct_category/`
	- `POST /api/transactions/retrain/`
- Analytics
	- `GET /api/analytics/summary/`
	- `GET /api/analytics/forecast/`
- Predictions
	- `GET /api/predictions/next-month/`
- Suggestions
	- `GET /api/suggestions/`
	- `POST /api/suggestions/simulate/`
- Reports
	- `GET /api/reports/export/?year=YYYY&month=MM`

## Troubleshooting

### Backend run error: connection refused on localhost:5432

Cause: PostgreSQL is not running but backend is trying PostgreSQL.

Fix options:
1. Use local SQLite fallback: set `DJANGO_USE_SQLITE=True`.
2. Or start PostgreSQL and keep `DJANGO_USE_SQLITE=False`.

## License

MIT

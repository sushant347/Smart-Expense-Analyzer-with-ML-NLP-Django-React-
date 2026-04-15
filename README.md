# Kharchi (Nepal)

Full-stack personal finance tracker with categorization, forecasting, budgeting suggestions, and PDF reporting.

## Core Features

- CSV import with source detection (Bank, eSewa, Khalti)
- Manual transaction entry
- Transaction categorization with confidence and uncertain flag
- Advanced dashboard with weekly spending, category split range filters, cashflow, and savings-rate trends
- User analytics view with category momentum and recurring-spend signals
- Next-month spending prediction
- Savings suggestions and budget simulation
- JWT authentication and per-user data isolation
- Monthly PDF report export

## Tech Stack

- Backend: Django, Django REST Framework, Simple JWT
- Database: PostgreSQL (production), SQLite fallback (local development)
- Frontend: React (Vite), Tailwind CSS, Recharts
- Frontend charting: Recharts + D3 (category donut)
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
- `DJANGO_CSRF_TRUSTED_ORIGINS` (comma-separated, include your Vercel URL)
- `DJANGO_USE_SQLITE` (`True` or `False`)
- `DATABASE_URL` (Neon PostgreSQL URL; preferred in production)

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
	- `GET/PATCH/DELETE /api/transactions/{id}/`
	- `POST /api/transactions/upload/`
	- `POST /api/transactions/{id}/correct_category/`
	- `POST /api/transactions/retrain/`
- Analytics
	- `GET /api/analytics/summary/`
	- `GET /api/analytics/forecast/`
	- `GET /api/analytics/comparison/`
	- `GET /api/analytics/recurring/`
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

## Deployment (Render + Neon + Vercel)

This repository is prepared for:
- Backend: Render web service
- Database: Neon PostgreSQL
- Frontend: Vercel

### 1. Neon (Database)

1. Create a new Neon project and database.
2. Copy the full connection string (looks like `postgresql://...`).
3. Keep it for `DATABASE_URL` in Render.

### 2. Render (Backend)

This repo includes a `render.yaml` blueprint at project root.

1. In Render, click **New +** -> **Blueprint**.
2. Connect this GitHub repository and deploy.
3. Set required env vars in Render service:
	- `DATABASE_URL`: Neon connection string
	- `DJANGO_SECRET_KEY`: strong random string
	- `DJANGO_DEBUG`: `False`
	- `DJANGO_USE_SQLITE`: `False`
	- `DJANGO_ALLOWED_HOSTS`: include `.onrender.com`
	- `DJANGO_CORS_ALLOWED_ORIGINS`: include your Vercel URL (for example `https://your-app.vercel.app`)
	- `DJANGO_CSRF_TRUSTED_ORIGINS`: include your Vercel URL (for example `https://your-app.vercel.app`)

The service runs migrations at startup automatically.

### 3. Vercel (Frontend)

This repo includes `frontend/vercel.json` with SPA rewrite support.

1. In Vercel, import the repository.
2. Set **Root Directory** to `frontend`.
3. Set environment variable:
	- `VITE_API_BASE_URL`: `https://<your-render-service>.onrender.com/api/`
4. Deploy.

### 4. Final check

1. Open Vercel app.
2. Register/Login.
3. Verify API requests go to Render domain and no CORS errors appear.

## Logo

Kharchi branding uses the uploaded image at:
- `frontend/src/components/image/Kharchi.png`

The app sidebar/auth branding and browser favicon are configured to use this asset.

## License

MIT

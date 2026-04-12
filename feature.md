# Smart Expense Analyzer - Feature Guide

## 1. Product Summary

Smart Expense Analyzer is a full-stack personal finance tracker focused on Nepal use cases.
It supports statement import, transaction categorization, analytics, forecasting, budgeting guidance, and monthly reporting.

## 2. Core Functional Areas

### 2.1 Authentication and User Profile

- JWT login and refresh token flow
- User registration
- User profile settings for:
  - monthly income
  - savings goal
  - currency

Relevant backend modules:
- backend/users/models.py
- backend/users/serializers.py
- backend/users/views.py
- backend/users/urls.py

### 2.2 Transaction Management

- Manual transaction create/list/update/delete
- CSV upload endpoint
- Category correction endpoint for relabeling
- Retraining trigger endpoint based on corrected labels
- User-level isolation on all records

Relevant backend modules:
- backend/transactions/models.py
- backend/transactions/serializers.py
- backend/transactions/views.py
- backend/transactions/parsers.py

### 2.3 CSV Parsing and Source Detection

Supported source detection:
- Bank
- eSewa
- Khalti
- Generic fallback

Behavior:
- auto maps date/description/amount columns
- derives debit/credit where available
- rejects rows with invalid values
- applies categorization and confidence

Relevant backend module:
- backend/transactions/parsers.py

### 2.4 Categorization and Retraining

ML stack:
- TF-IDF vectorizer
- Logistic Regression classifier

Behavior:
- predicts category + confidence score
- sets uncertain flag for low confidence
- accepts user corrections
- retraining endpoint builds user-specific model updates

Relevant modules:
- ml/categorizer.py
- backend/transactions/views.py

### 2.5 Analytics Dashboard

Outputs:
- monthly category breakdown
- weekly trend values
- top categories
- non-essential ratio
- bad-habit detection
- savings rate

Income handling:
- uses credited income rows when available
- falls back to profile monthly income if credit rows are missing
- exposes income source mode in response

Relevant modules:
- backend/analytics/services.py
- backend/analytics/views.py

### 2.6 Predictions

- next-month projection endpoint
- category-level projected vs actual values
- total projected, total actual, and gap

Model:
- linear regression-based daily trend projection
- fallback averaging for sparse data

Relevant modules:
- backend/predictions/services.py
- backend/predictions/views.py
- ml/predictor.py

### 2.7 Suggestions Engine

Provides:
- 50/30/20 style budget recommendation
- tips from current spending pattern
- simulation endpoint: reduce a category by X% and estimate saved amount

Relevant modules:
- backend/suggestions/services.py
- backend/suggestions/views.py

### 2.8 PDF Reporting

- monthly PDF export endpoint
- summary metrics
- category table
- embedded chart and insight section

Relevant module:
- backend/reports/views.py

## 3. Frontend Pages

Main pages:
- Login
- Register
- Dashboard
- Transactions
- Upload
- Predictions
- Suggestions
- Settings

Frontend architecture notes:
- React + Vite
- Axios API client with JWT header injection
- Protected layout + sidebar navigation
- Responsive behavior on desktop/mobile
- Light/dark mode toggle

Relevant frontend modules:
- frontend/src/App.jsx
- frontend/src/components/Sidebar.jsx
- frontend/src/pages/*.jsx
- frontend/src/api/axios.js

## 4. API Surface

Authentication and users:
- POST /api/auth/login/
- POST /api/auth/refresh/
- POST /api/users/register/
- GET/PATCH /api/users/profile/

Transactions:
- GET/POST /api/transactions/
- POST /api/transactions/upload/
- POST /api/transactions/{id}/correct_category/
- POST /api/transactions/retrain/

Analytics and prediction:
- GET /api/analytics/summary/
- GET /api/analytics/forecast/
- GET /api/predictions/next-month/

Suggestions and reporting:
- GET /api/suggestions/
- POST /api/suggestions/simulate/
- GET /api/reports/export/?year=YYYY&month=MM

## 5. Data Model Highlights

### User
- username
- email
- monthly_income
- savings_goal
- currency

### Transaction
- user
- date
- description
- amount
- transaction_type (DEBIT/CREDIT)
- category
- source
- confidence_score
- is_uncertain
- is_manually_corrected

## 6. Reliability and Testing

Automated test coverage exists for:
- users
- transactions
- analytics
- predictions
- suggestions
- reports

Verification commands:
- backend tests
- frontend lint
- frontend build

## 7. Runtime and Environment

### Backend runtime

Primary production DB:
- PostgreSQL

Local development behavior:
- SQLite fallback available for quick startup
- can force PostgreSQL via environment flag

Important environment variables:
- DJANGO_DEBUG
- DJANGO_SECRET_KEY
- DJANGO_ALLOWED_HOSTS
- DJANGO_CORS_ALLOWED_ORIGINS
- DJANGO_USE_SQLITE
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_HOST
- POSTGRES_PORT

## 8. Suggested Next Improvements

- pagination + server-side filters on large transaction lists
- role-based admin/reporting controls
- model retraining scheduler and model version tracking
- chunk splitting for frontend bundle optimization
- deployment automation with CI/CD

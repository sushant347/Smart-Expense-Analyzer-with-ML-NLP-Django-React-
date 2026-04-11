---
phase: 1
plan: 1
wave: 1
---

# Plan 1.1: Backend Foundation & Auth

## Objective
Establish the Django base project, configure PostgreSQL, implement the custom user model for the Nepal-focused expense tracker, and configure JWT authentication.

## Context
- .gsd/SPEC.md
- .gsd/ROADMAP.md

## Tasks

<task type="auto">
  <name>Initialize Django Project & Dependencies</name>
  <files>
    requirements.txt
    core/settings.py
    core/urls.py
    manage.py
  </files>
  <action>
    - Create a requirements.txt with: Django, djangorestframework, psycopg2-binary, djangorestframework-simplejwt, django-cors-headers.
    - Start a new Django project named `core` in the current directory.
    - Update `core/settings.py` adding `corsheaders` and `rest_framework` to INSTALLED_APPS.
    - Configure PostgreSQL database named `expense_tracker` for local Windows usage (assume user: postgres).
    - Allow CORS for frontend dev (localhost:3000).
  </action>
  <verify>python -c "import django; print('Django import success!')"</verify>
  <done>Django successfully scaffolded with PostgreSQL settings applied</done>
</task>

<task type="auto">
  <name>Implement Custom User Model</name>
  <files>
    users/models.py
    users/admin.py
    users/apps.py
    core/settings.py
  </files>
  <action>
    - Run `python manage.py startapp users` (we'll script or manually create the app files in the execute phase).
    - Implement `CustomUser` in `users/models.py` inheriting from `AbstractUser`.
    - Add fields: `monthly_income` (DecimalField, null=True), `savings_goal` (DecimalField, null=True), `currency` (CharField, default='NPR').
    - Update `core/settings.py` to set `AUTH_USER_MODEL = 'users.CustomUser'`.
    - Register the CustomUser in `users/admin.py` for admin panel access.
  </action>
  <verify>type users\models.py | findstr CustomUser</verify>
  <done>CustomUser model defined and registered in settings before initial migration</done>
</task>

<task type="auto">
  <name>Configure JWT Auth API</name>
  <files>
    core/urls.py
    core/settings.py
  </files>
  <action>
    - Configure DRF in `core/settings.py` to use `rest_framework_simplejwt.authentication.JWTAuthentication`.
    - Import `TokenObtainPairView`, `TokenRefreshView` in `core/urls.py`.
    - Route POST `/api/auth/login/` to `TokenObtainPairView`.
    - Route POST `/api/auth/refresh/` to `TokenRefreshView`.
  </action>
  <verify>type core\urls.py | findstr TokenObtainPairView</verify>
  <done>Auth endpoints properly mapped for React frontend usage</done>
</task>

## Success Criteria
- [ ] Dependencies documented and setup.
- [ ] Django settings wired specifically for Postgres and local frontend connectivity.
- [ ] JWT authentication exposed via `/api/auth/login/`.

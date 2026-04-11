# SPEC.md — Project Specification

> **Status**: `FINALIZED`

## Vision
An AI-Powered Personal Finance Analyzer tailored for Nepal, combining automated transaction categorization, predictive spending analysis, and actionable budgeting insights. It replaces manual spreadsheet tracking with ML-driven automation and smart suggestions.

## Goals
1. Provide a robust data input module that handles bank CSVs (eSewa, Khalti, etc.) and manual entries.
2. Automate transaction tagging using an NLP classification model trained on Nepali merchant data.
3. Deliver deep spending analytics, forecasting, and personalized budgeting advice via a modern React/Tailwind frontend.

## Non-Goals (Out of Scope)
- Direct real-time bank API integrations (relying on CSV uploads and manual data entry).
- Production deployment pipelines (focusing on local development MVP for now).
- Handling large-scale corporate accounting (focus is purely on personal finance).

## Users
Individuals in Nepal seeking automated, insightful tracking of their expenses, savings, and financial habits across local platforms like eSewa, Khalti, IME Pay, and Nepali web banking portals.

## Constraints
- **Technical Stack**: Django REST Framework + Postgres (Backend), React + Tailwind (Frontend).
- **ML Capabilities**: TF-IDF + Logistic Regression initially for categorization; Linear Regression (upgradeable to LSTM via TensorFlow) for prediction.
- **Language/Domain**: Must explicitly support strings related to Nepali merchants (e.g., Bhatbhateni, Daraz, Pathao, Foodmandu, Tootle).

## Success Criteria
- [ ] Users can successfully register, log in (JWT), and maintain secure data isolation.
- [ ] App cleanly parses common eSewa/Khalti/Bank CSV outputs into database transaction records.
- [ ] ML categorization tags transactions and explicitly identifies "uncertain" labels requiring human review.
- [ ] Active learning loop: user corrections accurately trigger partial retraining or updates to the local classification rules.
- [ ] Analytics visualization correctly maps "predictive spending vs actuals" and flags defined unstructured spending "bad habits".

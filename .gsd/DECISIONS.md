# DECISIONS.md

## Architecture Decision Records

### 1. Model Baseline Decision
- **Date**: 2026-04-11
- **Context**: Choosing the initial ML baseline for categorization & predictions.
- **Decision**: Use TF-IDF + Logistic Regression for NLP classification (faster, lightweight). Use Linear Regression as a baseline for forecasting, with clear hooks to upgrade to LSTM (TensorFlow) later.
- **Consequences**: Local development training will be faster without needing GPU constraints.

### 2. Deployment constraints
- **Date**: 2026-04-11
- **Context**: Deciding deployment scope.
- **Decision**: Out of scope for v1.0. Architecture will remain locally isolated.
- **Consequences**: No immediate containerization.

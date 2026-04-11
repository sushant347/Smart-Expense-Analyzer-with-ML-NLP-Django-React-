# ROADMAP.md

> **Current Phase**: Not started
> **Milestone**: v1.0

## Must-Haves (from SPEC)
- [ ] Backend foundation with Django, PostgreSQL, and Simple JWT Auth.
- [ ] Reliable CSV parsing engine for local Nepali banks/wallets.
- [ ] ML transaction categorizer with an active learning feedback loop.
- [ ] Comprehensive analytics and budget forecast dashboard.
- [ ] Smart suggestions module and PDF report export.

## Phases

### Phase 1: Foundation (Backend & Auth)
**Status**: ✅ Complete
**Objective**: Establish Django project, models, and JWT authentication.
**Requirements**: REQ-AUTH-01, REQ-DB-01

### Phase 2: Data Input & Transactions
**Status**: ✅ Complete
**Objective**: Build transaction APIs and CSV parser logic.
**Requirements**: REQ-TXN-01, REQ-TXN-02

### Phase 3: AI Categorization 
**Status**: ✅ Complete
**Objective**: Implement NLP categorization model.
**Requirements**: REQ-ML-01, REQ-ML-02

### Phase 4: Analytics API & React Dashboard Foundation
**Status**: ⬜ Not Started
**Objective**: Initialize React application and connect analytics APIs.
**Requirements**: REQ-UI-01, REQ-UI-02

### Phase 5: Predictive Analytics & Smart Suggestions
**Status**: ⬜ Not Started
**Objective**: Add spending forecasting and actionable financial advice.
**Requirements**: REQ-ML-03, REQ-FEAT-01

### Phase 6: Polish, Reports, and PDF Export
**Status**: ⬜ Not Started
**Objective**: Add export functionality and finalize user experience.
**Requirements**: REQ-FEAT-02, REQ-UI-03

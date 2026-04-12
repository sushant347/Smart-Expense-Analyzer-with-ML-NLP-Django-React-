from __future__ import annotations

from datetime import date
from typing import Any

import pandas as pd


ESEWA = 'ESEWA'
KHALTI = 'KHALTI'
BANK = 'BANK'
GENERIC = 'GENERIC'


class CSVParserError(ValueError):
    pass


def _normalize_col(name: Any) -> str:
    return str(name).strip().lower().replace('\n', ' ')


def _normalize_amount(value: Any) -> float:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return 0.0

    raw = str(value).strip().replace(',', '').replace('NPR', '').replace('Rs.', '').replace('Rs', '')
    if raw in {'', '-', '--', 'nan'}:
        return 0.0
    try:
        return float(raw)
    except ValueError:
        return 0.0


def _parse_date(value: Any) -> date | None:
    if value is None or (isinstance(value, float) and pd.isna(value)):
        return None
    parsed = pd.to_datetime(value, errors='coerce', dayfirst=True)
    if pd.isna(parsed):
        return None
    return parsed.date()


def detect_csv_source(columns: list[str]) -> str:
    normalized = [_normalize_col(col) for col in columns]

    if any('esewa' in col for col in normalized) or {'paid to', 'wallet id'}.issubset(set(normalized)):
        return ESEWA

    if any('khalti' in col for col in normalized) or {'service', 'txn id'}.issubset(set(normalized)):
        return KHALTI

    bank_signals = {'withdrawal', 'deposit', 'particulars', 'value date', 'txn date'}
    if any(signal in normalized for signal in bank_signals):
        return BANK

    return GENERIC


def _pick(col_map: dict[str, int], keywords: list[str]) -> int | None:
    for key in keywords:
        if key in col_map:
            return col_map[key]
    return None


def parse_transactions_frame(frame: pd.DataFrame, fallback_source: str | None = None) -> tuple[str, list[dict[str, Any]]]:
    if frame.empty:
        raise CSVParserError('CSV file has no rows.')

    columns = [_normalize_col(col) for col in frame.columns]
    source = fallback_source or detect_csv_source(columns)
    col_map = {col: idx for idx, col in enumerate(columns)}

    if source == ESEWA:
        date_idx = _pick(col_map, ['date', 'transaction date', 'created at'])
        desc_idx = _pick(col_map, ['remarks', 'description', 'paid to', 'particulars'])
        debit_idx = _pick(col_map, ['debit', 'amount'])
        credit_idx = _pick(col_map, ['credit'])
    elif source == KHALTI:
        date_idx = _pick(col_map, ['date', 'created at'])
        desc_idx = _pick(col_map, ['service', 'description', 'remarks'])
        debit_idx = _pick(col_map, ['amount'])
        credit_idx = _pick(col_map, ['credited amount'])
    elif source == BANK:
        date_idx = _pick(col_map, ['txn date', 'value date', 'date'])
        desc_idx = _pick(col_map, ['particulars', 'description', 'narration'])
        debit_idx = _pick(col_map, ['withdrawal', 'debit', 'amount'])
        credit_idx = _pick(col_map, ['deposit', 'credit'])
    else:
        date_idx = _pick(col_map, ['date', 'transaction date'])
        desc_idx = _pick(col_map, ['description', 'remarks', 'particulars', 'detail'])
        debit_idx = _pick(col_map, ['debit', 'withdrawal'])
        credit_idx = _pick(col_map, ['credit', 'deposit'])

    if date_idx is None and desc_idx is None and debit_idx is None and credit_idx is None:
        raise CSVParserError('Unsupported CSV format: required columns not found.')

    parsed_rows: list[dict[str, Any]] = []

    for _, row in frame.iterrows():
        parsed_date = _parse_date(row.iloc[date_idx]) if date_idx is not None else None
        description = str(row.iloc[desc_idx]).strip() if desc_idx is not None else ''

        debit_amount = _normalize_amount(row.iloc[debit_idx]) if debit_idx is not None else 0.0
        credit_amount = _normalize_amount(row.iloc[credit_idx]) if credit_idx is not None else 0.0

        amount = 0.0
        transaction_type = 'DEBIT'

        if credit_amount > 0:
            amount = credit_amount
            transaction_type = 'CREDIT'
        elif debit_amount > 0:
            amount = debit_amount
            transaction_type = 'DEBIT'
        elif debit_idx is not None:
            # Generic single amount column handling
            amount = _normalize_amount(row.iloc[debit_idx])
            if amount < 0:
                amount = abs(amount)
                transaction_type = 'DEBIT'
            else:
                transaction_type = 'DEBIT'

        if amount <= 0:
            continue

        parsed_rows.append(
            {
                'date': parsed_date,
                'description': description or f'{source} CSV Import',
                'amount': round(amount, 2),
                'transaction_type': transaction_type,
                'source': f'CSV_{source}',
            }
        )

        if parsed_rows[-1]['date'] is None:
            parsed_rows[-1]['date'] = date.today()

    return source, parsed_rows

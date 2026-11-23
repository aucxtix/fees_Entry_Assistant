"""
==============================================================================
GOOGLE SHEET CONFIGURATION & SAFETY SETTINGS
==============================================================================
Central configuration for sheet structure, month rules, and safety thresholds.
"""

SHEET_CONFIG = {
    # 1. Google Sheet Tab Name
    "sheet_tab_name": "Fees",

    # 2. Fixed Metadata Columns (Matches Kiya Tuition Classes Database)
    "fixed_columns": [
        {"col_index": 0, "col_letter": "A", "header": "Student name", "key": "name"},
        {"col_index": 1, "col_letter": "B", "header": "Std", "key": "std"},
        {"col_index": 2, "col_letter": "C", "header": "School Name", "key": "school"},
        {"col_index": 3, "col_letter": "D", "header": "Fees", "key": "monthly_fee"}
    ],
    "fixed_column_count": 4,

    # 3. Month Header Format (Three-letter month, space, four-digit year, e.g. Oct 2026)
    "default_month_format": "text",
    "month_header_format": "%b %Y",
    "month_header_regex": r"^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$",

    # 4. Fallback Rule for Students With No Recorded Payments
    "no_payment_rule": "current_month",

    # Starting month columns
    "initial_month_columns": ["Oct 2026", "Nov 2026", "Dec 2026"],

    # ==============================================================
    # SAFETY THRESHOLDS (Easily configurable)
    # ==============================================================
    # Amount above which the app asks for special confirmation
    "large_amount_threshold": 10000,

    # Duplicate payment window in seconds (warns if same student + amount in this time)
    "duplicate_window_seconds": 60
}


def col_number_to_letter(col_idx):
    """
    Converts 0-based column index to Excel / Google Sheet column letter.
    0 -> A, 1 -> B, 2 -> C, ... 25 -> Z, 26 -> AA, etc.
    """
    letter = ""
    col_idx += 1
    while col_idx > 0:
        col_idx, remainder = divmod(col_idx - 1, 26)
        letter = chr(65 + remainder) + letter
    return letter

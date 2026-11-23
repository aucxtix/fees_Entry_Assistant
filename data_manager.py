"""
Data Manager for Fees Entry Assistant
Persists all student records, fee amounts, and payment history.
Initializes from data/students.csv.
"""

import os
import csv
import json
from sheet_config import SHEET_CONFIG

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
CSV_PATH = os.path.join(DATA_DIR, "students.csv")
EXAMPLE_CSV_PATH = os.path.join(DATA_DIR, "students.example.csv")
JSON_PATH = os.path.join(DATA_DIR, "fees_database.json")


def load_database():
    """Loads database from JSON file; if not found, parses from CSV."""
    if os.path.exists(JSON_PATH):
        try:
            with open(JSON_PATH, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            print(f"Error reading {JSON_PATH}, falling back to CSV: {e}")

    # Initialize from CSV
    months = list(SHEET_CONFIG["initial_month_columns"])
    students = []
    student_id = 1

    csv_path = CSV_PATH if os.path.exists(CSV_PATH) else EXAMPLE_CSV_PATH
    if os.path.exists(csv_path):
        with open(csv_path, "r", encoding="utf-8") as f:
            reader = csv.reader(f)
            header = next(reader, None)

            # Month columns are Column E onwards (index 4 onwards)
            if header and len(header) > 4:
                months = [h.strip() for h in header[4:] if h.strip()]

            for row in reader:
                if not row or not any(cell.strip() for cell in row):
                    continue
                name = row[0].strip()
                if not name or name.lower() == "total":
                    continue

                std = row[1].strip() if len(row) > 1 else ""
                school = row[2].strip() if len(row) > 2 else ""
                fee_str = row[3].strip() if len(row) > 3 else "0"
                try:
                    fee = int(float(fee_str))
                except ValueError:
                    fee = 0

                payments = {}
                # Read any existing payments in month columns
                for idx, month in enumerate(months):
                    col_idx = 4 + idx
                    if len(row) > col_idx and row[col_idx].strip():
                        try:
                            payments[month] = int(float(row[col_idx].strip()))
                        except ValueError:
                            pass

                students.append({
                    "id": student_id,
                    "name": name,
                    "std": std,
                    "school": school,
                    "monthly_fee": fee,
                    "payments": payments
                })
                student_id += 1

    db = {
        "months": months if months else ["2026-12-01"],
        "students": students,
        "next_student_id": student_id
    }
    save_database(db)
    return db


def save_database(db):
    """Saves database state to JSON file."""
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump(db, f, indent=2, ensure_ascii=False)


def find_students_by_query(query_name, amount=None, std=None):
    """
    Finds matching students. Handles duplicate names intelligently.
    e.g. if query is 'Alex' and amount is 900, matches Alex (Std 1).
    """
    db = load_database()
    cleaned = query_name.strip().lower()

    # Direct match on clean name
    exact_matches = [s for s in db["students"] if s["name"].lower() == cleaned]
    if not exact_matches:
        # Partial match
        exact_matches = [s for s in db["students"] if cleaned in s["name"].lower() or s["name"].lower() in cleaned]

    if not exact_matches:
        return []

    if len(exact_matches) == 1:
        return exact_matches

    # If multiple matches, try to disambiguate by amount or class
    if amount is not None:
        amount_matches = [s for s in exact_matches if s["monthly_fee"] == amount]
        if len(amount_matches) == 1:
            return amount_matches

    if std is not None:
        std_matches = [s for s in exact_matches if s["std"].lower() == str(std).lower()]
        if len(std_matches) == 1:
            return std_matches

    return exact_matches

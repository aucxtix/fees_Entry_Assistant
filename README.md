# Fees Entry Assistant 🎓💳

A smart, AI-powered conversational web application built for school administrators and tuition teachers to record, track, and manage student monthly tuition fees effortlessly.

Admin messages like *"Student A paid 2500"* or *"Student B deposited 1500 for Jan 2027"* are parsed via Gemini AI / pattern recognition, mapped to the correct student, and booked into the fee ledger with automated month progression, duplicate detection, and 1-click safety controls.

---

## ✨ Features

- 🤖 **Smart Natural Language Fee Entry**: Type or speak natural payment notes in English or Hinglish (e.g., *"Student Dummy has paid 2000"*).
- 📅 **Automated Target Month Calculation**: Automatically detects the next unpaid month for any student (including year rollovers like `Dec 2026` ➡️ `Jan 2027`) or honors explicit month requests.
- 🛡️ **Safety & Confirmation Pipeline**:
  - Interactive proposal cards with green **Confirm** and **Cancel** buttons.
  - **1-Click Undo**: Accidentally confirmed a payment? Revert it instantly with one tap.
  - **Duplicate Detection**: Flags potential double payments for the same month.
  - **Gap Detection & Large Amount Alerts**: Warns when skipping months or entering amounts exceeding ₹10,000.
  - **Smart Disambiguation**: Asks for school/class clarification when multiple students share the same name (e.g., *Alex* in Std 1 vs. Std 5 at Example School).
- 📊 **Live Interactive Ledger**:
  - Live table rendering with real-time student search filtering.
  - Instant monthly column insertion.
  - **Delete Column** control with safety confirmation modal.
- 📥 **Download Report**: One-click CSV export of the entire fee sheet including monthly totals and collection summaries.
- 👤 **Student Management**: Modal to quickly enroll new students with Name, School, Standard, and Monthly Fee.
- 💾 **SQLite Persistence**: ACID transaction storage with automatic `/tmp` fallback for serverless environments (Vercel).

---

## 🛠️ Tech Stack

- **Backend**: Python 3.9+, Flask, Gunicorn
- **AI / NLU**: Google Gemini API (`@google/genai`)
- **Database**: SQLite3 (`data/fees.db`, local and ignored by Git)
- **Frontend**: HTML5, Tailwind CSS, Lucide Icons, Vanilla JavaScript
- **Deployment**: Vercel Serverless Ready (`api/index.py`, `vercel.json`) & Docker Ready (`Dockerfile`, `Procfile`)

---

## 🚀 Quickstart & Local Setup

### 1. Clone the Repository
```bash
git clone https://github.com/vap0611/fees_Entry_Assistant.git
cd fees_Entry_Assistant
```

### 2. Create and Activate Virtual Environment
```bash
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Open `.env` and add your Gemini API key (optional for local testing, fallback regex parser is included):
```ini
GEMINI_API_KEY=your_gemini_api_key_here
PORT=5001
FLASK_DEBUG=false
```

### 5. Start the Application
```bash
python3 app.py
```
Visit **[http://localhost:5001](http://localhost:5001)** in your browser.

---

## ☁️ Deploying to Vercel

This repository is pre-configured for zero-warning deployment on Vercel:

1. **Push your code to GitHub** (public or private repository).
2. Go to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New ➡️ Project**.
3. Import your `fees_Entry_Assistant` repository.
4. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key from Google AI Studio.
5. Click **Deploy**. Vercel will build and serve the application via serverless Python automatically.

---

## 📁 Project Structure

```text
fees-entry-assistant/
├── api/
│   └── index.py            # Vercel serverless entrypoint
├── app.py                  # Flask application & REST API routes
├── data/
│   └── students.example.csv # Synthetic seed data; local records stay untracked
├── mock_db.py              # Business logic & payment proposal pipeline
├── month_logic.py          # Target month calculation & date utilities
├── sheet_config.py         # Table schema & configuration
├── sqlite_db.py            # SQLite schema, queries, & serverless fallback
├── gemini_service.py       # Gemini API integration & intent parser
├── static/
│   ├── css/style.css       # Custom styling & animations
│   └── js/app.js           # Client-side table, chat, and modal handlers
├── templates/
│   └── index.html          # Responsive single-page interface
├── .env.example            # Environment template (safe for git)
├── .gitignore              # Git ignore rules (prevents secret leaks)
├── requirements.txt        # Production dependencies
├── vercel.json             # Vercel routing configuration
├── Dockerfile              # Docker container definition
├── Procfile                # Heroku/Render process file
└── README.md               # Documentation
```

---

## 📜 License

MIT License. Free for educational and commercial use.


# BakersAlley 2.0

A comprehensive Bakery Management System built with React, TypeScript, and Tailwind CSS. Featuring AI-powered recipe optimization, industrial costing, and distribution management.

## 🚀 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/bakersalley-erp.git
cd bakersalley-erp
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add your Google Gemini API Key:
```env
API_KEY=your_gemini_api_key_here
```

For backend hardening in PHP, configure these server environment variables:

```env
BAKERY_TOKEN_SECRET=replace_with_long_random_secret_min_32_chars
BAKERY_API_KEY=replace_with_separate_api_key_for_read_endpoint
BAKERY_ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
BAKERY_LOGIN_MAX_ATTEMPTS=5
BAKERY_LOGIN_WINDOW_SECONDS=900
BAKERY_LOGIN_LOCKOUT_SECONDS=900
BAKERY_BOOTSTRAP_ADMIN_PASSWORD=replace_with_strong_one_time_password
BAKERY_BOOTSTRAP_ADMIN_IDENTITY=admin@bakery.com
BAKERY_BOOTSTRAP_ADMIN_NAME=System Admin
```

Important:

- Rotating `BAKERY_TOKEN_SECRET` invalidates all existing session tokens.
- Do not keep real API keys in frontend code for production.
- Restrict `BAKERY_ALLOWED_ORIGINS` to your known domains only.

### 4. Run the development server
```bash
npm run dev
```

## Auto Sync to GitHub

This project can auto-commit and auto-push saved changes to GitHub.

- Start manually: `npm run autosync`
- VS Code task: `Auto Sync to GitHub` (configured to start on folder open)

Environment variables (optional):

- `AUTO_SYNC_REMOTE` default: `origin`
- `AUTO_SYNC_BRANCH` default: current branch
- `AUTO_SYNC_DEBOUNCE_MS` default: `8000`

Notes:

- The watcher commits all tracked and untracked file changes in this repo.
- Keep it disabled when doing sensitive or experimental work you do not want pushed.

## 🛠 Features
- **Recipe Builder:** Advanced ABC costing with automated material waste calculation.
- **Production Hub:** Live shift timers and daily capacity planning.
- **S&OP Room:** Demand vs Supply forecasting with AI analysis.
- **Management Accountant:** Real-time Manufacturing Accounts, P&L, and Cash Flow.
- **Distribution:** Multi-outlet stock management and custom price overrides.
- **Historical Migration:** Manual input for opening balances in Debtors and Creditors.

## 📄 License
MIT

# Emmanuel Real Estate — Luxury Property Sales & Executive CRM

An ultra-luxury residential sales website and private executive CRM portal for prime ready homes and architectural off-plan investments across Dubai's most prestigious communities (Palm Jumeirah, Downtown, Dubai Marina, Business Bay, Dubai Hills, and JVC).

---

## 🏛️ Features Overview

1. **Luxury Public Experience:**
   - Calm, minimal Dubai developer aesthetic with generous whitespace and full-width imagery.
   - Prices strictly in UAE Dirhams (AED).
   - Dynamic Ready Residences directory with multi-filtering (Community, Type, Bedrooms, Price).
   - Architectural Off-Plan Developments with payment schedules and handover milestones.
   - Interactive Mortgage & Upfront Costs Calculator in AED.
   - Property Valuation & Consignment intake form (`Sell Your Property`).
   - Global floating WhatsApp concierge and instant "Call Me Back" private drawer.
   - Elegant luxury page transition loader and custom 404/500 error experiences.
   - Comprehensive mobile responsiveness across all devices and viewport dimensions.

2. **Automated Lead Capture & Anti-Spam Throttling:**
   - Every form captures the buyer directly into the CRM database with originating source tracking.
   - IP rate limiting (10-second submission cooldown, 12 max per hour per IP) and honeypot bot trap.
   - Standardized user confirmation: *"Thank you. An Emmanuel Real Estate advisor will contact you within 24 hours."*

3. **Intelligent Lead Scoring (0 to 100) & Temperature Ratings:**
   - Cash buyers (+20 pts) vs. Mortgage (+10 pts)
   - Immediate timeframe readiness (+20 pts) vs. 1–3 months (+15 pts)
   - Verified contact number (+15 pts)
   - Budget scale (+10 to +25 pts for UHNW portfolios)
   - Specific property or viewing selection (+15 pts)
   - Dynamic badges: **HOT** (70–100), **WARM** (45–69), **COLD** (0–44)

4. **Executive CRM Portal (`/admin-login.html` & `/admin.html`):**
   - **Real-Time Notification Bell**: Unread lead badge automatically refreshed every 60 seconds with dropdown preview.
   - **Executive Dashboard**: Live KPIs (New Leads Today, Total Pipeline AED, Viewings Scheduled, Closed Sales & 2% Commission).
   - **Kanban Pipeline Board**: Drag-and-drop cards between 6 stages (`New` → `Contacted` → `Viewing` → `Offer` → `Won` → `Lost`).
   - **Leads Directory**: Live search, filters by stage/temperature/advisor, and **Export to Excel** (`.csv`).
   - **Lead Dossier Drawer**: Complete buyer profile, source form, stage & advisor selector, direct **Call** and **WhatsApp** buttons, and discussion notes timeline.
   - **Deal Won Workflow**: Prompts for agreed sale price, automatically calculates **2% agency commission**, and marks the property as **Sold**.
   - **Viewings Schedule**: Scheduled private walkthroughs with client details and VIP notes.
   - **Agent Performance Leaderboard**: Monthly targets vs. closed volume and commission earnings.
   - **Stale Leads Alert**: Flags active leads with no notes or activity for 3+ days.
   - **Inventory Management**: Add, edit, and remove ready residences and off-plan projects.
   - **Role-Based Security**: Directors access full agency data; Advisory Partners see only their assigned leads.

5. **Search Engine Optimization & Privacy:**
   - Public pages indexed with `sitemap.xml`, OpenGraph tags, and Schema.org `RealEstateAgent` JSON-LD structured data.
   - Private CRM and login areas protected with `<meta name="robots" content="noindex, nofollow">` and blocked in `robots.txt`.
   - Security `.gitignore` ensures database credentials and `.env` files are never tracked or leaked.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (included with Node.js)

### 2. Installation
Open your terminal in the project directory and install dependencies:
```bash
npm install
```

### 3. Running the Server Locally
Start the server:
```bash
npm start
```
The application will launch on port **5000**:
- 🌐 **Public Website:** [http://localhost:5000/](http://localhost:5000/)
- 🔒 **Private Admin CRM Portal:** [http://localhost:5000/admin-login.html](http://localhost:5000/admin-login.html)

---

## 🗄️ Neon PostgreSQL Database Setup

The application features a dual-engine architecture:
- **Instant Local Seed Store:** Works out-of-the-box with pre-seeded luxury residences, off-plan developments, advisory partners, and 40 scored leads.
- **Neon Cloud PostgreSQL:** Connects automatically when your database URL is supplied.

### Where to paste your Neon database link:
1. Open the [`.env`](.env) file in the project root directory.
2. Locate **Line 14**:
   ```env
   DATABASE_URL=
   ```
3. Paste your Neon connection string after the equals sign, for example:
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
4. Save the file and restart the server (`npm start`). The database engine will automatically create all tables and populate the complete portfolio.

---

## 🔑 Executive Login Credentials

| Role | Account | Corporate Email | Password | Access Scope |
| :--- | :--- | :--- | :--- | :--- |
| **Principal Director** | Director / Admin | `admin@emmanuelrealestate.ae` | `EmmanuelLuxury2026!` | **Full Agency Access** (All leads, pipeline, sales, 2% commission, inventory CRUD) |
| **Senior Managing Partner** | Alexander Wright | `alexander@emmanuelrealestate.ae` | `agent123` | **Assigned Leads Only** |
| **Private Client Partner** | Elena Rostova | `elena@emmanuelrealestate.ae` | `agent123` | **Assigned Leads Only** |
| **Senior Associate Director**| Tariq Al-Mansoor | `tariq@emmanuelrealestate.ae` | `agent123` | **Assigned Leads Only** |

*(Quick-fill credential buttons are available on the login screen for testing).*

---

## 🛡️ Security & Privacy Notice
- All database passwords, tokens, and environment configurations are strictly isolated in `.env`.
- `.env` and sensitive runtime assets are listed in `.gitignore` and **will never be committed to GitHub**.
- Search engine crawlers (Google, Bing) are instructed via `robots.txt` and `noindex` headers to ignore all administrative, authentication, and CRM endpoints.

---

## 📦 Pushing to GitHub (Step-by-Step)

Follow these exact steps to publish your project securely to your GitHub repository:

1. **Initialize Git:**
   ```bash
   git init
   ```

2. **Stage all clean project files:**
   ```bash
   git add .
   ```
   *(Your `.env` and `node_modules` are automatically ignored by `.gitignore`).*

3. **Create the initial commit:**
   ```bash
   git commit -m "feat: initial commit of Emmanuel Real Estate platform and CRM"
   ```

4. **Link to your GitHub repository:**
   Create a new repository on [GitHub](https://github.com/new) (e.g. `emmanuel-real-estate`), then run:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPOSITORY.git
   git branch -M main
   git push -u origin main
   ```

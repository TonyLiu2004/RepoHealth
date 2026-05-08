# RepoHealth

**The Headless Portfolio Janitor.** RepoHealth is a pragmatic, on-demand maintenance tool designed to combat "Portfolio Rot." It crawls your GitHub repositories, extracts links from your documentation and code, and performs high-fidelity audits to ensure your professional work stays functional and accessible.

---

## 🚀 Quick Start (Local Deployment)

### Backend

1. **Navigate to the backend directory:**
`cd backend`
2. **Install dependencies:**
`pip install -r requirements.txt`
3. **Start the server:**
`python main.py`

### Frontend

1. **Navigate to the frontend directory:**
`cd frontend`
2. **Install dependencies:**
`npm install`
3. **Start the development server:**
`npm run dev`

---

## 📌 The Problem: Portfolio Rot

As a developer’s portfolio grows, older projects naturally degrade. Links break, hosting services change, and SSL certificates expire. Manually checking these is time-consuming and often forgotten, leading to broken projects that can hurt a developer’s professional image.

## 🛠️ The Solution: RepoHealth

RepoHealth provides **Stateless, On-Demand Validation**. Unlike heavy, always-on monitoring services, RepoHealth is built on a "Zero-Overhead" philosophy:

* **On-Demand:** Run it only when you need a clean-up. No persistent background processes.
* **Privacy-First:** By opting out of a persistent database, we eliminate the costs and privacy concerns associated with storing repository credentials long-term.
* **High Fidelity:** Leveraging the **Playwright** headless browser, it verifies the actual rendering of a page, ensuring accuracy where standard server responses fail.

---

## 🏗️ Technical Architecture

### Stack

* **Frontend:** React.js for a modular UI, utilizing **Recharts** for visual health telemetry.
* **Backend:** FastAPI (Python) for high-performance, asynchronous REST routing.
* **Logic:** A hybrid validation engine using **Requests** (for speed) and **Playwright** (for accuracy).
* **Concurrency:** Managed via **Asyncio** to handle hundreds of concurrent links efficiently.

### Execution Pipeline

1. **GitHub Auth:** User logs in via GitHub to select target repositories.
2. **Pre-filtering:** The backend recursively scans the repo, ignoring noise (folders/internal paths) and targeting high-value files (READMEs, etc.).
3. **Link Extraction:** Regex-based extraction of all web URLs.
4. **Hybrid Verification:**
* **Tier 1:** A lightweight check via HTTP requests.
* **Tier 2 (Escalation):** If a site returns ambiguous errors (400s, 403s, 503s), a headless Playwright browser is launched to verify the actual UI render.


5. **Reporting:** Results are consolidated into a clean JSON payload and visualized on the dashboard.

---

## ⚙️ Performance & Async Control

To ensure the application remains stable under heavy loads, RepoHealth implements several concurrency guardrails:

* **Task Aggregation:** Uses `asyncio.gather` to fetch file contents from GitHub simultaneously, reducing I/O wait times.
* **Link Semaphores:** Throttles concurrent link checks to a limit of **10** to prevent backend exhaustion and IP flagging.
* **Browser Semaphores:** Limits headless Chromium instances to **3** concurrent browsers to balance speed with server memory management.

---

## 🗺️ Roadmap: What's Next?

* **Recurring Automated Checks:** Scheduled interval audits to keep work functional without user intervention.
* **Automated Alerts:** Email notifications to proactively notify the user of any issues.
* **Persistence:** Adding a database layer to store user preferences and "Featured Project" selections.
* **Custom Filtering:** Per-repo configuration to "mute" specific links (e.g., example code or legacy placeholders).

---

> **RepoHealth:** Ensuring that as your portfolio and career grows, the technical debt of your past work stays at zero.

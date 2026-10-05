# CampusFix — Smart Campus Issue Reporting Platform

> **1-Hour Website Development Competition Prototype**  
> A centralized, responsive SaaS platform empowering students and campus facility administrators to report, prioritize, and track campus infrastructure issues in real-time.

---

## 📌 Problem & Solution

* **The Problem:** Students encounter campus issues such as damaged laboratory equipment, cleanliness problems, broken lights, water leaks, Wi-Fi outages, and infrastructure damage. Reporting is currently informal (word-of-mouth or unorganized chat groups), and students cannot track the resolution process.
* **The Solution:** **CampusFix** provides a modern, centralized platform for reporting, smart-prioritizing, and tracking issues across campus. It features an on-device **Smart Priority Recommendation Engine** that scans issue descriptions for hazards (without external APIs) and an interactive **Kanban-style tracking board** with full LocalStorage persistence.

---

## 🚀 Key Features

### 1. 🤖 Smart Priority Recommendation Engine (No External APIs)
* **Real-time Keyword Heuristics:** Analyzes keywords in the issue title and description as the user types.
* **Hazard & Safety Detection:**
  * **High Priority Signals:** `fire`, `sparks`, `burning`, `exposed wire`, `live voltage`, `burst pipe`, `flooding`, `ceiling crack`, `shattered glass`, `gas leak`, `safety hazard`.
  * **Medium Priority Signals:** `wi-fi dead zone`, `projector broken`, `hdmi loose`, `ac not cooling`, `water cooler leak`, `door lock jammed`.
  * **Low Priority Signals:** `flickering lamp`, `paint scuff`, `squeaky hinge`, `whiteboard marker`, `routine cleaning`.
* **Explainable AI:** Displays confidence score (e.g., *98% Confidence*), matched keyword pills, and a clear reason for the recommendation.
* **User Sovereignty:** Automatically selects the recommended priority while providing 100% manual override anytime.

### 2. 📊 SaaS-Style Operations Dashboard
* **4 Live KPI Summary Cards:**
  * **Total Reported Issues**
  * **Pending Triage** (with high-priority safety pill)
  * **In Progress** (assigned to field staff)
  * **Resolved** (with live resolution percentage)
* **Issue Status Overview:** Interactive stacked workflow distribution bar showing proportional completion rates.
* **Issues by Category:** Visual breakdown across **Electrical**, **Wi-Fi**, **Cleanliness**, **Plumbing**, **Equipment**, and **Infrastructure**.
* **Recent Campus Issues Table:** Filterable by *All*, *High Priority*, *Pending*, and *In Progress*, with inline status switching and quick detail inspection.
* **Smart Insight Panel:** Live diagnostic alerts detecting hazard clusters and high-volume campus hotspots.

### 3. 📋 "My Reports" Kanban Tracking Board
* **3-Column Agile Workflow:**
  * ⏳ **Pending** (Awaiting triage / review)
  * 🔄 **In Progress** (Assigned to technician)
  * ✅ **Resolved** (Remediated and verified)
* **HTML5 Drag-and-Drop:** Drag cards seamlessly between columns with automatic LocalStorage synchronization.
* **Single-Click Quick Actions:** Touch/keyboard-friendly transition buttons (`Start →`, `✓ Resolve`, `Reopen`) on every card.
* **Live Filtering:** Instant search input, Category dropdown filter, and Priority filter.

### 4. 🗄️ Full LocalStorage Data Persistence
* All submitted issues, edits, and status changes are stored in browser `localStorage`.
* **Pre-seeded with 8 realistic campus issues** (electrical hazards, library Wi-Fi drop, pipe burst, classroom projector defect) for an immediate complete experience upon launch.
* **Reset to Clean Seed Dataset:** One-click reset button under *Settings* specifically crafted for competition judges to reset demo state.
* **JSON Export:** Download all campus issue records directly as a structured JSON file.

### 5. 🎨 Visual Hierarchy & Aesthetics
* **Background:** Warm off-white / light grey (`#F6F7F9`).
* **Cards:** Pure white cards (`#FFFFFF`) with subtle borders (`#E5E7EB`) and soft depth shadows.
* **Typography:** Modern, legible typography via **Inter** font with JetBrains Mono for ticket IDs.
* **Brand Accents:**
  * Primary Brand Orange: `#FF5B26` / `#F97316`
  * Resolved Emerald Green: `#10B981` / `#047857`
  * In Progress Blue: `#3B82F6` / `#1D4ED8`
  * High-Priority Hazard Red: `#DC2626` / `#FEF2F2`
* **Icons:** 100% vector Lucide SVG icons built directly into the codebase with zero external icon font dependencies.

---

## 📂 File Architecture

```
CampusFix/
├── index.html               # Main SPA layout with Sidebar, Topbar, and Views
├── start.bat                # 1-click launcher for Windows
├── tests.html               # Automated 22-test verification suite
├── css/
│   ├── styles.css           # Design tokens, variables, typography, layout, and tables
│   ├── dashboard.css        # KPI cards, progress overview, category meters, insight panel
│   ├── kanban.css           # 3-column Kanban layout, drag-drop dropzones, priority cards
│   └── modal.css            # Report modal, details dialog, smart recommendation box, toast
├── js/
│   ├── app.js               # Main SPA orchestrator, hash router, global search, shortcut '/'
│   ├── store.js             # LocalStorage state management, seed data, reactive subscriber
│   ├── smart-engine.js      # Heuristic NLP keyword analyzer & campus insight generator
│   ├── icons.js             # Lucide SVG vector icon library
│   ├── modal.js             # Reusable modal controller for reporting and issue inspection
│   └── views/
│       ├── dashboard.js     # SaaS dashboard view
│       ├── kanban.js        # My Reports Kanban board view
│       ├── report.js        # Issue reporting view with live AI analysis & scenario presets
│       ├── resolved.js      # Resolved issues audit archive view
│       ├── analytics.js     # Category & priority charts, hotspot rankings, SLAs
│       ├── insights.js      # Deep-dive campus diagnostics & heuristic documentation
│       └── settings.js      # Role switcher (Student/Admin), Seed reset, JSON export
└── README.md                # Project documentation
```

---

## ⚡ How to Run Locally

### Option 1: Double-Click (Windows)
Double-click [`start.bat`](start.bat) in the project root directory. It will start a local server at `http://localhost:8080` and open your default web browser automatically.

### Option 2: Command Line (Python)
Run the built-in HTTP server:
```bash
python -m http.server 8080
```
Then navigate to: **`http://localhost:8080`**

### Option 3: Direct File Open
You can also open [`index.html`](index.html) directly in any modern browser (Chrome, Edge, Firefox, Safari) using the local server or an IDE Live Server.

---

## 🧪 Automated Test Suite

An automated test suite is included in [`tests.html`](tests.html) covering 22 test specifications:
1. Seed dataset initialization (8 realistic campus tickets)
2. LocalStorage persistence and subscriber reactivity
3. High, Medium, and Low Smart Priority keyword classifications
4. Issue creation, status transitions, and resolution note tracking
5. Dynamic KPI calculations and resolution percentage updates
6. Heuristic hotspot and hazard insight detection

To view test results:
Open **`http://localhost:8080/tests.html`** in your browser. All **22 / 22 Tests Pass**.

---

## 🎯 Competition Evaluation Guide

To experience all features in under 2 minutes:
1. **Explore the Dashboard:** Observe the 4 KPI cards, the Issue Status Overview bar, and the Smart Insight Panel.
2. **Test Smart Priority AI:**
   * Click **+ Report Issue** in the top bar or sidebar.
   * Under *"Try Smart Recommendation Test Prompts"* on the right, click **⚡ Dangerous Sparking**.
   * Notice how the Smart Priority Engine instantly detects *"Fire/Combustion Risk"* and *"Electrical Sparking"*, displays *98% Confidence*, and auto-selects **High Priority**.
   * Click the Low or Medium card to verify that user manual override is smooth and supported.
3. **Submit an Issue:** Click *"Submit Campus Issue"* and see it appear in the **My Reports** Kanban board.
4. **Drag & Drop in Kanban:** Drag a card from **Pending** to **In Progress**, or click the quick action **✓ Resolve** button. Notice that dashboard stats and resolution rates update instantly.
5. **Search Anything:** Press the `/` key on your keyboard to instantly focus the search bar. Type *"Library"* or *"Plumbing"* to view instant results.
6. **Reset Dataset:** Go to **Settings** and click **Reset Seed Data** to restore the pristine competition state anytime.

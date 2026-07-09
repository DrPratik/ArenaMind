# ArenaMind — Smart Stadiums & Operations Copilot 🏟️🧠

**ArenaMind** is a GenAI-enabled, single-model architecture designed to solve Challenge 4 (Smart Stadiums & Tournament Operations) for the FIFA World Cup 2026. 

By utilizing a deterministic rule engine paired with a role-aware AI companion (Gemini 2.5 Flash), ArenaMind enhances the stadium experience across two connected surfaces sharing a single backend.

## 🎯 How It Targets the Root Challenge

Our solution was explicitly built to address the core problem statement requirements:

1. **Navigation & Accessibility (Fan App)** ♿️
   - Generates personalized, step-by-step routing for fans using their exact e-ticket gate assignment.
   - Calculates specific `wheelchair` accessible routes or `less_crowded` routes dynamically based on real-time stadium congestion.

2. **Multilingual Assistance (Fan App)** 🌐
   - Features a native Web Speech API integration that allows fans to speak in 6 different languages (English, Spanish, Portuguese, French, Hindi, Arabic).
   - The AI automatically responds in the fan's chosen language, breaking down communication barriers.

3. **Crowd Management & Operations Intelligence (Organizer Dashboard)** 📊
   - A real-time SVGs heatmap visualizes stadium congestion.
   - The **30-Min Predictive Forecaster** proactively flags gates that are trending toward critical overload *before* they happen, providing specific action items.
   - The **Ops Assistant** allows organizers to issue natural-language directives (e.g., "divert crowd from G8 to G1") which automatically generate and log operational incidents for volunteers.

4. **Incident Triage & Volunteer Coordination (Backend/Shared)** 📋
   - Volunteers can use the Fan App (switched to Volunteer role) to securely log detailed incident reports via chat (medical, security, maintenance).
   - These incidents instantly appear in the Organizer Dashboard's live feed, where staff can filter by priority (P1-P4) and update statuses.

## 🏗️ Architecture & Software Principles

The codebase has been strictly engineered according to **SOLID principles** and Clean Architecture, demonstrating enterprise-grade quality:

- **Single Responsibility Principle (SRP):** The frontend relies on granular, decoupled components (`CrowdForecaster`, `LostFanScanner`, `OpsAssistant`) orchestrated by the main Dashboard.
- **Controller/Service Pattern:** The Express API routes (Controllers) delegate all business logic, data fetching, and caching to isolated Service classes (e.g., `TournamentService`).
- **Defensive Programming:** Extensive SQL parameterization, robust input sanitization, and fallback MockLLM engines ensure the system degrades gracefully and resists injection attacks.
- **Determinism First:** "Rules decide. The LLM only phrases." The AI never hallucinates navigation or severity; it strictly wraps JSON output from hardcoded algorithms.

## 🚀 Getting Started

### Prerequisites
- Node.js v18+
- npm

### Installation & Run

1. **Install Dependencies:**
   ```bash
   # Install backend dependencies
   cd server
   npm install

   # Install frontend dependencies
   cd ../client
   npm install
   ```

2. **Environment Variables:**
   - In the `server/` directory, copy `.env.example` to `.env` and add your `GEMINI_API_KEY` and `FOOTBALL_DATA_API_KEY`.

3. **Start the Development Servers:**
   ```bash
   # In the server/ directory
   npm run dev

   # In the client/ directory (new terminal)
   npm run dev
   ```

The application will be running at `http://localhost:5173`.

## 🧪 Testing

A comprehensive test suite verifies the business logic and security of the application.

```bash
cd server
npm test
```

- `tests/crowd.test.ts`: Unit tests verifying the deterministic crowd risk calculations.
- `tests/security.test.ts`: Integration tests verifying prompt injection defenses, role-based access control (RBAC), and SQL injection defenses.

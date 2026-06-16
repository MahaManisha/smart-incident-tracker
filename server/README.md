# 📡 Smart Incident Tracker — Backend API Engine

Welcome to the backend API engine for the **Smart Incident Tracker (INFINITUM Edition)**.

This is a high-availability MVC (Model-View-Controller) server built using **Node.js**, **Express**, **MongoDB Atlas**, and **Socket.io** for real-time intelligence feeds, SLA background automation, and active notification dispatch.

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables in `.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=mongodb+srv://...
   JWT_SECRET=your_secret_key
   CLIENT_URL=http://localhost:5173
   ```
3. Run in development mode (with hot-reloads via nodemon):
   ```bash
   npm run dev
   ```
4. Start in production mode:
   ```bash
   npm start
   ```

---

## ⚙️ Core Architectures
- **SLA & Cron Automations (`jobs/slaChecker.js`):** Continuously checks incident status windows, raises priority levels, and records compliance states.
- **Escalation Engine (`services/escalationService.js`):** Intelligently flags overdue incidents and reassigns them to secondary rosters.
- **Socket Dispatcher (`socket.js` & `server.js`):** Sets up persistent bi-directional connections for team channels and individual notifications.
- **REST Gateway (`routes/`):** Exposes secured endpoints for tracking incidents, rendering service topologies, generating analytical summaries, and managing profiles.

For full blueprints, endpoints, and deployment parameters, see the [Root README.md](../README.md).

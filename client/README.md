# 🛰️ Smart Incident Tracker — Client Application

Welcome to the frontend app for the **Smart Incident Tracker (INFINITUM Edition)**.

This is a reactive Single Page Application built using **React 19**, **Vite 7**, and structured modern CSS following the holographic cyberpunk "INFINITUM" theme.

## 🚀 Quick Start

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables. Create a `.env` file in this directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

---

## 🛠️ Main App Structure
- **`src/api/`**: Integrates with the backend REST endpoints.
- **`src/components/`**: Reusable modular widgets (such as the SLA tracker, custom loader, and system charts).
- **`src/contexts/`**: Context state for Socket connection, Authentication, and live Notifications.
- **`src/pages/`**: Includes 20+ specialized page views for incident reporting, analytics, calendars, and mapping.
- **`src/styles/`**: Custom cyberpunk dark-mode themes, typography, custom scrollbars, and neon glows.

For full architectural blueprints, API cheat sheets, and database schemas, please refer to the [Root README.md](../README.md).

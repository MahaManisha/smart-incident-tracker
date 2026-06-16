# 🛰️ Smart Incident Tracker — INFINITUM Edition

[![MERN Stack](https://img.shields.io/badge/Stack-MERN-crimson.svg?style=for-the-badge&logo=mongodb)]()
[![Socket.io](https://img.shields.io/badge/Realtime-Socket.io-010101.svg?style=for-the-badge&logo=socketdotio)]()
[![Design System](https://img.shields.io/badge/Aesthetic-Cyberpunk_Infinitum-ff007f.svg?style=for-the-badge)]()

An enterprise-grade, high-fidelity **Incident Intelligence & Observability Platform** designed to streamline incident management, deliver real-time decision support, and maintain high service availability through automated tracking, root-cause detection, and service-dependency analysis.

Built with an immersive cyberpunk dark-mode aesthetic (**"INFINITUM"**), this system integrates complex operations with premium visual experience, neon accents, and modular reactive components.

🚀 **Deployed Production Build:** [Access Smart Incident Tracker Live]([Paste your deployed website link here])

---

## 🔮 Core Mission & System Essence

In high-stakes production environments, standard ticketing systems fall short. The **Smart Incident Tracker** is an intelligence platform that acts as the nerve center for incident response. It is designed to:
- **Minimize MTTR (Mean Time to Resolve)** through real-time communication and instant escalations.
- **Provide Actionable Observability** using a fully interactive Service Map displaying critical system dependencies and incident blast radius.
- **Maintain SLA Compliance** with continuous background monitors, automated priority tiering, and visual indicators.

---

## 🛰️ High-Fidelity Cyberpunk Theme ("INFINITUM")
The interface is meticulously crafted around a high-fidelity cyberpunk grid design:
- **Harmonious Palette:** Deep void background (`#050508`), neon hot-pink accents (`#ff007f`), digital cyan glows (`#00f3ff`), and radioactive success-greens (`#39ff14`).
- **Glassmorphism Panels:** Translucent panels featuring blurred background refraction (`blur(10px)`) and reactive glowing borders that pulse on interaction.
- **Premium Typography:** Immersive futuristic headers powered by Google Fonts' **Orbitron** combined with highly legible tech-displays in **Rajdhani** and clean body fonts in **Inter**.

---

## 🛠️ Tech Stack & Architecture

### Backend (Node.js & Express)
- **MVC Architecture:** Structured folder layouts keeping controllers, models, services, routes, and middlewares highly segregated and maintainable.
- **Real-Time Communication:** Driven by **Socket.io** (`server/socket.js`) for instant messaging, live alert broadcasts, and active user tracking.
- **Database Layer:** **MongoDB Atlas** with clean schema modeling via **Mongoose** (dynamic validations, automated indexes, and pre-save middleware).
- **Automation Engine:** Custom background service running **node-cron** to continuously check SLA breaches, trigger alerts, and run daily diagnostic summaries.
- **Notification Services:** Unified transport layer handling in-app dashboard notifications and external critical emails via **Nodemailer**.

### Frontend (React.js & Vite)
- **Vite Bundler:** Ultrafast lightning builds and high-speed Hot Module Replacement (HMR).
- **Interactive service maps:** Powered by **React Flow** for constructing complex nodes representing active Microservices, their statuses, and operational links.
- **Global State Management:** Encapsulated React Contexts handling user authentication, live socket connections, notifications, and theme settings.
- **Visual Analytics:** Dynamic dashboard charts and MTTR analytics designed using **Chart.js** & **React-Chartjs-2**.
- **Responsive Layout:** Grid and Flex architectures built using standard Vanilla CSS to achieve maximum customization and strict adherence to the **INFINITUM** design system without bulky UI kit dependencies.

---

## 🧩 Key Functional Modules

```
                              ┌────────────────────────────────────────┐
                              │     Smart Incident Tracker Nerve       │
                              └───────────────────┬────────────────────┘
                                                  │
         ┌────────────────────────┬───────────────┼───────────────┬────────────────────────┐
         ▼                        ▼               ▼               ▼                        ▼
 ┌───────────────┐        ┌───────────────┐ ┌───────────┐ ┌───────────────┐        ┌───────────────┐
 │ Real-Time Chat│        │  Service Map  │ │ SLA & Esc │ │ Analytics Hub │        │Knowledge Base │
 └───────────────┘        └───────────────┘ └───────────┘ └───────────────┘        └───────────────┘
```

### 1. 🚨 Incident Lifecycle & Intelligence
- **Intelligent Creation:** Templates for common incidents to decrease creation overhead.
- **Quick RCA Insights:** In-depth Incident Detail views equipped with diagnostic panels displaying automated Root Cause Analysis and suggested resolutions.
- **Incident Centric Postmortems:** Dynamic compilation of resolution documentation stored directly with the incidents.

### 2. 🗺️ System Observability (Service Map)
- Fully interactive graph representing components (APIs, Databases, Gateways, Frontends).
- **Incident Blast Radius:** Visually isolates impacted nodes and downriver dependencies with red warnings, allowing engineers to target critical failures immediately.
- Real-time service status updates driven by socket sync.

### 3. ⏱️ Service Level Agreements (SLA) & Escalation Policies
- **Tiered SLA Management:** Configure multi-tier response and resolution timeframes based on severity levels (Critical, High, Medium, Low).
- **Automated Escalation Engine:** If an incident isn't acknowledged/resolved within the SLA window, the server automatically escalates the incident to tier-2 and tier-3 responders based on the team's rules.

### 4. 👥 Operations & On-Call Calendars
- **On-Call Shifts:** Interactive schedule planner powered by `react-big-calendar` displaying color-coded on-call rosters.
- **Team Rooms:** Granular organization definitions with dedicated chat channels and instant alert pings.

### 5. 📊 Analytics Hub
- High-level dashboards visualizing MTTR (Mean Time to Resolve) trends, SLA breach rates, and individual responder statistics.
- Direct report export mechanisms.

---

## 📂 Project Directory Structure

```text
smart-incident-tracker/
├── client/                     # React Single Page Application (Vite)
│   ├── public/                 # Static assets
│   └── src/
│       ├── api/                # Axios API request interceptors & services
│       ├── components/         # Reusable widgets (cards, panels, loaders, charts)
│       ├── contexts/           # Global States (Auth, Socket, Notifications)
│       ├── pages/              # 20+ specialized page views (Dashboard, ServiceMap, etc)
│       ├── styles/             # Infinitum design token styling systems
│       ├── utils/              # Roster, date, and parsing helpers
│       ├── App.jsx             # React Core Router configuration
│       └── main.jsx            # Application root mounting
│
├── server/                     # Node.js & Express REST API
│   ├── config/                 # DB connectors & configurations
│   ├── controllers/            # Request handlers (auth, incident, teams)
│   ├── jobs/                   # Background SLA & system update engines (Cron)
│   ├── middleware/             # Role verification, JWT auth, Error Handlers
│   ├── models/                 # Mongoose Database Schemas
│   ├── routes/                 # Structured REST API endpoints
│   ├── services/               # Escalation, Mailers, and RCA models
│   ├── uploads/                # Local attachment repository
│   ├── utils/                  # Token generators, validations
│   └── server.js               # Application entry point & Socket server initialization
```

---

## 🚀 Setting Up the Nerve Center

Follow these instructions to run the application locally in development mode:

### 📡 Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** (Local instance or MongoDB Atlas Connection URI)

---

### 1. Configure Backend (Server)

1. Navigate to the server folder:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` root directory matching the variables below:
   ```env
   PORT=5000
   NODE_ENV=development
   MONGO_URI=your_mongodb_connection_uri
   JWT_SECRET=your_super_secure_jwt_secret
   CLIENT_URL=http://localhost:5173
   
   # Optional: Mailer Setup
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your_email@gmail.com
   SMTP_PASS=your_email_password
   ```
4. Start the server in Development Mode (runs on `http://localhost:5000` with nodemon auto-restart):
   ```bash
   npm run dev
   ```

---

### 2. Configure Frontend (Client)

1. Navigate to the client folder:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `client` root directory:
   ```env
   VITE_API_URL=http://localhost:5000/api
   ```
4. Start the Vite dev server (runs on `http://localhost:5173` with HMR):
   ```bash
   npm run dev
   ```

---

## 🔌 API Documentation Cheat Sheet

| Endpoint | Method | Authentication | Description |
| :--- | :---: | :---: | :--- |
| `/api/auth/login` | `POST` | Public | Logs user in, returns signed JWT & profile |
| `/api/incidents` | `GET` | JWT Protected | Fetches list of all incidents (filterable) |
| `/api/incidents` | `POST` | JWT Protected | Creates a new incident, broadcasts live event |
| `/api/incidents/:id` | `GET` | JWT Protected | Retrieves detail view, RCA intelligence |
| `/api/sla` | `GET` | JWT (Admin Only) | Retreives SLA configuration thresholds |
| `/api/mapping` | `GET` | JWT Protected | Fetches active node topology for Service Map |
| `/api/oncall` | `GET` | JWT Protected | Fetches the active calendar rosters |

---

## 👤 Developer
- **Author:** Maha Manisha / Maha Monisha
- **Email:** [mahamanisha111_db_user@cluster0.gse3wum.mongodb.net](mailto:mahamanisha111@gmail.com) *(Update as preferred)*
- **GitHub:** [MahaManisha](https://github.com/MahaManisha)

Feel free to open issues or pull requests to enhance the automated Incident Intelligence models!

---

*“Maintaining the stability of the digital landscape. One node at a time.” — **INFINITUM System Command***

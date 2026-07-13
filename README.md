# NexLedger

NexLedger is a modern, full-stack financial ledger and audit management system designed for businesses to track their cash flow, categorize expenses, monitor analytics, and maintain rigorous system audit logs.

Featuring a beautiful, premium user interface with interactive dashboards and a robust backend API, NexLedger provides everything needed to manage financial records seamlessly.

---

## 🚀 Tech Stack

### Frontend
- **Framework:** Angular (v19)
- **Styling:** Tailwind CSS (Modern, utility-first)
- **Build Tool:** Angular CLI / Webpack
- **Features:** Responsive design, Dark mode, Dynamic SVG charting, Reactive forms.

### Backend
- **Runtime:** Bun 
- **Framework:** Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JWT (JSON Web Tokens)
- **Email Services:** Resend API

---

## ✨ Key Features

- **Dashboard Analytics:** A comprehensive command center with animated stats, expense/income dual breakdowns, savings rate donut charts, and gradient-filled trend lines.
- **Financial Records Management:** Add, edit, and categorize income and expenses with detailed tagging.
- **Role-Based Access Control (RBAC):** Distinct roles (`VIEWER`, `ANALYST`, `ADMIN`) with secure route guarding and API middleware.
- **System Audit Trails:** Automatic tracking of all user actions (creation, updates, deletions) for administrative review.
- **Modern Authentication:** Split-pane login and registration flows, password recovery, and secure session management.
- **Dark/Light Mode:** First-class dark mode support across the entire application.

---

## 📂 Project Structure

This is a monorepo containing both the frontend and backend applications:

```text
NexLedger/
├── backend/            # Express.js API server
│   ├── src/
│   │   ├── controllers/  # Route logic
│   │   ├── models/       # Mongoose schemas
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   └── validations/  # Request validation
│   └── ...
└── frontend/           # Angular Web App
    ├── src/
    │   ├── app/
    │   │   ├── core/     # Services, models, guards, interceptors
    │   │   ├── features/ # Lazy-loaded feature modules (Auth, Dashboard, etc.)
    │   │   └── shared/   # Reusable components (Modals, Toasts, Layouts)
    │   └── ...
```

---

## 🛠️ Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Bun](https://bun.sh/) (for the backend)
- [Node.js](https://nodejs.org/) & [npm](https://www.npmjs.com/) (for the frontend)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Shinkhal/NexLedger.git
   cd NexLedger
   ```

2. **Setup the Backend:**
   ```bash
   cd backend
   bun install
   ```
   Create a `.env` file in the `backend` directory (refer to `.env.example` if available) and add your `MONGO_URI`, `JWT_SECRET`, and `RESEND_API_KEY`.

3. **Setup the Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

**Run the Backend (Development Mode):**
```bash
cd backend
bun dev
```
*The backend API will start on `http://localhost:3000`.*

**Run the Frontend (Development Mode):**
```bash
cd frontend
npm start
```
*The Angular app will start on `http://localhost:4200`.*

---

## 🔒 Security & Best Practices

- Passwords are cryptographically hashed using `bcryptjs`.
- All routes demanding analytical or destructive actions are protected by rigorous RBAC middleware.
- Soft-deletion strategy implemented across primary financial records to maintain audit integrity.
- Form inputs are validated and sanitized on both the frontend (Angular Reactive Forms) and backend (Zod validations).

---

## 📝 License

This project is licensed under the MIT License.

Knowledge Repository and learning platform

A full-stack **document management and training compliance platform** built with the MERN stack (MongoDB, Express, React, Node.js). Organizations use it to publish SOPs, policies, and work instructions to employees, track that employees have actually read them, test their understanding with quizzes, and issue certificates — all with a full audit trail.

## Features

- **Role-based access control** — `superadmin`, `deptadmin`, `approver`, `employee`, and `auditor` roles, each with their own permissions and views
- **Document lifecycle management** — create documents, upload versions, and route them through a `draft → pending approval → approved/rejected → published` workflow
- **Version control** — every document keeps a full history of versions, each with its own file, notes, and approval status
- **Department organization** — documents and users are organized by department (HR, IT, Finance, Operations, Production, Quality, Supply Chain, etc.)
- **Approvals workflow** — designated approvers review and approve/reject new document versions before they go live
- **Employee assignments** — employees are assigned documents to read and complete
- **Read tracking & quizzes** — employees read a document (with a minimum reading time) and then take a quiz to confirm comprehension
- **Certificates** — a passing quiz attempt automatically issues a certificate with a unique code
- **Audit log** — every significant action in the system is recorded for compliance and traceability
- **Dashboard** — at-a-glance view of documents, assignments, and completion status
- **File uploads** — supports document files (including `.docx` preview via `mammoth`) up to 100MB

## Tech Stack

**Backend**
- Node.js + Express
- MongoDB with Mongoose
- JWT authentication (`jsonwebtoken`) + `bcryptjs` for password hashing
- `multer` for file uploads, `mammoth` for `.docx` text extraction
- `nodemon` for local development

**Frontend**
- React 19 + Vite
- React Router v7
- Axios for API calls
- `oxlint` for linting

## Project Structure

```
adm-knowledge-repo/
├── server/                 # Express API
│   ├── config/              # Database connection
│   ├── middleware/          # Auth (JWT) and file upload middleware
│   ├── models/               # Mongoose schemas (User, Document, DocumentVersion,
│   │                          #   Quiz, Attempt, Assignment, Certificate, Department, AuditLog)
│   ├── routes/                # API routes (auth, users, departments, documents,
│   │                          #   quizzes, assessment, certificates, audit, dashboard)
│   ├── utils/                # Audit logging helper + database seed script
│   └── server.js             # App entry point
└── client/                 # React front end
    └── src/
        ├── api/               # Axios client
        ├── components/        # Shared UI components (Layout, ProtectedRoute, FileViewer, etc.)
        ├── context/           # Auth context
        └── pages/             # Route-level pages (admin, documents, employee, audit, dashboard)
```

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- A running [MongoDB](https://www.mongodb.com/) instance (local or a hosted service like MongoDB Atlas)

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
```

### 2. Set up the backend

```bash
cd server
npm install
cp .env.example .env
```

Edit `.env` with your own values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/adm_knowledge_repo
JWT_SECRET=change_this_to_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Seed the database with demo departments and users:

```bash
npm run seed
```

Start the API server:

```bash
npm run dev      # with nodemon (auto-restart)
# or
npm start        # plain node
```

The API will run at `http://localhost:5000` (health check: `GET /api/health`).

### 3. Set up the frontend

In a new terminal:

```bash
cd client
npm install
npm run dev
```

The app will run at `http://localhost:5173`.

### 4. Log in

Use one of the demo accounts created by the seed script (password for all: `Password123!`):

| Role         | Email                    |
|--------------|---------------------------|
| Super Admin  | `superadmin@adm.com`     |
| Dept Admin   | `deptadmin@adm.com`      |
| Approver     | `approver@adm.com`       |
| Employee     | `employee@adm.com`       |
| Auditor      | `auditor@adm.com`        |
| Employee (IT)| `employee.it@adm.com`    |

> ⚠️ These are demo credentials for local development only — do not use them (or ship the seed script) in a production deployment.

## API Overview

All endpoints are prefixed with `/api` and (except `/auth`) require a `Bearer <token>` JWT in the `Authorization` header.

| Route             | Purpose                                      |
|--------------------|-----------------------------------------------|
| `/api/auth`         | Login / authentication                        |
| `/api/users`        | User management (admin)                       |
| `/api/departments`  | Department management                         |
| `/api/documents`    | Document CRUD, versions, publishing            |
| `/api/quizzes`      | Quiz creation for document versions            |
| `/api/assessment`   | Quiz attempts / scoring                        |
| `/api/certificates` | Certificate issuance and retrieval             |
| `/api/audit`        | Audit log viewing                              |
| `/api/dashboard`    | Aggregated dashboard stats                     |

## Environment Variables

| Variable      | Description                                   |
|---------------|-------------------------------------------------|
| `PORT`        | Port the API server listens on                 |
| `MONGO_URI`   | MongoDB connection string                       |
| `JWT_SECRET`  | Secret used to sign JWTs — use a long random value |
| `CLIENT_URL`  | Frontend origin, used for CORS                  |

## Scripts

**Server** (`/server`)
- `npm run dev` – start with nodemon
- `npm start` – start normally
- `npm run seed` – seed departments and demo users

**Client** (`/client`)
- `npm run dev` – start Vite dev server
- `npm run build` – production build
- `npm run preview` – preview the production build
- `npm run lint` – run oxlint

## Roadmap / Ideas

- [ ] Add automated tests (backend + frontend)
- [ ] Add CI pipeline (lint + tests on PR)
- [ ] Dockerize the app for one-command local setup
- [ ] Add pagination/filtering to document and audit log lists


## Contributing

Contributions, issues, and feature requests are welcome. Feel free to open an issue or submit a pull request.

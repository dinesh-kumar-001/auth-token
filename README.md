# MERN Authentication App

A full-stack MERN (MongoDB · Express · React · Node.js) application with:
- **JWT authentication** (register / login / protected profile)
- **Swagger UI** API explorer at `/api-docs`
- **Vercel deployment** configuration
- **GitHub Actions** CI pipeline

---

## 📁 Project Structure

```
├── backend/
│   ├── middleware/auth.js     # JWT verification middleware
│   ├── models/User.js         # Mongoose User schema
│   ├── routes/auth.js         # API routes with Swagger annotations
│   ├── server.js              # Express server entry point
│   ├── .env.example           # Environment variable template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── Dashboard.jsx
│   ├── vite.config.js         # Dev proxy → /api → localhost:5000
│   ├── .env.example           # Environment variable template
│   └── package.json
├── .github/workflows/
│   └── deploy.yml             # CI: build + syntax check backend & frontend
├── vercel.json                # Vercel v2 deployment config
├── .gitignore
└── README.md
```

---

## 🚀 Local Development

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas cluster (or local MongoDB)

### 1. Backend

```bash
cd backend
cp .env.example .env          # fill in real values
npm install
npm run dev                   # starts with nodemon on port 5000
```

**`backend/.env` variables:**

| Variable      | Description                                |
|---------------|--------------------------------------------|
| `PORT`        | Port the server listens on (default `5000`)|
| `MONGO_URI`   | MongoDB connection string                  |
| `JWT_SECRET`  | Long random string (≥ 32 chars)            |
| `CLIENT_URL`  | Allowed CORS origin(s), comma-separated    |
| `API_URL`     | Public URL of this backend (for Swagger)   |

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # optional: set custom VITE_API_URL
npm install
npm run dev                   # Vite dev server on http://localhost:5173
```

**`frontend/.env` variables:**

| Variable       | Description                                                                                                    |
|----------------|----------------------------------------------------------------------------------------------------------------|
| `VITE_API_URL` | Public URL of the backend (e.g. `https://auth-token-1x6w.onrender.com`). Leave blank to use dev proxy/same-origin. |

> All `/api` calls from the frontend are dynamically resolved. If `VITE_API_URL` is set, it queries that host. If left blank, it falls back to relative routes (proxied to `http://localhost:5000` via `vite.config.js` in development, or routed automatically by Vercel in production).

---

## 📖 API Documentation (Swagger)

Start the backend, then open:  
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

### Endpoints

| Method | Path            | Auth required | Description              |
|--------|-----------------|:-------------:|--------------------------|
| GET    | `/health`       | No            | Server health check      |
| POST   | `/api/register` | No            | Register new user        |
| POST   | `/api/login`    | No            | Login → returns JWT      |
| GET    | `/api/profile`  | ✅ Bearer JWT | Get authenticated profile |

---

## ☁️ Deploying to Vercel

1. **Set environment variables** in your Vercel project dashboard:  
   `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL`, `API_URL` (for backend services), and `VITE_API_URL` (pointing to your Render URL if deploying backend separately).

2. **Import** your GitHub repo into Vercel — it will pick up `vercel.json` automatically.

3. The backend runs as a **serverless Node.js function** and the frontend is deployed as a **static Vite build**.

> See `vercel.json` for routing configuration.

---

## 🔁 CI (GitHub Actions)

Every push to `main` or pull request triggers `.github/workflows/deploy.yml`:
- Installs backend dependencies and checks syntax
- Installs frontend dependencies and runs `vite build`

To add the frontend API URL secret: `Settings → Secrets → VITE_API_URL`.

---

## 🛡️ Security Notes

- Passwords are hashed with **bcrypt** (cost factor 12)
- JWTs expire after **1 day**
- CORS is restricted to `CLIENT_URL` origins only
- Request body size is limited to **10 KB**
- `.env` is excluded from git (see `.gitignore`)

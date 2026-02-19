# 🚂 Railway Shift Management System (MERN Stack)

Full-stack MERN app for managing loco pilot shifts with real-time duty hour alerts via Socket.IO.

**MongoDB • Express • React • Node.js**

---

## 📁 Project Structure

```
mern-railway/
├── backend/       → Node.js + Express + Mongoose + Socket.IO
└── frontend/      → React + Vite + Tailwind + Socket.IO Client
```

---

## 🚀 Quick Start

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env → set your MONGODB_URI (see below)
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Open → **http://localhost:5173**

---

## ⚙️ MongoDB Setup Options

### Option A — Local MongoDB
```env
MONGODB_URI=mongodb://localhost:27017/railway_db
```
Install MongoDB: https://www.mongodb.com/try/download/community

### Option B — MongoDB Atlas (Free Cloud, Recommended)
1. Go to https://cloud.mongodb.com
2. Create free cluster → Get connection string
3. Paste in `.env`:
```env
MONGODB_URI=mongodb+srv://youruser:yourpassword@cluster.mongodb.net/railway_db
```

---

## 🔑 Default Login (auto-created on startup)

| Role       | Email                | Password  |
|------------|----------------------|-----------|
| SuperAdmin | admin@railway.com    | Admin@123 |
| Admin      | admin2@railway.com   | Admin@123 |

---

## 🚨 Alert System

Backend monitors active shifts every **5 minutes**. Alerts fire at:

| Hour | Level    | Action Options |
|------|----------|----------------|
| 7hr  | Info     | Acknowledge    |
| 8hr  | Warning  | Plan Relief / Not Required |
| 9hr  | High     | Crew Relieved / Not Booked |
| 10hr | Critical | Relief Arranged / Continue |
| 11hr | Danger   | Keep On / Already Relieved |
| 14hr | Maximum  | Emergency Relief / Ending  |

Alerts appear as **modal popups** + **banner** in the frontend via Socket.IO.

---

## 🔧 Backend `.env` Required Fields

```env
MONGODB_URI=mongodb://localhost:27017/railway_db
JWT_ACCESS_SECRET=any-long-random-string
JWT_REFRESH_SECRET=another-long-random-string
SOCKET_ENABLED=true
MONITORING_ENABLED=true
SEED_ON_STARTUP=true
```

---

## 📦 Install Commands

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

## ▶️ Start Commands

```bash
# Terminal 1 - Backend
cd backend && npm run dev     # starts on :8000

# Terminal 2 - Frontend
cd frontend && npm run dev    # starts on :5173
```

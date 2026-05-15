# Telegram Vault 🛡️☁️

A full-stack MERN application that uses your personal Telegram account as an end-to-end encrypted cloud storage vault.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS v4, React Router, Axios, Lucide React
- **Backend**: Node.js, Express, MongoDB Atlas, GramJS (Telegram MTProto API), bcrypt, jsonwebtoken

## Features
- **Zero-Knowledge Encryption**: Data is encrypted using AES-256-GCM before uploading to Telegram.
- **Telegram Cloud Storage**: Uses your "Saved Messages" / own chat for free unlimited storage.
- **Render & Vercel Ready**: No local filesystem storage; uses memory storage for uploads. 

## Local Development

### 1. Database Setup
Create a free MongoDB Atlas cluster and get the connection string.

### 2. Telegram API
Get your `API_ID` and `API_HASH` from [my.telegram.org](https://my.telegram.org).

### 3. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm start
```

### 4. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env with your backend API URL if needed
npm run dev
```

## Deployment Instructions

### Backend (Render)
1. Push your repository to GitHub.
2. Go to [Render](https://render.com) and create a new **Web Service**.
3. Connect your GitHub repository.
4. Set the following configuration:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add the following Environment Variables in Render:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `API_ID`
   - `API_HASH`
   - `FRONTEND_URL` (e.g., https://your-frontend.vercel.app)

### Frontend (Vercel)
1. Go to [Vercel](https://vercel.com) and import your GitHub repository.
2. Set the following configuration:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
3. Add the following Environment Variables in Vercel:
   - `VITE_API_URL` (e.g., https://your-backend.onrender.com/api)
4. Click Deploy.

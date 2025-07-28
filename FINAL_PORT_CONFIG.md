# 🌐 Final Port Configuration - Blood Warriors AI Platform

## Port Assignments

| Service              | Port  | URL                                                     |
| -------------------- | ----- | ------------------------------------------------------- |
| **Frontend (React)** | 3100  | http://localhost:3100                                   |
| **Backend API**      | 4000  | http://localhost:4000/api                               |
| **Supabase API**     | 54321 | http://localhost:54321                                  |
| **Database**         | 54322 | postgresql://postgres:postgres@localhost:54322/postgres |
| **Supabase Studio**  | 54323 | http://localhost:54323                                  |

## Configuration Files Updated

### 1. Frontend Configuration

**frontend/package.json**

```json
"scripts": {
  "start": "PORT=3100 react-scripts start"
}
```

**frontend/.env**

```env
REACT_APP_API_URL=http://localhost:4000/api
```

### 2. Backend Configuration

**backend/.env**

```env
PORT=4000
FRONTEND_URL=http://localhost:3100
```

**backend/src/index.js**

```javascript
app.use(
  cors({
    origin:
      process.env.NODE_ENV === "development"
        ? ["http://localhost:3100", "http://127.0.0.1:3100"]
        : process.env.FRONTEND_URL,
    credentials: true,
  })
);
```

## How to Start the Application

### Option 1: Automated (Recommended)

```bash
./run.sh
```

### Option 2: Manual

```bash
# Terminal 1: Start Backend (port 4000)
cd backend && npm run dev

# Terminal 2: Start Frontend (port 3100)
cd frontend && npm start
```

## Testing the Configuration

```bash
# Test backend API
curl http://localhost:4000/health

# Test frontend (open in browser)
open http://localhost:3100

# Test Supabase Studio
open http://localhost:54323
```

## Port Conflict Resolution

If any ports are in use:

```bash
# Check what's using the ports
lsof -i :3100  # Frontend
lsof -i :4000  # Backend
lsof -i :54321 # Supabase API
lsof -i :54322 # Database
lsof -i :54323 # Supabase Studio

# Kill processes if needed
lsof -ti:3100 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

## Environment Variables Summary

### Backend (.env)

```env
# Server
PORT=4000
NODE_ENV=development

# Supabase
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# CORS
FRONTEND_URL=http://localhost:3100
```

### Frontend (.env)

```env
# Supabase
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# API
REACT_APP_API_URL=http://localhost:4000/api
```

## Verification Checklist

- [ ] Backend starts on port 4000
- [ ] Frontend starts on port 3100
- [ ] API calls work between frontend and backend
- [ ] Supabase services are running
- [ ] Database connection works
- [ ] CORS is properly configured
- [ ] All documentation updated

## Quick Start Commands

```bash
# 1. Setup (first time only)
./setup.sh

# 2. Check status
./check_status.sh

# 3. Start application
./run.sh

# 4. Access application
open http://localhost:3100
```

**All ports are now configured and ready for development!** 🚀

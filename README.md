# Blood Warriors - Blood Donation Platform

A simple and clean blood donation platform built with React and Node.js.

## Quick Start

1. **Install Dependencies**

   ```bash
   # Backend
   cd backend && npm install

   # Frontend
   cd ../frontend && npm install
   ```

2. **Environment Setup**

   ```bash
   # Copy environment files
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env

   # Update with your Supabase credentials
   ```

3. **Database Setup**

   ```bash
   # Apply migrations
   supabase db push
   ```

4. **Start Application**

   ```bash
   # Start both servers
   ./start.sh

   # Or manually:
   # Backend: cd backend && npm start
   # Frontend: cd frontend && npm start
   ```

5. **Access Application**
   - Frontend: http://localhost:3100
   - Backend API: http://localhost:4000

## Features

- User Registration & Authentication
- Patient and Donor profiles
- Simple dashboard
- Clean, responsive UI

## Tech Stack

- **Frontend**: React, React Router
- **Backend**: Node.js, Express
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Project Structure

```
blood_warriors/
├── backend/          # Node.js API server
├── frontend/         # React application
├── supabase/         # Database migrations
└── start.sh          # Quick start script
```

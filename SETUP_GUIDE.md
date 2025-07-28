# 🩸 Blood Warriors AI Platform - Setup Guide

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** - [Download here](https://git-scm.com/)
- **Supabase CLI** - We'll install this during setup

## 🚀 Quick Setup (Automated)

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd blood_warriors
```

### 2. Run the Setup Script

```bash
chmod +x setup.sh
./setup.sh
```

This script will:

- Install all dependencies
- Set up Supabase local development
- Create environment files
- Apply database migrations
- Start the local database

## 🔧 Manual Setup (Step by Step)

If you prefer to set up manually or the script doesn't work:

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Install Dependencies

```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies
cd ../frontend
npm install
cd ..
```

### 3. Initialize Supabase

```bash
# Initialize Supabase (if not already done)
supabase init

# Start Supabase local development
supabase start
```

### 4. Apply Database Migrations

```bash
# Reset database with migrations
supabase db reset

# Or apply migrations manually
supabase migration up
```

### 5. Set Up Environment Variables

#### Backend Environment (.env)

```bash
cd backend
cp .env.example .env
```

The default values in `.env.example` work for local development. Key variables:

```env
# These are the default Supabase local development keys
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Change this in production
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

#### Frontend Environment (.env)

```bash
cd frontend
cp .env.example .env
```

The default values work for local development:

```env
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
REACT_APP_API_URL=http://localhost:4000/api
```

## 🏃‍♂️ Running the Application

### 1. Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will start on http://localhost:4000

### 2. Start the Frontend (in a new terminal)

```bash
cd frontend
npm start
```

The frontend will start on http://localhost:3100

### 3. Access the Application

- **Frontend**: http://localhost:3100
- **Backend API**: http://localhost:4000/api
- **Supabase Studio**: http://localhost:54323

## 🗄️ Database Information

### Local Database Access

- **Database URL**: postgresql://postgres:postgres@localhost:54322/postgres
- **Studio URL**: http://localhost:54323
- **API URL**: http://localhost:54321

### Database Schema

The database includes:

- **Users, Patients, Donors** - User management
- **BloodGroups, BloodComponents** - Blood type data
- **BloodBanks, BloodStock** - Blood bank directory
- **DonationRequests, Donations** - Request management
- **Notifications** - Donor notification system
- **Coupons, DonorCoupons** - Reward system
- **ChatHistory** - AI chat logs

### Sample Data

The database is seeded with:

- 8 blood groups (A+, A-, B+, B-, AB+, AB-, O+, O-)
- 5 blood components (Whole Blood, Packed RBC, etc.)
- Sample blood banks across major Indian cities
- Sample blood stock data
- Sample reward coupons

## 🧪 Testing the Application

### 1. Register a New User

1. Go to http://localhost:3100
2. Click "Register"
3. Fill in the form (choose Patient or Donor)
4. Select a blood group
5. Complete registration

### 2. Test Core Features

#### As a Patient:

- Create a blood request
- View request status
- Chat with CareBot
- Use SOS button for emergencies

#### As a Donor:

- Update location
- Toggle SOS availability
- View notifications
- Check reward coupons

### 3. Test API Endpoints

```bash
# Health check
curl http://localhost:4000/health

# Get blood groups (requires authentication)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" http://localhost:4000/api/public-data/blood-groups
```

## 🔧 Optional Integrations

### Firebase (Push Notifications)

1. Create a Firebase project at https://console.firebase.google.com/
2. Enable Cloud Messaging
3. Get your config and add to environment variables
4. Update both backend and frontend .env files

### Mapbox (Enhanced Maps)

1. Create account at https://www.mapbox.com/
2. Get access token
3. Add `REACT_APP_MAPBOX_TOKEN` to frontend .env

### Hugging Face (Enhanced AI)

1. Create account at https://huggingface.co/
2. Get API token
3. Add `LLM_API_KEY` to backend .env

## 🐛 Troubleshooting

### Common Issues

#### 1. Supabase Won't Start

```bash
# Stop all Supabase services
supabase stop

# Start fresh
supabase start
```

#### 2. Database Migration Errors

```bash
# Reset database completely
supabase db reset

# Or apply specific migration
supabase migration up --file 20240101000001_initial_schema.sql
```

#### 3. Port Already in Use

```bash
# Kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

#### 4. Authentication Issues

- Check that Supabase is running
- Verify environment variables
- Check browser console for errors

#### 5. Frontend Won't Connect to Backend

- Ensure backend is running on correct port
- Check REACT_APP_API_URL in frontend .env
- Verify CORS settings in backend

### Getting Help

1. **Check Logs**:

   - Backend: Check terminal where `npm run dev` is running
   - Frontend: Check browser console (F12)
   - Database: Check Supabase Studio logs

2. **Verify Services**:

   ```bash
   # Check Supabase status
   supabase status

   # Check if ports are in use
   lsof -i :4000
   lsof -i :54321
   ```

3. **Reset Everything**:

   ```bash
   # Stop all services
   supabase stop

   # Clean and restart
   rm -rf node_modules
   npm install
   supabase start
   supabase db reset
   ```

## 📊 Development Tools

### Supabase Studio

Access at http://localhost:54323 to:

- View and edit database tables
- Test SQL queries
- Monitor real-time subscriptions
- Manage authentication

### API Testing

Use tools like:

- **Postman** - GUI for API testing
- **curl** - Command line testing
- **Thunder Client** - VS Code extension

### Database Management

```bash
# View database logs
supabase logs db

# Connect to database directly
psql postgresql://postgres:postgres@localhost:54322/postgres

# Backup database
pg_dump postgresql://postgres:postgres@localhost:54322/postgres > backup.sql
```

## 🚀 Next Steps

Once you have the application running:

1. **Explore the Features** - Test all user flows
2. **Customize the UI** - Modify components in `frontend/src/`
3. **Add New Features** - Extend the API and database
4. **Deploy to Production** - Follow the DEPLOYMENT.md guide
5. **Set Up Monitoring** - Add error tracking and analytics

## 📞 Support

If you encounter issues:

1. Check this guide first
2. Look at error messages carefully
3. Check the GitHub issues
4. Create a new issue with detailed information

---

**Happy Coding! 🩸❤️**

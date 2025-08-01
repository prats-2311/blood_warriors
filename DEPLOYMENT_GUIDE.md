# 🚀 Deployment Guide: Netlify + Render + Supabase

This guide will help you deploy your Blood Warriors AI Personalization System with the following architecture:

- **Frontend**: Netlify (React app)
- **Backend**: Render (Node.js API)
- **Database**: Supabase (PostgreSQL with AI features)

## 📋 Prerequisites

1. Accounts on:
   - [Netlify](https://netlify.com)
   - [Render](https://render.com)
   - [Supabase](https://supabase.com)
2. GitHub repository with your code
3. Domain name (optional, but recommended)

## 🗄️ Step 1: Supabase Database Setup

### 1.1 Create Supabase Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and set:
   - **Name**: `blood-warriors-ai`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users
4. Wait for project creation (2-3 minutes)

### 1.2 Get Supabase Credentials

After project creation, go to **Settings > API**:

```env
# Copy these values:
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Apply Database Migration

1. Go to **SQL Editor** in Supabase Dashboard
2. Copy and paste the migration SQL from `supabase/migrations/20250731154634_initial_schema_with_auth_fixed.sql`
3. Then run the indexes migration from `supabase/migrations/20250731154733_add_indexes_and_functions.sql`
3. Click **Run** to apply the migration

## 🖥️ Step 2: Backend Deployment (Render)

### 2.1 Prepare Backend for Production

Create production environment configuration:

### 2.2 Create Render Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:
   - **Name**: `blood-warriors-backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (upgrade to Starter for production)

### 2.3 Set Environment Variables in Render

Go to **Environment** tab and add these variables:

```env
NODE_ENV=production
PORT=4000
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random
FRONTEND_URL=https://your-app-name.netlify.app
QLOO_API_KEY=your-qloo-key (optional)
LLM_API_KEY=your-huggingface-key (optional)
```

### 2.4 Deploy Backend

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes)
3. Test your API: `https://your-backend-app.onrender.com/api/health`

## 🌐 Step 3: Frontend Deployment (Netlify)

### 3.1 Prepare Frontend

Update your frontend API configuration to point to your Render backend:

```javascript
// In your frontend API configuration
const API_BASE_URL =
  process.env.REACT_APP_API_URL || "https://your-backend-app.onrender.com/api";
```

### 3.2 Deploy to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click **Add new site** → **Import an existing project**
3. Connect your GitHub repository
4. Configure build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`

### 3.3 Set Environment Variables in Netlify

Go to **Site Settings** → **Environment Variables** and add:

```env
REACT_APP_API_URL=https://your-backend-app.onrender.com/api
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
REACT_APP_ENABLE_AI_CHAT=true
REACT_APP_ENABLE_PERSONALIZATION=true
REACT_APP_ENABLE_REWARDS=true
```

### 3.4 Deploy Frontend

1. Click **Deploy site**
2. Wait for deployment (3-5 minutes)
3. Test your app: `https://your-app-name.netlify.app`

## 🔧 Step 4: Configuration & Testing

### 4.1 Update CORS Settings

Update your backend CORS configuration to allow your Netlify domain:

```javascript
// In your backend CORS configuration
const corsOptions = {
  origin: [
    "http://localhost:3000", // Development
    "https://your-app-name.netlify.app", // Production
  ],
  credentials: true,
};
```

### 4.2 Test the Full Stack

1. **Database**: Test migration applied correctly
2. **Backend**: Test API endpoints work
3. **Frontend**: Test app loads and connects to backend
4. **AI Features**: Test personalization and chat features

## 🚀 Step 5: Production Optimizations

### 5.1 Performance Optimizations

- Enable Render's **Auto-Deploy** from GitHub
- Set up Netlify's **Branch Deploys** for staging
- Configure **Custom Domains** (optional)

### 5.2 Monitoring & Logging

- Set up **Render Logs** monitoring
- Configure **Netlify Analytics**
- Add **Error Tracking** (Sentry recommended)

### 5.3 Security Enhancements

- Enable **HTTPS** (automatic on both platforms)
- Set up **Rate Limiting** on backend
- Configure **CSP Headers** in Netlify

## 📋 Environment Variables Checklist

### ✅ Backend (Render)

- [ ] `NODE_ENV=production`
- [ ] `PORT=4000`
- [ ] `SUPABASE_URL`
- [ ] `SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `JWT_SECRET`
- [ ] `FRONTEND_URL`
- [ ] `QLOO_API_KEY` (optional)
- [ ] `LLM_API_KEY` (optional)

### ✅ Frontend (Netlify)

- [ ] `REACT_APP_API_URL`
- [ ] `REACT_APP_SUPABASE_URL`
- [ ] `REACT_APP_SUPABASE_ANON_KEY`
- [ ] `REACT_APP_ENABLE_AI_CHAT=true`
- [ ] `REACT_APP_ENABLE_PERSONALIZATION=true`
- [ ] `REACT_APP_ENABLE_REWARDS=true`

### ✅ Database (Supabase)

- [ ] Migration applied successfully
- [ ] RLS policies configured
- [ ] API keys generated

## 🎯 Quick Deployment Commands

```bash
# 1. Prepare deployment files
./deploy.sh

# 2. Test locally first
cd backend && npm start
cd frontend && npm start

# 3. Push to GitHub (triggers auto-deploy)
git add .
git commit -m "Deploy AI Personalization System"
git push origin main
```

## 🔍 Troubleshooting

### Common Issues:

1. **CORS Errors**: Update FRONTEND_URL in backend environment
2. **Database Connection**: Check Supabase credentials
3. **Build Failures**: Check Node.js version compatibility
4. **API Not Found**: Verify backend URL in frontend config

### Health Check URLs:

- **Backend**: `https://your-backend-app.onrender.com/api/health`
- **Frontend**: `https://your-app-name.netlify.app`
- **Database**: Supabase Dashboard → API Health

## 🎉 Success!

Once deployed, your AI Personalization System will be live with:

- ✅ **Personalized Chat Responses** for patients
- ✅ **Interest-Based Rewards** for donors
- ✅ **Qloo Integration** for enhanced personalization
- ✅ **Fallback Systems** for reliability
- ✅ **Scalable Architecture** on modern platforms

Your app will be accessible at:

- **Frontend**: `https://your-app-name.netlify.app`
- **Backend API**: `https://your-backend-app.onrender.com/api`
- **Database**: Managed by Supabase

## 📞 Support

If you encounter issues:

1. Check the deployment logs in Render/Netlify dashboards
2. Verify environment variables are set correctly
3. Test API endpoints individually
4. Check Supabase connection and migration status

Happy deploying! 🚀

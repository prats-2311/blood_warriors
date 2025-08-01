# ✅ Deployment Checklist - Netlify + Render + Supabase

## 🚀 **Pre-Deployment Preparation**

### ✅ **Code Preparation**
- [ ] Run `./test-production-build.sh` to verify build works
- [ ] Run `./prepare-deployment.sh` to create deployment package
- [ ] Commit all changes to Git repository
- [ ] Push to GitHub (required for auto-deployment)

### ✅ **Environment Setup**
- [ ] Generate secure JWT secret (32+ characters)
- [ ] Prepare all API keys (Qloo, Hugging Face, Firebase - optional)
- [ ] Have GitHub repository ready and accessible

---

## 🗄️ **Step 1: Supabase Database Setup**

### ✅ **Create Project**
- [ ] Go to [supabase.com/dashboard](https://supabase.com/dashboard)
- [ ] Click "New Project"
- [ ] Choose organization
- [ ] Set project name: `blood-warriors-ai`
- [ ] Generate strong database password
- [ ] Select region closest to your users
- [ ] Wait for project creation (2-3 minutes)

### ✅ **Apply Database Schema**
- [ ] Go to **SQL Editor** in Supabase Dashboard
- [ ] Copy content from `supabase/migrations/20250731154634_initial_schema_with_auth_fixed.sql`
- [ ] Paste and click **Run**
- [ ] Copy content from `supabase/migrations/20250731154733_add_indexes_and_functions.sql`
- [ ] Paste and click **Run**
- [ ] Verify tables created successfully

### ✅ **Get Credentials**
- [ ] Go to **Settings > API**
- [ ] Copy **Project URL**: `https://your-project-id.supabase.co`
- [ ] Copy **Anon Key**: `eyJhbGciOiJIUzI1NiIs...`
- [ ] Copy **Service Role Key**: `eyJhbGciOiJIUzI1NiIs...`

## 🖥️ Backend Deployment (Render)

- [ ] Create Render account
- [ ] Connect GitHub repository
- [ ] Create new Web Service
- [ ] Set build command: `npm install`
- [ ] Set start command: `npm start`
- [ ] Add environment variables:
  - [ ] `NODE_ENV=production`
  - [ ] `PORT=4000`
  - [ ] `SUPABASE_URL`
  - [ ] `SUPABASE_ANON_KEY`
  - [ ] `SUPABASE_SERVICE_ROLE_KEY`
  - [ ] `JWT_SECRET`
  - [ ] `FRONTEND_URL` (will be your Netlify URL)
  - [ ] `QLOO_API_KEY` (optional)
  - [ ] `LLM_API_KEY` (optional)
- [ ] Deploy and test: `https://your-app.onrender.com/api/health`

## 🌐 Frontend Deployment (Netlify)

- [ ] Create Netlify account
- [ ] Connect GitHub repository
- [ ] Set build settings:
  - [ ] Base directory: `frontend`
  - [ ] Build command: `npm run build`
  - [ ] Publish directory: `frontend/build`
- [ ] Add environment variables:
  - [ ] `REACT_APP_API_URL` (your Render backend URL)
  - [ ] `REACT_APP_SUPABASE_URL`
  - [ ] `REACT_APP_SUPABASE_ANON_KEY`
  - [ ] `REACT_APP_ENABLE_AI_CHAT=true`
  - [ ] `REACT_APP_ENABLE_PERSONALIZATION=true`
  - [ ] `REACT_APP_ENABLE_REWARDS=true`
- [ ] Deploy and test: `https://your-app.netlify.app`

## 🔧 Post-Deployment Configuration

- [ ] Update backend CORS to allow Netlify domain
- [ ] Update Netlify redirects to point to Render backend
- [ ] Test full stack integration
- [ ] Test AI personalization features
- [ ] Test reward system
- [ ] Verify database operations

## 🧪 Testing Checklist

### Backend API Tests

- [ ] Health check: `/api/health`
- [ ] Status check: `/api/status`
- [ ] Database connection working
- [ ] AI services responding
- [ ] CORS configured correctly

### Frontend Tests

- [ ] App loads successfully
- [ ] API calls work
- [ ] Authentication flow
- [ ] Chat functionality
- [ ] Personalization features
- [ ] Responsive design

### AI Personalization Tests

- [ ] Patient interest management
- [ ] Personalized chat responses
- [ ] Donor reward system
- [ ] Qloo integration (if configured)
- [ ] Fallback systems working

## 🚀 Go Live

- [ ] All tests passing
- [ ] Performance acceptable
- [ ] Error monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Team notified

## 📞 Support URLs

After deployment, bookmark these:

- **Frontend**: `https://your-app.netlify.app`
- **Backend**: `https://your-app.onrender.com`
- **API Health**: `https://your-app.onrender.com/api/health`
- **Supabase Dashboard**: `https://supabase.com/dashboard/project/your-project-id`
- **Render Dashboard**: `https://dashboard.render.com`
- **Netlify Dashboard**: `https://app.netlify.com`

## 🎉 Success Criteria

Your deployment is successful when:

✅ Frontend loads without errors
✅ Backend API responds to health checks
✅ Database queries work correctly
✅ AI personalization features function
✅ Users can register, login, and use features
✅ Chat system provides personalized responses
✅ Reward system matches donor interests
✅ Error handling works gracefully

## 🔄 Continuous Deployment

Set up automatic deployments:

1. **Render**: Enable auto-deploy from GitHub main branch
2. **Netlify**: Enable auto-deploy from GitHub main branch
3. **Database**: Use Supabase migrations for schema changes

## 📊 Monitoring

Set up monitoring for:

- API response times
- Error rates
- Database performance
- User engagement metrics
- AI personalization effectiveness

---

**Ready to deploy? Run `./deploy.sh` to prepare your deployment files!** 🚀

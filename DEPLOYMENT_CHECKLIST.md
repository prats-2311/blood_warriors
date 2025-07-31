# 🚀 Deployment Checklist

## 📋 Pre-Deployment Setup

### ✅ Environment Variables Setup

```bash
# Run this script to set up your local environment
./setup-env.sh
```

### ✅ Database Migration

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to **SQL Editor**
3. Copy and paste the migration from `supabase/migrations/20240101000016_add_patient_taste_keywords.sql`
4. Click **Run**

### ✅ Test Locally

```bash
# Test backend
cd backend
npm install
npm start

# Test frontend (in new terminal)
cd frontend
npm install
npm start
```

## 🗄️ Supabase Setup

- [ ] Create Supabase project
- [ ] Copy URL and API keys
- [ ] Apply database migration
- [ ] Test database connection
- [ ] Configure RLS policies (if needed)

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

# 🔐 Environment Variables for Deployment

## 📋 Quick Reference

### 🗄️ **Supabase (Database)**
1. Create project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Go to **Settings > API** to get these values:

```
Project URL: https://your-project-id.supabase.co
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 🖥️ **Render (Backend) Environment Variables**

Set these in **Render Dashboard > Environment**:

```bash
# Required - Database
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Required - Server
NODE_ENV=production
PORT=4000

# Required - Security
JWT_SECRET=your-super-secret-jwt-key-make-it-long-and-random-at-least-32-chars
JWT_EXPIRES_IN=7d

# Required - CORS (Update after Netlify deployment)
FRONTEND_URL=https://your-app-name.netlify.app

# Optional - AI Features
QLOO_API_KEY=your-qloo-api-key
LLM_API_KEY=your-huggingface-api-key

# Optional - Push Notifications
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Optional - Partner API
PARTNER_API_KEY=blood-warriors-partner-key-2024
```

### 🌐 **Netlify (Frontend) Environment Variables**

Set these in **Netlify Dashboard > Site Settings > Environment Variables**:

```bash
# Required - API Connection
REACT_APP_API_URL=https://your-backend-app.onrender.com/api

# Required - Database (Public keys only)
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here

# Optional - Feature Flags
REACT_APP_ENABLE_AI_CHAT=true
REACT_APP_ENABLE_PERSONALIZATION=true
REACT_APP_ENABLE_REWARDS=true

# Optional - App Info
REACT_APP_APP_NAME=Blood Warriors
REACT_APP_VERSION=1.0.0
REACT_APP_ENVIRONMENT=production

# Optional - Analytics
REACT_APP_GOOGLE_ANALYTICS_ID=your-ga-id
REACT_APP_SENTRY_DSN=your-sentry-dsn

# Optional - Firebase (for push notifications)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 🔑 **How to Generate Secure Values**

### JWT Secret (Backend)
```bash
# Generate a secure 64-character random string
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Partner API Key (Backend)
```bash
# Generate a secure API key
node -e "console.log('blood-warriors-' + require('crypto').randomBytes(16).toString('hex'))"
```

## 🚀 **Deployment Order**

1. **Supabase First** - Set up database and get credentials
2. **Render Second** - Deploy backend with Supabase credentials
3. **Netlify Last** - Deploy frontend with backend URL

## ⚠️ **Security Notes**

- Never commit real environment variables to Git
- Use strong, unique secrets for production
- Regularly rotate API keys and secrets
- Enable 2FA on all service accounts
- Monitor access logs for suspicious activity

## 🔍 **Testing Your Deployment**

### Health Check URLs:
- **Backend**: `https://your-backend-app.onrender.com/api/health`
- **Frontend**: `https://your-app-name.netlify.app`
- **Database**: Check Supabase Dashboard > API Health

### Test API Connection:
```bash
# Test backend health
curl https://your-backend-app.onrender.com/api/health

# Test frontend-backend connection
# Open browser dev tools and check Network tab
```

## 🆘 **Troubleshooting**

### Common Issues:

1. **CORS Errors**: Update `FRONTEND_URL` in Render environment
2. **Database Connection**: Check Supabase credentials and network
3. **Build Failures**: Verify Node.js version compatibility
4. **API Not Found**: Confirm backend URL in frontend config

### Debug Commands:
```bash
# Check environment variables (backend)
curl https://your-backend-app.onrender.com/api/debug/env

# Check database connection (backend)
curl https://your-backend-app.onrender.com/api/debug/db
```
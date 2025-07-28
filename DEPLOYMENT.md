# 🚀 Deployment Guide - Blood Warriors AI Platform

This guide covers deploying the Blood Warriors AI Platform to production environments.

## 📋 Prerequisites

- Supabase Cloud account
- Firebase project (for push notifications)
- Domain name (optional but recommended)
- Hosting platform accounts (Vercel, Netlify, Railway, etc.)

## 🗄️ Database Setup (Supabase Cloud)

### 1. Create Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Wait for the project to be ready
4. Note down your project URL and anon key

### 2. Apply Database Schema

```bash
# Link your local project to Supabase Cloud
supabase link --project-ref YOUR_PROJECT_REF

# Push the schema to production
supabase db push

# Apply seed data (optional)
supabase db reset --linked
```

### 3. Configure Authentication

1. Go to Authentication > Settings in Supabase Dashboard
2. Configure your site URL
3. Add redirect URLs for your production domain
4. Enable email confirmations if needed

## 🔧 Backend Deployment

### Option 1: Railway

1. **Connect Repository**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login and deploy
   railway login
   railway init
   railway up
   ```

2. **Environment Variables**
   Set these in Railway dashboard:

   ```env
   NODE_ENV=production
   PORT=4000
   SUPABASE_URL=your-production-supabase-url
   SUPABASE_ANON_KEY=your-production-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key
   JWT_SECRET=your-strong-jwt-secret

   # Firebase
   FIREBASE_PROJECT_ID=your-firebase-project-id
   FIREBASE_CLIENT_EMAIL=your-firebase-client-email
   FIREBASE_PRIVATE_KEY="your-firebase-private-key"

   # External APIs
   QLOO_API_KEY=your-qloo-api-key
   LLM_API_URL=your-llm-api-url
   LLM_API_KEY=your-llm-api-key
   ```

### Option 2: Vercel

1. **Deploy to Vercel**

   ```bash
   # Install Vercel CLI
   npm install -g vercel

   # Deploy from backend directory
   cd backend
   vercel
   ```

2. **Configure vercel.json**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "src/index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "src/index.js"
       }
     ]
   }
   ```

### Option 3: Heroku

1. **Create Heroku App**

   ```bash
   # Install Heroku CLI and login
   heroku create blood-warriors-api

   # Set environment variables
   heroku config:set NODE_ENV=production
   heroku config:set SUPABASE_URL=your-production-supabase-url
   # ... add all other environment variables

   # Deploy
   git push heroku main
   ```

## 🌐 Frontend Deployment

### Option 1: Vercel

1. **Build and Deploy**

   ```bash
   cd frontend

   # Install dependencies
   npm install

   # Deploy to Vercel
   vercel
   ```

2. **Environment Variables**
   Set in Vercel dashboard:

   ```env
   REACT_APP_SUPABASE_URL=your-production-supabase-url
   REACT_APP_SUPABASE_ANON_KEY=your-production-anon-key
   REACT_APP_API_URL=your-backend-api-url
   REACT_APP_MAPBOX_TOKEN=your-mapbox-token

   # Firebase (for PWA notifications)
   REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your-firebase-auth-domain
   REACT_APP_FIREBASE_PROJECT_ID=your-firebase-project-id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your-firebase-storage-bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-firebase-messaging-sender-id
   REACT_APP_FIREBASE_APP_ID=your-firebase-app-id
   ```

### Option 2: Netlify

1. **Build and Deploy**

   ```bash
   cd frontend
   npm run build

   # Deploy to Netlify
   npm install -g netlify-cli
   netlify deploy --prod --dir=build
   ```

2. **Configure \_redirects**
   Create `frontend/public/_redirects`:
   ```
   /*    /index.html   200
   ```

## 🔔 Firebase Setup (Push Notifications)

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project
3. Enable Cloud Messaging

### 2. Generate Service Account Key

1. Go to Project Settings > Service Accounts
2. Generate new private key
3. Download the JSON file
4. Extract the required fields for environment variables

### 3. Configure Web App

1. Add a web app to your Firebase project
2. Copy the config object
3. Add the config to your frontend environment variables

## 🗺️ Maps Setup (Optional)

### Mapbox

1. Create account at [Mapbox](https://www.mapbox.com)
2. Get your access token
3. Add to frontend environment variables

## 🔐 Security Configuration

### 1. CORS Setup

Update backend CORS configuration for production domains:

```javascript
app.use(
  cors({
    origin: [
      "https://your-frontend-domain.com",
      "https://www.your-frontend-domain.com",
    ],
    credentials: true,
  })
);
```

### 2. Rate Limiting

Ensure rate limiting is properly configured for production:

```javascript
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});

app.use("/api/", limiter);
```

### 3. Environment Variables Security

- Use strong, unique secrets for JWT_SECRET
- Never commit API keys to version control
- Use different keys for different environments

## 📊 Monitoring and Analytics

### 1. Error Tracking

Consider integrating error tracking services:

- Sentry
- LogRocket
- Bugsnag

### 2. Performance Monitoring

- Google Analytics
- Mixpanel
- Amplitude

### 3. Uptime Monitoring

- UptimeRobot
- Pingdom
- StatusCake

## 🔄 CI/CD Pipeline

### GitHub Actions Example

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "16"
      - name: Install dependencies
        run: cd backend && npm install
      - name: Run tests
        run: cd backend && npm test
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: "16"
      - name: Install dependencies
        run: cd frontend && npm install
      - name: Build
        run: cd frontend && npm run build
      - name: Deploy to Vercel
        run: vercel --prod
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

## 🧪 Testing in Production

### 1. Health Checks

Implement health check endpoints:

```javascript
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});
```

### 2. Database Connection Test

```javascript
app.get("/health/db", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("Users")
      .select("count")
      .limit(1);

    if (error) throw error;

    res.status(200).json({ status: "ok", database: "connected" });
  } catch (error) {
    res.status(500).json({ status: "error", database: "disconnected" });
  }
});
```

## 📱 PWA Deployment Considerations

### 1. HTTPS Requirement

- PWAs require HTTPS in production
- Most hosting platforms provide SSL certificates automatically

### 2. Service Worker

- Ensure service worker is properly configured
- Test offline functionality

### 3. App Installation

- Test "Add to Home Screen" functionality
- Verify app icons and splash screens

## 🔧 Post-Deployment Checklist

- [ ] Database schema applied successfully
- [ ] All environment variables configured
- [ ] Authentication working correctly
- [ ] Push notifications functional
- [ ] Maps integration working
- [ ] AI chatbot responding
- [ ] Email notifications working
- [ ] PWA installation working
- [ ] Mobile responsiveness verified
- [ ] Performance optimized
- [ ] Error tracking configured
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] SSL certificate active
- [ ] Domain configured correctly

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors**

   - Check CORS configuration in backend
   - Verify frontend domain is whitelisted

2. **Database Connection Issues**

   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure RLS policies are correct

3. **Authentication Problems**

   - Check JWT secret configuration
   - Verify Supabase auth settings
   - Test token expiration handling

4. **Push Notification Issues**
   - Verify Firebase configuration
   - Check service worker registration
   - Test notification permissions

## 📞 Support

For deployment issues:

1. Check the logs in your hosting platform
2. Verify all environment variables
3. Test API endpoints individually
4. Check database connectivity
5. Review error tracking services

---

**Happy Deploying! 🚀**

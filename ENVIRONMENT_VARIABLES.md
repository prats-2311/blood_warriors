# 🔧 Environment Variables Guide

This guide explains all environment variables used in the Blood Warriors AI Platform.

## 🗄️ Backend Environment Variables

### Required Variables (Local Development)

```env
# Supabase Configuration
SUPABASE_URL=http://127.0.0.1:54321
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# Server Configuration
PORT=4000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Partner API Configuration
PARTNER_API_KEY=blood-warriors-partner-key-2024
```

### Optional Variables (Enhanced Features)

```env
# Firebase Configuration (for Push Notifications)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-firebase-client-email
FIREBASE_PRIVATE_KEY="your-firebase-private-key"

# Qloo API Configuration (for Personalized Coupons)
QLOO_API_KEY=your-qloo-api-key
QLOO_API_URL=https://api.qloo.com/v1

# LLM Configuration (for Enhanced CareBot)
LLM_API_URL=https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium
LLM_API_KEY=your-huggingface-api-key
```

## 🌐 Frontend Environment Variables

### Required Variables (Local Development)

```env
# Supabase Configuration
REACT_APP_SUPABASE_URL=http://127.0.0.1:54321
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# API Configuration
REACT_APP_API_URL=http://localhost:4000/api
```

### Optional Variables (Enhanced Features)

```env
# Mapbox Configuration (for Enhanced Maps)
REACT_APP_MAPBOX_TOKEN=your-mapbox-token

# Firebase Configuration (for Push Notifications)
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
REACT_APP_FIREBASE_APP_ID=your-app-id
```

## 📝 Variable Descriptions

### Backend Variables

#### Supabase Configuration

- **SUPABASE_URL**: The URL of your Supabase instance
- **SUPABASE_ANON_KEY**: Public key for client-side operations
- **SUPABASE_SERVICE_ROLE_KEY**: Private key for server-side operations (bypasses RLS)

#### Server Configuration

- **PORT**: Port number for the backend server (default: 4000)
- **NODE_ENV**: Environment mode (development/production)

#### JWT Configuration

- **JWT_SECRET**: Secret key for signing JWT tokens (must be strong in production)
- **JWT_EXPIRES_IN**: Token expiration time (e.g., '7d', '24h', '30m')

#### Partner API

- **PARTNER_API_KEY**: API key for partner integrations (hospitals, NGOs)

#### Firebase (Push Notifications)

- **FIREBASE_PROJECT_ID**: Your Firebase project ID
- **FIREBASE_CLIENT_EMAIL**: Service account email
- **FIREBASE_PRIVATE_KEY**: Service account private key (keep secure)

#### Qloo API (Personalized Coupons)

- **QLOO_API_KEY**: API key from Qloo for taste profiling
- **QLOO_API_URL**: Qloo API endpoint URL

#### LLM Configuration (AI CareBot)

- **LLM_API_URL**: URL of your LLM service (Hugging Face, OpenAI, etc.)
- **LLM_API_KEY**: API key for the LLM service

### Frontend Variables

#### Supabase Configuration

- **REACT_APP_SUPABASE_URL**: Same as backend SUPABASE_URL
- **REACT_APP_SUPABASE_ANON_KEY**: Same as backend SUPABASE_ANON_KEY

#### API Configuration

- **REACT_APP_API_URL**: URL of your backend API

#### Mapbox (Enhanced Maps)

- **REACT_APP_MAPBOX_TOKEN**: Access token from Mapbox for enhanced mapping

#### Firebase (Push Notifications)

- **REACT*APP_FIREBASE*\***: Firebase web app configuration

## 🔐 Security Considerations

### Local Development

- The provided default keys are safe for local development
- Never commit real API keys to version control
- Use `.env` files (already in .gitignore)

### Production

- Generate strong, unique secrets for JWT_SECRET
- Use environment variables or secure secret management
- Rotate keys regularly
- Use different keys for different environments

## 🚀 Getting API Keys

### Firebase (Optional - for Push Notifications)

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Cloud Messaging
4. Go to Project Settings > Service Accounts
5. Generate new private key
6. Copy the configuration values

### Mapbox (Optional - for Enhanced Maps)

1. Create account at [Mapbox](https://www.mapbox.com/)
2. Go to Account > Access Tokens
3. Create a new token or use the default public token
4. Copy the token

### Hugging Face (Optional - for Enhanced AI)

1. Create account at [Hugging Face](https://huggingface.co/)
2. Go to Settings > Access Tokens
3. Create a new token with read permissions
4. Copy the token

### Qloo API (Optional - for Personalized Coupons)

1. Contact [Qloo](https://www.qloo.com/) for API access
2. Get your API key and endpoint URL
3. Add to environment variables

## 🔄 Environment Setup Process

### 1. Copy Example Files

```bash
# Backend
cp backend/.env.example backend/.env

# Frontend
cp frontend/.env.example frontend/.env
```

### 2. Update Required Variables

For local development, the default values work out of the box.

### 3. Add Optional API Keys

Update the `.env` files with your API keys for enhanced features.

### 4. Verify Configuration

```bash
# Check if Supabase is accessible
curl http://127.0.0.1:54321/health

# Test backend health
curl http://localhost:4000/health
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Supabase Connection Errors

- Verify SUPABASE_URL is correct
- Check if Supabase is running: `supabase status`
- Ensure keys match your local instance

#### 2. CORS Errors

- Check REACT_APP_API_URL points to correct backend
- Verify backend CORS configuration

#### 3. Authentication Issues

- Ensure JWT_SECRET is set and consistent
- Check token expiration settings
- Verify Supabase auth configuration

#### 4. API Integration Failures

- Check if API keys are valid
- Verify network connectivity
- Look for rate limiting issues

### Debug Commands

```bash
# Check environment variables
printenv | grep SUPABASE
printenv | grep REACT_APP

# Test API endpoints
curl -H "Content-Type: application/json" http://localhost:4000/health

# Check Supabase status
supabase status
```

## 📋 Environment Checklist

### Before Starting Development

- [ ] Supabase is running (`supabase status`)
- [ ] Backend `.env` file exists and is configured
- [ ] Frontend `.env` file exists and is configured
- [ ] All required variables are set
- [ ] Optional API keys added (if needed)

### Before Production Deployment

- [ ] Strong JWT_SECRET generated
- [ ] Production Supabase instance configured
- [ ] All API keys are production-ready
- [ ] Environment variables are secure
- [ ] No sensitive data in version control

---

**Need Help?** Check the SETUP_GUIDE.md for detailed setup instructions.

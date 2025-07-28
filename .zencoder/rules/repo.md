---
description: Repository Information Overview
alwaysApply: true
---

# Blood Warriors AI Platform Information

## Summary
The Blood Warriors AI Platform is a comprehensive health technology solution designed to eliminate blood shortages for Thalassemia patients in India. The platform connects patients with donors through a smart network that combines real-time logistics with AI-driven user engagement and support.

## Structure
This repository contains the blueprint and technical specifications for the Blood Warriors AI Platform. Currently, it includes:
- `blueprint.md`: Outlines the project vision, core architectural principles, and feature specifications
- `technical_specs.md`: Provides detailed technical documentation including system architecture, database schema, and API specifications

## Language & Runtime
**Language**: JavaScript/TypeScript (Backend), JavaScript/HTML/CSS (Frontend PWA)
**Database**: PostgreSQL via Supabase
**Backend Framework**: Node.js with Express
**Frontend Framework**: React with PWA capabilities
**Authentication**: Supabase Auth (JWT-based)

## Dependencies
**Backend Dependencies**:
- Express.js: Web framework for Node.js
- Supabase.js: Client library for Supabase
- Node-postgres: PostgreSQL client for Node.js
- Firebase Cloud Messaging (FCM): Push notification service
- Qloo API: Cultural AI for personalized engagement
- LangChain: Framework for LLM integration (CareBot)

**Frontend Dependencies**:
- React: UI library
- React Router: Client-side routing
- Supabase.js: Client library for Supabase
- Workbox: PWA service worker library
- Mapbox/Leaflet: Maps for location services

## Database Implementation (Supabase)
**Database Type**: PostgreSQL (managed by Supabase)
**Authentication**: Supabase Auth with JWT
**Key Tables**:
- User tables: Users, Patients, Donors
- Blood data tables: BloodGroups, BloodComponents, BloodBanks, BloodStock
- Activity tables: DonationRequests, Donations, Notifications
- Perks program tables: Coupons, DonorCoupons
- AI tables: ChatHistory

**Supabase Features Used**:
- Row Level Security (RLS): For data access control
- Realtime subscriptions: For live updates on donation requests
- PostGIS extension: For geospatial queries (donor proximity)
- Storage: For user profile images and documents
- Edge Functions: For serverless API endpoints

## Build & Installation
```bash
# Backend setup
cd backend
npm install
npm run dev

# Frontend setup
cd frontend
npm install
npm start

# Database setup
npx supabase init
npx supabase start
```

## API Implementation
**Base URL**: https://api.bloodwarriors.ai/v1
**Authentication**: JWT via Supabase Auth
**Key Endpoints**:
- `/auth`: Handled by Supabase Auth
- `/donors`: Donor profile management
- `/requests`: Blood donation requests
- `/public-data`: Public blood bank information
- `/partner`: Integration for hospital partners

## Core Features Implementation

### 1. Dynamic SOS Network
- **Backend**: Geospatial queries using PostGIS in Supabase
- **Notifications**: Firebase Cloud Messaging integration
- **Location Services**: Browser Geolocation API + Mapbox/Leaflet

### 2. Thalassemia CareBot
- **LLM Integration**: Fine-tuned open-source model (Llama 3, Mistral 7B)
- **Deployment**: Hugging Face Inference API or self-hosted
- **Context Management**: LangChain for conversation history

### 3. Donor Perks Program
- **External API**: Qloo API integration
- **Matching Algorithm**: PostgreSQL JSON functions for keyword matching
- **Notification System**: Firebase Cloud Messaging

### 4. Partner Integration Gateway
- **Authentication**: API key management via Supabase
- **Rate Limiting**: Implemented at API Gateway level
- **Data Validation**: JSON Schema validation

### 5. Public Data Hub
- **Data Collection**: Scheduled functions to scrape e-RaktKosh
- **Data Cleaning**: ETL pipeline using Node.js
- **API Caching**: Redis or Supabase caching

## Development Workflow
1. ✅ Set up Supabase project and implement database schema
   - Created `supabase_schema.sql` with adapted schema for Supabase
   - Added PostGIS extension for geospatial queries
   - Implemented Row Level Security (RLS) policies
   - Created stored procedures for core features
2. ✅ Set up project structure
   - Created directory structure for backend and frontend
   - Set up basic Express.js server
   - Created configuration files (.env.example)
   - Implemented Supabase client utility
3. ✅ Implement authentication middleware
   - Created middleware for JWT validation with Supabase Auth
   - Added role-based access control (Patient, Donor, Admin)
   - Implemented partner API authentication
4. 🔄 Next steps:
   - Implement core API endpoints with Express.js
   - Develop PWA frontend with React
   - Integrate external services (FCM, Qloo, LLM)
   - Implement geospatial features for the SOS network
   - Set up CI/CD pipeline for deployment

## Testing & Validation
- **Unit Testing**: Jest for backend, React Testing Library for frontend
- **API Testing**: Postman or Insomnia
- **Database Testing**: pgTAP for PostgreSQL
- **Security Testing**: OWASP guidelines, penetration testing
- **User Testing**: Usability testing with target users
# 🩸 Blood Warriors AI Platform

A comprehensive health technology solution designed to eliminate blood shortages for Thalassemia patients in India. The platform connects patients with donors through a smart network that combines real-time logistics with AI-driven user engagement and support.

## 🌟 Features

### Core Features

- **Dynamic SOS Network**: Real-time emergency blood request system with geospatial donor matching
- **Thalassemia CareBot**: AI-powered chatbot for personalized health support and guidance
- **Donor Perks Program**: Reward system with personalized coupons based on donor preferences
- **Partner Integration Gateway**: API for hospitals and NGOs to integrate with the platform
- **Public Data Hub**: Comprehensive blood bank directory with real-time stock information

### User Types

- **Patients**: Create blood requests, track donations, chat with CareBot
- **Donors**: Receive notifications, manage availability, earn rewards
- **Admins**: Manage platform, monitor activities, generate reports

## 🏗️ Architecture

### Technology Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React PWA (Progressive Web App)
- **Database**: PostgreSQL with PostGIS (via Supabase)
- **Authentication**: Supabase Auth (JWT-based)
- **Real-time**: Supabase Realtime subscriptions
- **Push Notifications**: Firebase Cloud Messaging
- **AI Integration**: Hugging Face Inference API / Custom LLM
- **Maps**: Leaflet with OpenStreetMap
- **Personalization**: Qloo API integration

### Database Schema

- User management with role-based access control
- Geospatial data for location-based matching
- Blood inventory tracking
- Notification and reward systems
- AI chat history and analytics

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm
- Git

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd blood_warriors
   ```

2. **Run the automated setup**

   ```bash
   chmod +x setup.sh
   ./setup.sh
   ```

   This will:

   - Install all dependencies
   - Set up Supabase local development
   - Apply database migrations
   - Create environment files with working defaults

3. **Start the application**

   ```bash
   # Option 1: Use the run script (recommended)
   ./run.sh

   # Option 2: Start manually in separate terminals
   # Terminal 1:
   cd backend && npm run dev

   # Terminal 2:
   cd frontend && npm start
   ```

4. **Access the application**
   - Frontend: http://localhost:3100
   - Backend API: http://localhost:4000/api
   - Supabase Studio: http://localhost:54323

### Environment Variables

The setup script creates working `.env` files with default values. For enhanced features, see [ENVIRONMENT_VARIABLES.md](ENVIRONMENT_VARIABLES.md) to add:

- Firebase (push notifications)
- Mapbox (enhanced maps)
- Hugging Face (enhanced AI)
- Qloo API (personalized coupons)

## 📱 PWA Features

The frontend is built as a Progressive Web App with:

- Offline functionality
- Push notifications
- App-like experience on mobile devices
- Automatic updates
- Home screen installation

## 🔧 Development

### Project Structure

```
blood_warriors/
├── backend/                 # Node.js API server
│   ├── src/
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/      # Authentication, validation
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   └── utils/           # Utilities
│   └── package.json
├── frontend/                # React PWA
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── contexts/        # React contexts
│   │   ├── pages/           # Page components
│   │   ├── services/        # API services
│   │   └── utils/           # Utilities
│   └── package.json
├── supabase/               # Database schema and config
│   ├── migrations/
│   └── config.toml
└── README.md
```

### API Endpoints

#### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

#### Blood Requests

- `POST /api/requests` - Create blood request
- `GET /api/requests` - List blood requests
- `GET /api/requests/:id` - Get specific request
- `POST /api/requests/:id/respond` - Respond to request (donors)
- `PUT /api/requests/:id/status` - Update request status (patients)

#### Donors

- `PUT /api/donors/me/location` - Update donor location
- `PUT /api/donors/me/sos-availability` - Toggle SOS availability
- `GET /api/donors/me/notifications` - Get notifications
- `GET /api/donors/me/coupons` - Get reward coupons
- `POST /api/donors/me/donations` - Record donation

#### Public Data

- `GET /api/public-data/banks` - List blood banks
- `GET /api/public-data/stock` - Get blood stock
- `GET /api/public-data/blood-groups` - Get blood groups
- `GET /api/public-data/blood-components` - Get blood components

#### AI CareBot

- `POST /api/ai/carebot/query` - Chat with CareBot

#### Partner Integration

- `POST /api/partner/requests/sos` - Create SOS request (hospitals)
- `POST /api/partner/donors/register` - Register donor (NGOs)

### Database Functions

The platform includes several PostgreSQL functions for advanced features:

- `find_eligible_donors()` - Find compatible donors within radius
- `create_sos_notifications()` - Create notifications for SOS requests
- `match_donor_with_coupons()` - Match donors with relevant coupons
- `issue_coupon_to_donor()` - Issue reward coupons

## 🧪 Testing

### Backend Testing

```bash
cd backend
npm test
```

### Frontend Testing

```bash
cd frontend
npm test
```

## 🚀 Deployment

### Backend Deployment

1. Set up production database (Supabase Cloud)
2. Configure environment variables
3. Deploy to your preferred platform (Vercel, Railway, etc.)

### Frontend Deployment

1. Build the production bundle
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy to static hosting (Vercel, Netlify, etc.)

### Database Migration

```bash
supabase db push
```

## 🔐 Security Features

- JWT-based authentication
- Row Level Security (RLS) policies
- API rate limiting
- Input validation and sanitization
- CORS protection
- Helmet.js security headers

## 🌍 Internationalization

The platform is designed to support multiple languages and can be easily extended for different regions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🙏 Acknowledgments

- Thalassemia patients and families for inspiration
- Blood donors who save lives daily
- Healthcare professionals providing guidance
- Open source community for tools and libraries

---

**Blood Warriors AI Platform** - Connecting hearts, saving lives through technology. 🩸❤️

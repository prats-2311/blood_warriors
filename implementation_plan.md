# Blood Warriors AI Platform Implementation Plan

## 1. Project Setup

### Backend Setup (Node.js/Express)

```bash
mkdir -p backend/src/{controllers,models,routes,middleware,utils,services}
cd backend
npm init -y
npm install express dotenv cors helmet @supabase/supabase-js firebase-admin jsonwebtoken
npm install --save-dev nodemon typescript ts-node @types/express @types/node
```

### Frontend Setup (React PWA)

```bash
npx create-react-app frontend --template pwa-typescript
cd frontend
npm install @supabase/supabase-js react-router-dom mapbox-gl @types/mapbox-gl
```

## 2. Database Implementation

1. Run the `supabase_schema.sql` script in your local Supabase instance:
   - Open the Supabase Studio at http://localhost:54323
   - Go to the SQL Editor
   - Paste and run the SQL script

2. Set up Supabase client in your backend:

```typescript
// backend/src/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-local-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

## 3. API Implementation

### Authentication Routes

```typescript
// backend/src/routes/auth.routes.ts
import { Router } from 'express';
import { register, login, getProfile, updateProfile } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);

export default router;
```

### Donation Request Routes

```typescript
// backend/src/routes/requests.routes.ts
import { Router } from 'express';
import { 
  createRequest, 
  getRequest, 
  listRequests, 
  respondToRequest,
  updateRequestStatus
} from '../controllers/requests.controller';
import { authenticate, isPatient, isDonor } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, isPatient, createRequest);
router.get('/:id', authenticate, getRequest);
router.get('/', authenticate, listRequests);
router.post('/:id/respond', authenticate, isDonor, respondToRequest);
router.put('/:id/status', authenticate, isPatient, updateRequestStatus);

export default router;
```

### Donor Routes

```typescript
// backend/src/routes/donors.routes.ts
import { Router } from 'express';
import { 
  updateLocation, 
  toggleSosAvailability,
  updateTasteKeywords,
  getDonorCoupons
} from '../controllers/donors.controller';
import { authenticate, isDonor } from '../middleware/auth.middleware';

const router = Router();

router.put('/me/location', authenticate, isDonor, updateLocation);
router.put('/me/sos-availability', authenticate, isDonor, toggleSosAvailability);
router.put('/me/taste-keywords', authenticate, isDonor, updateTasteKeywords);
router.get('/me/coupons', authenticate, isDonor, getDonorCoupons);

export default router;
```

### Public Data Routes

```typescript
// backend/src/routes/public-data.routes.ts
import { Router } from 'express';
import { 
  listBloodBanks, 
  getBloodStock,
  getBloodGroups,
  getBloodComponents
} from '../controllers/public-data.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/banks', authenticate, listBloodBanks);
router.get('/stock', authenticate, getBloodStock);
router.get('/blood-groups', authenticate, getBloodGroups);
router.get('/blood-components', authenticate, getBloodComponents);

export default router;
```

### Partner Routes

```typescript
// backend/src/routes/partner.routes.ts
import { Router } from 'express';
import { 
  createSosRequest, 
  registerDonor
} from '../controllers/partner.controller';
import { authenticatePartner } from '../middleware/auth.middleware';

const router = Router();

router.post('/requests/sos', authenticatePartner, createSosRequest);
router.post('/donors/register', authenticatePartner, registerDonor);

export default router;
```

### AI Routes

```typescript
// backend/src/routes/ai.routes.ts
import { Router } from 'express';
import { queryCareBot } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/carebot/query', authenticate, queryCareBot);

export default router;
```

## 4. Core Feature Implementation

### Dynamic SOS Network

1. Create a service to handle SOS requests:

```typescript
// backend/src/services/sos.service.ts
import { supabase } from '../utils/supabase';
import { sendPushNotification } from './notification.service';

export async function createSosRequest(patientId, bloodGroupId, componentId, unitsRequired, latitude, longitude) {
  try {
    // 1. Insert the request into the database
    const { data: request, error } = await supabase
      .from('DonationRequests')
      .insert({
        patient_id: patientId,
        blood_group_id: bloodGroupId,
        component_id: componentId,
        units_required: unitsRequired,
        urgency: 'SOS',
        status: 'Open',
        latitude,
        longitude
      })
      .select()
      .single();
      
    if (error) throw error;
    
    // 2. Call the database function to create notifications
    const { data: notificationCount, error: funcError } = await supabase
      .rpc('create_sos_notifications', {
        p_request_id: request.request_id,
        p_max_distance_km: 15
      });
      
    if (funcError) throw funcError;
    
    // 3. Get the notifications to send push notifications
    const { data: notifications, error: notifError } = await supabase
      .from('Notifications')
      .select(`
        notification_id,
        donor_id,
        message,
        Donors(Users(fcm_token))
      `)
      .eq('request_id', request.request_id);
      
    if (notifError) throw notifError;
    
    // 4. Send push notifications
    for (const notification of notifications) {
      if (notification.Donors?.Users?.fcm_token) {
        await sendPushNotification(
          notification.Donors.Users.fcm_token,
          'Blood Request SOS',
          notification.message
        );
      }
    }
    
    return { request, notificationCount };
  } catch (error) {
    console.error('Error creating SOS request:', error);
    throw error;
  }
}
```

2. Implement the push notification service:

```typescript
// backend/src/services/notification.service.ts
import admin from 'firebase-admin';
import { supabase } from '../utils/supabase';

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

export async function sendPushNotification(token, title, body, data = {}) {
  try {
    const message = {
      notification: {
        title,
        body
      },
      data,
      token
    };
    
    const response = await admin.messaging().send(message);
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

export async function updateNotificationStatus(notificationId, status) {
  try {
    const { data, error } = await supabase
      .from('Notifications')
      .update({ status })
      .eq('notification_id', notificationId)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating notification status:', error);
    throw error;
  }
}
```

### Thalassemia CareBot

1. Set up the LLM integration:

```typescript
// backend/src/services/carebot.service.ts
import { supabase } from '../utils/supabase';

// This is a placeholder for the actual LLM integration
// You would use a service like Hugging Face Inference API or a self-hosted model
async function queryLLM(prompt, context = []) {
  // In a real implementation, you would call your LLM API here
  // For now, we'll return a mock response
  return {
    response: `This is a mock response to: "${prompt}". In a real implementation, this would come from a fine-tuned LLM.`
  };
}

export async function queryCareBot(userId, prompt) {
  try {
    // 1. Get user's chat history for context
    const { data: history, error: historyError } = await supabase
      .from('ChatHistory')
      .select('prompt, response')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(5);
      
    if (historyError) throw historyError;
    
    // 2. Query the LLM with the prompt and context
    const llmResponse = await queryLLM(prompt, history);
    
    // 3. Save the interaction to chat history
    const { data: chatRecord, error: chatError } = await supabase
      .from('ChatHistory')
      .insert({
        user_id: userId,
        prompt,
        response: llmResponse.response
      })
      .select()
      .single();
      
    if (chatError) throw chatError;
    
    return {
      response: llmResponse.response,
      chatId: chatRecord.chat_id
    };
  } catch (error) {
    console.error('Error querying CareBot:', error);
    throw error;
  }
}
```

### Donor Perks Program

1. Implement the service to handle donation rewards:

```typescript
// backend/src/services/perks.service.ts
import { supabase } from '../utils/supabase';
import { sendPushNotification } from './notification.service';
import { callQlooApi } from './qloo.service';

export async function processDonationReward(donationId) {
  try {
    // 1. Get the donation details
    const { data: donation, error: donationError } = await supabase
      .from('Donations')
      .select(`
        donation_id,
        donor_id,
        Donors(qloo_taste_keywords, Users(fcm_token))
      `)
      .eq('donation_id', donationId)
      .single();
      
    if (donationError) throw donationError;
    
    const donorId = donation.donor_id;
    const tasteKeywords = donation.Donors?.qloo_taste_keywords || [];
    const fcmToken = donation.Donors?.Users?.fcm_token;
    
    // 2. If no taste keywords, we can't match coupons
    if (!tasteKeywords.length) {
      return { success: false, reason: 'No taste keywords available' };
    }
    
    // 3. Call Qloo API to enrich keywords (mock implementation)
    const enrichedKeywords = await callQlooApi(tasteKeywords);
    
    // 4. Find matching coupons using the database function
    const { data: matchingCoupons, error: matchError } = await supabase
      .rpc('match_donor_with_coupons', {
        p_donor_id: donorId
      });
      
    if (matchError) throw matchError;
    
    // 5. If no matching coupons, return
    if (!matchingCoupons.length) {
      return { success: false, reason: 'No matching coupons found' };
    }
    
    const couponId = matchingCoupons[0].coupon_id;
    
    // 6. Issue the coupon to the donor
    const { data: redemptionCode, error: issueError } = await supabase
      .rpc('issue_coupon_to_donor', {
        p_donor_id: donorId,
        p_coupon_id: couponId
      });
      
    if (issueError) throw issueError;
    
    // 7. Send push notification if FCM token is available
    if (fcmToken) {
      await sendPushNotification(
        fcmToken,
        'Thank You for Your Donation!',
        `You've earned a reward: ${matchingCoupons[0].coupon_title}. Use code: ${redemptionCode}`
      );
    }
    
    return {
      success: true,
      coupon: matchingCoupons[0],
      redemptionCode
    };
  } catch (error) {
    console.error('Error processing donation reward:', error);
    throw error;
  }
}
```

2. Mock implementation of the Qloo API service:

```typescript
// backend/src/services/qloo.service.ts
export async function callQlooApi(tasteKeywords) {
  // This is a mock implementation
  // In a real implementation, you would call the Qloo API
  
  // Mock enrichment: for each keyword, add 2 related keywords
  const enrichedKeywords = [...tasteKeywords];
  
  for (const keyword of tasteKeywords) {
    if (keyword === 'movies') {
      enrichedKeywords.push('cinema', 'films');
    } else if (keyword === 'cafes') {
      enrichedKeywords.push('coffee', 'bakeries');
    } else if (keyword === 'music') {
      enrichedKeywords.push('concerts', 'festivals');
    } else if (keyword === 'sports') {
      enrichedKeywords.push('fitness', 'athletics');
    } else {
      // Add some generic related keywords
      enrichedKeywords.push(`${keyword} events`, `${keyword} shops`);
    }
  }
  
  return [...new Set(enrichedKeywords)]; // Remove duplicates
}
```

## 5. Frontend Implementation

### Key Components

1. **Auth Components**:
   - Registration Form
   - Login Form
   - Profile Management

2. **Patient Components**:
   - Dashboard with blood request history
   - SOS Request Form
   - Request Status Tracking

3. **Donor Components**:
   - Dashboard with donation history
   - Location Settings
   - Notification Center
   - Rewards Wallet

4. **Shared Components**:
   - Blood Bank Locator Map
   - CareBot Chat Interface
   - Blood Stock Information

### Sample React Component for SOS Request

```tsx
// frontend/src/components/SosRequestButton.tsx
import React, { useState } from 'react';
import { useSupabaseClient } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';

const SosRequestButton: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabaseClient();
  const navigate = useNavigate();

  const handleSosRequest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Get user's location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject);
      });
      
      const { latitude, longitude } = position.coords;
      
      // 2. Get user's blood group from profile
      const { data: profile, error: profileError } = await supabase
        .from('Patients')
        .select('blood_group_id')
        .single();
        
      if (profileError) throw profileError;
      
      // 3. Create the SOS request
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          blood_group_id: profile.blood_group_id,
          component_id: 1, // Whole Blood (default)
          units_required: 1,
          urgency: 'SOS',
          latitude,
          longitude
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create SOS request');
      }
      
      const data = await response.json();
      
      // 4. Navigate to request status page
      navigate(`/requests/${data.request.request_id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('SOS request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="sos-button-container">
      <button
        className="sos-button"
        onClick={handleSosRequest}
        disabled={isLoading}
      >
        {isLoading ? 'Processing...' : 'Request Blood (SOS)'}
      </button>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
    </div>
  );
};

export default SosRequestButton;
```

## 6. Next Steps

1. **Set up the project structure** according to the plan above
2. **Implement the database schema** in your local Supabase instance
3. **Build the authentication system** using Supabase Auth
4. **Implement the core API endpoints** for the Dynamic SOS Network feature
5. **Create the basic frontend components** for patient and donor interfaces
6. **Test the end-to-end flow** of the SOS feature
7. **Implement the remaining features** in order of priority

## 7. Testing Strategy

1. **Unit Tests**: Test individual functions and components
2. **Integration Tests**: Test API endpoints and database interactions
3. **End-to-End Tests**: Test complete user flows
4. **Performance Tests**: Test the system under load, especially the SOS feature
5. **Security Tests**: Test authentication, authorization, and data protection
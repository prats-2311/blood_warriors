import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';

const SosRequestButton = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSosRequest = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // 1. Get user's location
      const position = await new Promise((resolve, reject) => {
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
      const response = await fetch(`${process.env.REACT_APP_API_URL}/requests`, {
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
      navigate(`/requests/${data.data.request_id}`);
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
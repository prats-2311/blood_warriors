import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabase';
import Button, { HeartIcon } from './ui/Button';
import './SosRequestButton.css';

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
    <div className="sos-container">
      <div className="sos-card">
        <div className="sos-card__header">
          <div className="sos-card__icon">
            <HeartIcon />
          </div>
          <h3 className="sos-card__title">Emergency Blood Request</h3>
          <p className="sos-card__subtitle">
            Need blood urgently? Send an SOS to nearby donors instantly.
          </p>
        </div>
        
        <div className="sos-card__content">
          <div className="sos-warning">
            <div className="sos-warning__icon">⚠️</div>
            <div className="sos-warning__text">
              <strong>Emergency Use Only</strong>
              <p>This will alert all nearby donors immediately. Use only for genuine emergencies.</p>
            </div>
          </div>
          
          <Button
            variant="sos"
            size="xl"
            fullWidth
            loading={isLoading}
            onClick={handleSosRequest}
            icon={<HeartIcon />}
            className="sos-button"
          >
            {isLoading ? 'Sending SOS Alert...' : 'Send SOS Alert'}
          </Button>
          
          {error && (
            <div className="sos-error">
              <div className="sos-error__icon">❌</div>
              <div className="sos-error__message">{error}</div>
            </div>
          )}
        </div>
        
        <div className="sos-card__footer">
          <div className="sos-info">
            <div className="sos-info__item">
              <span className="sos-info__label">Response Time:</span>
              <span className="sos-info__value">~5 minutes</span>
            </div>
            <div className="sos-info__item">
              <span className="sos-info__label">Coverage:</span>
              <span className="sos-info__value">15km radius</span>
            </div>
            <div className="sos-info__item">
              <span className="sos-info__label">Available 24/7:</span>
              <span className="sos-info__value">Yes</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SosRequestButton;
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { couponService } from '../services/couponService';
import { useProfile } from '../hooks/useAuth';
import './RewardsWidget.css';

const RewardsWidget = () => {
  const { profile } = useProfile();
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    available: 0,
    expiring: 0,
    total: 0
  });

  useEffect(() => {
    if (profile?.user_id) {
      fetchRewards();
    }
  }, [profile]);

  const fetchRewards = async () => {
    try {
      setLoading(true);
      // Get expiring coupons (within 7 days)
      const expiringData = await couponService.getExpiringCoupons(profile.user_id, 7);
      
      // Get available coupons
      const availableData = await couponService.getDonorCoupons(profile.user_id, "Issued");
      
      // Get coupon stats
      const statsData = await couponService.getCouponStats(profile.user_id);
      
      // Set rewards data
      setRewards(expiringData.data || []);
      
      // Set stats
      setStats({
        available: availableData.data?.length || 0,
        expiring: expiringData.data?.length || 0,
        total: statsData?.total_issued || 0
      });
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rewards-widget">
        <div className="rewards-widget-header">
          <h3>My Rewards</h3>
        </div>
        <div className="rewards-widget-loading">
          <div className="spinner-small"></div>
          <p>Loading rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rewards-widget">
      <div className="rewards-widget-header">
        <h3>My Rewards</h3>
        <Link to="/app/coupons" className="view-all-link">View All</Link>
      </div>
      
      <div className="rewards-stats">
        <div className="reward-stat">
          <span className="stat-value">{stats.available}</span>
          <span className="stat-label">Available</span>
        </div>
        <div className="reward-stat">
          <span className="stat-value">{stats.expiring}</span>
          <span className="stat-label">Expiring Soon</span>
        </div>
        <div className="reward-stat">
          <span className="stat-value">{stats.total}</span>
          <span className="stat-label">Total Earned</span>
        </div>
      </div>
      
      {rewards.length > 0 ? (
        <div className="rewards-list">
          <h4>Expiring Soon</h4>
          {rewards.slice(0, 3).map(reward => (
            <div key={reward.id} className="reward-item">
              <div className="reward-icon">🎁</div>
              <div className="reward-details">
                <div className="reward-title">{reward.coupon_title}</div>
                <div className="reward-partner">{reward.partner_name}</div>
                <div className="reward-expiry">
                  Expires: {new Date(reward.expiry_date).toLocaleDateString()}
                </div>
              </div>
              <Link to="/app/coupons" className="use-reward-btn">Use</Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-rewards">
          <p>No rewards expiring soon.</p>
          <Link to="/app/coupons" className="browse-rewards-btn">Browse Rewards</Link>
        </div>
      )}
      
      <div className="rewards-footer">
        <p>Donate blood to earn more rewards!</p>
      </div>
    </div>
  );
};

export default RewardsWidget;
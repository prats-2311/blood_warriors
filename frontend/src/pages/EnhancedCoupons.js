import React, { useState, useEffect } from "react";
import { couponService } from "../services/couponService";
import { useProfile } from "../hooks/useAuth";
import "./EnhancedCoupons.css";

const EnhancedCoupons = () => {
  const { profile } = useProfile();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [activeTab, setActiveTab] = useState("available");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [couponStats, setCouponStats] = useState({
    total_issued: 0,
    total_redeemed: 0,
    total_expired: 0
  });

  useEffect(() => {
    if (profile?.user_id) {
      fetchCoupons();
      fetchCouponStats();
    }
  }, [profile, activeTab, filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      let data;
      
      // Different API calls based on active tab
      if (activeTab === "available") {
        data = await couponService.getDonorCoupons(profile.user_id, "Issued");
      } else if (activeTab === "redeemed") {
        data = await couponService.getDonorCoupons(profile.user_id, "Redeemed");
      } else if (activeTab === "expiring") {
        data = await couponService.getExpiringCoupons(profile.user_id, 7);
      } else if (activeTab === "all") {
        data = await couponService.getDonorCoupons(profile.user_id, filter || null);
      }
      
      setCoupons(data.data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCouponStats = async () => {
    try {
      const stats = await couponService.getCouponStats(profile.user_id);
      if (stats) {
        setCouponStats(stats);
      }
    } catch (error) {
      console.error("Error fetching coupon stats:", error);
    }
  };

  const handleRedeemCoupon = async (couponId) => {
    try {
      await couponService.redeemCoupon(couponId);
      // Refresh coupons after redemption
      fetchCoupons();
      fetchCouponStats();
    } catch (error) {
      console.error("Error redeeming coupon:", error);
    }
  };

  const handleCouponClick = (coupon) => {
    setSelectedCoupon(coupon);
  };

  const closeModal = () => {
    setSelectedCoupon(null);
  };

  const filteredCoupons = coupons.filter(coupon => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      coupon.partner_name?.toLowerCase().includes(query) ||
      coupon.coupon_title?.toLowerCase().includes(query)
    );
  });

  if (loading && !coupons.length) {
    return (
      <div className="enhanced-coupons-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your rewards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="enhanced-coupons-page">
      <div className="coupons-header">
        <div className="coupons-header-content">
          <h1>My Rewards & Coupons</h1>
          <p>Earn rewards by donating blood and helping save lives!</p>
        </div>
      </div>

      <div className="coupons-stats-container">
        <div className="coupon-stat-card">
          <div className="stat-icon available-icon">🎁</div>
          <div className="stat-content">
            <h3>{couponStats.total_issued - couponStats.total_redeemed - couponStats.total_expired}</h3>
            <p>Available</p>
          </div>
        </div>
        <div className="coupon-stat-card">
          <div className="stat-icon redeemed-icon">✅</div>
          <div className="stat-content">
            <h3>{couponStats.total_redeemed}</h3>
            <p>Redeemed</p>
          </div>
        </div>
        <div className="coupon-stat-card">
          <div className="stat-icon expired-icon">⏱️</div>
          <div className="stat-content">
            <h3>{couponStats.total_expired}</h3>
            <p>Expired</p>
          </div>
        </div>
      </div>

      <div className="coupons-controls">
        <div className="coupons-tabs">
          <button 
            className={`tab-button ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            Available
          </button>
          <button 
            className={`tab-button ${activeTab === 'expiring' ? 'active' : ''}`}
            onClick={() => setActiveTab('expiring')}
          >
            Expiring Soon
          </button>
          <button 
            className={`tab-button ${activeTab === 'redeemed' ? 'active' : ''}`}
            onClick={() => setActiveTab('redeemed')}
          >
            Redeemed
          </button>
          <button 
            className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All Coupons
          </button>
        </div>
        
        <div className="coupons-search">
          <input
            type="text"
            placeholder="Search coupons..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {activeTab === 'all' && (
        <div className="filter-dropdown">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="Issued">Available</option>
            <option value="Redeemed">Redeemed</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      )}

      <div className="coupons-grid">
        {filteredCoupons.length > 0 ? (
          filteredCoupons.map((coupon) => (
            <div 
              key={coupon.id} 
              className={`coupon-card ${coupon.status.toLowerCase()}`}
              onClick={() => handleCouponClick(coupon)}
            >
              <div className="coupon-status">{coupon.status}</div>
              <div className="coupon-partner">{coupon.partner_name}</div>
              <div className="coupon-title">{coupon.coupon_title}</div>
              
              {coupon.status === "Issued" && (
                <div className="coupon-code">
                  <span>Code: </span>
                  <code>{coupon.redemption_code}</code>
                </div>
              )}
              
              <div className="coupon-dates">
                <div className="coupon-issued">
                  <span>Issued: </span>
                  {new Date(coupon.issued_at).toLocaleDateString()}
                </div>
                
                {coupon.expiry_date && (
                  <div className="coupon-expiry">
                    <span>Expires: </span>
                    {new Date(coupon.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
              
              {coupon.status === "Issued" && (
                <button 
                  className="redeem-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRedeemCoupon(coupon.id);
                  }}
                >
                  Redeem Now
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="no-coupons">
            <div className="no-coupons-icon">🎁</div>
            <h3>No coupons found</h3>
            <p>
              {activeTab === "available" 
                ? "You don't have any available coupons yet. Start donating blood to earn rewards!" 
                : activeTab === "expiring" 
                ? "You don't have any coupons expiring soon."
                : activeTab === "redeemed"
                ? "You haven't redeemed any coupons yet."
                : "No coupons match your search criteria."}
            </p>
          </div>
        )}
      </div>

      <div className="how-to-earn">
        <h2>How to Earn More Rewards</h2>
        <div className="earn-methods">
          <div className="earn-method">
            <div className="earn-icon">💉</div>
            <h3>Donate Blood</h3>
            <p>Each donation earns you reward points that can be redeemed for coupons.</p>
          </div>
          <div className="earn-method">
            <div className="earn-icon">🆘</div>
            <h3>Respond to SOS</h3>
            <p>Help patients in urgent need to earn bonus rewards.</p>
          </div>
          <div className="earn-method">
            <div className="earn-icon">📅</div>
            <h3>Regular Donations</h3>
            <p>Maintain a regular donation schedule to earn loyalty rewards.</p>
          </div>
          <div className="earn-method">
            <div className="earn-icon">👥</div>
            <h3>Refer Friends</h3>
            <p>Invite friends to join Blood Warriors and earn referral rewards.</p>
          </div>
        </div>
      </div>

      {/* Coupon Detail Modal */}
      {selectedCoupon && (
        <div className="coupon-modal-overlay" onClick={closeModal}>
          <div className="coupon-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={closeModal}>×</button>
            
            <div className="modal-coupon-card">
              <div className={`modal-status ${selectedCoupon.status.toLowerCase()}`}>
                {selectedCoupon.status}
              </div>
              
              <h2>{selectedCoupon.partner_name}</h2>
              <h3>{selectedCoupon.coupon_title}</h3>
              
              {selectedCoupon.description && (
                <div className="modal-description">
                  {selectedCoupon.description}
                </div>
              )}
              
              {selectedCoupon.status === "Issued" && (
                <div className="modal-redemption">
                  <h4>Redemption Code</h4>
                  <div className="modal-code">{selectedCoupon.redemption_code}</div>
                  
                  <button 
                    className="modal-redeem-button"
                    onClick={() => handleRedeemCoupon(selectedCoupon.id)}
                  >
                    Redeem This Coupon
                  </button>
                </div>
              )}
              
              <div className="modal-details">
                <div className="modal-detail">
                  <span>Issued Date:</span>
                  <span>{new Date(selectedCoupon.issued_at).toLocaleDateString()}</span>
                </div>
                
                {selectedCoupon.expiry_date && (
                  <div className="modal-detail">
                    <span>Expiry Date:</span>
                    <span>{new Date(selectedCoupon.expiry_date).toLocaleDateString()}</span>
                  </div>
                )}
                
                {selectedCoupon.redeemed_at && (
                  <div className="modal-detail">
                    <span>Redeemed Date:</span>
                    <span>{new Date(selectedCoupon.redeemed_at).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
              
              <div className="modal-terms">
                <h4>Terms & Conditions</h4>
                <p>This coupon is subject to the terms and conditions set by {selectedCoupon.partner_name}. Cannot be combined with other offers. Valid until expiration date.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedCoupons;
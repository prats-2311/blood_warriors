import React, { useState, useEffect } from "react";
import { donorService } from "../services/donorService";

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetchCoupons();
  }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const data = await donorService.getCoupons(filter || null);
      setCoupons(data.data);
    } catch (error) {
      console.error("Error fetching coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="coupons-page">
      <div className="page-header">
        <h2>My Coupons & Rewards</h2>
        <p>Earn coupons by donating blood and helping save lives!</p>
      </div>

      <div className="card">
        <h3>Filter Coupons</h3>
        <div className="form-group">
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="">All Coupons</option>
            <option value="Issued">Available</option>
            <option value="Redeemed">Redeemed</option>
            <option value="Expired">Expired</option>
          </select>
        </div>
      </div>

      <div className="coupons-grid">
        {coupons.length > 0 ? (
          coupons.map((coupon) => (
            <div key={coupon.id} className="card coupon-card">
              <div className="coupon-header">
                <h3>{coupon.partner_name}</h3>
                <span
                  className={`status status-${coupon.status.toLowerCase()}`}
                >
                  {coupon.status}
                </span>
              </div>

              <div className="coupon-content">
                <h4>{coupon.coupon_title}</h4>

                {coupon.status === "Issued" && (
                  <div className="redemption-code">
                    <strong>Redemption Code:</strong>
                    <code>{coupon.redemption_code}</code>
                  </div>
                )}

                <div className="coupon-meta">
                  <p>
                    <strong>Issued:</strong>{" "}
                    {new Date(coupon.issued_at).toLocaleDateString()}
                  </p>
                  {coupon.expiry_date && (
                    <p>
                      <strong>Expires:</strong>{" "}
                      {new Date(coupon.expiry_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card">
            <h3>No Coupons Yet</h3>
            <p>
              Start donating blood to earn reward coupons from our partners!
            </p>
          </div>
        )}
      </div>

      <div className="card">
        <h3>How to Earn Coupons</h3>
        <ul>
          <li>Donate blood at registered blood banks</li>
          <li>Respond to SOS requests from patients</li>
          <li>Maintain regular donation schedule</li>
          <li>Keep your profile updated with interests</li>
        </ul>
      </div>
    </div>
  );
};

export default Coupons;

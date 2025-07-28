import React, { useState, useEffect } from "react";
import { publicDataService } from "../services/publicDataService";

const BloodBanks = () => {
  const [bloodBanks, setBloodBanks] = useState([]);
  const [bloodStock, setBloodStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState({
    city: "",
    state: "",
  });
  const [selectedBank, setSelectedBank] = useState(null);

  useEffect(() => {
    fetchBloodBanks();
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBloodBanks = async () => {
    try {
      setLoading(true);
      const data = await publicDataService.getBloodBanks(searchParams);
      setBloodBanks(data.data);
    } catch (error) {
      console.error("Error fetching blood banks:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBloodStock = async (bankId) => {
    try {
      const data = await publicDataService.getBloodStock({ bank_id: bankId });
      setBloodStock(data.data);
      setSelectedBank(bankId);
    } catch (error) {
      console.error("Error fetching blood stock:", error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchBloodBanks();
  };

  return (
    <div className="blood-banks-page">
      <div className="page-header">
        <h2>Blood Banks Directory</h2>
        <p>Find blood banks and check blood availability in your area</p>
      </div>

      {/* Search Form */}
      <div className="card">
        <h3>Search Blood Banks</h3>
        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input
                type="text"
                id="city"
                value={searchParams.city}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    city: e.target.value,
                  }))
                }
                placeholder="Enter city name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="state">State</label>
              <input
                type="text"
                id="state"
                value={searchParams.state}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    state: e.target.value,
                  }))
                }
                placeholder="Enter state name"
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary">
            Search Blood Banks
          </button>
        </form>
      </div>

      {loading ? (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      ) : (
        <div className="blood-banks-grid">
          {bloodBanks.length > 0 ? (
            bloodBanks.map((bank) => (
              <div key={bank.bank_id} className="card blood-bank-card">
                <div className="bank-header">
                  <h3>{bank.name}</h3>
                  <span
                    className={`category category-${bank.category
                      .toLowerCase()
                      .replace("/", "-")}`}
                  >
                    {bank.category}
                  </span>
                </div>

                <div className="bank-details">
                  <p>
                    <strong>Address:</strong> {bank.address}
                  </p>
                  <p>
                    <strong>City:</strong> {bank.city}
                  </p>
                  <p>
                    <strong>State:</strong> {bank.state}
                  </p>
                  {bank.phone && (
                    <p>
                      <strong>Phone:</strong>{" "}
                      <a href={`tel:${bank.phone}`}>{bank.phone}</a>
                    </p>
                  )}
                  {bank.email && (
                    <p>
                      <strong>Email:</strong>{" "}
                      <a href={`mailto:${bank.email}`}>{bank.email}</a>
                    </p>
                  )}
                </div>

                <div className="bank-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => fetchBloodStock(bank.bank_id)}
                  >
                    Check Blood Stock
                  </button>
                </div>

                {selectedBank === bank.bank_id && (
                  <div className="blood-stock">
                    <h4>Blood Stock Availability</h4>
                    {bloodStock.length > 0 ? (
                      <div className="stock-grid">
                        {bloodStock.map((stock) => (
                          <div key={stock.stock_id} className="stock-item">
                            <span className="blood-type">
                              {stock.blood_group.group_name}
                            </span>
                            <span className="component">
                              {stock.component.component_name}
                            </span>
                            <span className="units">
                              {stock.units_available} units
                            </span>
                            <span className="last-updated">
                              Updated:{" "}
                              {new Date(
                                stock.last_updated
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p>No blood stock information available</p>
                    )}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="card">
              <p>No blood banks found matching your search criteria.</p>
            </div>
          )}
        </div>
      )}

      <div className="card">
        <h3>Blood Bank Categories</h3>
        <div className="category-info">
          <div className="category-item">
            <strong>Government:</strong> Public sector blood banks operated by
            government hospitals
          </div>
          <div className="category-item">
            <strong>Private:</strong> Private hospitals and healthcare
            facilities
          </div>
          <div className="category-item">
            <strong>Charitable/Voluntary:</strong> NGOs and charitable
            organizations
          </div>
        </div>
      </div>

      <div className="card">
        <h3>Important Information</h3>
        <ul>
          <li>
            Blood stock levels are updated regularly but may change quickly
          </li>
          <li>Always call ahead to confirm availability before visiting</li>
          <li>
            Bring valid ID and medical documents when donating or receiving
            blood
          </li>
          <li>Some blood banks may have specific operating hours</li>
          <li>Emergency cases are given priority regardless of stock levels</li>
        </ul>
      </div>
    </div>
  );
};

export default BloodBanks;

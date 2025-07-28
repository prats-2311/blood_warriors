import React, { useState, useEffect } from "react";
import { publicDataService } from "../services/publicDataService";

const Donors = () => {
  const [bloodGroups, setBloodGroups] = useState([]);
  const [searchParams, setSearchParams] = useState({
    blood_group: "",
    city: "",
    radius: "10",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBloodGroups();
  }, []);

  const fetchBloodGroups = async () => {
    try {
      const data = await publicDataService.getBloodGroups();
      setBloodGroups(data.data);
    } catch (error) {
      console.error("Error fetching blood groups:", error);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);

    // In a real implementation, you would call an API to find donors
    // For now, we'll just show a message
    setTimeout(() => {
      setLoading(false);
      alert("Donor search functionality would be implemented here");
    }, 1000);
  };

  return (
    <div className="donors-page">
      <div className="page-header">
        <h2>Find Blood Donors</h2>
        <p>Search for compatible blood donors in your area</p>
      </div>

      <div className="card">
        <h3>Search Criteria</h3>
        <form onSubmit={handleSearch}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="blood_group">Blood Group</label>
              <select
                id="blood_group"
                value={searchParams.blood_group}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    blood_group: e.target.value,
                  }))
                }
              >
                <option value="">Any Blood Group</option>
                {bloodGroups.map((group) => (
                  <option key={group.blood_group_id} value={group.group_name}>
                    {group.group_name}
                  </option>
                ))}
              </select>
            </div>

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
              <label htmlFor="radius">Search Radius (km)</label>
              <select
                id="radius"
                value={searchParams.radius}
                onChange={(e) =>
                  setSearchParams((prev) => ({
                    ...prev,
                    radius: e.target.value,
                  }))
                }
              >
                <option value="5">5 km</option>
                <option value="10">10 km</option>
                <option value="25">25 km</option>
                <option value="50">50 km</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? "Searching..." : "Search Donors"}
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Blood Compatibility Guide</h3>
        <div className="compatibility-table">
          <table>
            <thead>
              <tr>
                <th>Blood Type</th>
                <th>Can Donate To</th>
                <th>Can Receive From</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>O-</td>
                <td>Everyone (Universal Donor)</td>
                <td>O-</td>
              </tr>
              <tr>
                <td>O+</td>
                <td>O+, A+, B+, AB+</td>
                <td>O-, O+</td>
              </tr>
              <tr>
                <td>A-</td>
                <td>A-, A+, AB-, AB+</td>
                <td>O-, A-</td>
              </tr>
              <tr>
                <td>A+</td>
                <td>A+, AB+</td>
                <td>O-, O+, A-, A+</td>
              </tr>
              <tr>
                <td>B-</td>
                <td>B-, B+, AB-, AB+</td>
                <td>O-, B-</td>
              </tr>
              <tr>
                <td>B+</td>
                <td>B+, AB+</td>
                <td>O-, O+, B-, B+</td>
              </tr>
              <tr>
                <td>AB-</td>
                <td>AB-, AB+</td>
                <td>O-, A-, B-, AB-</td>
              </tr>
              <tr>
                <td>AB+</td>
                <td>AB+</td>
                <td>Everyone (Universal Recipient)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h3>Important Notes</h3>
        <ul>
          <li>Always verify blood compatibility with medical professionals</li>
          <li>Donors must meet health and eligibility criteria</li>
          <li>Contact information is shared only with patient consent</li>
          <li>Emergency requests (SOS) are prioritized in search results</li>
        </ul>
      </div>
    </div>
  );
};

export default Donors;

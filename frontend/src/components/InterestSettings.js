import React, { useState, useEffect } from "react";
import { aiService } from "../services/aiService";
import { useProfile } from "../hooks/useAuth";

const InterestSettings = () => {
  const { profile } = useProfile();
  const [interests, setInterests] = useState([]);
  const [newInterest, setNewInterest] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  // Predefined interest categories for patients
  const suggestedInterests = [
    // Health & Wellness
    "healthy eating", "nutrition", "exercise", "meditation", "yoga", "mental health",
    
    // Entertainment
    "movies", "music", "books", "podcasts", "tv shows", "gaming",
    
    // Hobbies
    "cooking", "gardening", "photography", "art", "crafts", "reading",
    
    // Food & Dining
    "restaurants", "coffee", "vegetarian food", "desserts", "home cooking",
    
    // Technology
    "technology", "apps", "gadgets", "social media",
    
    // Lifestyle
    "fashion", "travel", "home decor", "pets", "family time",
    
    // Learning
    "education", "online courses", "languages", "science", "history"
  ];

  useEffect(() => {
    loadInterests();
  }, []);

  const loadInterests = async () => {
    try {
      setLoading(true);
      const response = await aiService.getPatientInterests();
      if (response.status === 'success') {
        setInterests(response.data.interests || []);
      }
    } catch (error) {
      console.error("Error loading interests:", error);
      setMessage({ type: "error", text: "Failed to load interests" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddInterest = () => {
    const trimmedInterest = newInterest.trim().toLowerCase();
    if (trimmedInterest && !interests.includes(trimmedInterest)) {
      setInterests([...interests, trimmedInterest]);
      setNewInterest("");
    }
  };

  const handleRemoveInterest = (interestToRemove) => {
    setInterests(interests.filter(interest => interest !== interestToRemove));
  };

  const handleAddSuggested = (suggestedInterest) => {
    if (!interests.includes(suggestedInterest)) {
      setInterests([...interests, suggestedInterest]);
    }
  };

  const handleSaveInterests = async () => {
    try {
      setSaving(true);
      setMessage(null);
      
      const response = await aiService.updatePatientInterests(interests);
      if (response.status === 'success') {
        setMessage({ 
          type: "success", 
          text: "Interests saved successfully! CareBot will now provide more personalized responses." 
        });
      }
    } catch (error) {
      console.error("Error saving interests:", error);
      setMessage({ type: "error", text: "Failed to save interests" });
    } finally {
      setSaving(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddInterest();
    }
  };

  if (loading) {
    return (
      <div className="interest-settings">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading your interests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="interest-settings">
      <div className="card">
        <h3>🎯 Your Interests</h3>
        <p>
          Help CareBot provide more personalized support by sharing your interests. 
          This information helps me understand you better and offer relevant advice.
        </p>

        {message && (
          <div className={`alert alert-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Current Interests */}
        <div className="current-interests">
          <h4>Your Current Interests ({interests.length})</h4>
          {interests.length === 0 ? (
            <p className="no-interests">No interests added yet. Add some below!</p>
          ) : (
            <div className="interests-list">
              {interests.map((interest, index) => (
                <span key={index} className="interest-tag">
                  {interest}
                  <button
                    type="button"
                    onClick={() => handleRemoveInterest(interest)}
                    className="remove-interest"
                    aria-label={`Remove ${interest}`}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Add New Interest */}
        <div className="add-interest">
          <h4>Add New Interest</h4>
          <div className="input-group">
            <input
              type="text"
              value={newInterest}
              onChange={(e) => setNewInterest(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type an interest (e.g., cooking, music, reading)"
              className="form-control"
            />
            <button
              type="button"
              onClick={handleAddInterest}
              disabled={!newInterest.trim()}
              className="btn btn-secondary"
            >
              Add
            </button>
          </div>
        </div>

        {/* Suggested Interests */}
        <div className="suggested-interests">
          <h4>Suggested Interests</h4>
          <p>Click on any of these to add them to your interests:</p>
          <div className="suggestions-grid">
            {suggestedInterests
              .filter(suggestion => !interests.includes(suggestion))
              .map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleAddSuggested(suggestion)}
                  className="suggestion-btn"
                >
                  + {suggestion}
                </button>
              ))}
          </div>
        </div>

        {/* Save Button */}
        <div className="save-section">
          <button
            type="button"
            onClick={handleSaveInterests}
            disabled={saving || interests.length === 0}
            className="btn btn-primary"
          >
            {saving ? "Saving..." : "Save Interests"}
          </button>
          <p className="save-note">
            💡 Your interests help CareBot provide more relevant and personalized support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default InterestSettings;

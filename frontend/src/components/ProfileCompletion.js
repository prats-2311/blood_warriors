import React from "react";

const ProfileCompletion = ({ completion, onEditClick }) => {
  const { isComplete, completionPercentage, missingFields } = completion;

  if (isComplete) {
    return (
      <div className="profile-completion-card complete">
        <div className="completion-icon">✅</div>
        <div className="completion-content">
          <h4>Profile Complete!</h4>
          <p>Your profile is 100% complete. Great job!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-completion-card incomplete">
      <div className="completion-icon">📝</div>
      <div className="completion-content">
        <h4>Complete Your Profile</h4>
        <p>Your profile is {completionPercentage}% complete.</p>

        {missingFields.length > 0 && (
          <div className="missing-fields-list">
            <p>
              <strong>Missing information:</strong>
            </p>
            <ul>
              {missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        )}

        <button className="btn btn-primary btn-sm" onClick={onEditClick}>
          Complete Profile
        </button>
      </div>

      <div className="completion-progress">
        <div className="progress-circle">
          <svg width="60" height="60" viewBox="0 0 60 60">
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="var(--color-secondary-200)"
              strokeWidth="4"
            />
            <circle
              cx="30"
              cy="30"
              r="25"
              fill="none"
              stroke="var(--color-primary-500)"
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 25}`}
              strokeDashoffset={`${
                2 * Math.PI * 25 * (1 - completionPercentage / 100)
              }`}
              strokeLinecap="round"
              transform="rotate(-90 30 30)"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>
          <span className="progress-text">{completionPercentage}%</span>
        </div>
      </div>
    </div>
  );
};

export default ProfileCompletion;

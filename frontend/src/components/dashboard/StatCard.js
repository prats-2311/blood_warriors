import React from "react";
import { Link } from "react-router-dom";

const StatCard = ({
  title,
  value,
  icon,
  color = "primary",
  trend = null,
  linkTo = null,
  description = null,
  onClick = null,
  loading = false,
}) => {
  const cardContent = (
    <div
      className={`stat-card stat-card-${color} ${
        onClick || linkTo ? "clickable" : ""
      } ${loading ? "loading" : ""}`}
    >
      <div className="stat-card-header">
        <div className="stat-icon">
          {loading ? <div className="spinner-sm"></div> : icon}
        </div>
        {trend && (
          <div className={`stat-trend ${trend.direction}`}>
            <span className="trend-icon">
              {trend.direction === "up"
                ? "↗️"
                : trend.direction === "down"
                ? "↘️"
                : "➡️"}
            </span>
            <span className="trend-value">{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="stat-card-body">
        <div className="stat-value">{loading ? "..." : value}</div>
        <div className="stat-title">{title}</div>
        {description && <div className="stat-description">{description}</div>}
      </div>
      {(linkTo || onClick) && !loading && (
        <div className="stat-card-footer">
          <span className="view-more">View Details →</span>
        </div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link to={linkTo} className="stat-card-link">
        {cardContent}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button onClick={onClick} className="stat-card-button">
        {cardContent}
      </button>
    );
  }

  return cardContent;
};

export default StatCard;

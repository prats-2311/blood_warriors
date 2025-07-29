import React, { useState, useEffect } from "react";
import { networkMonitor } from "../utils/networkMonitor";

const ConnectionStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionQuality, setConnectionQuality] = useState("good");
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    const unsubscribe = networkMonitor.addListener((status, online) => {
      setIsOnline(online);
      setShowStatus(true);

      // Hide status after 3 seconds if back online
      if (online) {
        setTimeout(() => setShowStatus(false), 3000);
      }
    });

    // Test connection quality periodically
    const testConnection = async () => {
      if (isOnline) {
        const isConnected = await networkMonitor.testConnection();
        setConnectionQuality(isConnected ? "good" : "poor");
      }
    };

    const interval = setInterval(testConnection, 30000); // Test every 30 seconds
    testConnection(); // Initial test

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [isOnline]);

  if (!showStatus && isOnline) {
    return null;
  }

  return (
    <div className={`connection-status ${isOnline ? "online" : "offline"}`}>
      <div className="connection-indicator">
        <span className={`status-dot ${isOnline ? "green" : "red"}`}></span>
        <span className="status-text">
          {isOnline
            ? connectionQuality === "good"
              ? "Connected"
              : "Poor Connection"
            : "No Internet Connection"}
        </span>
      </div>
      {!isOnline && (
        <div className="connection-message">
          Some features may not work properly. Please check your internet
          connection.
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;

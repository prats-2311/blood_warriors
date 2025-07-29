import React from "react";

// Network status monitoring utility
class NetworkMonitor {
  constructor() {
    this.isOnline = navigator.onLine;
    this.listeners = [];
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener("online", () => {
      this.isOnline = true;
      this.notifyListeners("online");
    });

    window.addEventListener("offline", () => {
      this.isOnline = false;
      this.notifyListeners("offline");
    });
  }

  addListener(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(
        (listener) => listener !== callback
      );
    };
  }

  notifyListeners(status) {
    this.listeners.forEach((callback) => callback(status, this.isOnline));
  }

  // Test connection to Supabase
  async testConnection() {
    if (!this.isOnline) {
      return false;
    }

    try {
      const response = await fetch(
        process.env.REACT_APP_SUPABASE_URL + "/rest/v1/",
        {
          method: "HEAD",
          signal: AbortSignal.timeout(5000),
          headers: {
            apikey: process.env.REACT_APP_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${process.env.REACT_APP_SUPABASE_ANON_KEY}`,
          },
        }
      );
      return response.ok;
    } catch (error) {
      console.log("Connection test failed:", error.message);
      return false;
    }
  }
}

export const networkMonitor = new NetworkMonitor();

// Hook for React components
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = React.useState(networkMonitor.isOnline);

  React.useEffect(() => {
    const unsubscribe = networkMonitor.addListener((status, online) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  return isOnline;
};

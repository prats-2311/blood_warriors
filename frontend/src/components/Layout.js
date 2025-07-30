import React, { useState } from "react";
import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Layout = () => {
  const { user, profile, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case "/app/dashboard":
        return "Dashboard";
      case "/app/profile":
        return "Profile";
      case "/app/requests":
        return profile?.user_type === "Patient"
          ? "My Requests"
          : "Available Requests";
      case "/app/requests/create":
        return "Create Request";
      case "/app/donors":
        return "Find Donors";
      case "/app/blood-banks":
        return "Blood Banks";
      case "/app/carebot":
        return "CareBot";
      case "/app/notifications":
        return "Notifications";
      case "/app/coupons":
        return "My Coupons";
      default:
        return "Blood Warriors";
    }
  };

  const getPageDescription = () => {
    const path = location.pathname;
    switch (path) {
      case "/app/dashboard":
        return profile?.user_type === "Patient"
          ? "Manage your blood requests and find donors"
          : "Help save lives by donating blood";
      case "/app/profile":
        return "Manage your account information";
      case "/app/requests":
        return profile?.user_type === "Patient"
          ? "Track your blood donation requests"
          : "Find requests that match your blood type";
      case "/app/requests/create":
        return "Create a new blood donation request";
      case "/app/donors":
        return "Find blood donors in your area";
      case "/app/blood-banks":
        return "Locate nearby blood banks";
      case "/app/carebot":
        return "Get AI-powered health assistance";
      case "/app/notifications":
        return "View your donation notifications";
      case "/app/coupons":
        return "Redeem rewards for your donations";
      default:
        return "Connecting donors with those in need";
    }
  };

  const navigationItems = [
    {
      path: "/app/dashboard",
      label: "Dashboard",
      icon: "🏠",
      description: "Overview and quick actions",
    },
    {
      path: "/app/profile",
      label: "Profile",
      icon: "👤",
      description: "Manage your account",
    },
    ...(profile?.user_type === "Patient"
      ? [
          {
            path: "/app/requests",
            label: "My Requests",
            icon: "🩸",
            description: "Track your requests",
          },
          {
            path: "/app/requests/create",
            label: "Create Request",
            icon: "➕",
            description: "Request blood donation",
          },
        ]
      : []),
    ...(profile?.user_type === "Donor"
      ? [
          {
            path: "/app/requests",
            label: "Available Requests",
            icon: "🩸",
            description: "Find requests to help",
          },
          {
            path: "/app/notifications",
            label: "Notifications",
            icon: "🔔",
            description: "Your donation alerts",
          },
          {
            path: "/app/coupons",
            label: "My Coupons",
            icon: "🎫",
            description: "Redeem your rewards",
          },
        ]
      : []),
    {
      path: "/app/donors",
      label: "Find Donors",
      icon: "🔍",
      description: "Search for donors",
    },
    {
      path: "/app/blood-banks",
      label: "Blood Banks",
      icon: "🏥",
      description: "Locate blood banks",
    },
    {
      path: "/app/carebot",
      label: "CareBot",
      icon: "🤖",
      description: "AI health assistant",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="layout">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="sidebar-toggle md:hidden"
              onClick={toggleSidebar}
              aria-label="Toggle sidebar"
            >
              <span className="hamburger-icon">☰</span>
            </button>
            <div className="brand">
              <h1 className="app-title">🩸 Blood Warriors</h1>
              <span className="app-tagline">Saving Lives Together</span>
            </div>
          </div>
          <div className="header-center">
            <div className="page-info">
              <h2 className="page-title">{getPageTitle()}</h2>
              <p className="page-description">{getPageDescription()}</p>
            </div>
          </div>
          <div className="header-right">
            <div className="user-menu">
              <div className="user-info">
                <div className="user-avatar">
                  {profile?.full_name?.charAt(0) ||
                    user?.email?.charAt(0) ||
                    "U"}
                </div>
                <div className="user-details">
                  <span className="user-name">
                    {profile?.full_name || user?.email}
                  </span>
                  <span className="user-type">{profile?.user_type}</span>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary btn-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="layout-body">
        {/* Sidebar */}
        <nav className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
          <div className="sidebar-header">
            <h3 className="sidebar-title">Navigation</h3>
            <button
              className="sidebar-close md:hidden"
              onClick={toggleSidebar}
              aria-label="Close sidebar"
            >
              ✕
            </button>
          </div>
          <div className="nav-items">
            {navigationItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${
                  location.pathname === item.path ? "active" : ""
                }`}
                onClick={() => setSidebarOpen(false)}
              >
                <div className="nav-item-content">
                  <div className="nav-item-main">
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </div>
                  <p className="nav-description">{item.description}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="sidebar-footer">
            <div className="user-stats">
              <h4>Quick Stats</h4>
              {profile?.user_type === "Donor" && (
                <div className="stat-item">
                  <span className="stat-label">Donations:</span>
                  <span className="stat-value">0</span>
                </div>
              )}
              {profile?.user_type === "Patient" && (
                <div className="stat-item">
                  <span className="stat-label">Requests:</span>
                  <span className="stat-value">0</span>
                </div>
              )}
            </div>
          </div>
        </nav>

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div className="sidebar-overlay md:hidden" onClick={toggleSidebar} />
        )}

        {/* Main Content */}
        <main className="main-content">
          <div className="content-wrapper">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;

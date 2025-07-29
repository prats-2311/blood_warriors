import React, { useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import SosRequestButton from "./SosRequestButton";

const Layout = () => {
  const { profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case "/app/dashboard":
        return "Dashboard";
      case "/app/profile":
        return "Profile";
      case "/app/requests":
        return "Blood Requests";
      case "/app/requests/create":
        return "Create Request";
      case "/app/donors":
        return "Donors";
      case "/app/blood-banks":
        return "Blood Banks";
      case "/app/carebot":
        return "CareBot";
      case "/app/notifications":
        return "Notifications";
      case "/app/coupons":
        return "Coupons";
      default:
        return "Blood Warriors";
    }
  };

  const navigationItems = [
    { path: "/app/dashboard", label: "Dashboard", icon: "🏠" },
    { path: "/app/profile", label: "Profile", icon: "👤" },
    ...(profile?.user_type === "Patient"
      ? [
          { path: "/app/requests", label: "My Requests", icon: "🩸" },
          { path: "/app/requests/create", label: "Create Request", icon: "➕" },
        ]
      : []),
    ...(profile?.user_type === "Donor"
      ? [
          { path: "/app/requests", label: "Available Requests", icon: "🩸" },
          { path: "/app/notifications", label: "Notifications", icon: "🔔" },
          { path: "/app/coupons", label: "My Coupons", icon: "🎫" },
        ]
      : []),
    { path: "/app/donors", label: "Find Donors", icon: "🔍" },
    { path: "/app/blood-banks", label: "Blood Banks", icon: "🏥" },
    { path: "/app/carebot", label: "CareBot", icon: "🤖" },
  ];

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <h2>Blood Warriors</h2>
        <nav>
          <ul>
            {navigationItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => (isActive ? "active" : "")}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Header */}
        <header className="header">
          <div className="header-left">
            <button
              className="menu-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1>{getPageTitle()}</h1>
          </div>

          <div className="user-info">
            <span>Welcome, {profile?.full_name}</span>
            <span className="user-type">{profile?.user_type}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="page-content">
          <Outlet />
        </div>
      </main>

      {/* SOS Button for Patients */}
      {profile?.user_type === "Patient" && <SosRequestButton />}
    </div>
  );
};

export default Layout;

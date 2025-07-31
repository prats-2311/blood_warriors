import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/JWTAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navigation from "./components/Navigation";
import ErrorBoundary from "./components/ErrorBoundary";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Dashboard from "./components/Dashboard";
import SosRequestButton from "./components/SosRequestButton";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import CreateRequest from "./pages/CreateRequest";
import Donors from "./pages/Donors";
import BloodBanks from "./pages/BloodBanks";
import CareBot from "./pages/CareBot";
import Notifications from "./pages/Notifications";
import Coupons from "./pages/Coupons";
import AuthCallback from "./pages/AuthCallback";
import LandingPage from "./components/LandingPage";
import "./styles/globals.css";
import "./App.css";

// Modern Layout Component
const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Navigation />
    <main className="app-main">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
            {/* Landing page */}
            <Route path="/" element={<LandingPage />} />

            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route
              path="/app/*"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Routes>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="profile" element={<Profile />} />
                      <Route path="requests" element={<Requests />} />
                      <Route path="requests/new" element={<CreateRequest />} />
                      <Route path="sos" element={<SosRequestButton />} />
                      <Route path="donors" element={<Donors />} />
                      <Route path="blood-banks" element={<BloodBanks />} />
                      <Route path="carebot" element={<CareBot />} />
                      <Route path="notifications" element={<Notifications />} />
                      <Route path="coupons" element={<Coupons />} />
                    </Routes>
                  </AppLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

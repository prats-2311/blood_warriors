import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./components/Login";
import Register from "./components/Register";
import AuthCallback from "./pages/AuthCallback";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Requests from "./pages/Requests";
import CreateRequest from "./pages/CreateRequest";
import Donors from "./pages/Donors";
import BloodBanks from "./pages/BloodBanks";
import CareBot from "./pages/CareBot";
import Notifications from "./pages/Notifications";
import Coupons from "./pages/Coupons";
import ConnectionStatus from "./components/ConnectionStatus";
import SupabaseTest from "./components/SupabaseTest";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="App">
          <ConnectionStatus />
          {process.env.NODE_ENV === "development" && <SupabaseTest />}
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="profile" element={<Profile />} />
              <Route path="requests" element={<Requests />} />
              <Route path="requests/create" element={<CreateRequest />} />
              <Route path="donors" element={<Donors />} />
              <Route path="blood-banks" element={<BloodBanks />} />
              <Route path="carebot" element={<CareBot />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="coupons" element={<Coupons />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

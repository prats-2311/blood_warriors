import React, { useState } from "react";
import { supabase } from "../utils/supabase";
import api from "../services/api";

const AuthDebug = () => {
  const [debugInfo, setDebugInfo] = useState(null);

  const checkAuth = async () => {
    try {
      // Check Supabase session
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      const info = {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0,
        userEmail: session?.user?.email,
        error: error?.message,
      };

      // Test API call
      try {
        const response = await api.get("/auth/debug/token");
        info.apiTest = "SUCCESS";
        info.apiResponse = response.data;
      } catch (apiError) {
        info.apiTest = "FAILED";
        info.apiError = apiError.response?.data || apiError.message;
      }

      setDebugInfo(info);
    } catch (error) {
      setDebugInfo({ error: error.message });
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 10,
        right: 10,
        background: "white",
        padding: 20,
        border: "1px solid #ccc",
        borderRadius: 5,
        zIndex: 9999,
        maxWidth: 400,
      }}
    >
      <h4>Auth Debug</h4>
      <button onClick={checkAuth}>Check Auth Status</button>
      {debugInfo && (
        <pre style={{ fontSize: 12, marginTop: 10 }}>
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      )}
    </div>
  );
};

export default AuthDebug;

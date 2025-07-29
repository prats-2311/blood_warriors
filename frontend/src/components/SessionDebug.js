import React from "react";
import {
  clearSupabaseSession,
  checkForStaleSession,
} from "../utils/sessionReset";

const SessionDebug = () => {
  const hasStaleSession = checkForStaleSession();

  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "10px",
        right: "10px",
        background: hasStaleSession ? "#fee" : "#efe",
        border: `1px solid ${hasStaleSession ? "#f00" : "#0f0"}`,
        padding: "10px",
        borderRadius: "5px",
        zIndex: 9999,
        fontSize: "12px",
      }}
    >
      <div>
        <strong>Session Debug</strong>
      </div>
      <div>Stale Session: {hasStaleSession ? "⚠️ Yes" : "✅ No"}</div>
      <button
        onClick={clearSupabaseSession}
        style={{
          marginTop: "5px",
          padding: "5px 10px",
          background: "#ff4444",
          color: "white",
          border: "none",
          borderRadius: "3px",
          cursor: "pointer",
          fontSize: "11px",
        }}
      >
        Clear Session
      </button>
    </div>
  );
};

export default SessionDebug;

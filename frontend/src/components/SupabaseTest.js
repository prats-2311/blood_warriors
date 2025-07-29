import React, { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

const SupabaseTest = () => {
  const [testResult, setTestResult] = useState("Testing...");
  const [bloodGroups, setBloodGroups] = useState([]);

  useEffect(() => {
    const testSupabaseConnection = async () => {
      try {
        console.log("Testing Supabase connection...");
        console.log("Supabase URL:", process.env.REACT_APP_SUPABASE_URL);
        console.log(
          "API Key exists:",
          !!process.env.REACT_APP_SUPABASE_ANON_KEY
        );

        // Test basic connection
        const { data, error } = await supabase
          .from("bloodgroups")
          .select("*")
          .limit(5);

        if (error) {
          console.error("Supabase error:", error);
          setTestResult(`Error: ${error.message}`);
        } else {
          console.log("Supabase success:", data);
          setTestResult("✅ Connection successful!");
          setBloodGroups(data);
        }
      } catch (err) {
        console.error("Test error:", err);
        setTestResult(`Test failed: ${err.message}`);
      }
    };

    testSupabaseConnection();
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "white",
        border: "1px solid #ccc",
        padding: "10px",
        borderRadius: "5px",
        zIndex: 9999,
        maxWidth: "300px",
      }}
    >
      <h4>Supabase Test</h4>
      <p>
        <strong>Status:</strong> {testResult}
      </p>
      {bloodGroups.length > 0 && (
        <div>
          <strong>Blood Groups:</strong>
          <ul>
            {bloodGroups.map((group) => (
              <li key={group.blood_group_id}>{group.group_name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SupabaseTest;

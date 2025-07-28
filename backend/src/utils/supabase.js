const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client with better error handling
const supabaseUrl = process.env.SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseKey =
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";

console.log("Initializing Supabase client with URL:", supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  db: {
    schema: "public",
  },
  global: {
    headers: {
      "X-Client-Info": "blood-warriors-backend",
    },
  },
});

// Test connection on startup
const testConnection = async () => {
  try {
    const { data, error } = await supabase
      .from("bloodgroups")
      .select("count")
      .limit(1);

    if (error) {
      console.error("Supabase connection test failed:", error.message);
    } else {
      console.log("✅ Supabase connection test successful");
    }
  } catch (err) {
    console.error("Supabase connection error:", err.message);
  }
};

// Test connection after a short delay to allow services to start
setTimeout(testConnection, 2000);

module.exports = { supabase };

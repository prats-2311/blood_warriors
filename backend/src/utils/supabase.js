const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client with better error handling and retry logic
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "Missing Supabase environment variables. Please check your .env file."
  );
}

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
  // Add retry configuration
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Enhanced connection test with retry logic
const testConnection = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      console.log(
        `Testing Supabase connection (attempt ${i + 1}/${retries})...`
      );

      const { data, error } = await supabase
        .from("bloodgroups")
        .select("count")
        .limit(1);

      if (error) {
        throw error;
      }

      console.log("✅ Supabase Cloud connection test successful");
      return true;
    } catch (err) {
      console.error(`Connection attempt ${i + 1} failed:`, err.message);

      if (i < retries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  console.error(
    "❌ All connection attempts failed. Please check your network and Supabase configuration."
  );
  return false;
};

// Test connection with retry logic
setTimeout(() => testConnection(), 2000);

module.exports = { supabase };

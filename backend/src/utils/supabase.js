const { createClient } = require("@supabase/supabase-js");

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  throw new Error("Missing Supabase environment variables");
}

console.log("Initializing Supabase client with URL:", supabaseUrl);

// Enhanced fetch with better error handling and retry logic
const createEnhancedFetch = (apiKey, retries = 2) => {
  return async (url, options = {}) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
          headers: {
            apikey: apiKey,
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Connection: "close",
            "Cache-Control": "no-cache",
            "User-Agent": "BloodWarriors/1.0",
            ...options.headers,
          },
        });

        clearTimeout(timeoutId);
        return response;
      } catch (err) {
        console.log(
          `Supabase fetch attempt ${attempt + 1} failed:`,
          err.message
        );

        if (attempt === retries) {
          clearTimeout(timeoutId);
          throw new Error(
            `Network request failed after ${retries + 1} attempts: ${
              err.message
            }`
          );
        }

        // Wait before retry (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  };
};

// Client for token validation (uses anon key)
const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: createEnhancedFetch(supabaseAnonKey, 1), // 1 retry for auth requests
  },
});

// Client for database operations (uses service role key)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
  global: {
    fetch: createEnhancedFetch(supabaseServiceKey, 2), // 2 retries for database requests
  },
  db: {
    schema: "public",
  },
});

module.exports = { supabase, supabaseAuth };

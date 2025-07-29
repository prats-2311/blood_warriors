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
      Connection: "keep-alive",
    },
    fetch: (url, options = {}) => {
      // Add timeout and retry logic to all requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

      return fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          ...options.headers,
          Connection: "keep-alive",
          "Keep-Alive": "timeout=30, max=100",
        },
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    },
  },
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

// Retry wrapper for database operations
const withRetry = async (operation, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const isNetworkError =
        error.code === "ECONNRESET" ||
        error.code === "ENOTFOUND" ||
        error.code === "ETIMEDOUT" ||
        error.message?.includes("fetch failed") ||
        error.message?.includes("network error") ||
        error.message?.includes("connection") ||
        error.name === "FetchError";

      if (isNetworkError && attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(
          `Network error on attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`
        );
        console.log(`Error details:`, error.message);

        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      // If it's not a network error or we've exhausted retries, throw the error
      throw error;
    }
  }
};

// Enhanced Supabase client with retry logic
const supabaseWithRetry = {
  ...supabase,
  from: (table) => {
    const query = supabase.from(table);

    // Wrap common operations with retry logic
    const originalSelect = query.select.bind(query);
    const originalInsert = query.insert.bind(query);
    const originalUpdate = query.update.bind(query);
    const originalDelete = query.delete.bind(query);

    query.select = (...args) => {
      const selectQuery = originalSelect(...args);
      const originalExecute =
        selectQuery.then?.bind(selectQuery) || (() => selectQuery);

      return {
        ...selectQuery,
        then: (onResolve, onReject) => {
          return withRetry(() => originalExecute()).then(onResolve, onReject);
        },
      };
    };

    query.insert = (...args) => {
      const insertQuery = originalInsert(...args);
      const originalExecute =
        insertQuery.then?.bind(insertQuery) || (() => insertQuery);

      return {
        ...insertQuery,
        then: (onResolve, onReject) => {
          return withRetry(() => originalExecute()).then(onResolve, onReject);
        },
      };
    };

    query.update = (...args) => {
      const updateQuery = originalUpdate(...args);
      const originalExecute =
        updateQuery.then?.bind(updateQuery) || (() => updateQuery);

      return {
        ...updateQuery,
        then: (onResolve, onReject) => {
          return withRetry(() => originalExecute()).then(onResolve, onReject);
        },
      };
    };

    query.delete = (...args) => {
      const deleteQuery = originalDelete(...args);
      const originalExecute =
        deleteQuery.then?.bind(deleteQuery) || (() => deleteQuery);

      return {
        ...deleteQuery,
        then: (onResolve, onReject) => {
          return withRetry(() => originalExecute()).then(onResolve, onReject);
        },
      };
    };

    return query;
  },

  auth: {
    ...supabase.auth,
    signUp: (...args) => withRetry(() => supabase.auth.signUp(...args)),
    signInWithPassword: (...args) =>
      withRetry(() => supabase.auth.signInWithPassword(...args)),
    signOut: (...args) => withRetry(() => supabase.auth.signOut(...args)),
    getUser: (...args) => withRetry(() => supabase.auth.getUser(...args)),
    getSession: (...args) => withRetry(() => supabase.auth.getSession(...args)),
    setSession: (...args) => withRetry(() => supabase.auth.setSession(...args)),
    admin: {
      ...supabase.auth.admin,
      createUser: (...args) =>
        withRetry(() => supabase.auth.admin.createUser(...args)),
      deleteUser: (...args) =>
        withRetry(() => supabase.auth.admin.deleteUser(...args)),
    },
  },
};

// Test connection with retry logic
setTimeout(() => testConnection(), 2000);

module.exports = { supabase: supabaseWithRetry, withRetry };

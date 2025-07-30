require("dotenv").config();
const { supabase, supabaseAuth } = require("./src/utils/supabase");

async function testConnection() {
  console.log("Testing Supabase connection...");
  console.log("URL:", process.env.SUPABASE_URL);
  console.log("Anon key length:", process.env.SUPABASE_ANON_KEY?.length);
  console.log(
    "Service key length:",
    process.env.SUPABASE_SERVICE_ROLE_KEY?.length
  );

  try {
    // Test basic connection with service role
    console.log("1. Testing database connection with service role...");
    const { data, error } = await supabase
      .from("users")
      .select("user_id")
      .limit(1);

    if (error) {
      console.log("❌ Database connection failed:", error.message);
      console.log("Error details:", error);
    } else {
      console.log(
        "✅ Database connection successful, found",
        data?.length || 0,
        "users"
      );
    }

    // Test auth connection
    console.log("2. Testing auth client connection...");
    try {
      const { data: authData, error: authError } =
        await supabaseAuth.auth.getSession();

      if (authError) {
        console.log("❌ Auth connection failed:", authError.message);
      } else {
        console.log("✅ Auth connection successful");
      }
    } catch (authNetworkError) {
      console.log("❌ Auth network error:", authNetworkError.message);
    }

    // Test network connectivity
    console.log("3. Testing direct network connectivity...");
    try {
      const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/`, {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      console.log(
        "✅ Direct network test successful, status:",
        response.status
      );
    } catch (networkError) {
      console.log("❌ Direct network test failed:", networkError.message);
    }
  } catch (error) {
    console.log("❌ Connection test failed:", error.message);
    console.log("Stack:", error.stack);
  }
}

testConnection();

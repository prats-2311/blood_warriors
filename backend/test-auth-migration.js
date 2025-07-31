require("dotenv").config();
const { supabase } = require("./src/utils/supabase");

async function testAuthMigration() {
  try {
    console.log("🧪 Testing Authentication Migration Application...");

    // Test 1: Check if we can add a column to users table
    console.log("\n1. Testing column addition...");
    const { error: alterError } = await supabase.rpc("exec_sql", {
      sql: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS test_column BOOLEAN DEFAULT false;`,
    });

    if (alterError) {
      console.log(
        "❌ Cannot execute DDL statements via RPC:",
        alterError.message
      );
      console.log(
        "✅ This is expected - Supabase requires manual SQL execution for schema changes"
      );
    } else {
      console.log("✅ DDL execution successful");
    }

    // Test 2: Check current users table structure
    console.log("\n2. Checking current users table structure...");
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .limit(1);

    if (userError) {
      console.log("❌ Error accessing users table:", userError.message);
    } else {
      console.log("✅ Users table accessible");
      if (userData && userData.length > 0) {
        const columns = Object.keys(userData[0]);
        console.log("📋 Current columns:", columns.join(", "));

        // Check if new auth columns exist
        const authColumns = [
          "is_active",
          "is_verified",
          "failed_login_attempts",
          "locked_until",
          "password_hash",
        ];
        const missingColumns = authColumns.filter(
          (col) => !columns.includes(col)
        );

        if (missingColumns.length > 0) {
          console.log("📝 Missing auth columns:", missingColumns.join(", "));
        } else {
          console.log("✅ All auth columns already exist");
        }
      }
    }

    // Test 3: Check if new tables exist
    console.log("\n3. Checking for new authentication tables...");
    const authTables = [
      "refresh_tokens",
      "email_verifications",
      "password_resets",
      "login_attempts",
    ];

    for (const tableName of authTables) {
      const { data, error } = await supabase
        .from(tableName)
        .select("*")
        .limit(1);

      if (error && error.message.includes("does not exist")) {
        console.log(`📝 Table '${tableName}' needs to be created`);
      } else if (!error) {
        console.log(`✅ Table '${tableName}' already exists`);
      } else {
        console.log(`❓ Table '${tableName}' status unclear:`, error.message);
      }
    }

    console.log("\n📋 Migration Status Summary:");
    console.log("- The migration SQL has been generated successfully");
    console.log(
      "- Schema changes require manual execution in Supabase SQL editor"
    );
    console.log("- Copy the SQL from the migration file to Supabase dashboard");
    console.log(
      "- File location: supabase/migrations/20240101000017_auth_system_redesign.sql"
    );

    console.log("\n🎯 Next Steps:");
    console.log("1. Open Supabase dashboard SQL editor");
    console.log("2. Copy and paste the migration SQL");
    console.log("3. Execute the migration");
    console.log("4. Run this test script again to verify");
  } catch (error) {
    console.error("💥 Error testing migration:", error);
  }
}

testAuthMigration();

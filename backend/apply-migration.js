const { supabase } = require("./src/utils/supabase");
const fs = require("fs");
const path = require("path");

async function applyMigration() {
  try {
    console.log("🚀 Applying AI Personalization migration...");

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240101000016_add_patient_taste_keywords.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter((stmt) => stmt.length > 0 && !stmt.startsWith("--"));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);

        const { error } = await supabase.rpc("exec_sql", {
          sql: statement,
        });

        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase
            .from("_temp_migration")
            .select("*")
            .limit(0); // This will fail but let us execute raw SQL

          if (directError) {
            console.log(
              `⚠️  RPC method not available, trying alternative approach...`
            );
            // We'll need to execute this manually through Supabase dashboard
            break;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
        }
      }
    }

    // Test if the migration was successful
    console.log("🔍 Testing migration results...");

    // Test 1: Check if taste_keywords column exists
    const { data: patientColumns, error: columnError } = await supabase
      .from("patients")
      .select("taste_keywords")
      .limit(1);

    if (!columnError) {
      console.log("✅ taste_keywords column added to patients table");
    } else {
      console.log(
        "❌ Failed to add taste_keywords column:",
        columnError.message
      );
    }

    // Test 2: Check if functions exist
    const { data: validateResult, error: validateError } = await supabase.rpc(
      "validate_interest_keywords",
      {
        keywords: ["test"],
      }
    );

    if (!validateError) {
      console.log("✅ validate_interest_keywords function created");
    } else {
      console.log(
        "❌ validate_interest_keywords function not found:",
        validateError.message
      );
    }

    const { data: sanitizeResult, error: sanitizeError } = await supabase.rpc(
      "sanitize_interest_keywords",
      {
        keywords: ["  TEST  ", "example"],
      }
    );

    if (!sanitizeError) {
      console.log("✅ sanitize_interest_keywords function created");
      console.log("📊 Sanitize test result:", sanitizeResult);
    } else {
      console.log(
        "❌ sanitize_interest_keywords function not found:",
        sanitizeError.message
      );
    }

    const { data: matchResult, error: matchError } = await supabase.rpc(
      "find_matching_coupons_by_interests",
      {
        user_interests: ["food", "entertainment"],
        max_results: 3,
      }
    );

    if (!matchError) {
      console.log("✅ find_matching_coupons_by_interests function created");
      console.log("📊 Found", matchResult.length, "matching coupons");
    } else {
      console.log(
        "❌ find_matching_coupons_by_interests function not found:",
        matchError.message
      );
    }

    console.log("🎉 Migration application completed!");
  } catch (error) {
    console.error("💥 Error applying migration:", error);

    console.log("\n📋 Manual Migration Instructions:");
    console.log(
      "If the automatic migration failed, please run the following SQL manually in your Supabase SQL editor:"
    );
    console.log("\n" + "=".repeat(80));

    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240101000016_add_patient_taste_keywords.sql"
    );
    const migrationSQL = fs.readFileSync(migrationPath, "utf8");
    console.log(migrationSQL);
    console.log("=".repeat(80));
  }
}

// Run the migration
applyMigration();

require("dotenv").config();
const { supabase } = require("./src/utils/supabase");

async function checkTables() {
  console.log("Checking database tables...");

  const tables = [
    "users",
    "patients",
    "donors",
    "bloodgroups",
    "bloodcomponents",
    "donationrequests",
    "donations",
    "notifications",
    "donorcoupons",
  ];

  for (const table of tables) {
    try {
      console.log(`\n--- Checking table: ${table} ---`);
      const { data, error, count } = await supabase
        .from(table)
        .select("*", { count: "exact" })
        .limit(1);

      if (error) {
        console.log(`❌ Error accessing ${table}:`, error.message);
      } else {
        console.log(`✅ Table ${table} exists with ${count} rows`);
        if (data && data.length > 0) {
          console.log(`Sample data:`, Object.keys(data[0]));
        }
      }
    } catch (err) {
      console.log(`❌ Exception checking ${table}:`, err.message);
    }
  }
}

checkTables();

/**
 * Fix script for common issues
 * Run this to fix authentication and database issues
 */

require("dotenv").config();
const { supabase } = require("./backend/src/utils/supabase");

async function fixIssues() {
  console.log("🔧 Fixing Blood Warriors Issues...\n");

  try {
    // 1. Check database connection
    console.log("1️⃣ Testing database connection...");
    const { data: testData, error: testError } = await supabase
      .from("users")
      .select("count")
      .limit(1);

    if (testError) {
      console.error("❌ Database connection failed:", testError.message);
      console.log("💡 Please check your Supabase credentials in .env file");
      return;
    }
    console.log("✅ Database connection successful");

    // 2. Check if blood groups exist
    console.log("\n2️⃣ Checking blood groups...");
    const { data: bloodGroups, error: bgError } = await supabase
      .from("bloodgroups")
      .select("*");

    if (bgError) {
      console.error("❌ Error checking blood groups:", bgError.message);
      return;
    }

    if (!bloodGroups || bloodGroups.length === 0) {
      console.log("⚠️  No blood groups found. Seeding data...");
      await seedBloodGroups();
    } else {
      console.log(`✅ Found ${bloodGroups.length} blood groups`);
    }

    // 3. Check if blood components exist
    console.log("\n3️⃣ Checking blood components...");
    const { data: components, error: compError } = await supabase
      .from("bloodcomponents")
      .select("*");

    if (compError) {
      console.error("❌ Error checking blood components:", compError.message);
      return;
    }

    if (!components || components.length === 0) {
      console.log("⚠️  No blood components found. Seeding data...");
      await seedBloodComponents();
    } else {
      console.log(`✅ Found ${components.length} blood components`);
    }

    // 4. Check for duplicate phone numbers and clean them
    console.log("\n4️⃣ Checking for duplicate phone numbers...");
    const { data: duplicates, error: dupError } = await supabase
      .from("users")
      .select("phone_number, count(*)")
      .group("phone_number")
      .having("count(*) > 1");

    if (dupError) {
      console.log("⚠️  Could not check duplicates:", dupError.message);
    } else if (duplicates && duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} duplicate phone numbers`);
      console.log(
        "💡 You may need to clean these manually in Supabase dashboard"
      );
    } else {
      console.log("✅ No duplicate phone numbers found");
    }

    // 5. Test API endpoints
    console.log("\n5️⃣ Testing API endpoints...");
    console.log("💡 Make sure your backend is running on port 4000");
    console.log("💡 Test these URLs in your browser:");
    console.log("   - http://localhost:4000/health");
    console.log("   - http://localhost:4000/api/health");
    console.log("   - http://localhost:4000/api/public-data/blood-groups");

    console.log("\n🎉 Issue fixing completed!");
    console.log("\n📋 Next steps:");
    console.log("1. Restart your backend server: cd backend && npm start");
    console.log("2. Restart your frontend: cd frontend && npm start");
    console.log("3. Try registering with a unique phone number");
    console.log("4. Check browser console for any remaining errors");
  } catch (error) {
    console.error("❌ Error during fix:", error);
  }
}

async function seedBloodGroups() {
  const bloodGroups = [
    { blood_group_id: 1, group_name: "A+" },
    { blood_group_id: 2, group_name: "A-" },
    { blood_group_id: 3, group_name: "B+" },
    { blood_group_id: 4, group_name: "B-" },
    { blood_group_id: 5, group_name: "AB+" },
    { blood_group_id: 6, group_name: "AB-" },
    { blood_group_id: 7, group_name: "O+" },
    { blood_group_id: 8, group_name: "O-" },
  ];

  const { error } = await supabase
    .from("bloodgroups")
    .upsert(bloodGroups, { onConflict: "blood_group_id" });

  if (error) {
    console.error("❌ Error seeding blood groups:", error.message);
  } else {
    console.log("✅ Blood groups seeded successfully");
  }
}

async function seedBloodComponents() {
  const components = [
    { component_id: 1, component_name: "Whole Blood" },
    { component_id: 2, component_name: "Red Blood Cells" },
    { component_id: 3, component_name: "Platelets" },
    { component_id: 4, component_name: "Plasma" },
    { component_id: 5, component_name: "Cryoprecipitate" },
  ];

  const { error } = await supabase
    .from("bloodcomponents")
    .upsert(components, { onConflict: "component_id" });

  if (error) {
    console.error("❌ Error seeding blood components:", error.message);
  } else {
    console.log("✅ Blood components seeded successfully");
  }
}

// Run the fix
fixIssues();

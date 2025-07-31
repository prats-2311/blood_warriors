require("dotenv").config();
const { supabase } = require("./src/utils/supabase");

async function debugUserData() {
  console.log("Checking user data in database...");

  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .limit(5);

    if (error) {
      console.log("❌ Error fetching users:", error.message);
    } else {
      console.log("✅ Found", users.length, "users");
      users.forEach((user, index) => {
        console.log(`User ${index + 1}:`, JSON.stringify(user, null, 2));
      });
    }
  } catch (error) {
    console.log("❌ Debug failed:", error.message);
  }
}

debugUserData();

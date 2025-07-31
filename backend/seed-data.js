/**
 * Seed script to populate basic data in the database
 * Run this after applying the migration
 */

require("dotenv").config();
const { supabase } = require("./src/utils/supabase");

async function seedData() {
  console.log("🌱 Seeding database with initial data...");

  try {
    // 1. Seed Blood Groups
    console.log("📊 Seeding blood groups...");
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

    const { error: bloodGroupError } = await supabase
      .from("bloodgroups")
      .upsert(bloodGroups, { onConflict: "blood_group_id" });

    if (bloodGroupError) {
      console.error("Error seeding blood groups:", bloodGroupError);
    } else {
      console.log("✅ Blood groups seeded successfully");
    }

    // 2. Seed Blood Components
    console.log("🩸 Seeding blood components...");
    const bloodComponents = [
      { component_id: 1, component_name: "Whole Blood" },
      { component_id: 2, component_name: "Red Blood Cells" },
      { component_id: 3, component_name: "Platelets" },
      { component_id: 4, component_name: "Plasma" },
      { component_id: 5, component_name: "Cryoprecipitate" },
    ];

    const { error: componentError } = await supabase
      .from("bloodcomponents")
      .upsert(bloodComponents, { onConflict: "component_id" });

    if (componentError) {
      console.error("Error seeding blood components:", componentError);
    } else {
      console.log("✅ Blood components seeded successfully");
    }

    // 3. Seed Sample Blood Banks
    console.log("🏥 Seeding sample blood banks...");
    const bloodBanks = [
      {
        name: "City General Hospital Blood Bank",
        address: "123 Main Street",
        city: "Mumbai",
        state: "Maharashtra",
        category: "Hospital",
        phone: "+91-22-12345678",
        email: "bloodbank@citygeneral.com",
      },
      {
        name: "Red Cross Blood Center",
        address: "456 Health Avenue",
        city: "Delhi",
        state: "Delhi",
        category: "NGO",
        phone: "+91-11-87654321",
        email: "donate@redcross.org",
      },
      {
        name: "Apollo Hospital Blood Bank",
        address: "789 Medical Complex",
        city: "Bangalore",
        state: "Karnataka",
        category: "Hospital",
        phone: "+91-80-11223344",
        email: "bloodbank@apollo.com",
      },
    ];

    const { error: bankError } = await supabase
      .from("bloodbanks")
      .upsert(bloodBanks, { onConflict: "name" });

    if (bankError) {
      console.error("Error seeding blood banks:", bankError);
    } else {
      console.log("✅ Blood banks seeded successfully");
    }

    // 4. Seed Sample Coupons for Rewards System
    console.log("🎟️ Seeding sample coupons...");
    const coupons = [
      {
        partner_name: "Pizza Palace",
        coupon_title: "20% Off on All Pizzas",
        target_keywords: JSON.stringify([
          "food",
          "dining",
          "pizza",
          "restaurant",
        ]),
        quantity_total: 100,
        quantity_redeemed: 0,
        expiry_date: "2025-12-31",
        discount_percentage: 20,
        description:
          "Get 20% discount on all pizza orders. Valid for dine-in and takeaway.",
        is_active: true,
      },
      {
        partner_name: "MovieMax Cinemas",
        coupon_title: "Free Popcorn with Movie Ticket",
        target_keywords: JSON.stringify([
          "movies",
          "entertainment",
          "cinema",
          "films",
        ]),
        quantity_total: 50,
        quantity_redeemed: 0,
        expiry_date: "2025-12-31",
        discount_percentage: 0,
        description: "Get free medium popcorn with any movie ticket purchase.",
        is_active: true,
      },
      {
        partner_name: "Sports Zone",
        coupon_title: "15% Off Sports Equipment",
        target_keywords: JSON.stringify([
          "sports",
          "cricket",
          "fitness",
          "games",
        ]),
        quantity_total: 75,
        quantity_redeemed: 0,
        expiry_date: "2025-12-31",
        discount_percentage: 15,
        description: "15% discount on all sports equipment and accessories.",
        is_active: true,
      },
      {
        partner_name: "BookWorld",
        coupon_title: "Buy 2 Get 1 Free Books",
        target_keywords: JSON.stringify([
          "books",
          "reading",
          "literature",
          "education",
        ]),
        quantity_total: 30,
        quantity_redeemed: 0,
        expiry_date: "2025-12-31",
        discount_percentage: 33,
        description:
          "Buy any 2 books and get the 3rd one free. Valid on all genres.",
        is_active: true,
      },
    ];

    const { error: couponError } = await supabase
      .from("coupons")
      .upsert(coupons, { onConflict: "partner_name,coupon_title" });

    if (couponError) {
      console.error("Error seeding coupons:", couponError);
    } else {
      console.log("✅ Sample coupons seeded successfully");
    }

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📊 Summary:");
    console.log("- 8 Blood Groups added");
    console.log("- 5 Blood Components added");
    console.log("- 3 Sample Blood Banks added");
    console.log("- 4 Sample Coupons added");
    console.log("\n✅ Your app should now work properly!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seeding
seedData();

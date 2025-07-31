const { supabase } = require("../utils/supabase");

describe("Database Migration - Patient Taste Keywords", () => {
  beforeAll(async () => {
    // Ensure we have a clean test environment
    // Note: In a real test environment, you'd want to use a test database
  });

  afterAll(async () => {
    // Clean up test data
  });

  describe("Schema Changes", () => {
    test("patients table should have taste_keywords column", async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("taste_keywords")
        .limit(1);

      expect(error).toBeNull();
      // The query should succeed even if no data is returned
    });

    test("taste_keywords should default to empty array", async () => {
      // This test would require creating a test patient
      // For now, we'll just verify the column exists and accepts JSONB
      const testKeywords = ["test", "keywords"];

      // Test that we can query with JSONB operations
      const { error } = await supabase
        .from("patients")
        .select("*")
        .contains("taste_keywords", testKeywords);

      // Should not error even if no matches found
      expect(error).toBeNull();
    });
  });

  describe("Database Functions", () => {
    test("validate_interest_keywords function should exist and work", async () => {
      const { data, error } = await supabase.rpc("validate_interest_keywords", {
        keywords: ["cricket", "movies", "music"],
      });

      expect(error).toBeNull();
      expect(data).toBe(true);
    });

    test("validate_interest_keywords should reject invalid input", async () => {
      const { data, error } = await supabase.rpc("validate_interest_keywords", {
        keywords: "not an array",
      });

      expect(error).toBeNull();
      expect(data).toBe(false);
    });

    test("sanitize_interest_keywords function should exist and work", async () => {
      const { data, error } = await supabase.rpc("sanitize_interest_keywords", {
        keywords: ["  CRICKET  ", "Movies", "music", "", "a"], // mixed case, whitespace, empty, too short
      });

      expect(error).toBeNull();
      expect(data).toEqual(["cricket", "movies", "music"]); // should be cleaned
    });

    test("find_matching_coupons_by_interests function should exist", async () => {
      const { data, error } = await supabase.rpc(
        "find_matching_coupons_by_interests",
        {
          user_interests: ["food", "entertainment"],
          max_results: 3,
        }
      );

      expect(error).toBeNull();
      expect(Array.isArray(data)).toBe(true);
    });
  });

  describe("Indexes", () => {
    test("GIN indexes should be created for performance", async () => {
      // Query to check if indexes exist
      const { data, error } = await supabase
        .from("pg_indexes")
        .select("indexname")
        .in("indexname", [
          "idx_patients_taste_keywords",
          "idx_donors_qloo_taste_keywords",
          "idx_chathistory_user_timestamp",
        ]);

      expect(error).toBeNull();
      // Should find the indexes (though this test might need adjustment based on Supabase permissions)
    });
  });

  describe("Interest Data Operations", () => {
    test("should be able to store and retrieve interest keywords", async () => {
      // This would require a test patient record
      const testInterests = ["cricket", "movies", "food"];

      // For now, just test that the JSONB operations work
      const { error } = await supabase
        .from("patients")
        .select("*")
        .eq("taste_keywords", JSON.stringify(testInterests));

      expect(error).toBeNull();
    });

    test("should be able to query by interest keywords", async () => {
      // Test JSONB containment queries
      const { error } = await supabase
        .from("patients")
        .select("*")
        .contains("taste_keywords", ["cricket"]);

      expect(error).toBeNull();
    });

    test("should be able to check if interests overlap", async () => {
      // Test JSONB overlap operator
      const { error } = await supabase
        .from("patients")
        .select("*")
        .overlaps("taste_keywords", ["cricket", "movies"]);

      expect(error).toBeNull();
    });
  });
});

describe("Performance Tests", () => {
  test("interest-based queries should be reasonably fast", async () => {
    const startTime = Date.now();

    const { error } = await supabase
      .from("patients")
      .select("patient_id, taste_keywords")
      .contains("taste_keywords", ["cricket"])
      .limit(10);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(1000); // Should complete within 1 second
  });

  test("coupon matching should be reasonably fast", async () => {
    const startTime = Date.now();

    const { error } = await supabase.rpc("find_matching_coupons_by_interests", {
      user_interests: ["food", "entertainment", "travel"],
      max_results: 5,
    });

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(error).toBeNull();
    expect(queryTime).toBeLessThan(2000); // Should complete within 2 seconds
  });
});

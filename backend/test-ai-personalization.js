/**
 * Test script for AI Personalization System
 * This script tests the core functionality without requiring a full app setup
 */

const PersonalizationService = require("./src/services/PersonalizationService");
const FallbackResponseService = require("./src/services/FallbackResponseService");
const RewardService = require("./src/services/RewardService");
const QlooService = require("./src/services/QlooService");
const Patient = require("./src/models/Patient");

async function testPersonalizationSystem() {
  console.log("🚀 Testing AI Personalization System...\n");

  // Test 1: PersonalizationService
  console.log("📋 Test 1: PersonalizationService");
  try {
    // Test interest validation
    const validInterests = ["cricket", "movies", "music"];
    const isValid = PersonalizationService.validateInterests(validInterests);
    console.log(`✅ Interest validation: ${isValid ? "PASS" : "FAIL"}`);

    // Test interest sanitization
    const dirtyInterests = ["  CRICKET  ", "Movies", "", "a", "valid"];
    const sanitized = PersonalizationService.sanitizeInterests(dirtyInterests);
    console.log(`✅ Interest sanitization: ${JSON.stringify(sanitized)}`);

    // Test enrichment with mock data (when Qloo is not available)
    const enriched = await PersonalizationService.enrichContextWithQloo([
      "cricket",
      "movies",
    ]);
    console.log(
      `✅ Interest enrichment: ${
        enriched.qlooUsed ? "Qloo used" : "Fallback used"
      }`
    );
  } catch (error) {
    console.log(`❌ PersonalizationService error: ${error.message}`);
  }

  console.log("\n📋 Test 2: FallbackResponseService");
  try {
    // Test mood detection
    const sadMood = FallbackResponseService.detectMood("i feel so sad today");
    const boredMood = FallbackResponseService.detectMood("i am really bored");
    console.log(`✅ Mood detection: sad="${sadMood}", bored="${boredMood}"`);

    // Test topic detection
    const thalTopic = FallbackResponseService.detectTopic(
      "what is thalassemia"
    );
    const donationTopic = FallbackResponseService.detectTopic(
      "how to donate blood"
    );
    console.log(
      `✅ Topic detection: thalassemia="${thalTopic}", donation="${donationTopic}"`
    );

    // Test personalized responses
    const sadResponse = FallbackResponseService.getPersonalizedFallback(
      "I feel sad today",
      ["cricket", "movies"],
      "patient"
    );
    console.log(`✅ Personalized response length: ${sadResponse.length} chars`);
    console.log(`   Sample: "${sadResponse.substring(0, 100)}..."`);

    // Test response quality scoring
    const quality = FallbackResponseService.getResponseQuality(sadResponse, [
      "cricket",
      "movies",
    ]);
    console.log(`✅ Response quality score: ${quality}/100`);
  } catch (error) {
    console.log(`❌ FallbackResponseService error: ${error.message}`);
  }

  console.log("\n📋 Test 3: QlooService");
  try {
    // Test Qloo service status
    const status = QlooService.getStatus();
    console.log(
      `✅ Qloo status: enabled=${status.enabled}, hasApiKey=${status.hasApiKey}`
    );

    // Test mock taste keywords (when API is not configured)
    const mockKeywords = QlooService.getMockTasteKeywords();
    console.log(`✅ Mock taste keywords: ${JSON.stringify(mockKeywords)}`);

    // Test fallback keywords
    const fallbackKeywords = QlooService.getFallbackKeywords([
      "cricket",
      "movies",
    ]);
    console.log(`✅ Fallback keywords: ${JSON.stringify(fallbackKeywords)}`);

    // Test mock recommendations
    const mockRecs = QlooService.getMockRecommendations(
      ["cricket", "food"],
      "all"
    );
    console.log(`✅ Mock recommendations: ${mockRecs.length} items`);
  } catch (error) {
    console.log(`❌ QlooService error: ${error.message}`);
  }

  console.log("\n📋 Test 4: RewardService");
  try {
    // Test match score calculation
    const score1 = RewardService.calculateMatchScore(
      ["food", "dining"],
      ["food", "entertainment"]
    );
    const score2 = RewardService.calculateMatchScore('["movies", "cinema"]', [
      "movies",
    ]);
    console.log(
      `✅ Match scores: exact match=${score1}, JSON string=${score2}`
    );

    // Test redemption code generation
    const code1 = RewardService.generateRedemptionCode();
    const code2 = RewardService.generateRedemptionCode();
    console.log(
      `✅ Redemption codes: ${code1}, ${code2} (unique: ${code1 !== code2})`
    );

    // Test reward statistics (will fail without database, but tests the structure)
    try {
      const stats = await RewardService.getRewardStatistics();
      console.log(
        `✅ Reward statistics structure: ${Object.keys(stats).join(", ")}`
      );
    } catch (dbError) {
      console.log(
        `⚠️  Reward statistics (expected DB error): ${dbError.message.substring(
          0,
          50
        )}...`
      );
    }
  } catch (error) {
    console.log(`❌ RewardService error: ${error.message}`);
  }

  console.log("\n📋 Test 5: Patient Model");
  try {
    // Test interest validation
    const validation1 = Patient.validateInterests(["cricket", "movies"]);
    const validation2 = Patient.validateInterests(["a"]); // Too short
    console.log(
      `✅ Patient validation: valid interests=${
        validation1.isValid
      }, invalid=${!validation2.isValid}`
    );

    if (!validation2.isValid) {
      console.log(`   Validation errors: ${validation2.errors.join(", ")}`);
    }
  } catch (error) {
    console.log(`❌ Patient model error: ${error.message}`);
  }

  console.log("\n🎉 Testing completed!");
  console.log("\n📝 Next Steps:");
  console.log("1. Apply the database migration in Supabase console");
  console.log("2. Configure QLOO_API_KEY in your .env file (optional)");
  console.log("3. Run the unit tests: npm test");
  console.log("4. Test with real database connections");
}

// Run the tests
testPersonalizationSystem().catch(console.error);

const FallbackResponseService = require("../services/FallbackResponseService");

describe("FallbackResponseService", () => {
  describe("detectMood", () => {
    test("should detect sad mood", () => {
      const mood = FallbackResponseService.detectMood("i feel so sad today");
      expect(mood).toBe("sad");
    });

    test("should detect bored mood", () => {
      const mood = FallbackResponseService.detectMood("i am really bored");
      expect(mood).toBe("bored");
    });

    test("should detect worried mood", () => {
      const mood = FallbackResponseService.detectMood(
        "i am worried about my health"
      );
      expect(mood).toBe("worried");
    });

    test("should detect happy mood", () => {
      const mood = FallbackResponseService.detectMood("i feel great today");
      expect(mood).toBe("happy");
    });

    test("should return neutral for unrecognized mood", () => {
      const mood = FallbackResponseService.detectMood(
        "tell me about thalassemia"
      );
      expect(mood).toBe("neutral");
    });
  });

  describe("detectTopic", () => {
    test("should detect thalassemia topic", () => {
      const topic = FallbackResponseService.detectTopic("what is thalassemia");
      expect(topic).toBe("thalassemia");
    });

    test("should detect donation topic", () => {
      const topic = FallbackResponseService.detectTopic("how to donate blood");
      expect(topic).toBe("donation");
    });

    test("should detect health topic", () => {
      const topic = FallbackResponseService.detectTopic(
        "health tips for wellness"
      );
      expect(topic).toBe("health");
    });

    test("should detect emergency topic", () => {
      const topic = FallbackResponseService.detectTopic("this is an emergency");
      expect(topic).toBe("emergency");
    });

    test("should detect mood topic", () => {
      const topic = FallbackResponseService.detectTopic("i feel sad");
      expect(topic).toBe("mood");
    });

    test("should return general for unrecognized topic", () => {
      const topic = FallbackResponseService.detectTopic("random question");
      expect(topic).toBe("general");
    });
  });

  describe("generateInterestSuggestions", () => {
    test("should generate cricket suggestions for sad mood", () => {
      const suggestions = FallbackResponseService.generateInterestSuggestions(
        ["cricket"],
        "sad"
      );
      expect(suggestions).toContain("cricket");
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test("should generate movie suggestions for bored mood", () => {
      const suggestions = FallbackResponseService.generateInterestSuggestions(
        ["movies"],
        "bored"
      );
      expect(suggestions).toContain("movie");
      expect(suggestions.length).toBeGreaterThan(0);
    });

    test("should handle multiple interests", () => {
      const suggestions = FallbackResponseService.generateInterestSuggestions(
        ["cricket", "movies"],
        "neutral"
      );
      expect(suggestions).toBeTruthy();
      expect(typeof suggestions).toBe("string");
    });

    test("should handle unknown interests", () => {
      const suggestions = FallbackResponseService.generateInterestSuggestions(
        ["unknown"],
        "neutral"
      );
      expect(suggestions).toContain("unknown");
    });

    test("should handle empty interests", () => {
      const suggestions = FallbackResponseService.generateInterestSuggestions(
        [],
        "neutral"
      );
      expect(suggestions).toBe("");
    });
  });

  describe("getPersonalizedFallback", () => {
    test("should provide personalized response for sad patient with interests", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "I feel sad today",
        ["cricket", "movies"],
        "patient"
      );

      expect(response).toContain("I'm sorry to hear you're feeling down");
      expect(response.length).toBeGreaterThan(50);
      expect(response).toMatch(/patient|journey|alone/);
    });

    test("should provide response for bored donor with interests", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "I am bored",
        ["music", "food"],
        "donor"
      );

      expect(response).toContain("bored");
      expect(response.length).toBeGreaterThan(50);
    });

    test("should handle thalassemia questions with interests", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "What is thalassemia?",
        ["cricket"],
        "patient"
      );

      expect(response).toContain("Thalassemia");
      expect(response).toContain("genetic blood disorder");
      expect(response).toContain("cricket" || "positive outlook");
    });

    test("should handle emergency situations", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "This is an emergency",
        ["cricket"],
        "patient"
      );

      expect(response).toContain("emergency");
      expect(response).toContain("healthcare provider");
      expect(response).toContain("immediately");
    });

    test("should provide response without interests", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "I feel sad",
        [],
        "patient"
      );

      expect(response).toContain("I'm sorry to hear you're feeling down");
      expect(response).toContain("What activities");
    });

    test("should handle health questions for donors", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "Health tips please",
        ["fitness"],
        "donor"
      );

      expect(response).toContain("health");
      expect(response).toContain("blood donor");
      expect(response).toMatch(/fitness|well-being/);
    });

    test("should handle donation questions", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "How to donate blood?",
        ["travel"],
        "donor"
      );

      expect(response).toContain("Blood donation");
      expect(response).toContain("noble act");
      expect(response).toContain("3 months");
    });

    test("should provide default response for general questions", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "Random question",
        ["books"],
        "patient"
      );

      expect(response).toContain("help you with information");
      expect(response).toMatch(/books|authors|reading/);
      expect(response).toContain("Thalassemia patient");
    });
  });

  describe("selectTemplate", () => {
    test("should select mood-specific template", () => {
      const template = FallbackResponseService.selectTemplate(
        "mood",
        "sad",
        "patient"
      );
      expect(template).toHaveProperty("base");
      expect(template.base).toContain("I'm sorry to hear you're feeling down");
    });

    test("should select topic-specific template", () => {
      const template = FallbackResponseService.selectTemplate(
        "thalassemia",
        "neutral",
        "patient"
      );
      expect(template).toHaveProperty("base");
      expect(template.base).toContain("Thalassemia");
    });

    test("should fallback to default template", () => {
      const template = FallbackResponseService.selectTemplate(
        "unknown",
        "unknown",
        "patient"
      );
      expect(template).toHaveProperty("base");
      expect(template.base).toContain("help you with information");
    });
  });

  describe("personalizeResponse", () => {
    test("should personalize response with interests", () => {
      const template = {
        base: "Base response",
        withInterests: " With interests: {suggestions}",
        withoutInterests: " Without interests",
        userTypeSpecific: {
          patient: "Patient specific content",
        },
      };

      const response = FallbackResponseService.personalizeResponse(
        template,
        ["cricket"],
        "neutral",
        "patient"
      );

      expect(response).toContain("Base response");
      expect(response).toContain("With interests:");
      expect(response).toContain("Patient specific content");
    });

    test("should handle response without interests", () => {
      const template = {
        base: "Base response",
        withInterests: " With interests: {suggestions}",
        withoutInterests: " Without interests",
        userTypeSpecific: {
          donor: "Donor specific content",
        },
      };

      const response = FallbackResponseService.personalizeResponse(
        template,
        [],
        "neutral",
        "donor"
      );

      expect(response).toContain("Base response");
      expect(response).toContain("Without interests");
      expect(response).toContain("Donor specific content");
    });
  });

  describe("getResponseQuality", () => {
    test("should score response with interests highly", () => {
      const response =
        "I understand you enjoy cricket. How about watching cricket highlights?";
      const score = FallbackResponseService.getResponseQuality(response, [
        "cricket",
      ]);

      expect(score).toBeGreaterThan(70);
    });

    test("should score empathetic response highly", () => {
      const response =
        "I'm sorry to hear you're feeling down. I understand it's difficult.";
      const score = FallbackResponseService.getResponseQuality(response, []);

      expect(score).toBeGreaterThan(60);
    });

    test("should score actionable response highly", () => {
      const response = "How about trying some music to help you feel better?";
      const score = FallbackResponseService.getResponseQuality(response, [
        "music",
      ]);

      expect(score).toBeGreaterThan(70);
    });

    test("should score short response lower", () => {
      const response = "OK";
      const score = FallbackResponseService.getResponseQuality(response, []);

      expect(score).toBeLessThan(60);
    });

    test("should score very long response lower", () => {
      const response = "A".repeat(400);
      const score = FallbackResponseService.getResponseQuality(response, []);

      expect(score).toBeLessThan(70);
    });
  });

  describe("Edge Cases", () => {
    test("should handle null interests", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "Hello",
        null,
        "patient"
      );

      expect(response).toBeTruthy();
      expect(typeof response).toBe("string");
    });

    test("should handle undefined user type", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "Hello",
        ["cricket"],
        undefined
      );

      expect(response).toBeTruthy();
      expect(typeof response).toBe("string");
    });

    test("should handle empty prompt", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "",
        ["cricket"],
        "patient"
      );

      expect(response).toBeTruthy();
      expect(typeof response).toBe("string");
    });

    test("should handle very long prompt", () => {
      const longPrompt = "I am feeling ".repeat(100) + "sad";
      const response = FallbackResponseService.getPersonalizedFallback(
        longPrompt,
        ["cricket"],
        "patient"
      );

      expect(response).toBeTruthy();
      expect(response).toContain("I'm sorry to hear you're feeling down");
    });

    test("should handle special characters in prompt", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "I feel @#$% sad today!!!",
        ["cricket"],
        "patient"
      );

      expect(response).toBeTruthy();
      expect(response).toContain("I'm sorry to hear you're feeling down");
    });
  });

  describe("Integration with Different User Types", () => {
    test("should provide patient-specific content", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "Tell me about thalassemia",
        ["cricket"],
        "patient"
      );

      expect(response).toContain("treatment" || "medical" || "hematologist");
    });

    test("should provide donor-specific content", () => {
      const response = FallbackResponseService.getPersonalizedFallback(
        "Tell me about blood donation",
        ["cricket"],
        "donor"
      );

      expect(response).toContain("donor" || "thank you" || "lives");
    });
  });
});

/**
 * FallbackResponseService - Provides personalized fallback responses when LLM is unavailable
 * This service creates interest-based response templates for better user experience
 */

class FallbackResponseService {
  constructor() {
    this.responseTemplates = this.initializeTemplates();
    this.moodDetectors = this.initializeMoodDetectors();
    this.interestSuggestions = this.initializeInterestSuggestions();
  }

  /**
   * Get personalized fallback response
   * @param {string} prompt - User's message
   * @param {string[]} interests - User's interests
   * @param {string} userType - 'patient' or 'donor'
   * @returns {string} Personalized fallback response
   */
  getPersonalizedFallback(prompt, interests = [], userType = "patient") {
    const lowerPrompt = prompt.toLowerCase();

    // Detect mood and context
    const mood = this.detectMood(lowerPrompt);
    const topic = this.detectTopic(lowerPrompt);

    // Get appropriate response template
    const template = this.selectTemplate(topic, mood, userType);

    // Personalize with interests
    return this.personalizeResponse(template, interests, mood, userType);
  }

  /**
   * Detect user's mood from their message
   * @param {string} lowerPrompt - Lowercase user message
   * @returns {string} Detected mood
   */
  detectMood(lowerPrompt) {
    for (const [mood, keywords] of Object.entries(this.moodDetectors)) {
      if (keywords.some((keyword) => lowerPrompt.includes(keyword))) {
        return mood;
      }
    }
    return "neutral";
  }

  /**
   * Detect topic from user's message
   * @param {string} lowerPrompt - Lowercase user message
   * @returns {string} Detected topic
   */
  detectTopic(lowerPrompt) {
    const topics = {
      thalassemia: [
        "thalassemia",
        "blood disorder",
        "hemoglobin",
        "transfusion",
      ],
      donation: ["donate", "donation", "blood bank", "donor"],
      health: ["health", "wellness", "medical", "doctor", "treatment"],
      emergency: ["emergency", "urgent", "help", "crisis"],
      mood: ["sad", "happy", "bored", "tired", "excited", "worried", "anxious"],
      general: [],
    };

    for (const [topic, keywords] of Object.entries(topics)) {
      if (keywords.some((keyword) => lowerPrompt.includes(keyword))) {
        return topic;
      }
    }
    return "general";
  }

  /**
   * Select appropriate response template
   * @param {string} topic - Detected topic
   * @param {string} mood - Detected mood
   * @param {string} userType - User type
   * @returns {Object} Response template
   */
  selectTemplate(topic, mood, userType) {
    const key = `${topic}_${mood}_${userType}`;

    // Try specific combination first
    if (this.responseTemplates[key]) {
      return this.responseTemplates[key];
    }

    // Try topic + mood
    const topicMoodKey = `${topic}_${mood}`;
    if (this.responseTemplates[topicMoodKey]) {
      return this.responseTemplates[topicMoodKey];
    }

    // Try just topic
    if (this.responseTemplates[topic]) {
      return this.responseTemplates[topic];
    }

    // Default template
    return this.responseTemplates.default;
  }

  /**
   * Personalize response with user interests
   * @param {Object} template - Response template
   * @param {string[]} interests - User interests
   * @param {string} mood - User mood
   * @param {string} userType - User type
   * @returns {string} Personalized response
   */
  personalizeResponse(template, interests, mood, userType) {
    let response = template.base;

    // Add interest-based suggestions if user has interests
    if (interests && interests.length > 0) {
      const suggestions = this.generateInterestSuggestions(interests, mood);
      if (suggestions) {
        response += template.withInterests.replace(
          "{suggestions}",
          suggestions
        );
      }
    } else {
      // Add prompt for interests if user doesn't have any
      response += template.withoutInterests;
    }

    // Add user type specific content
    if (template.userTypeSpecific && template.userTypeSpecific[userType]) {
      response += " " + template.userTypeSpecific[userType];
    }

    return response;
  }

  /**
   * Generate interest-based suggestions
   * @param {string[]} interests - User interests
   * @param {string} mood - User mood
   * @returns {string} Interest-based suggestions
   */
  generateInterestSuggestions(interests, mood) {
    const suggestions = [];
    const maxSuggestions = 2;

    interests.slice(0, maxSuggestions).forEach((interest) => {
      const interestSuggestions =
        this.interestSuggestions[interest.toLowerCase()];
      if (interestSuggestions) {
        const moodSpecific =
          interestSuggestions[mood] || interestSuggestions.neutral;
        if (moodSpecific && moodSpecific.length > 0) {
          const randomSuggestion =
            moodSpecific[Math.floor(Math.random() * moodSpecific.length)];
          suggestions.push(randomSuggestion);
        }
      }
    });

    if (suggestions.length === 0) {
      if (interests.length === 0) {
        return "";
      }
      return `engaging with your interests in ${interests
        .slice(0, 2)
        .join(" and ")}`;
    }

    return suggestions.join(" or ");
  }

  /**
   * Initialize response templates
   * @returns {Object} Response templates
   */
  initializeTemplates() {
    return {
      // Thalassemia-related responses
      thalassemia: {
        base: "Thalassemia is a genetic blood disorder that affects hemoglobin production. Regular blood transfusions and proper medical care are essential. Please consult with your hematologist for personalized advice.",
        withInterests:
          " In the meantime, {suggestions} can help maintain a positive outlook during treatment.",
        withoutInterests:
          " What activities do you usually enjoy? I'd be happy to suggest ways to stay positive during your treatment.",
        userTypeSpecific: {
          patient:
            "Remember to follow your treatment schedule and stay in touch with your medical team.",
          donor:
            "Thank you for your support in helping Thalassemia patients through blood donation.",
        },
      },

      // Mood-based responses
      mood_sad: {
        base: "I'm sorry to hear you're feeling down. It's completely normal to have difficult days, especially when dealing with health challenges.",
        withInterests:
          " Since you enjoy {suggestions}, these activities might help lift your spirits.",
        withoutInterests:
          " What activities or interests usually help you feel better? I'd love to suggest something that might brighten your day.",
        userTypeSpecific: {
          patient:
            "Remember that you're not alone in this journey, and it's okay to have tough days.",
          donor:
            "Your generosity in helping others shows what a caring person you are.",
        },
      },

      mood_bored: {
        base: "I understand you're feeling bored. Sometimes we all need something engaging to do.",
        withInterests:
          " How about {suggestions}? These might be just what you need right now.",
        withoutInterests:
          " What are some activities or hobbies you usually enjoy? I'd be happy to suggest something fun based on your interests.",
        userTypeSpecific: {
          patient:
            "Staying engaged with enjoyable activities is important for your overall well-being.",
          donor:
            "Taking time for yourself and your interests is important too!",
        },
      },

      mood_worried: {
        base: "I can sense you're feeling worried. It's natural to have concerns, especially about health matters.",
        withInterests:
          " Sometimes {suggestions} can help take your mind off worries and provide some relief.",
        withoutInterests:
          " What activities usually help you relax and feel more at ease?",
        userTypeSpecific: {
          patient:
            "If you have medical concerns, please don't hesitate to contact your healthcare provider.",
          donor: "Your caring nature shows through your concern for others.",
        },
      },

      // Health-related responses
      health: {
        base: "Maintaining good health involves regular exercise, balanced nutrition, adequate sleep, and routine medical checkups.",
        withInterests:
          " I see you're interested in {suggestions}, which can be great for your overall well-being!",
        withoutInterests:
          " What activities do you enjoy that help you stay healthy and active?",
        userTypeSpecific: {
          patient:
            "For Thalassemia patients, following your treatment plan is crucial for maintaining good health.",
          donor:
            "As a blood donor, you're already contributing to community health - thank you!",
        },
      },

      // Blood donation responses
      donation: {
        base: "Blood donation is a noble act that saves lives! Healthy individuals can donate blood every 3 months.",
        withInterests:
          " After donating, make sure to rest and perhaps enjoy {suggestions} while you recover.",
        withoutInterests:
          " What do you like to do to relax after helping others?",
        userTypeSpecific: {
          patient:
            "Thank you for your interest in blood donation. Please check with your doctor about your eligibility.",
          donor:
            "Thank you for being a regular blood donor - you're making a real difference in people's lives!",
        },
      },

      // Emergency responses
      emergency: {
        base: "For medical emergencies, please contact your healthcare provider immediately or call emergency services. I'm here to provide general information and support.",
        withInterests: "",
        withoutInterests: "",
        userTypeSpecific: {
          patient:
            "If this is about your Thalassemia treatment, contact your hematologist or treatment center immediately.",
          donor:
            "If you're experiencing issues after donation, contact the blood bank or your healthcare provider.",
        },
      },

      // Default response
      default: {
        base: "I'm here to help you with information about Thalassemia care, blood donation, and general health topics.",
        withInterests:
          " I also notice you're interested in {suggestions}, so feel free to chat about those topics too!",
        withoutInterests: " What would you like to know more about?",
        userTypeSpecific: {
          patient:
            "As a Thalassemia patient, I'm here to support you with information and encouragement.",
          donor:
            "Thank you for being a blood donor - your generosity helps save lives every day.",
        },
      },
    };
  }

  /**
   * Initialize mood detection keywords
   * @returns {Object} Mood detection keywords
   */
  initializeMoodDetectors() {
    return {
      sad: [
        "sad",
        "down",
        "depressed",
        "upset",
        "crying",
        "unhappy",
        "miserable",
        "heartbroken",
      ],
      bored: [
        "bored",
        "boring",
        "nothing to do",
        "dull",
        "tedious",
        "uninteresting",
      ],
      worried: [
        "worried",
        "anxious",
        "concerned",
        "nervous",
        "scared",
        "afraid",
        "stress",
      ],
      happy: [
        "happy",
        "excited",
        "great",
        "wonderful",
        "amazing",
        "fantastic",
        "good",
      ],
      tired: ["tired", "exhausted", "sleepy", "fatigue", "weary", "drained"],
      angry: ["angry", "mad", "furious", "annoyed", "frustrated", "irritated"],
    };
  }

  /**
   * Initialize interest-based suggestions
   * @returns {Object} Interest suggestions by mood
   */
  initializeInterestSuggestions() {
    return {
      cricket: {
        sad: [
          "watching your favorite cricket highlights",
          "reading about inspiring cricket comebacks",
        ],
        bored: [
          "checking live cricket scores",
          "watching cricket match highlights",
        ],
        worried: ["listening to cricket commentary", "reading cricket news"],
        neutral: [
          "following your favorite cricket team",
          "watching cricket videos",
        ],
      },
      movies: {
        sad: [
          "watching a feel-good comedy movie",
          "enjoying a heartwarming Bollywood film",
        ],
        bored: ["exploring new movie releases", "watching movie trailers"],
        worried: ["watching a light comedy", "enjoying a relaxing movie"],
        neutral: ["watching your favorite movies", "discovering new films"],
      },
      music: {
        sad: ["listening to uplifting music", "playing your favorite songs"],
        bored: ["discovering new music", "creating a playlist"],
        worried: ["listening to calming music", "enjoying soothing melodies"],
        neutral: ["listening to your favorite music", "exploring new artists"],
      },
      food: {
        sad: ["trying a comforting recipe", "ordering your favorite meal"],
        bored: ["exploring new recipes", "watching cooking videos"],
        worried: ["preparing a simple, healthy meal", "trying some herbal tea"],
        neutral: ["cooking something delicious", "exploring new cuisines"],
      },
      books: {
        sad: ["reading an inspiring book", "enjoying a comforting story"],
        bored: ["starting a new book", "exploring different genres"],
        worried: ["reading something light and positive", "enjoying poetry"],
        neutral: ["reading your favorite books", "discovering new authors"],
      },
      travel: {
        sad: [
          "looking at photos from happy trips",
          "planning future adventures",
        ],
        bored: ["exploring virtual tours online", "reading travel blogs"],
        worried: [
          "looking at peaceful travel destinations",
          "planning relaxing getaways",
        ],
        neutral: ["planning your next trip", "exploring new destinations"],
      },
      fitness: {
        sad: ["doing some light stretching", "taking a gentle walk"],
        bored: ["trying a new workout routine", "going for a walk"],
        worried: ["doing some relaxing yoga", "taking deep breaths"],
        neutral: [
          "staying active with exercise",
          "maintaining your fitness routine",
        ],
      },
      art: {
        sad: ["creating something beautiful", "looking at inspiring artwork"],
        bored: ["trying a new art project", "visiting virtual museums"],
        worried: ["doing some relaxing drawing", "enjoying peaceful art"],
        neutral: ["exploring your creativity", "enjoying artistic activities"],
      },
    };
  }

  /**
   * Get response quality score for testing
   * @param {string} response - Generated response
   * @param {string[]} interests - User interests
   * @returns {number} Quality score (0-100)
   */
  getResponseQuality(response, interests) {
    let score = 50; // Base score

    // Check if response mentions interests
    if (interests && interests.length > 0) {
      const mentionsInterests = interests.some((interest) =>
        response.toLowerCase().includes(interest.toLowerCase())
      );
      if (mentionsInterests) score += 20;
    }

    // Check response length (not too short, not too long)
    if (response.length > 50 && response.length < 300) score += 10;

    // Check for empathy keywords
    const empathyKeywords = [
      "sorry",
      "understand",
      "help",
      "support",
      "here for you",
    ];
    if (
      empathyKeywords.some((keyword) =>
        response.toLowerCase().includes(keyword)
      )
    ) {
      score += 10;
    }

    // Check for actionable suggestions
    if (
      response.includes("how about") ||
      response.includes("try") ||
      response.includes("consider")
    ) {
      score += 10;
    }

    return Math.min(score, 100);
  }
}

module.exports = new FallbackResponseService();

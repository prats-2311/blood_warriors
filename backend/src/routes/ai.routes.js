const express = require("express");
const { OpenAI } = require("openai");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

/**
 * Clean AI response by removing internal reasoning and thinking tags
 */
function cleanAIResponse(response) {
  if (!response) return "";

  // Remove thinking tags and their content
  let cleaned = response.replace(/###<think>[\s\S]*?<\/think>###/gi, "");

  // Remove any remaining thinking patterns
  cleaned = cleaned.replace(/<think>[\s\S]*?<\/think>/gi, "");
  cleaned = cleaned.replace(/\*\*\*thinking[\s\S]*?\*\*\*/gi, "");
  cleaned = cleaned.replace(/\[thinking[\s\S]*?\]/gi, "");

  // Remove multiple newlines and extra whitespace
  cleaned = cleaned.replace(/\n\s*\n\s*\n/g, "\n\n");
  cleaned = cleaned.trim();

  // If response is empty after cleaning, provide a fallback
  if (!cleaned) {
    return "I'm here to support you. How can I help you today?";
  }

  return cleaned;
}

/**
 * CareBot Chat Query - AI-powered patient support
 */
router.post("/carebot/query", async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.user_id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        status: "error",
        message: "Message is required",
      });
    }

    // First check if user is a patient
    console.log("CareBot Debug - User ID:", userId);
    console.log("CareBot Debug - User Type:", req.user.user_type);

    if (req.user.user_type !== "Patient") {
      return res.status(403).json({
        status: "error",
        message: "Only patients can access CareBot",
      });
    }

    // Get patient's interests and medical context from database
    const { data: patient, error: patientError } = await supabase
      .from("patients")
      .select(
        `
        taste_keywords,
        medical_conditions,
        users!inner(full_name, user_type)
      `
      )
      .eq("patient_id", userId)
      .single();

    console.log("CareBot Debug - Patient data:", patient);
    console.log("CareBot Debug - Patient error:", patientError);

    if (patientError || !patient) {
      return res.status(404).json({
        status: "error",
        message: "Patient profile not found",
      });
    }

    // Handle case where patient data is returned as array
    const patientData = Array.isArray(patient) ? patient[0] : patient;
    console.log("CareBot Debug - Processed patient data:", patientData);

    // Build personalized system prompt
    const userContext = {
      name: patientData.users?.full_name || req.user.full_name,
      interests: patientData.taste_keywords || [],
      medicalConditions: patientData.medical_conditions || "Not specified",
    };

    const systemPrompt = `You are CareBot, a compassionate AI companion for patients with blood disorders like Thalassemia.

Your role:
- Provide emotional support and encouragement
- Share helpful tips for managing blood disorders
- Answer questions about blood donation and transfusions
- Offer lifestyle advice and coping strategies
- Be empathetic and understanding

User Context: ${JSON.stringify(userContext)}

Guidelines:
- Always be supportive and positive
- Provide accurate medical information but remind users to consult doctors
- Personalize responses based on user's interests when appropriate
- Keep responses concise but caring (max 150 words)
- If asked about emergencies, direct to immediate medical care`;

    console.log("CareBot Debug - User Context:", userContext);
    console.log("CareBot Debug - HF_TOKEN available:", !!process.env.HF_TOKEN);
    console.log(
      "CareBot Debug - HF_MODEL_REPO_ID available:",
      !!process.env.HF_MODEL_REPO_ID
    );

    // Check if Hugging Face integration is available
    if (process.env.HF_TOKEN && process.env.HF_MODEL_REPO_ID) {
      try {
        console.log("CareBot Debug - Attempting OpenAI-compatible API call");
        console.log("CareBot Debug - Model:", process.env.HF_MODEL_REPO_ID);

        // Initialize OpenAI client with Hugging Face router
        const client = new OpenAI({
          baseURL: "https://router.huggingface.co/v1",
          apiKey: process.env.HF_TOKEN,
        });

        // Create chat completion with fine-tuned dataset approach
        const systemPrompt = `You are a supportive companion for a Thalassemia patient in India. Use the user's known interests to provide comfort and suggest positive distractions. Do not give medical advice. 

User Context: {"interests": [${userContext.interests
          .map((i) => `"${i}"`)
          .join(", ")}]}

Guidelines:
- Be empathetic and understanding
- Use their interests to suggest activities or distractions when appropriate
- Keep responses warm and encouraging
- Avoid giving medical advice - always refer to doctors for medical questions
- Use examples from their interests (movies, sports, books, etc.)
- Be supportive about their condition without being overly clinical
- Keep responses conversational and friendly
- Respond naturally to their emotions and concerns

IMPORTANT: Respond directly without showing any internal thinking, reasoning, or <think> tags. Give only the final supportive response.`;

        const chatCompletion = await client.chat.completions.create({
          model: process.env.HF_MODEL_REPO_ID,
          messages: [
            {
              role: "system",
              content: systemPrompt,
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 300,
          temperature: 0.7,
        });

        let botResponse = chatCompletion.choices[0].message.content.trim();

        // Clean up response - remove thinking tags and internal reasoning
        botResponse = cleanAIResponse(botResponse);

        // Check if response seems incomplete (ends abruptly without punctuation)
        if (botResponse && !botResponse.match(/[.!?]$/)) {
          console.log(
            "CareBot Debug - Response seems incomplete, adding completion"
          );
          botResponse += "... I'm here to support you through this journey.";
        }

        console.log("CareBot Debug - Using OpenAI response:", botResponse);

        // Save chat history
        await supabase.from("chathistory").insert({
          user_id: userId,
          prompt: message,
          response: botResponse,
        });

        return res.json({
          status: "success",
          response: botResponse,
          source: "openai-compatible",
        });
      } catch (aiError) {
        console.error("OpenAI-compatible API error:", aiError);
        console.log("CareBot Debug - AI API failed, falling back");
      }
    } else {
      console.log("CareBot Debug - No AI credentials, using fallback");
    }

    // Fallback to rule-based responses
    const fallbackResponse = generateFallbackResponse(message, userContext);
    console.log("CareBot Debug - Using fallback response:", fallbackResponse);

    // Save chat history
    await supabase.from("chathistory").insert({
      user_id: userId,
      prompt: message,
      response: fallbackResponse,
    });

    res.json({
      status: "success",
      response: fallbackResponse,
      source: "fallback",
    });
  } catch (error) {
    console.error("CareBot error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to get response from CareBot",
    });
  }
});

/**
 * Get chat history for patient
 */
router.get("/carebot/history", async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from("chathistory")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      status: "success",
      data: data || [],
    });
  } catch (error) {
    console.error("Chat history error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to fetch chat history",
    });
  }
});

/**
 * Fallback response generator based on fine-tuned dataset patterns
 */
function generateFallbackResponse(message, userContext) {
  const lowerMessage = message.toLowerCase();
  const interests = userContext.interests || [];

  // Feeling down/sad responses
  if (
    lowerMessage.includes("down") ||
    lowerMessage.includes("sad") ||
    lowerMessage.includes("depressed")
  ) {
    if (interests.includes("movies")) {
      return "I'm sorry to hear that. It's completely okay to feel this way. Since you enjoy movies, maybe watching a fun comedy like '3 Idiots' could help lift your spirits? Sometimes a good distraction is the best medicine.";
    }
    if (interests.includes("music")) {
      return "I'm sorry you're feeling sad. It's okay to have those feelings. Maybe putting on some of your favorite music could help? Music has a wonderful way of lifting our spirits.";
    }
    return "I'm sorry you're feeling sad. It's okay to have those feelings. Just know that I'm here to listen if you want to talk about it. Sometimes just sharing what's on your mind can make a difference.";
  }

  // Tired/exhausted responses
  if (
    lowerMessage.includes("tired") ||
    lowerMessage.includes("exhausted") ||
    lowerMessage.includes("hospital")
  ) {
    if (interests.includes("reading") || interests.includes("music")) {
      return "I can only imagine how exhausting that must be. It takes incredible strength to go through that so often. When you get home, perhaps putting on some calming music you enjoy or getting lost in a good book could help you relax and recharge. You're doing great.";
    }
    return "I can only imagine how exhausting that must be. It takes incredible strength to go through that so often. Make sure to rest and take care of yourself. You're doing great.";
  }

  // Bored responses
  if (lowerMessage.includes("bored")) {
    if (interests.includes("video games") || interests.includes("games")) {
      return "Boredom is the worst! How about we fire up a video game? We could try to beat your high score in that racing game or start a new adventure. What are you in the mood to play?";
    }
    if (interests.includes("reading")) {
      return "Let's see! It could be a perfect day to dive into that book you started. There's nothing like getting lost in a good story. Where did you leave off?";
    }
    return "Boredom can be tough! Is there a hobby or activity you enjoy that we could explore together?";
  }

  // Frustrated responses
  if (lowerMessage.includes("frustrated") || lowerMessage.includes("angry")) {
    if (interests.includes("gardening")) {
      return "Frustration is a totally valid feeling. It's okay to be upset. Sometimes doing something calm and focused can help. How about we check on your plants? Seeing something you're nurturing grow can be very rewarding.";
    }
    return "Frustration is a totally valid feeling. It's okay to be upset. Sometimes taking a step back and doing something you enjoy can help process those feelings.";
  }

  // Anxious responses
  if (
    lowerMessage.includes("anxious") ||
    lowerMessage.includes("nervous") ||
    lowerMessage.includes("check-up")
  ) {
    if (interests.includes("music") || interests.includes("guitar")) {
      return "It's completely normal to feel anxious before a check-up. Taking your mind off it for a bit might help. Have you tried learning that new song on your guitar? Focusing on the chords and melody can be a great way to calm your nerves.";
    }
    return "It's completely normal to feel anxious. Taking your mind off it for a bit might help. Is there something you enjoy doing that could help you relax?";
  }

  // Medical questions
  if (
    lowerMessage.includes("medicine") ||
    lowerMessage.includes("medication")
  ) {
    return "It can definitely feel like a lot to manage. Each medicine has a very specific and important job to do to keep you healthy. But for a detailed explanation of what each one does, your doctor is the best person to ask.";
  }

  // Food/diet questions
  if (
    lowerMessage.includes("food") ||
    lowerMessage.includes("eat") ||
    lowerMessage.includes("diet")
  ) {
    if (interests.includes("cooking") || interests.includes("food")) {
      return "That's a great question! While I'm not a doctor, I know that a balanced diet is super important. Since you enjoy cooking, maybe we could find some fun recipes that include healthy ingredients? It's always best to discuss a detailed diet plan with your doctor.";
    }
    return "That's a great question about nutrition! While I can't give specific medical advice, it's always best to discuss diet plans with your doctor who knows your specific needs.";
  }

  // Sports/activity questions
  if (
    lowerMessage.includes("sports") ||
    lowerMessage.includes("play") ||
    lowerMessage.includes("exercise")
  ) {
    return "It's awesome that you want to be active! Many people with Thalassemia can enjoy sports. Non-contact sports like badminton, swimming, or cycling are often great choices. It's really important to talk to your doctor first, as they can give you the best advice based on your health.";
  }

  // Lonely responses
  if (lowerMessage.includes("lonely") || lowerMessage.includes("alone")) {
    if (interests.includes("writing") || interests.includes("stories")) {
      return "That's a tough feeling, and I'm sorry you're experiencing it. Sometimes getting lost in another world can help. Since you enjoy writing stories, maybe we could start a new one? What if we came up with a character who goes on an amazing adventure?";
    }
    return "That's a tough feeling, and I'm sorry you're experiencing it. Remember, you're not alone - I'm here to listen, and there are people who care about you.";
  }

  // Confidence issues
  if (
    lowerMessage.includes("confident") ||
    lowerMessage.includes("self-esteem")
  ) {
    if (interests.includes("fashion") || interests.includes("design")) {
      return "I'm sorry you're feeling that way. Confidence can be tricky. But you have a great eye for fashion and design! Maybe we could try sketching some new outfit ideas or creating a mood board for a new look? Expressing your unique style is a powerful way to boost your confidence.";
    }
    return "I'm sorry you're feeling that way. Confidence can be tricky, but remember that you have unique strengths and talents. What's something you're good at that makes you feel proud?";
  }

  // Greeting responses
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return `Hello! I'm here to support you. How are you feeling today?`;
  }

  // Default supportive response
  return "I'm here to listen and support you. Remember that you're not alone in this journey. Is there anything specific you'd like to talk about?";
}

/**
 * Update patient interests/taste keywords
 */
router.put("/patient/interests", async (req, res) => {
  try {
    const { interests } = req.body;
    const userId = req.user.user_id;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        status: "error",
        message: "Interests must be an array",
      });
    }

    // Validate interests array
    const validInterests = interests
      .filter(
        (interest) => typeof interest === "string" && interest.trim().length > 0
      )
      .map((interest) => interest.trim().toLowerCase());

    if (validInterests.length === 0) {
      return res.status(400).json({
        status: "error",
        message: "At least one valid interest is required",
      });
    }

    // Update patient's taste keywords
    const { error } = await supabase
      .from("patients")
      .update({
        taste_keywords: validInterests,
      })
      .eq("patient_id", userId);

    if (error) {
      console.error("Error updating patient interests:", error);
      return res.status(500).json({
        status: "error",
        message: "Failed to update interests",
      });
    }

    res.json({
      status: "success",
      message: "Interests updated successfully",
      data: { interests: validInterests },
    });
  } catch (error) {
    console.error("Patient interests update error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

/**
 * Get patient interests/taste keywords
 */
router.get("/patient/interests", async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { data: patient, error } = await supabase
      .from("patients")
      .select("taste_keywords")
      .eq("patient_id", userId)
      .single();

    if (error) {
      console.error("Error fetching patient interests:", error);
      return res.status(404).json({
        status: "error",
        message: "Patient not found",
      });
    }

    res.json({
      status: "success",
      data: {
        interests: patient.taste_keywords || [],
      },
    });
  } catch (error) {
    console.error("Patient interests fetch error:", error);
    res.status(500).json({
      status: "error",
      message: "Internal server error",
    });
  }
});

module.exports = router;

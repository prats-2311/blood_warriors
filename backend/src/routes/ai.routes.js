const express = require("express");
const { OpenAI } = require("openai");
const AuthMiddleware = require("../middleware/AuthMiddleware");
const { supabase } = require("../utils/supabase");

const router = express.Router();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

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

        // Create chat completion
        const chatCompletion = await client.chat.completions.create({
          model: process.env.HF_MODEL_REPO_ID,
          messages: [
            {
              role: "system",
              content: `You are CareBot, a compassionate AI companion for patients with blood disorders like Thalassemia. You provide emotional support, encouragement, and helpful information.

Patient Information:
- Name: ${userContext.name}
- Medical Conditions: ${userContext.medicalConditions}
- Interests: ${userContext.interests.join(", ") || "None specified"}

Respond with empathy, understanding, and support. Keep responses warm, encouraging, and appropriate for someone managing a chronic condition.`,
            },
            {
              role: "user",
              content: message,
            },
          ],
          max_tokens: 150,
          temperature: 0.7,
        });

        const botResponse = chatCompletion.choices[0].message.content.trim();
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
 * Fallback response generator for when AI is unavailable
 */
function generateFallbackResponse(message, userContext) {
  const lowerMessage = message.toLowerCase();

  // Greeting responses
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return `Hello ${userContext.name}! I'm CareBot, here to support you on your health journey. How are you feeling today?`;
  }

  // Medical condition responses
  if (lowerMessage.includes("thalassemia") || lowerMessage.includes("anemia")) {
    return `I understand managing ${userContext.medicalConditions} can be challenging. Remember to take your medications as prescribed, stay hydrated, and don't hesitate to reach out to your healthcare team. You're doing great by staying informed!`;
  }

  // Donation/transfusion responses
  if (lowerMessage.includes("transfusion") || lowerMessage.includes("blood")) {
    return `Blood transfusions are an important part of treatment for many patients. It's normal to have questions or concerns. Always discuss any worries with your medical team - they're there to help you feel comfortable and safe.`;
  }

  // Emotional support responses
  if (
    lowerMessage.includes("scared") ||
    lowerMessage.includes("worried") ||
    lowerMessage.includes("anxious")
  ) {
    return `It's completely normal to feel worried sometimes. You're being so brave by managing your health condition. Remember that you have a whole support system - your doctors, family, and community. Take things one day at a time. 💙`;
  }

  // Default supportive response
  return `Thank you for sharing that with me, ${userContext.name}. I'm here to listen and support you. Remember that managing a blood disorder is a journey, and you don't have to face it alone. Is there anything specific you'd like to talk about today?`;
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

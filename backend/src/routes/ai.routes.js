const express = require('express');
const AuthMiddleware = require('../middleware/AuthMiddleware');
const { supabase } = require('../utils/supabase');

const router = express.Router();
const authMiddleware = new AuthMiddleware();

// All routes require authentication
router.use(authMiddleware.authenticate);

/**
 * CareBot Chat Query - AI-powered patient support
 */
router.post('/carebot/query', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.user_id;

    if (!message || message.trim().length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Message is required'
      });
    }

    // Get patient's interests and medical context from database
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select(`
        taste_keywords,
        medical_conditions,
        users!inner(full_name, user_type)
      `)
      .eq('patient_id', userId)
      .single();

    if (patientError || !patient) {
      return res.status(403).json({
        status: 'error',
        message: 'Only patients can access CareBot'
      });
    }

    // Build personalized system prompt
    const userContext = {
      name: patient.users.full_name,
      interests: patient.taste_keywords || [],
      medicalConditions: patient.medical_conditions || 'Not specified'
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

    // Check if Hugging Face integration is available
    if (process.env.HF_TOKEN && process.env.HF_MODEL_REPO_ID) {
      try {
        // Call Hugging Face model
        const response = await fetch(
          `https://api-inference.huggingface.co/models/${process.env.HF_MODEL_REPO_ID}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.HF_TOKEN}`
            },
            body: JSON.stringify({
              inputs: `<|system|>
You are CareBot, a supportive companion for a Thalassemia patient. Use the user's known interests to provide comfort and suggest positive distractions. Do not give medical advice. User Context: ${JSON.stringify(userContext)}</s>
<|user|>
${message}</s>
<|assistant|>`,
              parameters: { 
                max_new_tokens: 150,
                return_full_text: false,
                temperature: 0.7,
                do_sample: true
              }
            })
          }
        );

        if (response.ok) {
          const result = await response.json();
          const botResponse = result[0].generated_text.trim() ||
                             'I understand you need support. Please know that you\'re not alone in this journey.';

          // Save chat history
          await supabase.from('chathistory').insert({
            user_id: userId,
            prompt: message,
            response: botResponse
          });

          return res.json({
            status: 'success',
            response: botResponse,
            source: 'huggingface'
          });
        }
      } catch (hfError) {
        console.error('Hugging Face API error:', hfError);
      }
    }

    // Fallback to rule-based responses
    const fallbackResponse = generateFallbackResponse(message, userContext);

    // Save chat history
    await supabase.from('chathistory').insert({
      user_id: userId,
      prompt: message,
      response: fallbackResponse
    });

    res.json({
      status: 'success',
      response: fallbackResponse,
      source: 'fallback'
    });

  } catch (error) {
    console.error('CareBot error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to get response from CareBot'
    });
  }
});

/**
 * Get chat history for patient
 */
router.get('/carebot/history', async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { limit = 50, offset = 0 } = req.query;

    const { data, error } = await supabase
      .from('chathistory')
      .select('*')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    res.json({
      status: 'success',
      data: data || []
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Failed to fetch chat history'
    });
  }
});

/**
 * Fallback response generator for when AI is unavailable
 */
function generateFallbackResponse(message, userContext) {
  const lowerMessage = message.toLowerCase();

  // Greeting responses
  if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
    return `Hello ${userContext.name}! I'm CareBot, here to support you on your health journey. How are you feeling today?`;
  }

  // Medical condition responses
  if (lowerMessage.includes('thalassemia') || lowerMessage.includes('anemia')) {
    return `I understand managing ${userContext.medicalConditions} can be challenging. Remember to take your medications as prescribed, stay hydrated, and don't hesitate to reach out to your healthcare team. You're doing great by staying informed!`;
  }

  // Donation/transfusion responses
  if (lowerMessage.includes('transfusion') || lowerMessage.includes('blood')) {
    return `Blood transfusions are an important part of treatment for many patients. It's normal to have questions or concerns. Always discuss any worries with your medical team - they're there to help you feel comfortable and safe.`;
  }

  // Emotional support responses
  if (lowerMessage.includes('scared') || lowerMessage.includes('worried') || lowerMessage.includes('anxious')) {
    return `It's completely normal to feel worried sometimes. You're being so brave by managing your health condition. Remember that you have a whole support system - your doctors, family, and community. Take things one day at a time. 💙`;
  }

  // Default supportive response
  return `Thank you for sharing that with me, ${userContext.name}. I'm here to listen and support you. Remember that managing a blood disorder is a journey, and you don't have to face it alone. Is there anything specific you'd like to talk about today?`;
}

/**
 * Update patient interests/taste keywords
 */
router.put('/patient/interests', async (req, res) => {
  try {
    const { interests } = req.body;
    const userId = req.user.user_id;

    if (!Array.isArray(interests)) {
      return res.status(400).json({
        status: 'error',
        message: 'Interests must be an array'
      });
    }

    // Validate interests array
    const validInterests = interests.filter(interest =>
      typeof interest === 'string' && interest.trim().length > 0
    ).map(interest => interest.trim().toLowerCase());

    if (validInterests.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'At least one valid interest is required'
      });
    }

    // Update patient's taste keywords
    const { error } = await supabase
      .from('patients')
      .update({
        taste_keywords: validInterests
      })
      .eq('patient_id', userId);

    if (error) {
      console.error('Error updating patient interests:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to update interests'
      });
    }

    res.json({
      status: 'success',
      message: 'Interests updated successfully',
      data: { interests: validInterests }
    });
  } catch (error) {
    console.error('Patient interests update error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

/**
 * Get patient interests/taste keywords
 */
router.get('/patient/interests', async (req, res) => {
  try {
    const userId = req.user.user_id;

    const { data: patient, error } = await supabase
      .from('patients')
      .select('taste_keywords')
      .eq('patient_id', userId)
      .single();

    if (error) {
      console.error('Error fetching patient interests:', error);
      return res.status(404).json({
        status: 'error',
        message: 'Patient not found'
      });
    }

    res.json({
      status: 'success',
      data: {
        interests: patient.taste_keywords || []
      }
    });
  } catch (error) {
    console.error('Patient interests fetch error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

module.exports = router;
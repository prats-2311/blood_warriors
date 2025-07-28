const { supabase } = require('../utils/supabase');

/**
 * Mock LLM function (to be replaced with actual LLM integration)
 */
const queryLLM = async (prompt, context = []) => {
  // This is a placeholder for the actual LLM integration
  // In a real implementation, you would call your LLM API here
  
  // For now, we'll return a mock response based on the prompt
  let response = '';
  
  if (prompt.toLowerCase().includes('thalassemia')) {
    response = 'Thalassemia is an inherited blood disorder characterized by less hemoglobin and fewer red blood cells than normal. Symptoms include fatigue, weakness, pale skin, and slow growth. Treatment often involves regular blood transfusions and managing iron levels.';
  } else if (prompt.toLowerCase().includes('blood donation')) {
    response = 'Blood donation is a safe and simple process that typically takes about 10-15 minutes. Donors should be in good health, weigh at least 50 kg, and be between 18-65 years old. After donation, it\'s important to rest, stay hydrated, and avoid strenuous activities for 24 hours.';
  } else if (prompt.toLowerCase().includes('diet') || prompt.toLowerCase().includes('food')) {
    response = 'For Thalassemia patients, a balanced diet is important. Foods rich in iron should be consumed in moderation to avoid iron overload. Focus on calcium-rich foods, vitamin D, and antioxidants. Consult with your healthcare provider for personalized dietary advice.';
  } else {
    response = `I understand you're asking about "${prompt}". As an AI assistant for Thalassemia care, I can provide general information about Thalassemia, blood donation, and related health topics. For specific medical advice, please consult your healthcare provider.`;
  }
  
  return {
    response
  };
};

/**
 * Query the CareBot
 */
const queryCareBot = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { prompt } = req.body;

    // Validate required fields
    if (!prompt) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Prompt is required' 
      });
    }

    // Get user's chat history for context
    const { data: history, error: historyError } = await supabase
      .from('chathistory')
      .select('prompt, response')
      .eq('user_id', userId)
      .order('timestamp', { ascending: false })
      .limit(5);
      
    if (historyError) {
      console.error('Error fetching chat history:', historyError);
    }

    // Query the LLM with the prompt and context
    const llmResponse = await queryLLM(prompt, history || []);
    
    // Save the interaction to chat history
    const { data: chatRecord, error: chatError } = await supabase
      .from('chathistory')
      .insert({
        user_id: userId,
        prompt,
        response: llmResponse.response
      })
      .select()
      .single();
      
    if (chatError) {
      console.error('Error saving chat history:', chatError);
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        response: llmResponse.response,
        chat_id: chatRecord?.chat_id
      }
    });
  } catch (error) {
    console.error('CareBot query error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to query CareBot' 
    });
  }
};

module.exports = {
  queryCareBot
};
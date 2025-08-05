


# Guide: Integrating Your Fine-Tuned CareBot

Congratulations on successfully training your model! This guide will walk you through the final steps to integrate and use your custom AI chatbot in your Blood Warriors application.

### **The Integration Architecture**

The integration follows a simple and secure pattern:

1.  Your **React Frontend** sends the user's message to your own backend.
    
2.  Your **Node.js Backend** receives the message, securely adds the patient's interests and the system prompt, and then calls the Hugging Face API.
    
3.  The **Hugging Face API** runs your fine-tuned model and returns the personalized response.
    
4.  Your **Backend** sends this response back to your frontend to be displayed.
    

## Step 1: Update Your Backend Environment

In your `backend` project folder, open the `.env` file and make sure the following variables are set correctly with the details of your newly trained GPT-2 model.

**`backend/.env`**

```
# Supabase
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# Qloo API (for the donor perks feature)
QLOO_API_KEY=CDH-lGV5SKGfJ1GkdfqFXGVa5znqc90unnwRVWQsMq0
QLOO_API_URL=https://hackathon.api.qloo.com

HF_TOKEN=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

# The repository ID of the GPT-2 model you just trained
HF_MODEL_REPO_ID=prats2311/carebot-finetune-gpt2
# Backend Port
PORT=3001

```

## Step 2: Implement the Backend API Endpoint

This is the "brain" of the integration. This code will live in your `backend/index.js` file. It creates an API endpoint that the frontend can call.

**`backend/index.js`**

```
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// --- The CareBot API Endpoint ---
app.post('/api/chat/query', async (req, res) => {
    const { userId, message } = req.body;

    if (!userId || !message) {
        return res.status(400).json({ error: 'userId and message are required' });
    }

    try {
        // 1. Get the patient's interests from Supabase to add context
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .select('taste_keywords')
            .eq('patient_id', userId)
            .single();

        if (patientError) throw patientError;

        // 2. Build the detailed, formatted prompt for the AI
        const formatted_prompt = `<|system|>
You are a supportive companion for a Thalassemia patient in India. Use the user's known interests to provide comfort and suggest positive distractions. Do not give medical advice. User Context: ${JSON.stringify({ interests: patient.taste_keywords || [] })}</s>
<|user|>
${message}</s>
<|assistant|>
`;

        // 3. Call your fine-tuned model on the Hugging Face Inference API
        const response = await fetch(
            `https://api-inference.huggingface.co/models/${process.env.HF_MODEL_REPO_ID}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${process.env.HF_TOKEN}`
                },
                body: JSON.stringify({
                    inputs: formatted_prompt,
                    parameters: { 
                        max_new_tokens: 150, // Control the length of the response
                        return_full_text: false, // Only return the AI's response, not the whole prompt
                    }
                })
            }
        );

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Hugging Face API Error: ${response.status} ${errorBody}`);
        }

        const result = await response.json();
        const botResponse = result[0].generated_text.trim();
        
        // 4. Log the conversation to your database
        await supabase.from('chathistory').insert([
            { user_id: userId, prompt: message, response: botResponse }
        ]);

        // 5. Send the response back to the frontend
        res.json({ response: botResponse });

    } catch (err) {
        console.error("Chatbot Error:", err);
        res.status(500).json({ error: "Failed to get response from CareBot" });
    }
});


const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

```

## Step 3: Connect Your React Frontend

Now, your `CareBot.js` component in your React application can call this backend endpoint.

**`frontend/src/components/CareBot.js`**

```
import React, { useState } from 'react';

// This is a simplified example component.
// You will need to get the `userId` from your app's authentication context.

const CareBot = ({ userId }) => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim() || !userId) return;

        const userMessage = { role: 'user', content: input };
        setMessages(prev => [...prev, userMessage]);
        const currentInput = input;
        setInput('');
        setIsLoading(true);

        try {
            // Call your backend, not Hugging Face directly
            const response = await fetch('http://localhost:3001/api/chat/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: userId, message: currentInput })
            });

            if (!response.ok) {
                throw new Error("Failed to get response from server.");
            }

            const data = await response.json();
            const botMessage = { role: 'assistant', content: data.response };
            setMessages(prev => [...prev, botMessage]);

        } catch (error) {
            console.error("Error fetching chatbot response:", error);
            const errorMessage = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="chat-container">
            <div className="chat-window">
                {messages.map((msg, index) => (
                    <div key={index} className={`message ${msg.role}`}>
                        <p>{msg.content}</p>
                    </div>
                ))}
            </div>
            <div className="chat-input-area">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Type your message..."
                    disabled={isLoading}
                />
                <button onClick={handleSend} disabled={isLoading}>
                    {isLoading ? 'Sending...' : 'Send'}
                </button>
            </div>
        </div>
    );
};

export default CareBot;

```

### **How to Test**

1.  Run your backend server (`npm start` in the `backend` folder).
    
2.  Run your frontend server (`npm start` in the `frontend` folder).
    
3.  Log in to your application as a patient who has interests defined in your Supabase `patients` table.
    
4.  Navigate to the CareBot page and start chatting!
    

You have now fully integrated your custom-trained AI into your application.
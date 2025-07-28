import React, { useState, useEffect, useRef } from "react";
import { aiService } from "../services/aiService";

const CareBot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "bot",
      content:
        "Hello! I'm CareBot, your AI assistant for Thalassemia care and blood donation support. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputMessage.trim() || loading) return;

    const userMessage = {
      id: Date.now(),
      type: "user",
      content: inputMessage.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setLoading(true);

    try {
      const response = await aiService.queryCareBot(userMessage.content);

      const botMessage = {
        id: Date.now() + 1,
        type: "bot",
        content: response.data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          "I'm sorry, I'm having trouble responding right now. Please try again later or consult with your healthcare provider for urgent medical questions.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  const quickQuestions = [
    "What is Thalassemia?",
    "How often should I donate blood?",
    "What should I eat before blood donation?",
    "How can I manage Thalassemia symptoms?",
    "What are the side effects of blood transfusion?",
    "How to maintain iron levels?",
  ];

  return (
    <div className="carebot-page">
      <div className="card">
        <h2>🤖 CareBot - Your AI Health Assistant</h2>
        <p>
          Ask me anything about Thalassemia care, blood donation, or general
          health topics.
        </p>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`chat-message ${message.type}`}>
              <div className="message-content">{message.content}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString()}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-message bot">
              <div className="message-content">
                <div className="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chat-input">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || !inputMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>

      <div className="card">
        <h3>Quick Questions</h3>
        <div className="quick-questions">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="btn btn-secondary quick-question-btn"
              onClick={() => handleQuickQuestion(question)}
              disabled={loading}
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>⚠️ Important Disclaimer</h3>
        <p>
          CareBot provides general information and support. For medical
          emergencies or specific medical advice, please consult with your
          healthcare provider immediately. This AI assistant is not a substitute
          for professional medical care.
        </p>
      </div>
    </div>
  );
};

export default CareBot;

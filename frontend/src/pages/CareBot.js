import React, { useState, useEffect, useRef } from "react";
import { aiService } from "../services/aiService";
import { useProfile } from "../hooks/useAuth";
import InterestSettings from "../components/InterestSettings";
import "./CareBot.css";

const CareBot = () => {
  const { profile } = useProfile();
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);

  // Load chat history when profile is available
  useEffect(() => {
    if (profile && profile.user_id) {
      // Add a small delay to ensure authentication is fully set up
      const timer = setTimeout(() => {
        loadChatHistory();
      }, 100);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      const response = await aiService.getChatHistory(20);

      if (response.status === 'success' && response.data) {
        // Convert chat history to message format
        const historyMessages = [];

        response.data.reverse().forEach((chat) => {
          historyMessages.push({
            id: `user-${chat.chat_id}`,
            type: "user",
            content: chat.prompt,
            timestamp: new Date(chat.timestamp),
          });
          historyMessages.push({
            id: `bot-${chat.chat_id}`,
            type: "bot",
            content: chat.response,
            timestamp: new Date(chat.timestamp),
          });
        });

        setMessages(historyMessages);
      }

      // Add welcome message if no history
      if (!response.data || response.data.length === 0) {
        setMessages([{
          id: 'welcome',
          type: "bot",
          content: `Hello ${profile?.full_name || 'there'}! I'm CareBot, your AI companion for blood disorder support. I'm here to provide emotional support, answer questions, and help you on your health journey. How are you feeling today?`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
      // Don't show error for authentication issues, just start fresh
      if (error.response?.status === 401) {
        console.log("Authentication issue, starting fresh chat session");
      } else {
        setError("Failed to load chat history");
      }
      // Show welcome message on error
      setMessages([{
        id: 'welcome',
        type: "bot",
        content: `Hello! I'm CareBot, your AI companion. I'm here to support you. How can I help today?`,
        timestamp: new Date(),
      }]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-scroll when loading state changes
    if (!loading) {
      setTimeout(scrollToBottom, 100);
    }
  }, [loading]);

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

      if (response.status === 'success') {
        const botMessage = {
          id: Date.now() + 1,
          type: "bot",
          content: response.response,
          timestamp: new Date(),
          source: response.source || 'ai'
        };

        setMessages((prev) => [...prev, botMessage]);
      } else {
        throw new Error(response.message || 'Failed to get response');
      }
    } catch (error) {
      console.error("CareBot error:", error);
      const errorMessage = {
        id: Date.now() + 1,
        type: "bot",
        content:
          "I'm sorry, I'm having trouble responding right now. Please try again later or consult with your healthcare provider for urgent medical questions.",
        timestamp: new Date(),
        isError: true
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

  // Show loading while profile is being fetched
  if (!profile) {
    return (
      <div className="carebot-page">
        <div className="card">
          <h2>🤖 CareBot - Your AI Health Assistant</h2>
          <div className="loading-history">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading while profile is being fetched
  if (!profile) {
    return (
      <div className="carebot-page">
        <div className="card">
          <h2>🤖 CareBot - Your AI Health Assistant</h2>
          <div className="loading-history">
            <div className="spinner"></div>
            <p>Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="carebot-page">
      <div className="card">
        <div className="card__header">
          <h2>🤖 CareBot - Your AI Health Assistant</h2>
          <p>
            Your personalized AI companion for blood disorder support and health guidance.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
            onClick={() => setActiveTab("chat")}
          >
            💬 Chat
          </button>
          <button
            className={`tab-btn ${activeTab === "interests" ? "active" : ""}`}
            onClick={() => setActiveTab("interests")}
          >
            🎯 My Interests
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === "chat" && (
        <div className="card">
          <div className="chat-container">
            <div className="chat-messages">
          {loadingHistory ? (
            <div className="loading-history">
              <div className="spinner"></div>
              <p>Loading your chat history...</p>
            </div>
          ) : (
            <>
              {error && (
                <div className="error-message">
                  <p>⚠️ {error}</p>
                </div>
              )}
              {messages.map((message) => (
                <div key={message.id} className={`chat-message ${message.type} ${message.isError ? 'error' : ''}`}>
                  <div className="message-content">{message.content}</div>
                  <div className="message-time">
                    {message.timestamp.toLocaleTimeString()}
                    {message.source && (
                      <span className="message-source"> • {message.source}</span>
                    )}
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
                  <div className="message-time">CareBot is thinking...</div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </>
          )}
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
        </div>
      )}

      {activeTab === "chat" && (
        <div className="card">
          <div className="card__header">
            <h3>💡 Quick Questions</h3>
          </div>
          <div className="card__body">
            <div className="quick-questions">
              {quickQuestions.map((question, index) => (
                <button
                  key={index}
                  className="quick-question-btn"
                  onClick={() => handleQuickQuestion(question)}
                  disabled={loading}
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "interests" && (
        <InterestSettings />
      )}

      {/* Disclaimer - shown on all tabs */}
      <div className="card">
        <div className="card__header">
          <h3>⚠️ Important Disclaimer</h3>
        </div>
        <div className="card__body">
          <p>
            CareBot provides general information and support. For medical
            emergencies or specific medical advice, please consult with your
            healthcare provider immediately. This AI assistant is not a substitute
            for professional medical care.
          </p>
        </div>
      </div>
    </div>
  );
};

export default CareBot;

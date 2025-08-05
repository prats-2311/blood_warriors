import React, { useState, useEffect, useRef } from "react";
import { aiService } from "../services/aiService";
import { useProfile } from "../hooks/useAuth";
import "./FloatingCareBot.css";

const FloatingCareBot = () => {
  const { profile } = useProfile();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Load chat history when profile is available and chat is opened
  useEffect(() => {
    if (isOpen && profile && profile.user_id && loadingHistory) {
      loadChatHistory();
    }
  }, [isOpen, profile]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadChatHistory = async () => {
    try {
      setLoadingHistory(true);
      setError(null);
      const response = await aiService.getChatHistory(5); // Load fewer messages for the floating bot

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
          content: `Hello ${profile?.full_name || 'there'}! I'm CareBot, your AI companion. How can I help you today?`,
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      console.error("Error loading chat history:", error);
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
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
          "I'm sorry, I'm having trouble responding right now. Please try again later.",
        timestamp: new Date(),
        isError: true
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const quickQuestions = [
    "What is Thalassemia?",
    "How often should I donate blood?",
    "What should I eat before donation?",
  ];

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className={`floating-carebot ${isOpen ? 'open' : ''}`}>
      {/* Chat toggle button */}
      <button 
        className="carebot-toggle" 
        onClick={toggleChat}
        aria-label={isOpen ? "Close CareBot" : "Open CareBot"}
      >
        {isOpen ? '✕' : '🤖'}
        {!isOpen && <span className="toggle-label">CareBot</span>}
      </button>

      {/* Chat container */}
      {isOpen && (
        <div className="floating-chat-container" ref={chatContainerRef}>
          <div className="floating-chat-header">
            <h3>🤖 CareBot</h3>
            <p>Your AI health assistant</p>
          </div>

          <div className="floating-chat-messages">
            {loadingHistory ? (
              <div className="loading-history">
                <div className="spinner"></div>
                <p>Loading...</p>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <div key={message.id} className={`chat-message ${message.type} ${message.isError ? 'error' : ''}`}>
                    <div className="message-content">{message.content}</div>
                    <div className="message-time">
                      {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
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
              </>
            )}
          </div>

          <div className="floating-quick-questions">
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

          <form onSubmit={handleSendMessage} className="floating-chat-input">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !inputMessage.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </form>

          <div className="floating-chat-footer">
            <a href="/carebot" className="full-version-link">
              Open full CareBot
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default FloatingCareBot;
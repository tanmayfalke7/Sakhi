import React, { useEffect, useRef, useState } from "react";
import "./ChatWidget.css";

const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:5000/api/chat";

const normalizeChatResponse = (data) => {
  const responseText =
    typeof data?.response === "string"
      ? data.response
      : typeof data?.detail === "string"
        ? data.detail
        : typeof data?.message === "string"
          ? data.message
          : "I could not understand that response properly. Please try again.";

  return {
    text: responseText,
    image: typeof data?.image_url === "string" && data.image_url ? data.image_url : null,
    graphData: Array.isArray(data?.graph_data) ? data.graph_data : [],
    actions: Array.isArray(data?.suggested_actions) ? data.suggested_actions : [],
  };
};

const MealPlanPreview = ({ graphData }) => {
  const plan = graphData.find((item) => item?.plan_name && Array.isArray(item?.daily_plan));
  if (!plan) return null;

  return (
    <div className="meal-plan-preview">
      <strong>{plan.plan_name}</strong>
      {plan.daily_plan
        .slice()
        .sort((a, b) => (a.day || 0) - (b.day || 0))
        .slice(0, 7)
        .map((day) => (
          <div className="meal-plan-day" key={day.day}>
            <span>Day {day.day}</span>
            <small>
              {(day.meals || [])
                .map((meal) => meal.name || meal.meal_name || meal.type)
                .filter(Boolean)
                .join(", ")}
            </small>
          </div>
        ))}
    </div>
  );
};

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hi! I am Sakhi. How can I help you support your body today?", sender: "sakhi" },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const userText = input.trim();
    if (!userText || isLoading) return;

    setInput("");
    setMessages((prev) => [...prev, { text: userText, sender: "user" }]);
    setIsLoading(true);

    try {
      const response = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText }),
      });

      const data = await response.json().catch(() => ({}));
      const normalized = normalizeChatResponse(data);

      if (!response.ok) {
        throw new Error(normalized.text);
      }

      setMessages((prev) => [
        ...prev,
        {
          ...normalized,
          sender: "sakhi",
        },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: error.message || "Oops! I am having trouble connecting right now. Please try again later.",
          sender: "sakhi",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)} aria-label="Open Sakhi chat">
          Chat
        </button>
      )}

      {isOpen && (
        <div className="chat-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-modal" onClick={(event) => event.stopPropagation()}>
            <div className="chat-header">
              <span>Sakhi AI</span>
              <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close Sakhi chat">
                x
              </button>
            </div>

            <div className="chat-body">
              {messages.map((msg, index) => (
                <div key={`${msg.sender}-${index}`} className={`message ${msg.sender}`}>
                  <span className="message-text">{msg.text}</span>
                  {msg.image && <img src={msg.image} alt="Sakhi suggestion" className="sakhi-image" />}
                  <MealPlanPreview graphData={msg.graphData || []} />
                </div>
              ))}
              {isLoading && <div className="message sakhi">Sakhi is typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-footer">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && handleSend()}
                placeholder="Ask about symptoms, diet, meal plans..."
                disabled={isLoading}
              />
              <button onClick={handleSend} disabled={isLoading || !input.trim()}>
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;

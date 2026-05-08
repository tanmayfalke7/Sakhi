import React, { useState, useRef, useEffect } from "react";
import "./ChatWidget.css";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { text: "Hi! I am Sakhi. How can I help you support your body today?", sender: "sakhi" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input;
    setInput("");
    setMessages((prev) => [...prev, { text: userText, sender: "user" }]);
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/api/v1/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });

      const data = await response.json();
      const replyText =
        typeof data.response === "string"
          ? data.response
          : typeof data.detail === "string"
            ? data.detail
            : "I could not understand that response properly. Please try again.";

      let formattedText = replyText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
      formattedText = formattedText.replace(/\n/g, "<br/>");

      setMessages((prev) => [
        ...prev,
        {
          text: formattedText,
          image: typeof data.image_url === "string" ? data.image_url : null,
          sender: "sakhi"
        }
      ]);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Oops! I'm having trouble connecting right now. Please try again later.",
          sender: "sakhi"
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {!isOpen && (
        <button className="chat-fab" onClick={() => setIsOpen(true)}>
          Chat
        </button>
      )}

      {isOpen && (
        <div className="chat-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <span>Sakhi AI</span>
              <button className="close-btn" onClick={() => setIsOpen(false)}>x</button>
            </div>

            <div className="chat-body">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.sender}`}>
                  <span dangerouslySetInnerHTML={{ __html: msg.text }}></span>
                  {msg.image && (
                    <img src={msg.image} alt="Sakhi suggestion" className="sakhi-image" />
                  )}
                </div>
              ))}
              {isLoading && <div className="message sakhi">Sakhi is typing...</div>}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-footer">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask about symptoms, diet, etc..."
              />
              <button onClick={handleSend} disabled={isLoading}>
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

import React, { useState, useRef, useEffect } from 'react';
import './ChatWidget.css';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState([
        { text: "Hi gorgeous! I am Sakhi. How can I help you support your body today? ✨", sender: 'sakhi' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // Auto-scroll to bottom when new message arrives
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userText = input;
        setInput(''); // Clear input fast
        
        // Add User Message
        setMessages(prev => [...prev, { text: userText, sender: 'user' }]);
        setIsLoading(true);

        try {
            // Node.js Backend API Call
            // NOTE: Make sure this URL matches your Node.js server port!
            const response = await fetch('http://localhost:8000/api/v1/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText })
            });

            const data = await response.json();

            // Format bold text (**text**) to HTML <strong> tags
            let formattedText = data.response.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            formattedText = formattedText.replace(/\n/g, '<br/>');

            // Add Sakhi Message
            setMessages(prev => [...prev, { 
                text: formattedText, 
                image: data.image_url, 
                sender: 'sakhi' 
            }]);

        } catch (error) {
            console.error("Chat Error:", error);
            setMessages(prev => [...prev, { 
                text: "Oops! I'm having trouble connecting to my brain right now. Please try again later.", 
                sender: 'sakhi' 
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* The Floating Button */}
            {!isOpen && (
                <button className="chat-fab" onClick={() => setIsOpen(true)}>
                    💬
                </button>
            )}

            {/* The Modal Overlay (Blurred Background) */}
            {isOpen && (
                <div className="chat-overlay" onClick={() => setIsOpen(false)}>
                    
                    {/* The Chat Window (e.stopPropagation prevents clicks inside from closing the modal) */}
                    <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
                        
                        <div className="chat-header">
                            <span>Sakhi AI ✨</span>
                            <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                        </div>

                        <div className="chat-body">
                            {messages.map((msg, index) => (
                                <div key={index} className={`message ${msg.sender}`}>
                                    {/* Render HTML for bold/line breaks */}
                                    <span dangerouslySetInnerHTML={{ __html: msg.text }}></span>
                                    
                                    {/* Render Image if Sakhi sent one */}
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
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
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
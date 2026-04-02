import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../../services/apiClient.js';
import './AIAssistantModal.css';

export default function AIAssistantModal() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'ai', text: 'Hi! I am the MealMate AI Assistant. What would you like to cook today?' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, isOpen]);

    async function handleSend(e) {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        try {
            const data = await apiClient.post('/ai/chat', { message: userMsg, history: messages });
            setMessages(prev => [...prev, { role: 'ai', text: data.reply }]);
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I am having trouble connecting to my brain right now.' }]);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="ai-assistant-wrapper">
            {isOpen && (
                <div className="ai-assistant-window">
                    <div className="ai-header">
                        <h3>MealMate AI</h3>
                        <button onClick={() => setIsOpen(false)}>×</button>
                    </div>
                    <div className="ai-messages">
                        {messages.map((m, i) => (
                            <div key={i} className={`ai-message ${m.role}`}>
                                <div className="message-bubble">{m.text}</div>
                            </div>
                        ))}
                        {loading && <div className="ai-message ai"><div className="message-bubble typing">...</div></div>}
                        <div ref={messagesEndRef} />
                    </div>
                    <form className="ai-input-form" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            placeholder="Ask me for recipes..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>Send</button>
                    </form>
                </div>
            )}
            
            <button 
                className="ai-fab-button" 
                onClick={() => setIsOpen(!isOpen)}
                title="Ask AI Assistant"
            >
                {isOpen ? '✕' : '✨'}
            </button>
        </div>
    );
}

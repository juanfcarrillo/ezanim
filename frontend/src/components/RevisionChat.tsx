import React, { useState, useRef, useEffect } from 'react';
import './RevisionChat.css';

interface Message {
  id: string;
  role: 'user' | 'system';
  content: string;
}

interface RevisionChatProps {
  onRefine: (critique: string) => Promise<void>;
  isRefining: boolean;
}

export const RevisionChat: React.FC<RevisionChatProps> = ({ onRefine, isRefining }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'system',
      content: 'Hello! I have generated your video. If you want to make any changes, just let me know here.',
    },
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isRefining) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Add a temporary "thinking" message
    const thinkingId = 'thinking-' + Date.now();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: 'system', content: 'Refining video based on your feedback...' },
    ]);

    try {
      await onRefine(userMessage.content);
      
      // Update the thinking message to success
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingId
            ? { ...msg, content: 'Video updated! Let me know if you need anything else.' }
            : msg
        )
      );
    } catch (error) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingId
            ? { ...msg, content: 'Sorry, something went wrong while refining the video.' }
            : msg
        )
      );
    }
  };

  return (
    <div className="revision-chat">
      <div className="chat-header">
        Revision Assistant
      </div>
      <div className="chat-messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.role}`}>
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form className="chat-input-area" onSubmit={handleSubmit}>
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your feedback here..."
          rows={2}
          disabled={isRefining}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <button type="submit" className="send-button" disabled={isRefining || !input.trim()}>
          {isRefining ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
};

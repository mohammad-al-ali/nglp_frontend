/**
 * Message List Component
 * Displays chat message history with auto-scroll to latest message
 */

import { useEffect, useRef } from 'react';
import './MessageList.css';

export default function MessageList({ messages }) {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!messages || messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <div className="message-list__empty-icon">💬</div>
        <p>Ask your AI tutor a question</p>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((msg, index) => (
        <div
          key={index}
          className={`message ${msg.type === 'user' ? 'message--user' : 'message--ai'}`}
        >
          <div className="message__icon">
            {msg.type === 'user' ? '👤' : '🤖'}
          </div>
          <div className="message__content">
            <p className="message__text">{msg.text}</p>
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}

/**
 * Chat Input Component
 * Input area for typing messages with send button
 */

import { useState } from 'react';
import './ChatInput.css';

export default function ChatInput({ onSendMessage, isLoading, isDisabled }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !isDisabled) {
      onSendMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e) => {
    // Send on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSubmit(e);
    }
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="text"
        className="chat-input__field"
        placeholder={isDisabled ? 'Select a lesson to chat' : 'Ask your AI tutor...'}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={isLoading || isDisabled}
        maxLength={500}
      />
      <button
        type="submit"
        className="chat-input__button"
        disabled={!input.trim() || isLoading || isDisabled}
        title="Send (Ctrl+Enter)"
      >
        {isLoading ? '⏳' : '📤'}
      </button>
    </form>
  );
}

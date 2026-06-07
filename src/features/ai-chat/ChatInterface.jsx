/**
 * Chat Interface Component
 * Main chat interface combining MessageList and ChatInput
 * Manages message history and AI responses
 */

import { useState, useCallback } from 'react';
import MessageList from './MessageList';
import ChatInput from './ChatInput';
import useFetchAIResponse from '../../hooks/useFetchAIResponse';
import './ChatInterface.css';

export default function ChatInterface({ currentLessonId }) {
  const [messages, setMessages] = useState([]);
  const { sendMessage, loading: aiLoading, error: aiError } = useFetchAIResponse();

  const handleSendMessage = useCallback(
    async (userMessage) => {
      if (!currentLessonId) return;

      // Add user message to chat
      setMessages((prev) => [...prev, { type: 'user', text: userMessage }]);

      // Get AI response
      const response = await sendMessage(currentLessonId, userMessage);

      if (response) {
        // Add AI response to chat
        setMessages((prev) => [
          ...prev,
          {
            type: 'ai',
            text: response.reply || response.message || 'Unable to process response',
          },
        ]);
      } else if (aiError) {
        // Add error message
        setMessages((prev) => [
          ...prev,
          {
            type: 'ai',
            text: `Error: ${aiError}`,
          },
        ]);
      }
    },
    [currentLessonId, sendMessage, aiError]
  );

  return (
    <div className="chat-interface">
      <div className="chat-interface__header">
        <h3 className="chat-interface__title">🤖 AI Tutor</h3>
        <p className="chat-interface__subtitle">
          {currentLessonId ? `Lesson #${currentLessonId}` : 'Select a lesson'}
        </p>
      </div>

      <MessageList messages={messages} />

      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={aiLoading}
        isDisabled={!currentLessonId}
      />
    </div>
  );
}

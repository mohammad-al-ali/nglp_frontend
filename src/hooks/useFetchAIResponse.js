import { useState, useCallback } from 'react';
import api, { getCurrentUserId } from '../services/api';

/**
 * Custom Hook: useFetchAIResponse
 * Handles sending message to AI and getting response with loading/error states
 */
export const useFetchAIResponse = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (lessonId, message) => {
    if (!message.trim()) {
      return null;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await api.post('/ai/messages', {
        userId: getCurrentUserId(),
        lessonId: Number(lessonId),
        timestamp: 0,
        message: message.trim()
      });
      console.log('AI response:', response.data);
      // Spring Boot reply property is inside response.data.response or response.data.reply
      return response.data;
    } catch (err) {
      console.error('Error getting AI response:', err);
      const errorMsg =
        err.response?.data?.message ||
        err.message ||
        'Failed to get AI response. Please try again.';
      setError(errorMsg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { sendMessage, loading, error };
};

export default useFetchAIResponse;

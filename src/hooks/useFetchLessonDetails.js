import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom Hook: useFetchLessonDetails
 * Handles fetching lesson details by ID with loading and error states
 */
export const useFetchLessonDetails = (lessonId) => {
  const [lesson, setLesson] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!lessonId) {
      Promise.resolve().then(() => {
        setLesson(null);
        setError(null);
      });
      return;
    }

    const getLesson = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get(`/lessons/${lessonId}`);
        setLesson(response.data);
        console.log('Fetched lesson details:', response.data);
      } catch (err) {
        console.error('Error fetching lesson details:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to fetch lesson details'
        );
      } finally {
        setLoading(false);
      }
    };

    getLesson();
  }, [lessonId]);

  return { lesson, loading, error };
};

export default useFetchLessonDetails;

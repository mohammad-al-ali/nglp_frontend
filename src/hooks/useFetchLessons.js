import { useState, useEffect } from 'react';
import api from '../services/api';

/**
 * Custom Hook: useFetchLessons
 * Handles fetching, loading, and error states for lessons list
 */
export const useFetchLessons = () => {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getLessons = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/lessons');
        setLessons(response.data);
      } catch (err) {
        console.error('Error fetching lessons:', err);
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to fetch lessons. Make sure Spring Boot backend is running on localhost:8080'
        );
      } finally {
        setLoading(false);
      }
    };

    getLessons();
  }, []);

  return { lessons, loading, error };
};

export default useFetchLessons;

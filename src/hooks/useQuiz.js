import { useState, useCallback } from 'react';
import api, { getCurrentUserId } from '../services/api';

export function useFetchQuizzes(lessonId) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuizzes = useCallback(async () => {
    if (!lessonId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/quizzes?lessonId=${lessonId}`);
      setQuizzes(res.data);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to fetch quizzes');
    } finally {
      setLoading(false);
    }
  }, [lessonId]);

  return { quizzes, loading, error, fetchQuizzes };
}

export function useFetchQuiz() {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuiz = useCallback(async (quizId) => {
    if (!quizId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/quizzes/${quizId}`);
      setQuiz(res.data);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to fetch quiz');
    } finally {
      setLoading(false);
    }
  }, []);

  return { quiz, loading, error, fetchQuiz, setQuiz };
}

export function useFetchQuizStudent() {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchQuiz = useCallback(async (quizId) => {
    if (!quizId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/quizzes/${quizId}/student-view`);
      setQuiz(res.data);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to fetch quiz');
    } finally {
      setLoading(false);
    }
  }, []);

  return { quiz, loading, error, fetchQuiz };
}

export function useGenerateQuiz() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateQuiz = useCallback(async (payload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post('/quizzes/generate', payload);
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to generate quiz';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateQuiz, loading, error };
}

export function usePublishQuiz() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const publishQuiz = useCallback(async (quizId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/quizzes/${quizId}/publish`);
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to publish quiz';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { publishQuiz, loading, error };
}

export function useAddQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addQuestion = useCallback(async (quizId, payload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/quizzes/${quizId}/questions`, payload);
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to add question';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { addQuestion, loading, error };
}

export function useUpdateQuestion() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateQuestion = useCallback(async (quizId, questionId, payload) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.put(`/quizzes/${quizId}/questions/${questionId}`, payload);
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to update question';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateQuestion, loading, error };
}

export function useDeleteQuestion() {
  const [loading, setLoading] = useState(false);

  const deleteQuestion = useCallback(async (quizId, questionId) => {
    try {
      setLoading(true);
      await api.delete(`/quizzes/${quizId}/questions/${questionId}`);
      return true;
    } catch (err) {
      throw new Error(err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to delete question');
    } finally {
      setLoading(false);
    }
  }, []);

  return { deleteQuestion, loading };
}

export function useCheckAnswer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const checkAnswer = useCallback(async (questionId, choiceId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/quizzes/questions/${questionId}/choices/${choiceId}/check`);
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to check answer';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { checkAnswer, loading, error };
}

export function useStartAttempt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startAttempt = useCallback(async (quizId) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/quizzes/${quizId}/attempts?studentId=${getCurrentUserId()}`);
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to start attempt';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { startAttempt, loading, error };
}

export function useSubmitAttempt() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitAttempt = useCallback(async (attemptId, answers) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.post(`/quizzes/attempts/${attemptId}/submit`, { answers });
      return res.data;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to submit attempt';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { submitAttempt, loading, error };
}

export function useFetchAttempts() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAttempts = useCallback(async (quizId, studentId) => {
    if (!quizId) return;
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ quizId });
      if (studentId) params.append('studentId', studentId);
      const res = await api.get(`/quizzes/attempts?${params.toString()}`);
      setAttempts(res.data);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to fetch attempts');
    } finally {
      setLoading(false);
    }
  }, []);

  return { attempts, loading, error, fetchAttempts };
}

export function useFetchProviders() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get('/llm/providers');
      setProviders(res.data);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to fetch providers');
    } finally {
      setLoading(false);
    }
  }, []);

  return { providers, loading, error, fetchProviders };
}

export function useFetchUserSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchSettings = useCallback(async (userId) => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/llm/users/${userId}/settings`);
      setSettings(res.data);
    } catch (err) {
      setError(err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  }, []);

  return { settings, loading, error, fetchSettings };
}

export function useUpdateUserSettings() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateSettings = useCallback(async (userId, payload) => {
    try {
      setLoading(true);
      setError(null);
      await api.put(`/llm/users/${userId}/settings`, payload);
      return true;
    } catch (err) {
      const msg = err.friendlyMessage || err.response?.data?.message || err.response?.data?.error || 'Failed to update settings';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  return { updateSettings, loading, error };
}

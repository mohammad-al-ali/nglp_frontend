import { useState, useCallback } from 'react';
import api from '../services/api';

/**
 * يجلب تفريغ درس بلغة محددة ('ar' | 'en').
 * الاستجابة: { lessonId, language, available, availableLanguages: string[], segments: [{index,startSecond,endSecond,text}] }
 *
 * نفس نمط hooks/useQuiz.js — يقرأ رسالة الخطأ العربية الموحّدة من الـ interceptor.
 */
export function useLessonTranscript() {
  const [transcript, setTranscript] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTranscript = useCallback(async (lessonId, lang) => {
    if (!lessonId || !lang) return;
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/lessons/${lessonId}/transcript`, { params: { lang } });
      setTranscript(res.data);
    } catch (err) {
      setError(err.friendlyMessage || 'تعذر تحميل التفريغ النصي للفيديو.');
      setTranscript(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return { transcript, loading, error, fetchTranscript };
}

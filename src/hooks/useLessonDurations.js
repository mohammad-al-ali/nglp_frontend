import { useEffect, useRef } from 'react';
import api from '../services/api';
import { formatDuration, resolveMediaUrl } from '../utils/constants';

/**
 * يملأ مدد الدروس المجهولة في قوائم الدروس (Playlist / إدارة الدروس).
 *
 * لكل درس له فيديو وبلا مدّة معروفة، نحمّل بيانات الفيديو الوصفية فقط
 * (preload="metadata" — لا يُنزَّل الفيديو كاملاً)، نقرأ `duration`، ثم:
 *  1) نحدّث القائمة فوراً (تفاؤلياً) كي تظهر المدّة حتى لو فشل الحفظ.
 *  2) نرسل POST /lessons/:id/duration لحفظها في قاعدة البيانات (أفضل جهد).
 *
 * @param {Array}   lessons        قائمة الدروس المُطبَّعة (id, videoUrl, durationSeconds)
 * @param {Function} applyDuration (lessonId, seconds) => void — يحدّث حالة الصفحة
 */
export function useLessonDurations(lessons, applyDuration) {
  const probedRef = useRef(new Set());
  const applyRef = useRef(applyDuration);
  useEffect(() => {
    applyRef.current = applyDuration;
  });

  useEffect(() => {
    const pending = (lessons || []).filter(
      (l) => l && l.videoUrl && !(l.durationSeconds > 0) && !probedRef.current.has(l.id)
    );
    if (pending.length === 0) return undefined;

    let cancelled = false;
    const cleanups = [];

    pending.forEach((lesson) => {
      probedRef.current.add(lesson.id);
      const el = document.createElement('video');
      el.preload = 'metadata';
      el.muted = true;

      const cleanup = () => {
        el.removeEventListener('loadedmetadata', onMeta);
        el.removeEventListener('error', onError);
        el.removeAttribute('src');
        el.load();
      };

      function onError() {
        cleanup();
      }

      function onMeta() {
        const secs = Number(el.duration);
        cleanup();
        if (cancelled || !Number.isFinite(secs) || secs <= 0) return;

        const rounded = Math.round(secs);
        applyRef.current?.(lesson.id, rounded);
        api.post(`/lessons/${lesson.id}/duration`, { durationSeconds: rounded }).catch(() => {
          /* الحفظ أفضل جهد — الواجهة مُحدَّثة أصلاً */
        });
      }

      el.addEventListener('loadedmetadata', onMeta);
      el.addEventListener('error', onError);
      el.src = resolveMediaUrl(lesson.videoUrl);
      cleanups.push(cleanup);
    });

    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [lessons]);
}

/**
 * مساعد لتحديث صف درس واحد داخل مصفوفة الحالة بمدّة جديدة.
 * يُستخدم داخل setLessons(prev => applyLessonDuration(prev, id, seconds)).
 */
export function applyLessonDuration(rows, lessonId, seconds) {
  return rows.map((row) =>
    String(row.id) === String(lessonId)
      ? { ...row, durationSeconds: seconds, duration: formatDuration(seconds) }
      : row
  );
}

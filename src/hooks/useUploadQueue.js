import { useState } from 'react';
import api from '../services/api';
import { notify } from '@/lib/toast';

const MAX_VIDEO_MB = 500;
const ALLOWED_VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

/** تحقق جهة العميل من ملف فيديو الدرس قبل الرفع. يُعيد رسالة خطأ عربية أو null. */
export function validateLessonFile(file) {
  if (!(file instanceof File)) return 'يرجى إرفاق ملف فيديو للدرس.';
  const name = file.name.toLowerCase();
  const extOk = ALLOWED_VIDEO_EXT.some((e) => name.endsWith(e));
  const typeOk = !file.type || file.type.startsWith('video/');
  if (!extOk || !typeOk) {
    return 'صيغة الفيديو غير مدعومة. الصيغ المسموحة: MP4، WEBM، MOV.';
  }
  if (file.size > MAX_VIDEO_MB * 1024 * 1024) {
    return `حجم الفيديو يتجاوز الحد المسموح (${MAX_VIDEO_MB} ميغابايت).`;
  }
  return null;
}

/**
 * Shared lesson-upload queue for CourseBuilder and ManageLessons — the
 * two files had byte-identical handleDrag/handleDrop/handleFiles/
 * queueLesson logic apart from the state variable's name.
 *
 * Deliberately does not simulate a fake "offline" success when the
 * upload fails (the old per-page copies did): a failed request should
 * show as failed, not as a completed lesson with mock data.
 */
export function useUploadQueue() {
  const [queue, setQueue] = useState([]);

  function queueLesson({ file, title, description }) {
    const validationError = validateLessonFile(file);
    if (validationError) {
      notify.error(validationError);
      return;
    }
    const id = crypto.randomUUID();
    setQueue((current) => [
      ...current,
      {
        id,
        title,
        description,
        fileName: file.name,
        file,
        imageFile: null,
        progress: 0,
        status: 'pending', // pending | uploading | completed | error
        transcript: null,
      },
    ]);
  }

  function setItemImage(id, imageFile) {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, imageFile } : item)));
  }

  function updateItem(id, patch) {
    setQueue((current) => current.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  }

  async function uploadAll(courseId) {
    const pending = queue.filter((item) => item.status === 'pending');
    const uploaded = [];

    for (const item of pending) {
      updateItem(item.id, { status: 'uploading' });

      const formData = new FormData();
      formData.append('lesson', new Blob([JSON.stringify({ title: item.title, description: item.description })], { type: 'application/json' }));
      formData.append('file', item.file);
      if (item.imageFile) formData.append('image', item.imageFile);

      try {
        const response = await api.post(`/lessons/${courseId}`, formData, {
          onUploadProgress: (event) => {
            const progress = event.total ? Math.round((event.loaded * 100) / event.total) : 0;
            updateItem(item.id, { progress });
          },
        });
        updateItem(item.id, { progress: 100, status: 'completed' });
        uploaded.push(response.data);
      } catch (err) {
        updateItem(item.id, { status: 'error', errorMessage: err.friendlyMessage });
        throw err;
      }
    }

    return uploaded;
  }

  return { queue, queueLesson, setItemImage, uploadAll };
}

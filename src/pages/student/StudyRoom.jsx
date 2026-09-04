import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, ChevronLeft, PanelLeft, PanelRight, PanelBottom, AlertTriangle, RefreshCw } from 'lucide-react';
import api, { API_BASE_URL, getCurrentUserId } from '../../services/api';
import { normalizeCourse, normalizeLesson, formatDuration } from '../../utils/constants';
import { useLessonDurations, applyLessonDuration } from '../../hooks/useLessonDurations';
import { notify } from '@/lib/toast';
import { useFetchProviders, useFetchUserSettings, useUpdateUserSettings } from '../../hooks/useQuiz';
import { useLessonTranscript } from '../../hooks/useLessonTranscript';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AiTutorPanel from './components/AiTutorPanel';
import LessonVideoPane from './components/LessonVideoPane';
import LessonNavPanel from './components/LessonNavPanel';

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: 'أهلاً بك! أنا مساعدك التعليمي الذكي. كيف يمكنني مساعدتك في فهم هذا الدرس أو شرح الكود البرمجي اليوم؟',
};

const TRANSCRIPT_LANG_KEY = 'nglp.transcriptLang';
const LESSON_POS_KEY = (lessonId) => `nglp.lessonPos.${lessonId}`;

function readStoredTranscriptLang() {
  try {
    const v = localStorage.getItem(TRANSCRIPT_LANG_KEY);
    return v === 'ar' || v === 'en' ? v : 'ar';
  } catch {
    return 'ar';
  }
}

function readStoredLessonPos(lessonId) {
  try {
    const v = Number(localStorage.getItem(LESSON_POS_KEY(lessonId)));
    return Number.isFinite(v) && v > 0 ? v : 0;
  } catch {
    return 0;
  }
}

function writeStoredLessonPos(lessonId, seconds) {
  try {
    localStorage.setItem(LESSON_POS_KEY(lessonId), String(Math.floor(seconds)));
  } catch {
    /* التخزين المحلي غير متاح — لا يؤثر على العمل */
  }
}

function clearStoredLessonPos(lessonId) {
  try {
    localStorage.removeItem(LESSON_POS_KEY(lessonId));
  } catch {
    /* تجاهل */
  }
}

/**
 * حارس أخير على الواجهة: يزيل أي سياق تقني محقون أو وسوم XML داخلية قد تكون
 * بقيت في رسائل قديمة مخزّنة قبل تنظيف الخادم لها. الخادم ينظّف المصدر الآن،
 * وهذا فقط لضمان ألا يرى الطالب رموزاً غريبة إطلاقاً.
 */
function cleanMessageText(raw) {
  if (!raw) return '';
  let text = String(raw);

  const questionMatch = text.match(/<STUDENT_QUESTION>\s*([\s\S]*?)\s*<\/STUDENT_QUESTION>/);
  if (questionMatch) {
    text = questionMatch[1];
  } else {
    text = text.replace(/^\s*Student Question:\s*/, '');
    text = text.replace(/\n\s*\[(?:Video Transcript Context|System Info)\b[\s\S]*$/, '');
  }

  text = text.replace(/<\/?(?:SYSTEM_METADATA|TRANSCRIPT_CONTEXT|SYSTEM_INFO|STUDENT_QUESTION)>/g, '');
  return text.trim();
}

export default function StudyRoom() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const chatInputRef = useRef(null);
  const progressReportedRef = useRef(false);

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [completedLessonIds, setCompletedLessonIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showTutor, setShowTutor] = useState(false);
  const [showDetails, setShowDetails] = useState(true);
  const [showLessons, setShowLessons] = useState(true);

  const [chatMessage, setChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const { providers, fetchProviders } = useFetchProviders();
  const { settings, fetchSettings } = useFetchUserSettings();
  const { updateSettings } = useUpdateUserSettings();
  const [providerKey, setProviderKey] = useState('');
  const [modelKey, setModelKey] = useState('');
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);

  const [capturedTimestamp, setCapturedTimestamp] = useState(0);

  // --- تفريغ الفيديو المتزامن ---
  const [currentSecond, setCurrentSecond] = useState(0);
  const [transcriptLang, setTranscriptLang] = useState(readStoredTranscriptLang);
  const { transcript, loading: transcriptLoading, error: transcriptError, fetchTranscript } = useLessonTranscript();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // إعادة ضبط موضع التشغيل عند تبديل الدرس (الفيديو نفسه يُعاد تركيبه عبر key)
  useEffect(() => {
    setCurrentSecond(0);
    progressReportedRef.current = false;
  }, [lessonId]);

  useEffect(() => {
    if (activeLesson?.id) {
      fetchTranscript(activeLesson.id, transcriptLang);
    }
  }, [activeLesson?.id, transcriptLang, fetchTranscript]);

  // إن لم تتوفر اللغة المختارة لهذا الدرس بينما تتوفر أخرى، اعرض المتاحة
  // (دون تغيير التفضيل المحفوظ — يبقى ساري المفعول في الدروس التي تدعمه).
  useEffect(() => {
    const langs = transcript?.availableLanguages;
    if (transcript && !transcript.available && langs?.length > 0 && !langs.includes(transcriptLang)) {
      setTranscriptLang(langs[0]);
    }
  }, [transcript, transcriptLang]);

  // المقطع النشط = آخر مقطع بدأ عند/قبل الثانية الحالية (يتحمّل الفجوات بين المقاطع)
  const activeTranscriptIndex = useMemo(() => {
    const segs = transcript?.segments;
    if (!segs || segs.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < segs.length; i += 1) {
      if (segs[i].startSecond <= currentSecond) idx = i;
      else break;
    }
    return idx;
  }, [transcript, currentSecond]);

  function handleTranscriptSeek(startSecond) {
    if (videoRef.current) {
      videoRef.current.currentTime = startSecond;
      const played = videoRef.current.play();
      if (played?.catch) played.catch(() => {});
    }
  }

  function handleTranscriptLangChange(lang) {
    setTranscriptLang(lang);
    try {
      localStorage.setItem(TRANSCRIPT_LANG_KEY, lang);
    } catch {
      /* التخزين المحلي غير متاح — لا يؤثر على العمل */
    }
  }

  // الدرس السابق/التالي حسب ترتيب القائمة (للتنقّل من لوحة الفيديو)
  const { prevLessonId, nextLessonId } = useMemo(() => {
    const idx = lessons.findIndex((l) => String(l.id) === String(lessonId));
    if (idx === -1) return { prevLessonId: null, nextLessonId: null };
    return {
      prevLessonId: idx > 0 ? lessons[idx - 1].id : null,
      nextLessonId: idx < lessons.length - 1 ? lessons[idx + 1].id : null,
    };
  }, [lessons, lessonId]);

  function navigateToLesson(id) {
    navigate(`/study-room/${courseId}/lesson/${id}`);
  }

  // عند معرفة مدة الفيديو: (1) استئناف من آخر موضع محفوظ، (2) self-heal للمدة
  // في قاعدة البيانات إن كانت مجهولة (درس رُفع قبل استخراج المدة تلقائياً).
  function handleLoadedMetadata(rawDuration) {
    const duration = Number(rawDuration);
    const video = videoRef.current;

    if (video && Number.isFinite(duration) && duration > 0) {
      const saved = readStoredLessonPos(activeLesson?.id);
      if (saved > 5 && saved < duration - 10) {
        video.currentTime = saved;
      }
    }

    if (activeLesson && !activeLesson.durationSeconds && Number.isFinite(duration) && duration > 0) {
      const rounded = Math.round(duration);
      api
        .post(`/lessons/${activeLesson.id}/duration`, { durationSeconds: rounded })
        .then(() => {
          setActiveLesson((current) =>
            current ? { ...current, durationSeconds: rounded, duration: formatDuration(rounded) } : current
          );
          setLessons((rows) =>
            rows.map((row) =>
              String(row.id) === String(activeLesson.id)
                ? { ...row, durationSeconds: rounded, duration: formatDuration(rounded) }
                : row
            )
          );
        })
        .catch(() => {
          /* أفضل جهد — لا نزعج الطالب إن فشل */
        });
    }
  }

  function handleVideoTimeUpdate(time) {
    const seconds = Math.floor(time);
    setCurrentSecond(seconds);
    // حفظ موضع التشغيل كل 5 ثوانٍ فقط لتقليل الكتابة على localStorage
    if (activeLesson?.id && seconds > 0 && seconds % 5 === 0) {
      writeStoredLessonPos(activeLesson.id, seconds);
    }
  }

  function handleVideoEnded() {
    if (!activeLesson?.id) return;
    clearStoredLessonPos(activeLesson.id);
    // إكمال تلقائي عند انتهاء الفيديو (idempotent في الخادم).
    handleToggleComplete(activeLesson.id, true);
  }

  // عند أول تشغيل لهذا الدرس: سجّله كآخر درس تمّت مشاهدته في سجل التسجيل.
  function handleVideoPlay() {
    if (progressReportedRef.current || !enrollment?.id || !activeLesson?.id) return;
    if (String(enrollment.lastWatchedLesson?.id) === String(activeLesson.id)) {
      progressReportedRef.current = true;
      return;
    }
    progressReportedRef.current = true;
    api
      .put(`/enrollments/${enrollment.id}/progress`, {
        lastWatchedLessonId: Number(activeLesson.id),
      })
      .then((res) => setEnrollment(res.data))
      .catch(() => {
        progressReportedRef.current = false;
      });
  }

  // تبديل حالة إكمال درس. تحديث تفاؤلي فوري ثم مزامنة مع رد الخادم.
  function handleToggleComplete(targetLessonId, nextCompleted) {
    setCompletedLessonIds((ids) =>
      nextCompleted
        ? Array.from(new Set([...ids, targetLessonId]))
        : ids.filter((id) => String(id) !== String(targetLessonId))
    );
    api
      .post(
        `/lessons/${targetLessonId}/complete`,
        { completed: nextCompleted },
        { params: { userId: Number(getCurrentUserId()) } }
      )
      .then((res) => setEnrollment(res.data))
      .catch(() => {
        notify.error('تعذر تحديث حالة الدرس');
        // تراجع عن التحديث التفاؤلي
        setCompletedLessonIds((ids) =>
          nextCompleted
            ? ids.filter((id) => String(id) !== String(targetLessonId))
            : Array.from(new Set([...ids, targetLessonId]))
        );
      });
  }

  function handleRegenerateTranscript() {
    if (!activeLesson?.id) return;
    api
      .post(`/lessons/${activeLesson.id}/transcript/regenerate`)
      .then(() => notify.info('بدأ توليد التفريغ في الخلفية. راجع الدرس بعد دقيقة.'))
      .catch(() => notify.error('تعذّر بدء توليد التفريغ حالياً.'));
  }

  useEffect(() => {
    let isMounted = true;

    async function loadLessonWorkspace() {
      try {
        setLoading(true);
        setError(null);

        const lessonResponse = await api.get(`/lessons/${lessonId}`);
        const activeL = normalizeLesson(lessonResponse.data);

        let siblingLessons = [];
        try {
          const siblingResponse = await api.get('/lessons', { params: { courseId } });
          siblingLessons = siblingResponse.data.map(normalizeLesson);
        } catch (e) {
          console.warn('Failed to load sibling lessons list', e);
        }

        let courseDetails = null;
        try {
          const courseResponse = await api.get(`/courses/${courseId}`);
          courseDetails = normalizeCourse(courseResponse.data);
        } catch (e) {
          console.warn('Failed to load course details', e);
        }

        let enrollmentRecord = null;
        try {
          const enrollmentResponse = await api.get('/enrollments', {
            params: { userId: Number(getCurrentUserId()) },
          });
          enrollmentRecord =
            enrollmentResponse.data?.find((en) => String(en.course?.id) === String(courseId)) || null;
        } catch (e) {
          console.warn('Failed to load enrollment record', e);
        }

        let completedIds = [];
        try {
          const progressResponse = await api.get('/lessons/progress', {
            params: { userId: Number(getCurrentUserId()), courseId },
          });
          completedIds = progressResponse.data?.completedLessonIds || [];
        } catch (e) {
          console.warn('Failed to load lesson completion state', e);
        }

        let fetchedMessages = [];
        try {
          const currentUserId = getCurrentUserId();
          const historyResponse = await api.get('/conversations/history', {
            params: { userId: Number(currentUserId), lessonId: Number(lessonId) },
          });

          if (historyResponse.data?.messages?.length > 0) {
            fetchedMessages = historyResponse.data.messages
              .map((msg) => ({
                role: msg.senderType === 'USER' ? 'student' : 'assistant',
                text: cleanMessageText(msg.content),
              }))
              .filter((msg) => msg.text.length > 0);
          }
        } catch (e) {
          console.warn('Failed to fetch conversation history from backend:', e);
        }

        if (isMounted) {
          setActiveLesson(activeL);
          setLessons(siblingLessons);
          setCourse(courseDetails);
          setEnrollment(enrollmentRecord);
          setCompletedLessonIds(completedIds);
          setMessages(fetchedMessages.length > 0 ? fetchedMessages : [WELCOME_MESSAGE]);
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load lesson details from database.', err);
        if (isMounted) {
          setError('تعذر تحميل بيانات الدرس من قاعدة البيانات. يرجى التأكد من تشغيل الخادم وتثبيت الدرس بشكل صحيح.');
          setActiveLesson(null);
          setLessons([]);
          setCourse(null);
          setEnrollment(null);
          setCompletedLessonIds([]);
          setLoading(false);
        }
      }
    }

    loadLessonWorkspace();
    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId]);

  useEffect(() => {
    fetchProviders();
    fetchSettings(getCurrentUserId());
  }, []);

  // اختصارات لوحة المفاتيح لطيّ/فتح اللوحات (بأسلوب محرّرات الأكواد).
  // تُتجاهل أثناء الكتابة في حقول الإدخال (مثل محادثة المساعد الذكي).
  useEffect(() => {
    function onKeyDown(e) {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || e.shiftKey) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      const key = e.key.toLowerCase();
      if (key === 'b') {
        e.preventDefault();
        setShowLessons((v) => !v);
      } else if (key === 'j') {
        e.preventDefault();
        setShowDetails((v) => !v);
      } else if (key === '\\') {
        e.preventDefault();
        setShowTutor((v) => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // تعبئة مدد الدروس المجهولة في الـ Playlist من بيانات الفيديو الوصفية.
  useLessonDurations(lessons, (lessonId, seconds) => {
    setLessons((rows) => applyLessonDuration(rows, lessonId, seconds));
    setActiveLesson((current) =>
      current && String(current.id) === String(lessonId) && !(current.durationSeconds > 0)
        ? { ...current, durationSeconds: seconds, duration: formatDuration(seconds) }
        : current
    );
  });

  useEffect(() => {
    Promise.resolve().then(() => {
      if (settings) {
        setProviderKey(settings.providerKey || '');
        setModelKey(settings.modelKey || '');
      }
    });
  }, [settings]);

  useEffect(() => {
    Promise.resolve().then(() => {
      if (providers.length > 0 && !settings) {
        const first = providers[0];
        if (first) {
          setProviderKey(first.key);
          setModelKey((first.models || [])[0]?.key || '');
        }
      }
    });
  }, [providers, settings]);

  function handleSmartPrompt() {
    setShowTutor(true);
    setChatMessage('لم أفهم');

    if (videoRef.current) {
      const time = Math.floor(videoRef.current.currentTime);
      setCapturedTimestamp(time);
      videoRef.current.pause();
    }

    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 200);
  }

  async function sendMessage(event) {
    event.preventDefault();
    if (!chatMessage.trim() || isSending || !activeLesson) return;

    const studentMessage = { role: 'student', text: chatMessage.trim() };
    setMessages((current) => [...current, studentMessage]);
    setChatMessage('');
    setIsSending(true);

    const timestampToSend = capturedTimestamp;
    setCapturedTimestamp(0);

    try {
      const response = await fetch(`${API_BASE_URL}/ai/messages/stream`, {
        method: 'POST',
        // نداء fetch خام يتجاوز معترضات axios — نرسل هوية المستخدم يدوياً
        // كي يفحص المعترض الخلفي حالة الحظر على هذا المسار أيضاً.
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(getCurrentUserId() ?? ''),
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: Number(getCurrentUserId()),
          lessonId: Number(activeLesson.id),
          timestamp: String(timestampToSend),
          message: studentMessage.text,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('فشل في الاتصال بمزود البث اللحظي للذكاء الاصطناعي.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';

      setMessages((current) => [...current, { role: 'assistant', text: '' }]);

      // بروتوكول SSE: الأحداث مفصولة بسطر فارغ، وكل حدث قد يحوي عدة أسطر "data:".
      // نجمع الأسطر حتى يكتمل الحدث لأن قراءة الشبكة الواحدة قد تقطع سطراً في منتصفه.
      const applyEvent = (rawEvent) => {
        // Spring يكتب الأسطر بالشكل «data:<الحمولة>» دون مسافة بعد النقطتين،
        // فلا نقتطع أي مسافة — قد تكون المسافة البادئة جزءاً حقيقياً من مقطع الرد.
        const dataLines = rawEvent
          .split('\n')
          .filter((line) => line.startsWith('data:'))
          .map((line) => line.slice(5));

        if (dataLines.length === 0) return;
        const payload = dataLines.join('\n');
        if (payload === '[DONE]') return;

        accumulatedText += payload;
        setMessages((current) => {
          const next = [...current];
          next[next.length - 1] = { role: 'assistant', text: accumulatedText };
          return next;
        });
      };

      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n');

        let separatorIndex;
        while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
          applyEvent(buffer.slice(0, separatorIndex));
          buffer = buffer.slice(separatorIndex + 2);
        }
      }
      if (buffer.trim()) {
        applyEvent(buffer);
      }
    } catch (err) {
      console.warn('AI Chat streaming request failed.', err);
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: 'حدث خطأ في الاتصال بمساعد الذكاء الاصطناعي. لا يمكن الاتصال بنظام المحادثة اللحظية حالياً. يرجى التحقق من اتصال الخادم وإعادة المحاولة لاحقاً.',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 text-foreground">
        <Loader2 className="size-10 animate-spin text-primary" />
        <strong className="text-lg font-bold">جاري تحميل مساحة التعلم الذكية...</strong>
      </div>
    );
  }

  if (error || !activeLesson) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 p-6 text-center font-sans text-foreground">
        <AlertTriangle className="size-12 text-warning" />
        <h2 className="text-2xl font-bold">فشل تحميل مساحة الدرس</h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">{error || 'لم يتم العثور على بيانات هذا الدرس في قاعدة البيانات.'}</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>
            <RefreshCw className="size-4" /> إعادة المحاولة
          </Button>
          <Button as={Link} to="/dashboard" variant="outline">
            العودة للوحة المتابعة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden text-foreground">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface px-5">
        <div className="flex items-center gap-3">
          <Link to="/dashboard" className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-surface-raised px-3 text-xs font-bold text-foreground">
            <ArrowRight className="size-4" /> لوحة الطلاب
          </Link>
          <ChevronLeft className="size-3.5 text-muted-foreground" />
          <span className="text-sm font-bold text-muted-foreground">{course?.title || 'كورس تعليمي'}</span>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-bold text-primary">{activeLesson.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/*
           * IDE-style panel toggles (à la VS Code's layout icons): each icon
           * is the same split-pane glyph with only its own segment filled,
           * so the three read as one coherent workspace-layout control
           * rather than three unrelated feature buttons. DOM order here is
           * deliberately [right, bottom, left] — this app is RTL, and a row
           * lays its first child at the inline-start (physically the right
           * edge), so that order is what renders left-to-right on screen as
           * left / bottom / right, matching the icons' own handedness.
           */}
          <HeaderToggleButton active={showTutor} onClick={() => setShowTutor(!showTutor)} title="الشريط الجانبي الأيمن — مساعد الذكاء الاصطناعي (Ctrl+\)" icon={PanelRight} />
          <HeaderToggleButton active={showDetails} onClick={() => setShowDetails(!showDetails)} title="اللوحة السفلية — تفاصيل الدرس والتفريغ النصي (Ctrl+J)" icon={PanelBottom} />
          <HeaderToggleButton active={showLessons} onClick={() => setShowLessons(!showLessons)} title="الشريط الجانبي الأيسر — قائمة الدروس (Ctrl+B)" icon={PanelLeft} />

          <span className="mx-1.5 h-5 w-px bg-border" />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
            <span className="size-1.5 rounded-full bg-success" />
            متصل
          </span>
        </div>
      </header>

      <div className="flex min-h-0 w-screen flex-1 overflow-hidden">
        <AiTutorPanel
          show={showTutor}
          onClose={() => setShowTutor(false)}
          messages={messages}
          isSending={isSending}
          messagesEndRef={messagesEndRef}
          providers={providers}
          providerKey={providerKey}
          modelKey={modelKey}
          onProviderChange={(e) => {
            setProviderKey(e.target.value);
            const p = providers.find((pr) => pr.key === e.target.value);
            const firstModel = (p?.models || [])[0]?.key || '';
            setModelKey(firstModel);
            updateSettings(getCurrentUserId(), { providerKey: e.target.value, modelKey: firstModel }).catch(() => {});
          }}
          onModelChange={(e) => {
            setModelKey(e.target.value);
            updateSettings(getCurrentUserId(), { providerKey, modelKey: e.target.value }).catch(() => {});
          }}
          chatMessage={chatMessage}
          onChatMessageChange={setChatMessage}
          onSubmit={sendMessage}
          chatInputRef={chatInputRef}
        />

        <LessonVideoPane
          activeLesson={activeLesson}
          videoRef={videoRef}
          showDetails={showDetails}
          onToggleDetails={() => setShowDetails(false)}
          courseId={courseId}
          lessonId={lessonId}
          onSmartPrompt={handleSmartPrompt}
          onTimeUpdate={handleVideoTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onPlay={handleVideoPlay}
          onEnded={handleVideoEnded}
          prevLessonId={prevLessonId}
          nextLessonId={nextLessonId}
          onNavigateLesson={navigateToLesson}
          transcript={{
            segments: transcript?.segments ?? [],
            activeIndex: activeTranscriptIndex,
            onSeek: handleTranscriptSeek,
            language: transcriptLang,
            availableLanguages: transcript?.availableLanguages ?? [],
            onLanguageChange: handleTranscriptLangChange,
            onGenerate: handleRegenerateTranscript,
            loading: transcriptLoading,
            error: transcriptError,
          }}
        />

        <LessonNavPanel
          show={showLessons}
          onClose={() => setShowLessons(false)}
          lessons={lessons}
          activeLessonId={lessonId}
          lastWatchedLessonId={enrollment?.lastWatchedLesson?.id ?? null}
          completedLessonIds={completedLessonIds}
          onToggleComplete={handleToggleComplete}
          loading={loading}
          onNavigate={navigateToLesson}
        />
      </div>
    </div>
  );
}

function HeaderToggleButton({ active, onClick, title, icon: Icon }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        'flex size-8 items-center justify-center rounded-sm transition-all duration-200 ease-in-out',
        active ? 'bg-primary-soft text-primary' : 'text-muted-foreground hover:bg-surface-raised'
      )}
    >
      <Icon className="size-[18px]" />
    </button>
  );
}

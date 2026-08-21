import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight, ChevronLeft, PanelLeftOpen, Bot, FileText, AlertTriangle, RefreshCw } from 'lucide-react';
import api, { API_BASE_URL, getCurrentUserId } from '../../services/api';
import { normalizeCourse, normalizeLesson } from '../../utils/constants';
import { useFetchProviders, useFetchUserSettings, useUpdateUserSettings } from '../../hooks/useQuiz';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import AiTutorPanel from './components/AiTutorPanel';
import LessonVideoPane from './components/LessonVideoPane';
import LessonNavPanel from './components/LessonNavPanel';

const WELCOME_MESSAGE = {
  role: 'assistant',
  text: 'أهلاً بك! أنا مساعدك التعليمي الذكي. كيف يمكنني مساعدتك في فهم هذا الدرس أو شرح الكود البرمجي اليوم؟',
};

export default function StudyRoom() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();

  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const chatInputRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

        let fetchedMessages = [];
        try {
          const currentUserId = getCurrentUserId();
          const historyResponse = await api.get('/conversations/history', {
            params: { userId: Number(currentUserId), lessonId: Number(lessonId) },
          });

          if (historyResponse.data?.messages?.length > 0) {
            fetchedMessages = historyResponse.data.messages.map((msg) => ({
              role: msg.senderType === 'USER' ? 'student' : 'assistant',
              text: msg.content,
            }));
          }
        } catch (e) {
          console.warn('Failed to fetch conversation history from backend:', e);
        }

        if (isMounted) {
          setActiveLesson(activeL);
          setLessons(siblingLessons);
          setCourse(courseDetails);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: Number(getCurrentUserId()),
          lessonId: Number(activeLesson.id),
          timestamp: String(timestampToSend),
          message: studentMessage.text,
        }),
      });

      if (!response.ok) {
        throw new Error('فشل في الاتصال بمزود البث اللحظي للذكاء الاصطناعي.');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;
      let accumulatedText = '';

      setMessages((current) => [...current, { role: 'assistant', text: '' }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data:')) {
              const startIndex = line.indexOf('data:') + 5;
              let cleanChunk = line.substring(startIndex);

              if (cleanChunk.trim() === '[DONE]') {
                break;
              }
              if (cleanChunk) {
                const trimmedChunk = cleanChunk.trim();
                if (trimmedChunk.startsWith('"') && trimmedChunk.endsWith('"') && trimmedChunk.length > 1) {
                  cleanChunk = cleanChunk.replace(trimmedChunk, trimmedChunk.substring(1, trimmedChunk.length - 1));
                }
                cleanChunk = cleanChunk.replace(/\\n/g, '\n').replace(/\\t/g, '\t');

                accumulatedText += cleanChunk;
                setMessages((current) => {
                  const next = [...current];
                  if (next.length > 0) {
                    next[next.length - 1] = { role: 'assistant', text: accumulatedText };
                  }
                  return next;
                });
              }
            }
          }
        }
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
          <HeaderToggleButton active={showLessons} onClick={() => setShowLessons(!showLessons)} title="قائمة الدروس" icon={PanelLeftOpen} />
          <HeaderToggleButton active={showTutor} onClick={() => setShowTutor(!showTutor)} title="مساعد الذكاء الاصطناعي" icon={Bot} />
          <HeaderToggleButton active={showDetails} onClick={() => setShowDetails(!showDetails)} title="تفاصيل الدرس" icon={FileText} />

          <span className="mx-1.5 h-5 w-px bg-border" />

          <span className="inline-flex items-center gap-1.5 rounded-full border border-success-border bg-success-soft px-2.5 py-1 text-xs font-bold text-success">
            <span className="size-1.5 rounded-full bg-success" />
            اتصال ذكي بخادم البيانات
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
        />

        <LessonNavPanel
          show={showLessons}
          onClose={() => setShowLessons(false)}
          lessons={lessons}
          activeLessonId={lessonId}
          onNavigate={(id) => navigate(`/study-room/${courseId}/lesson/${id}`)}
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

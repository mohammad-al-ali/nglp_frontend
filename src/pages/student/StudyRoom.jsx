/**
 * ====================================================================
 * 🎓 اسم الملف: StudyRoom.jsx (مساحة التعلم الذكية للطالب)
 * 🎯 الغاية منه:
 *   يوفر هذا الملف بيئة دراسية متكاملة للطالب تشبه واجهة IDE (VS Code).
 *   يشتمل الملف على:
 *     1. مشغل فيديو مرئي تفاعلي للدرس.
 *     2. تفريغ نصي تلقائي لوقائع الفيديو مستخرج بالذكاء الاصطناعي (Whisper).
 *     3. لوحة محادثة ذكية متكاملة ومزامنة زمنياً مع الفيديو تتيح للطالب الاستفسار
 *        عن أي نقطة في الدرس واستلام رد تدفقي لحظي (Streaming) من المساعد الذكي.
 * ====================================================================
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import api, { getCurrentUserId } from '../../services/api';
import { normalizeCourse, normalizeLesson, resolveMediaUrl } from '../../utils/constants';

export default function StudyRoom() {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  
  const messagesEndRef = useRef(null);
  const videoRef = useRef(null);
  const chatInputRef = useRef(null);

  // States managed strictly from API responses
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // VS Code toggles states
  const [showTutor, setShowTutor] = useState(false); // Collapsed by default
  const [showDetails, setShowDetails] = useState(true); // Open by default
  const [showLessons, setShowLessons] = useState(true); // Open by default
  
  const [networkSource, setNetworkSource] = useState('backend'); // backend, offline

  // Chat panel state
  const [chatMessage, setChatMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: 'assistant', 
      text: 'أهلاً بك! أنا مساعدك التعليمي الذكي. كيف يمكنني مساعدتك في فهم هذا الدرس أو شرح الكود البرمجي اليوم؟' 
    },
  ]);
  const [activeConversationId, setActiveConversationId] = useState(null);

  // Implicitly captured timestamp
  const [capturedTimestamp, setCapturedTimestamp] = useState(0);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Fetch course & specific lesson details strictly from the database endpoints
  useEffect(() => {
    let isMounted = true;

    async function loadLessonWorkspace() {
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch active lesson metadata directly
        const lessonResponse = await api.get(`/lessons/${lessonId}`);
        console.log(lessonResponse);
        const activeL = normalizeLesson(lessonResponse.data);

        // 2. Fetch sibling syllabus lessons
        let siblingLessons = [];
        try {
          const siblingResponse = await api.get('/lessons', { params: { courseId } });
          siblingLessons = siblingResponse.data.map(normalizeLesson);
        } catch (e) {
          console.warn('Failed to load sibling lessons list', e);
        }

        // 3. Fetch course details
        let courseDetails = null;
        try {
          const courseResponse = await api.get(`/courses/${courseId}`);
          courseDetails = normalizeCourse(courseResponse.data);
        } catch (e) {
          console.warn('Failed to load course details', e);
        }

        // 4. تهيئة أو جلب المحادثة وتاريخ الرسائل دفعة واحدة بطلب واحد مبسط (تقليل التحميل على الشبكة)
        let conversationId = null;
        let fetchedMessages = [];
        try {
          const currentUserId = getCurrentUserId();
          const historyResponse = await api.get('/conversations/history', {
            params: { userId: Number(currentUserId), lessonId: Number(lessonId) }
          });
          
          if (historyResponse.data) {
            conversationId = historyResponse.data.conversationId;
            if (historyResponse.data.messages && historyResponse.data.messages.length > 0) {
              fetchedMessages = historyResponse.data.messages.map((msg) => ({
                role: msg.senderType === 'USER' ? 'student' : 'assistant',
                text: msg.content
              }));
            }
          }
        } catch (e) {
          console.warn('Failed to fetch conversation history from backend:', e);
        }

        if (isMounted) {
          setActiveLesson(activeL);
          setLessons(siblingLessons);
          setCourse(courseDetails);
          setActiveConversationId(conversationId);
          if (fetchedMessages.length > 0) {
            setMessages(fetchedMessages);
          } else {
            // إعادة ضبط الرسائل للترحيب الافتراضي في حال عدم وجود تاريخ محادثة سابق
            setMessages([
              { 
                role: 'assistant', 
                text: 'أهلاً بك! أنا مساعدك التعليمي الذكي. كيف يمكنني مساعدتك في فهم هذا الدرس أو شرح الكود البرمجي اليوم؟' 
              },
            ]);
          }
          setNetworkSource('backend');
          setLoading(false);
        }
      } catch (err) {
        console.error('Failed to load lesson details from database.', err);
        if (isMounted) {
          setError('تعذر تحميل بيانات الدرس من قاعدة البيانات. يرجى التأكد من تشغيل الخادم وتثبيت الدرس بشكل صحيح.');
          setActiveLesson(null);
          setLessons([]);
          setCourse(null);
          setNetworkSource('offline');
          setLoading(false);
        }
      }
    }

    loadLessonWorkspace();
    return () => {
      isMounted = false;
    };
  }, [courseId, lessonId]);

  // Handle smart prompt click ("Didn't understand this point")
  function handleSmartPrompt() {
    // 1. Expand AI Tutor Panel
    setShowTutor(true);
    
    // 2. Set chat input state to "لم أفهم"
    setChatMessage('لم أفهم');
    
    // 3. Implicitly capture current video playback time
    if (videoRef.current) {
      const time = Math.floor(videoRef.current.currentTime);
      setCapturedTimestamp(time);
      
      // إيقاف الفيديو مؤقتاً تلقائياً لتركيز الطالب
      videoRef.current.pause();
    }
    
    // 4. Focus the chat input box
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 200);
  }

  // Send message to AI Tutor with Real-Time Response Streaming (SSE)
  async function sendMessage(event) {
    event.preventDefault();
    if (!chatMessage.trim() || isSending || !activeLesson) return;

    const studentMessage = { role: 'student', text: chatMessage.trim() };
    setMessages((current) => [...current, studentMessage]);
    setChatMessage('');
    setIsSending(true);

    const timestampToSend = capturedTimestamp;
    setCapturedTimestamp(0); // Reset for next interactions

    try {
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
      
      // استدعاء البث اللحظي باستخدام fetch العادي لدعم دفق البيانات (Streaming)
      const response = await fetch(`${baseUrl}/ai/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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

      // إضافة رسالة مساعد فارغة تبدأ بالتعبئة الحية
      setMessages((current) => [...current, { role: 'assistant', text: '' }]);

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          // تقسيم الحزمة المستلمة إلى أسطر وقراءة أسطر SSE المبتدئة بـ "data:"
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('data:')) {
              // نقص ما بعد البادئة "data:" مع الحفاظ التام على المسافات البادئة واللاحقة للكلمة
              const startIndex = line.indexOf('data:') + 5;
              let cleanChunk = line.substring(startIndex);
              
              if (cleanChunk.trim() === '[DONE]') {
                break;
              }
              if (cleanChunk) {
                // إزالة علامات الاقتباس المحيطة بالكلمة فقط إذا كانت مضافة من تسلسل الـ JSON
                const trimmedChunk = cleanChunk.trim();
                if (trimmedChunk.startsWith('"') && trimmedChunk.endsWith('"') && trimmedChunk.length > 1) {
                  cleanChunk = cleanChunk.replace(trimmedChunk, trimmedChunk.substring(1, trimmedChunk.length - 1));
                }
                // تحويل ترميز الأسطر الجديدة والمحاذاة
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
          text: `⚠️ **حدث خطأ في الاتصال بمساعد الذكاء الاصطناعي**
          
لا يمكن الاتصال بنظام المحادثة اللحظية حالياً. يرجى التحقق من اتصال الخادم وإعادة المحاولة لاحقاً.` 
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (loading) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: 'var(--bg)',
          color: 'var(--text-main)',
          direction: 'rtl'
        }}
      >
        <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid var(--primary-soft)', borderTopColor: 'var(--primary)', animation: 'spin 1s linear infinite', marginBottom: '16px' }} />
        <strong style={{ fontSize: '1.1rem', fontWeight: '800' }}>جاري تحميل مساحة التعلم الذكية...</strong>
        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  if (error || !activeLesson) {
    return (
      <div 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '100vw', 
          height: '100vh', 
          backgroundColor: 'var(--bg)',
          color: 'var(--text-main)',
          padding: '24px',
          textAlign: 'center',
          direction: 'rtl',
          fontFamily: 'var(--font-sans)'
        }}
      >
        <span style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</span>
        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', marginBottom: '12px' }}>فشل تحميل مساحة الدرس</h2>
        <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', maxWidth: '480px', marginBottom: '24px', lineHeight: '1.6' }}>
          {error || 'لم يتم العثور على بيانات هذا الدرس في قاعدة البيانات.'}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => window.location.reload()}
            style={{
              minHeight: '40px',
              padding: '0 20px',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              fontWeight: '700',
              cursor: 'pointer'
            }}
          >
            إعادة المحاولة 🔄
          </button>
          <Link 
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '40px',
              padding: '0 20px',
              backgroundColor: 'var(--surface-raised)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            العودة للوحة المتابعة
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        width: '100vw', 
        height: '100vh', 
        overflow: 'hidden', 
        color: 'var(--text-main)', 
        backgroundColor: 'var(--bg)',
        fontFamily: 'var(--font-sans)',
        direction: 'rtl'
      }}
    >
      {/* Inject custom styles for Markdown parsing and sliding transitions */}
      <style>{`
        .markdown-content p {
          margin: 0 0 10px;
          line-height: 1.6;
        }
        .markdown-content p:last-child {
          margin-bottom: 0;
        }
        .markdown-content ul, .markdown-content ol {
          margin: 0 0 10px;
          padding-right: 20px;
          line-height: 1.5;
        }
        .markdown-content li {
          margin-bottom: 4px;
        }
        .markdown-content pre {
          background-color: var(--surface-raised);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          padding: 12px;
          overflow-x: auto;
          margin: 10px 0;
          direction: ltr;
          text-align: left;
        }
        .markdown-content code {
          font-family: var(--font-mono);
          font-size: 0.82rem;
          color: var(--primary);
          background-color: var(--primary-soft);
          padding: 2px 5px;
          border-radius: 4px;
          font-weight: 600;
        }
        .markdown-content pre code {
          color: var(--text-main);
          background-color: transparent;
          padding: 0;
          border-radius: 0;
          font-weight: 400;
        }
        .lesson-nav-btn {
          transition: all var(--transition-fast);
        }
        .lesson-nav-btn:hover {
          background-color: var(--primary-soft) !important;
          border-color: var(--primary-border) !important;
        }
        .activity-btn {
          background: none;
          border: none;
          cursor: pointer;
          display: flex;
          alignItems: center;
          justify-content: center;
          width: 100%;
          min-height: 48px;
          transition: all var(--transition-fast);
          position: relative;
        }
        .activity-btn:hover {
          background-color: var(--surface);
        }
      `}</style>

      {/* Top IDE Header navigation Breadcrumbs bar */}
      <header 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '52px',
          padding: '0 20px',
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          flex: '0 0 auto',
          boxShadow: 'var(--shadow-sm)',
          zIndex: 10
        }}
      >
        {/* Breadcrumb path */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link 
            to="/dashboard" 
            style={{ 
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '32px',
              padding: '0 12px',
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-main)',
              fontSize: '0.8rem',
              fontWeight: '700',
              textDecoration: 'none'
            }}
          >
            ⬅️ لوحة الطلاب
          </Link>
          <span style={{ color: 'var(--border)', fontSize: '1rem' }}>|</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: 'var(--text-muted)' }}>
            {course?.title || 'كورس تعليمي'}
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>/</span>
          <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--primary)' }}>
            {activeLesson.title}
          </span>
        </div>

        {/* Server status & mini toggles */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {networkSource === 'backend' ? (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                fontWeight: '800',
                color: 'var(--success)',
                backgroundColor: 'var(--success-soft)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--success-border)'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--success)', display: 'inline-block' }} />
              اتصال ذكي بخادم البيانات
            </span>
          ) : (
            <span 
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.74rem',
                fontWeight: '800',
                color: '#b45309',
                backgroundColor: '#fffbeb',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid #fde68a'
              }}
            >
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#d97706', display: 'inline-block' }} />
              وضع محلي بدون خادم
            </span>
          )}
        </div>
      </header>

      {/* Main Full-Height Workspace (RTL Visual Order: Right to Left) */}
      <div style={{ display: 'flex', minHeight: '0', flex: '1 1 auto', width: '100vw', overflow: 'hidden' }}>
        
        {/* Panel 1: Rightmost Pane - Collapsible AI Tutor Chat (Default: Collapsed/Hidden) */}
        <aside 
          style={{
            width: showTutor ? '380px' : '0px',
            overflow: 'hidden',
            transition: 'width 0.3s ease-in-out, border-left 0.3s ease-in-out',
            backgroundColor: 'var(--surface)',
            borderLeft: showTutor ? '1px solid var(--border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          {/* Slide mask inner wrapper */}
          <div style={{ width: '380px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Chat header */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface-raised)'
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: '900', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🤖</span> مساعد التعلم الذكي (AI Tutor)
              </span>
              <button 
                onClick={() => setShowTutor(false)}
                title="إغلاق قسم المحادثة"
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', color: 'var(--text-muted)' }}
              >
                ✕
              </button>
            </div>
            
            {/* Chat Messages Panel */}
            <div 
              style={{ 
                flex: 1, 
                overflowY: 'auto', 
                padding: '18px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '14px' 
              }}
            >
              {messages.map((msg, index) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div 
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: isAssistant ? 'flex-start' : 'flex-end',
                      width: '100%'
                    }}
                  >
                    <span 
                      style={{ 
                        fontSize: '0.72rem', 
                        fontWeight: '700', 
                        color: 'var(--text-muted)',
                        marginBottom: '4px',
                        padding: '0 4px'
                      }}
                    >
                      {isAssistant ? 'المساعد الذكي' : 'أنت'}
                    </span>
                    
                    <div 
                      className="markdown-content"
                      style={{
                        padding: '12px 14px',
                        borderRadius: isAssistant ? '0 12px 12px 12px' : '12px 0 12px 12px',
                        fontSize: '0.88rem',
                        lineHeight: '1.5',
                        maxWidth: '85%',
                        color: 'var(--text-main)',
                        backgroundColor: isAssistant ? 'var(--surface-raised)' : 'var(--primary-soft)',
                        border: isAssistant ? '1px solid var(--border)' : '1px solid var(--primary-border)',
                        boxShadow: 'var(--shadow-sm)',
                        wordBreak: 'break-word',
                        textAlign: 'right'
                      }}
                    >
                      {isAssistant ? (
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      ) : (
                        msg.text
                      )}
                    </div>
                  </div>
                );
              })}
              
              {/* Typing indicator */}
              {isSending && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', width: '100%' }}>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px', padding: '0 4px' }}>
                    المساعد الذكي
                  </span>
                  <div 
                    style={{
                      padding: '10px 14px',
                      borderRadius: '0 12px 12px 12px',
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      backgroundColor: 'var(--surface-raised)',
                      border: '1px solid var(--border)',
                      fontStyle: 'italic',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span className="pulse-dots" style={{ display: 'flex', gap: '3px' }}>
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'pulse 1s infinite alternate' }} />
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'pulse 1s infinite alternate 0.2s' }} />
                      <span style={{ width: '4px', height: '4px', borderRadius: '50%', backgroundColor: 'var(--primary)', animation: 'pulse 1s infinite alternate 0.4s' }} />
                    </span>
                    المساعد يكتب...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar Form */}
            <form 
              onSubmit={sendMessage}
              style={{ 
                padding: '14px', 
                borderTop: '1px solid var(--border)', 
                display: 'flex', 
                gap: '8px',
                backgroundColor: 'var(--surface-raised)'
              }}
            >
              <input 
                ref={chatInputRef}
                value={chatMessage} 
                onChange={(event) => setChatMessage(event.target.value)} 
                placeholder={isSending ? "جاري صياغة الرد..." : "اسأل مساعد الذكاء الاصطناعي..."}
                disabled={isSending}
                style={{
                  flex: 1,
                  minHeight: '38px',
                  padding: '0 12px',
                  fontSize: '0.88rem',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  outline: 'none',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text-main)',
                  transition: 'all var(--transition-fast)'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
              />
              <button 
                type="submit"
                disabled={isSending || !chatMessage.trim()}
                style={{
                  minWidth: '70px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontWeight: '800',
                  fontSize: '0.85rem',
                  cursor: (isSending || !chatMessage.trim()) ? 'not-allowed' : 'pointer',
                  opacity: (isSending || !chatMessage.trim()) ? 0.6 : 1,
                  transition: 'all var(--transition-fast)'
                }}
              >
                إرسال
              </button>
            </form>
          </div>
        </aside>

        {/* Panel 2: Center Pane - Main Workspace (Video Player + Tabbed Info) */}
        <main 
          style={{ 
            flex: '1 1 auto', 
            display: 'flex', 
            flexDirection: 'column', 
            minWidth: 0,
            overflowY: 'auto',
            padding: '24px',
            gap: '20px'
          }}
        >
          {/* Main Video Stage with HTML5 Video Player and Key re-render */}
          <section 
            style={{
              backgroundColor: '#0f172a',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)',
              aspectRatio: '16/9',
              maxHeight: '52vh',
              position: 'relative',
              width: '100%'
            }}
          >
            {activeLesson.videoUrl ? (
              <video 
                ref={videoRef}
                key={activeLesson.id}
                src={resolveMediaUrl(activeLesson.videoUrl)} 
                controls 
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div 
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  width: '100%', 
                  height: '100%',
                  gap: '12px',
                  color: 'white'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center' }}>
                  <span style={{ fontSize: '1.8rem' }}>🎬</span>
                </div>
                <strong style={{ fontSize: '1.15rem', fontWeight: '800' }}>لم يتم رفع فيديو لهذا الدرس بعد</strong>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{activeLesson.title}</p>
              </div>
            )}
          </section>

          {/* Dynamic Smart AI Prompt trigger button underneath video */}
          <div 
            style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              margin: '2px 0', 
              flexWrap: 'wrap', 
              gap: '12px' 
            }}
          >
            <h1 style={{ fontSize: '1.35rem', fontWeight: '900', color: 'var(--text-main)', fontFamily: 'var(--font-display)', margin: 0 }}>
              {activeLesson.title}
            </h1>
            
            {/* The Smart AI Prompt Button */}
            <button
              onClick={handleSmartPrompt}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                minHeight: '38px',
                padding: '0 16px',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                border: '1px solid var(--primary-border)',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
                fontWeight: '800',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                transition: 'all var(--transition-fast)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary)';
                e.currentTarget.style.color = '#ffffff';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--primary-soft)';
                e.currentTarget.style.color = 'var(--primary)';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <span>🤖</span> ألم تفهم هذه النقطة؟ اسألني
            </button>
          </div>

          {/* Tabbed details block (collapsible using showDetails state) */}
          <div 
            style={{ 
              height: showDetails ? 'auto' : '0px', 
              overflow: 'hidden', 
              transition: 'all 0.3s ease-in-out',
              opacity: showDetails ? 1 : 0
            }}
          >
            <section 
              className="premium-card"
              style={{
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {/* Header */}
              <div 
                style={{
                  display: 'flex',
                  borderBottom: '1px solid var(--border)',
                  backgroundColor: 'var(--surface-raised)',
                  borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
                  padding: '14px 20px',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0 }}>
                  📄 تفاصيل الدرس وتفريغ الفيديو
                </h3>
                <button 
                  onClick={() => setShowDetails(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: '700' }}
                >
                  طوي ✕
                </button>
              </div>

              {/* Body Content */}
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <p style={{ fontSize: '0.92rem', color: 'var(--text-main)', lineHeight: '1.7', whiteSpace: 'pre-line', margin: 0 }}>
                  {activeLesson.description || 'لا يوجد وصف تفصيلي متوفر لهذا الدرس.'}
                </p>
                
                {/* Automated Transcript */}
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: '0.88rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', margin: '0 0 8px 0' }}>
                    <span>📝</span> تفريغ الفيديو التلقائي
                  </h4>
                  <div 
                    style={{ 
                      backgroundColor: 'var(--surface-raised)', 
                      padding: '16px', 
                      borderRadius: 'var(--radius-md)', 
                      border: '1px solid var(--border)',
                      fontSize: '0.88rem',
                      color: 'var(--text-main)',
                      lineHeight: '1.8',
                      maxHeight: '160px',
                      overflowY: 'auto'
                    }}
                  >
                    {activeLesson.transcript || 'لم يتم توليد تفريغ نصي تلقائي لهذا الفيديو بعد.'}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </main>

        {/* Panel 3: Left-Center Pane - Sibling Syllabus (Collapsible with showLessons state) */}
        <aside 
          style={{
            width: showLessons ? '280px' : '0px',
            overflow: 'hidden',
            transition: 'width 0.3s ease-in-out, border-left 0.3s ease-in-out',
            backgroundColor: 'var(--surface)',
            borderLeft: showLessons ? '1px solid var(--border)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            flexShrink: 0
          }}
        >
          {/* Fixed width clip interior wrapper */}
          <div style={{ width: '280px', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 18px',
                borderBottom: '1px solid var(--border)',
                backgroundColor: 'var(--surface-raised)'
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: '900', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                📋 منهج الكورس الدراسي ({lessons.length})
              </span>
              <button 
                onClick={() => setShowLessons(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.85rem' }}
              >
                ✕
              </button>
            </div>
            
            <div style={{ overflowY: 'auto', flex: 1, padding: '12px' }}>
              {lessons.length === 0 ? (
                <div style={{ padding: '24px 8px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>لا توجد دروس متوفرة منهجياً.</p>
                </div>
              ) : (
                lessons.map((lesson, index) => {
                  const isActive = String(lesson.id) === String(lessonId);
                  return (
                    <button
                      key={lesson.id}
                      onClick={() => navigate(`/study-room/${courseId}/lesson/${lesson.id}`)}
                      className="lesson-nav-btn"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '12px 14px',
                        margin: '2px 0',
                        border: isActive ? '1px solid var(--primary-border)' : '1px solid transparent',
                        borderRadius: 'var(--radius-md)',
                        backgroundColor: isActive ? 'var(--primary-soft)' : 'transparent',
                        textAlign: 'right',
                        cursor: 'pointer',
                        transition: 'all var(--transition-fast)'
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'var(--surface-raised)';
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span 
                        style={{ 
                          display: 'grid', 
                          placeItems: 'center', 
                          width: '22px', 
                          height: '22px', 
                          borderRadius: '50%', 
                          fontSize: '0.75rem', 
                          fontWeight: '800',
                          color: isActive ? '#ffffff' : 'var(--text-muted)',
                          backgroundColor: isActive ? 'var(--primary)' : 'var(--surface-raised)',
                          border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)'
                        }}
                      >
                        {index + 1}
                      </span>
                      <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                        <strong 
                          style={{ 
                            display: 'block', 
                            fontSize: '0.84rem', 
                            fontWeight: '700', 
                            color: isActive ? 'var(--primary)' : 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {lesson.title}
                        </strong>
                        <small style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
                          ⏱️ {lesson.duration || '00:00'}
                        </small>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </aside>

        {/* Panel 4: Leftmost Pane - Sleek, Thin VS Code-Style Activity Sidebar containing ONLY icons */}
        <aside 
          style={{
            width: '60px',
            backgroundColor: 'var(--surface-raised)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '16px 0',
            justifyContent: 'space-between',
            flexShrink: 0,
            height: '100%'
          }}
        >
          {/* Top Toggles Stack */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', alignItems: 'center' }}>
            
            {/* 1. Toggle Syllabus (قائمة الدروس) */}
            <button
              onClick={() => setShowLessons(!showLessons)}
              className="activity-btn"
              title="تفعيل/طوي قائمة الدروس"
              style={{
                color: showLessons ? 'var(--primary)' : 'var(--text-muted)',
                borderRight: showLessons ? '3px solid var(--primary)' : '3px solid transparent'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📁</span>
            </button>

            {/* 2. Toggle AI Chat (مساعد الذكاء الاصطناعي) */}
            <button
              onClick={() => setShowTutor(!showTutor)}
              className="activity-btn"
              title="تفعيل/طوي مساعد الذكاء الاصطناعي"
              style={{
                color: showTutor ? 'var(--primary)' : 'var(--text-muted)',
                borderRight: showTutor ? '3px solid var(--primary)' : '3px solid transparent'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>💬</span>
            </button>

            {/* 3. Toggle Lesson Details (تفاصيل الدرس) */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="activity-btn"
              title="تفعيل/طوي تفاصيل الدرس"
              style={{
                color: showDetails ? 'var(--primary)' : 'var(--text-muted)',
                borderRight: showDetails ? '3px solid var(--primary)' : '3px solid transparent'
              }}
            >
              <span style={{ fontSize: '1.3rem' }}>📄</span>
            </button>
          </div>

          {/* Bottom Settings Icon */}
          <div 
            style={{ 
              color: 'var(--text-muted)', 
              fontSize: '1.25rem', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              minHeight: '40px'
            }} 
            title="إعدادات مساحة التعلم"
          >
            ⚙️
          </div>
        </aside>

      </div>
    </div>
  );
}

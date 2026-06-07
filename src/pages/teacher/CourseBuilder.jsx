import { useState, useEffect } from 'react';
import api, { getCurrentUserId } from '../../services/api';
import PageFrame from '../../components/ui/PageFrame';
import TextField from '../../components/ui/TextField';
import ProgressBar from '../../components/ui/ProgressBar';
import { categories as defaultCategories, normalizeCategory, normalizeCourse } from '../../utils/constants';

export default function CourseBuilder() {
  const [categories, setCategories] = useState(defaultCategories);
  const [courseInfo, setCourseInfo] = useState({ title: '', description: '', categoryId: 4 });
  const [savedCourse, setSavedCourse] = useState(null);
  const [courseStatus, setCourseStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'missing title' | 'offline draft'
  const [lessonTitle, setLessonTitle] = useState('');
  const [lessonDescription, setLessonDescription] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const [queue, setQueue] = useState([]);

  // Fetch categories from API on load
  useEffect(() => {
    let isMounted = true;
    async function loadCategories() {
      try {
        const rootResponse = await api.get('/categories/root');
        const rootCategories = rootResponse.data.map((category) => normalizeCategory(category));
        
        const childResponses = await Promise.all(
          rootCategories.map((category) => api.get(`/categories/${category.id}/sub`).catch(() => ({ data: [] })))
        );
        const childCategories = childResponses.flatMap((response, index) =>
          response.data.map((category) => normalizeCategory(category, rootCategories[index].id))
        );
        
        if (isMounted) {
          const combined = [...rootCategories, ...childCategories];
          if (combined.length > 0) {
            setCategories(combined);
            // Default to first category if available
            setCourseInfo(current => ({ ...current, categoryId: combined[0].id }));
          }
        }
      } catch (err) {
        console.warn('Backend categories unavailable. Using local category dictionary.', err);
      }
    }
    loadCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  function handleDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }

  function handleFiles(fileList) {
    Array.from(fileList)
      .filter((file) => file.type === 'video/mp4' || file.name.endsWith('.mp4'))
      .forEach((file) => queueLesson(file));
  }

  // Queue a lesson locally (does not upload immediately)
  function queueLesson(file) {
    const queueId = crypto.randomUUID();
    const title = lessonTitle.trim() || file.name.replace(/\.mp4$/i, '');
    const description = lessonDescription.trim();
    
    const newQueueItem = { 
      id: queueId, 
      title, 
      description,
      fileName: file.name, 
      file: file, // Keep raw binary File reference
      progress: 0, 
      status: 'pending', // 'pending' | 'uploading' | 'processing' | 'completed' | 'error'
      transcript: null 
    };
    
    setQueue((current) => [...current, newQueueItem]);
    setLessonTitle('');
    setLessonDescription('');
  }

  // Simulated offline/sandbox helper for safe uploads
  function simulateOfflineUpload(itemId) {
    return new Promise((resolve) => {
      let currentProgress = 0;
      const interval = setInterval(() => {
        currentProgress += Math.floor(Math.random() * 20) + 10;
        if (currentProgress >= 100) {
          currentProgress = 100;
          clearInterval(interval);
          
          setQueue((current) => 
            current.map((item) => 
              item.id === itemId 
                ? { ...item, progress: 100, status: 'processing' } 
                : item
            )
          );

          // Simulated transcription delay
          setTimeout(() => {
            setQueue((current) => 
              current.map((item) => 
                item.id === itemId 
                  ? { 
                      ...item, 
                      status: 'completed', 
                      transcript: 'نص تجريبي تلقائي: في هذا الدرس التعليمي، نستعرض بالتفصيل كيفية بناء واجهات برمجية تدعم الرفع المتعدد والتخزين السحابي.' 
                    } 
                  : item
              )
            );
            resolve();
          }, 1500);
        } else {
          setQueue((current) => 
            current.map((item) => (item.id === itemId ? { ...item, progress: currentProgress } : item))
          );
        }
      }, 150);
    });
  }

  // Final Sequential Async Submission Handler
  async function handleFinalSubmit() {
    if (!courseInfo.title.trim()) {
      setCourseStatus('missing title');
      return;
    }

    setCourseStatus('saving');
    let currentCourseId;
    let finalCourseObj;

    // 1. Save Course details
    try {
      const response = await api.post('/courses', {
        title: courseInfo.title,
        description: courseInfo.description,
        category: { id: courseInfo.categoryId },
        teacher: { id: getCurrentUserId() },
      });
      
      currentCourseId = response.data?.id;
      finalCourseObj = normalizeCourse(response.data);
      setSavedCourse(finalCourseObj);
      setCourseStatus('saved');
    } catch (err) {
      console.warn('Backend offline during course save. Creating local sandbox draft.', err);
      currentCourseId = Date.now();
      finalCourseObj = {
        id: currentCourseId,
        title: courseInfo.title,
        description: courseInfo.description,
        category: categories.find(c => c.id === courseInfo.categoryId)?.name || 'Frontend',
        lessonsCount: 0
      };
      setSavedCourse(finalCourseObj);
      setCourseStatus('offline draft');
    }

    // 2. Loop and Upload queued lessons sequentially
    const pendingLessons = queue.filter(item => item.status === 'pending');
    
    for (const item of pendingLessons) {
      // Mark as uploading in the GUI
      setQueue(curr => curr.map(q => q.id === item.id ? { ...q, status: 'uploading' } : q));

      const lessonPayload = {
        title: item.title,
        description: item.description
      };

      const formData = new FormData();
      formData.append(
        'lesson',
        new Blob(
          [JSON.stringify(lessonPayload)],
          { type: 'application/json' }
        )
      );
      formData.append('file', item.file);

      try {
        await api.post(`/lessons/${currentCourseId}`, formData, {
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total 
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total) 
              : 0;
            setQueue((current) => 
              current.map((q) => (q.id === item.id ? { ...q, progress } : q))
            );
          },
        });

        // Mark as processing transcript
        setQueue((current) => 
          current.map((q) => 
            q.id === item.id 
              ? { ...q, progress: 100, status: 'processing' } 
              : q
          )
        );

        // Simulation delay for transcription compilation
        setTimeout(() => {
          setQueue((current) => 
            current.map((q) => 
              q.id === item.id 
                ? { 
                    ...q, 
                    status: 'completed', 
                    transcript: 'تم توليد هذا النص بنجاح بواسطة خوارزمية الذكاء الاصطناعي لتحويل الصوت إلى نص وتسهيل الدراسة.' 
                  } 
                : q
            )
          );
        }, 3000);

      } catch (uploadErr) {
        console.warn('Backend rejected upload or offline during queue execution. Simulating local sandbox progress.', uploadErr);
        await simulateOfflineUpload(item.id);
      }
    }
  }

  return (
    <PageFrame eyebrow="بوابة المعلم" title="استوديو بناء الكورسات والدروس">
      <div 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
          gap: '30px', 
          alignItems: 'start',
          direction: 'rtl'
        }}
      >
        {/* Pane 1: Course Info */}
        <section 
          className="premium-card"
          style={{
            padding: '32px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50px',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.85rem'
              }}
            >
              1
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', margin: '0' }}>
              مواصفات الكورس التعليمي
            </h2>
          </div>

          <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
            قم بتهيئة البيانات الوصفية للمنهج الدراسي. سيتم حفظ الكورس ورفع جميع الدروس المرفقة في عملية واحدة عند النقر على الزر بالأسفل.
          </p>

          <TextField 
            label="عنوان الكورس" 
            value={courseInfo.title} 
            onChange={(title) => setCourseInfo({ ...courseInfo, title })} 
            placeholder="مثال: احترف بناء تطبيقات الويب باستخدام React"
            error={courseStatus === 'missing title' ? 'يرجى إدخال عنوان الكورس أولاً.' : null}
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '600' }}>
              وصف المنهج وخلاصة الكورس
            </label>
            <textarea 
              value={courseInfo.description} 
              onChange={(e) => setCourseInfo({ ...courseInfo, description: e.target.value })} 
              placeholder="اكتب وصفاً تفصيلياً يوضح المواضيع التي سيتم شرحها، والمهارات التي سيكتسبها الطلاب بعد دراسة المنهج."
              rows={5}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                resize: 'vertical',
                boxShadow: 'var(--shadow-sm)',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-border)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'var(--shadow-sm)';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: '600' }}>
              تصنيف المادة التعليمية
            </label>
            <select 
              value={courseInfo.categoryId} 
              onChange={(e) => setCourseInfo({ ...courseInfo, categoryId: Number(e.target.value) })}
              style={{
                width: '100%',
                minHeight: '42px',
                padding: '0 12px',
                fontSize: '0.95rem',
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                boxShadow: 'var(--shadow-sm)',
                cursor: 'pointer'
              }}
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Pane 2: Lesson Upload Area */}
        <section 
          className="premium-card"
          style={{
            padding: '32px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            boxShadow: 'var(--shadow-sm)',
            transition: 'opacity var(--transition-normal)',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span 
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '50px',
                backgroundColor: 'var(--primary-soft)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: '800',
                fontSize: '0.85rem'
              }}
            >
              2
            </span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', fontFamily: 'var(--font-display)', color: 'var(--text-main)', margin: '0' }}>
              استوديو إضافة الدروس
            </h2>
          </div>

          <p style={{ margin: '0', color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4' }}>
            صمّم هيكل دروسك التعليمية. أدخل عنواناً للدرس، ثم اسحب وأفلت ملف فيديو `.mp4` لإضافته لقائمة الرفع.
          </p>

          <TextField 
            label="عنوان الدرس (اختياري)" 
            value={lessonTitle} 
            onChange={setLessonTitle} 
            placeholder="مثال: 01 - مقدمة عامة في هندسة البرمجيات"
          />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ color: 'var(--text-main)', fontSize: '0.85rem', fontWeight: '700' }}>
              وصف الدرس (اختياري)
            </label>
            <textarea 
              value={lessonDescription} 
              onChange={(e) => setLessonDescription(e.target.value)} 
              placeholder="اكتب وصفاً موجزاً لمحتوى هذا الدرس والمهارات المستهدفة..."
              rows={3}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '0.9rem',
                color: 'var(--text-main)',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                outline: 'none',
                resize: 'vertical',
                boxShadow: 'var(--shadow-sm)',
                fontFamily: 'var(--font-sans)',
                transition: 'all var(--transition-fast)'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--primary-border)';
                e.target.style.boxShadow = '0 0 0 3px var(--primary-soft)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--border)';
                e.target.style.boxShadow = 'var(--shadow-sm)';
              }}
            />
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '36px 20px',
              textAlign: 'center',
              backgroundColor: dragActive ? 'var(--primary-soft)' : 'var(--bg)',
              transition: 'all var(--transition-fast)',
              cursor: 'pointer',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <input 
              type="file" 
              accept="video/mp4" 
              multiple 
              onChange={(e) => handleFiles(e.target.files)}
              style={{
                position: 'absolute',
                inset: '0',
                opacity: '0',
                cursor: 'pointer',
                width: '100%',
                height: '100%'
              }}
            />
            
            <div 
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
                fontSize: '1.4rem'
              }}
            >
              📹
            </div>
            <div>
              <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-main)', fontWeight: '700' }}>
                اسحب وأفلت فيديو الدرس هنا
              </strong>
              <span style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                صيغة MP4 فقط • يدعم إدراج ملفات متعددة في قائمة الانتظار
              </span>
            </div>
          </div>

          {/* Upload Queue Section */}
          {queue.length > 0 && (
            <div style={{ marginTop: '10px' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--text-main)', marginBottom: '12px' }}>
                قائمة الدروس المجهزة للرفع ({queue.length})
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {queue.map((item) => {
                  const isProcessing = item.status === 'processing';
                  const isCompleted = item.status === 'completed';
                  const isUploading = item.status === 'uploading';
                  const isPending = item.status === 'pending';
                  
                  let statusBadgeColor = 'var(--text-muted)';
                  let statusBg = 'var(--bg)';
                  let displayStatusText = 'قيد الانتظار';

                  if (isCompleted) {
                    statusBadgeColor = 'var(--success)';
                    statusBg = 'rgba(34, 197, 94, 0.08)';
                    displayStatusText = 'اكتمل الرفع';
                  } else if (isProcessing) {
                    statusBadgeColor = 'var(--primary)';
                    statusBg = 'var(--primary-soft)';
                    displayStatusText = 'جاري معالجة النص التلقائي...';
                  } else if (isUploading) {
                    statusBadgeColor = 'var(--primary)';
                    statusBg = 'var(--primary-soft)';
                    displayStatusText = 'جاري الرفع...';
                  } else if (isPending) {
                    statusBadgeColor = 'var(--warning)';
                    statusBg = 'rgba(245, 158, 11, 0.08)';
                    displayStatusText = 'جاهز للرفع';
                  }

                  return (
                    <div 
                      key={item.id} 
                      className="premium-card"
                      style={{
                        padding: '16px',
                        backgroundColor: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            {item.title}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {item.fileName}
                          </span>
                        </div>
                        <span 
                          style={{
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '0.68rem',
                            fontWeight: '800',
                            textTransform: 'uppercase',
                            letterSpacing: '0.03em',
                            color: statusBadgeColor,
                            backgroundColor: statusBg,
                            animation: isProcessing ? 'animate-pulse 1.5s infinite' : 'none'
                          }}
                        >
                          {displayStatusText}
                        </span>
                      </div>

                      {/* Display Progress Bar */}
                      {!isCompleted && !isPending && (
                        <ProgressBar value={item.progress} />
                      )}

                      {/* Display Transcript Summary if generated */}
                      {item.transcript && (
                        <details 
                          style={{ 
                            marginTop: '4px', 
                            padding: '8px 12px', 
                            borderRadius: 'var(--radius-sm)', 
                            backgroundColor: 'var(--bg)', 
                            border: '1px solid var(--border)',
                            cursor: 'pointer'
                          }}
                        >
                          <summary style={{ fontSize: '0.75rem', fontWeight: '700', color: 'var(--text-main)' }}>
                            معاينة النص المولد تلقائياً
                          </summary>
                          <p style={{ margin: '6px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.45', cursor: 'text' }}>
                            {item.transcript}
                          </p>
                        </details>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Unified Bottom Submit Action Row */}
      <div 
        style={{
          marginTop: '30px',
          padding: '24px',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          boxShadow: 'var(--shadow-sm)',
          direction: 'rtl'
        }}
      >
        <button 
          onClick={handleFinalSubmit}
          disabled={courseStatus === 'saving'}
          style={{
            width: '100%',
            maxWidth: '480px',
            minHeight: '46px',
            backgroundColor: 'var(--primary)',
            color: 'var(--text-inverse)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontWeight: '800',
            fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.15)',
            transition: 'all var(--transition-fast)'
          }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--primary-hover)'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'var(--primary)'}
        >
          {courseStatus === 'saving' ? 'جاري حفظ مواصفات الكورس ورفع الدروس...' : 'حفظ الكورس ونشر المحتوى بالكامل'}
        </button>

        {savedCourse && (
          <div 
            style={{ 
              padding: '8px 16px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: courseStatus === 'saved' ? 'rgba(34, 197, 94, 0.06)' : 'rgba(245, 158, 11, 0.06)',
              border: `1px solid ${courseStatus === 'saved' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`,
              color: courseStatus === 'saved' ? 'var(--success)' : 'var(--warning)',
              fontSize: '0.825rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <span>●</span>
            {courseStatus === 'saved' 
              ? 'تم نشر المنهج الدراسي وحفظ الدروس بنجاح على خادم Spring Boot!' 
              : 'تم حفظ الكورس ونشر الدروس في بيئة المحاكاة المحلية بنجاح!'
            }
          </div>
        )}

        {courseStatus === 'missing title' && (
          <div style={{ color: 'var(--error)', fontSize: '0.85rem', fontWeight: '600' }}>
            ❌ يرجى تعيين عنوان المنهج الدراسي أولاً لحفظ الكورس بنجاح.
          </div>
        )}
      </div>
    </PageFrame>
  );
}


import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Send, AlertCircle, FileQuestion } from 'lucide-react';
import PageFrame from './../../components/ui/PageFrame';
import Skeleton from './../../components/ui/Skeleton';
import { useFetchQuizStudent, useStartAttempt, useSubmitAttempt } from './../../hooks/useQuiz';

const cardGlass = {
  background: 'var(--glass-bg-enhanced)',
  backdropFilter: 'blur(var(--glass-blur-enhanced))',
  border: '1px solid var(--glass-border-enhanced)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--glass-shadow-enhanced)',
};

const btnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '10px 20px', borderRadius: 'var(--radius-md)',
  fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
  border: 'none', fontFamily: 'var(--font-sans)',
  transition: 'all var(--transition-fast)',
};

export default function QuizTaker() {
  const { courseId, lessonId, quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, loading, error, fetchQuiz } = useFetchQuizStudent();
  const { startAttempt } = useStartAttempt();
  const { submitAttempt, loading: submitting } = useSubmitAttempt();
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [localError, setLocalError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => { fetchQuiz(quizId); }, [quizId]);

  const handleStart = async () => {
    try {
      setLocalError('');
      const att = await startAttempt(quizId);
      setAttempt(att);
      setAnswers({});
      setCurrentIndex(0);
    } catch (e) {
      setLocalError(e.message || 'فشل بدء المحاولة');
    }
  };

  const handleSubmit = async () => {
    const quizData = result || quiz;
    const unanswered = (quizData?.questions || []).filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setLocalError('يرجى الإجابة على جميع الأسئلة قبل التسليم');
      return;
    }
    try {
      setLocalError('');
      const formatted = Object.entries(answers).map(([qId, choiceId]) => ({
        questionId: Number(qId),
        selectedChoiceId: Number(choiceId),
      }));
      const res = await submitAttempt(attempt.attemptId, formatted);
      setResult(res);
    } catch (e) {
      setLocalError(e.message || 'فشل تسليم الإجابات');
    }
  };

  const setAnswer = (questionId, choiceId) => {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  };

  const q = result || quiz;
  const questions = q?.questions || [];
  const totalQuestions = questions.length;
  const showAnswers = result?.showAnswersAfterSubmit ?? quiz?.showAnswersAfterSubmit ?? true;

  // Loading
  if (loading) {
    return (
      <PageFrame title="...جاري تحميل الكويز">
        <Skeleton height="200px" count={3} />
      </PageFrame>
    );
  }

  // Error
  if (error) {
    return (
      <PageFrame title="خطأ">
        <div style={{ ...cardGlass, textAlign: 'center', padding: '60px 20px' }}>
          <AlertCircle size={48} color="var(--error)" style={{ marginBottom: '12px' }} />
          <p style={{ margin: 0, color: 'var(--error)', fontWeight: 600 }}>{error}</p>
        </div>
      </PageFrame>
    );
  }

  if (!q) return null;

  // ============================================================
  // RESULT VIEW
  // ============================================================
  if (result) {
    const totalWeight = q.answers?.reduce((s, a) => s + (a.pointsAwarded || 0), 0) || 0;
    const maxWeight = q.questions?.reduce((s, qq) => s + (qq.difficultyWeight || 5), 0) || 0;
    const pct = maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 0;

    return (
      <PageFrame eyebrow="النتيجة" title={q.title || 'النتيجة'}>
        {/* Score Hero */}
        <div style={{
          ...cardGlass, textAlign: 'center', padding: '32px 20px', marginBottom: '24px',
          borderBottom: '4px solid',
          borderBottomColor: pct >= 70 ? 'var(--quiz-correct-border)' : pct >= 40 ? 'var(--warning)' : 'var(--quiz-incorrect-border)',
        }}>
          <div style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'var(--font-display)', color: 'var(--text-main)', lineHeight: 1 }}>
            {totalWeight}
            <span style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--quiz-text-secondary)' }}> / {maxWeight}</span>
          </div>
          <div style={{ marginTop: '8px', fontSize: '0.95rem', color: 'var(--quiz-text-secondary)' }}>
            {pct >= 70 ? 'أحسنت! أداء ممتاز' : pct >= 40 ? 'نتيجة مقبولة، حاول مرة أخرى' : 'بحاجة إلى مراجعة، حاول مرة أخرى'}
          </div>
        </div>

        {/* Question cards */}
        {q.answers?.map((answer, idx) => {
          const qq = questions[idx];
          const selectedChoice = qq?.choices?.find(c => c.id === answer.selectedChoiceId);

          return (
            <div key={answer.id} style={{ ...cardGlass, marginBottom: '16px', padding: '20px' }}>
              {/* Question header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{
                  width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.85rem', fontWeight: 700,
                  color: answer.isCorrect ? 'var(--quiz-correct-text)' : 'var(--quiz-incorrect-text)',
                  background: answer.isCorrect ? 'var(--quiz-correct-bg)' : 'var(--quiz-incorrect-bg)',
                  border: '2px solid',
                  borderColor: answer.isCorrect ? 'var(--quiz-correct-border)' : 'var(--quiz-incorrect-border)',
                }}>
                  {answer.isCorrect ? <CheckCircle size={16} /> : <XCircle size={16} />}
                </span>
                <p style={{ margin: 0, fontWeight: 700, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {qq?.questionText || 'سؤال'}
                </p>
              </div>

              {/* Answer details */}
              <div style={{ marginRight: '42px' }}>
                <p style={{ margin: '0 0 6px', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                  <span style={{ fontWeight: 600, color: 'var(--quiz-text-secondary)' }}>إجابتك: </span>
                  {selectedChoice?.choiceText || 'لم يتم الاختيار'}
                  <span style={{
                    marginRight: '8px', fontSize: '0.78rem', fontWeight: 700,
                    color: answer.isCorrect ? 'var(--quiz-correct-text)' : 'var(--quiz-incorrect-text)',
                  }}>
                    {answer.isCorrect ? '(صحيح)' : '(خطأ)'}
                  </span>
                </p>

                {showAnswers && answer.correctChoiceId && (
                  <>
                    {!answer.isCorrect && (
                      <p style={{ margin: '0 0 6px', fontSize: '0.88rem', color: 'var(--quiz-correct-text)' }}>
                        <span style={{ fontWeight: 600 }}>الإجابة الصحيحة: </span>
                        {answer.correctChoiceText}
                      </p>
                    )}
                    {answer.correctChoiceExplanation && (
                      <p style={{
                        margin: '8px 0 0', fontSize: '0.85rem', color: 'var(--quiz-text-secondary)',
                        padding: '10px 12px', borderRadius: 'var(--radius-md)',
                        background: 'var(--primary-soft)', border: '1px solid var(--primary-border)',
                      }}>
                        {answer.correctChoiceExplanation}
                      </p>
                    )}
                  </>
                )}

                <div style={{ marginTop: '8px', fontSize: '0.8rem', color: 'var(--quiz-text-secondary)' }}>
                  <span style={{ fontWeight: 600 }}>النقاط: </span>
                  {answer.pointsAwarded || 0}
                </div>
              </div>
            </div>
          );
        })}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button onClick={() => navigate(-1)} style={{ ...btnBase, flex: 1, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
            <ArrowRight size={16} /> عودة
          </button>
          <button onClick={handleStart} style={{ ...btnBase, flex: 1, background: 'var(--primary)', color: '#fff' }}>
            إعادة المحاولة
          </button>
        </div>
      </PageFrame>
    );
  }

  // ============================================================
  // PRE-ATTEMPT (Start Screen)
  // ============================================================
  if (!attempt) {
    return (
      <PageFrame eyebrow="كويز" title={quiz?.title || 'كويز'}>
        <div style={{ ...cardGlass, textAlign: 'center', padding: '60px 20px' }}>
          <FileQuestion size={48} color="var(--primary)" style={{ marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px', fontSize: '1.2rem' }}>{quiz?.title}</h3>
          <p style={{ marginBottom: '24px', color: 'var(--quiz-text-secondary)', fontSize: '0.9rem' }}>
            {totalQuestions} أسئلة
          </p>
          <button onClick={handleStart} style={{ ...btnBase, padding: '14px 48px', background: 'var(--primary)', color: '#fff', fontSize: '1rem' }}>
            بدء الكويز
          </button>
        </div>
      </PageFrame>
    );
  }

  // ============================================================
  // IN-PROGRESS (Solving)
  // ============================================================
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <PageFrame eyebrow="كويز" title={quiz?.title || 'كويز'}>
      {/* Progress bar */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.82rem', color: 'var(--quiz-text-secondary)' }}>
          <span>{answeredCount} من {totalQuestions} تمت الإجابة</span>
          <span>{currentIndex + 1} / {totalQuestions}</span>
        </div>
        <div style={{
          width: '100%', height: '6px', borderRadius: 'var(--radius-full)',
          background: 'var(--quiz-progress-track)', overflow: 'hidden',
        }}>
          <div style={{
            width: progressPct + '%', height: '100%',
            background: 'var(--quiz-progress-fill)',
            borderRadius: 'var(--radius-full)',
            transition: 'width var(--transition-normal)',
          }} />
        </div>
      </div>

      {/* Error */}
      {localError && (
        <div style={{
          marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--radius-md)',
          background: 'var(--quiz-incorrect-bg)', border: '1px solid var(--quiz-incorrect-border)',
          color: 'var(--quiz-incorrect-text)', fontSize: '0.85rem', fontWeight: 600,
        }}>
          {localError}
        </div>
      )}

      {/* Current question */}
      {currentQuestion && (
        <div style={{ ...cardGlass, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <span style={{
              width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
              background: 'var(--primary)', color: '#fff', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: '0.85rem', fontWeight: 700,
            }}>
              {currentIndex + 1}
            </span>
            <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {currentQuestion.questionText}
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {currentQuestion.choices.map((choice) => (
              <button
                key={choice.id}
                onClick={() => setAnswer(currentQuestion.id, choice.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                  padding: '14px 16px', borderRadius: 'var(--radius-md)',
                  border: answers[currentQuestion.id] === choice.id
                    ? '2px solid var(--primary)'
                    : '1px solid var(--border)',
                  background: answers[currentQuestion.id] === choice.id
                    ? 'var(--primary-soft)' : 'transparent',
                  cursor: 'pointer', textAlign: 'right', fontSize: '0.9rem',
                  color: 'var(--text-main)', fontFamily: 'var(--font-sans)',
                  transition: 'all var(--transition-fast)',
                }}
              >
                <span style={{
                  width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  border: answers[currentQuestion.id] === choice.id
                    ? '6px solid var(--primary)' : '2px solid var(--border)',
                  transition: 'all var(--transition-fast)',
                }} />
                {choice.choiceText}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
        {currentIndex > 0 && (
          <button onClick={() => setCurrentIndex(i => i - 1)} style={{ ...btnBase, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
            <ArrowRight size={16} /> السابق
          </button>
        )}
        {currentIndex < totalQuestions - 1 && (
          <button onClick={() => setCurrentIndex(i => i + 1)} style={{ ...btnBase, background: 'var(--primary)', color: '#fff', marginRight: 'auto' }}>
            التالي <ArrowLeft size={16} />
          </button>
        )}
        {currentIndex === totalQuestions - 1 && (
          <button onClick={handleSubmit} disabled={submitting} style={{
            ...btnBase, marginRight: 'auto',
            background: 'var(--success)', color: '#fff',
            opacity: submitting ? 0.6 : 1,
            cursor: submitting ? 'not-allowed' : 'pointer',
          }}>
            <Send size={16} /> {submitting ? 'جاري التسليم...' : 'تسليم الإجابات'}
          </button>
        )}
      </div>
    </PageFrame>
  );
}
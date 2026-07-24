import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Plus, Send, Trash2, CheckCircle, XCircle, AlertTriangle, Eye, Pencil
} from 'lucide-react';
import PageFrame from './../../components/ui/PageFrame';
import Skeleton from './../../components/ui/Skeleton';
import { normalizeQuiz } from './../../utils/constants';
import {
  useFetchQuiz, usePublishQuiz,
  useAddQuestion, useUpdateQuestion, useDeleteQuestion,
} from './../../hooks/useQuiz';
import QuestionModal from './components/QuestionModal';

const cardGlass = {
  background: 'var(--glass-bg-enhanced)',
  backdropFilter: 'blur(var(--glass-blur-enhanced))',
  border: '1px solid var(--glass-border-enhanced)',
  borderRadius: 'var(--radius-lg)',
  boxShadow: 'var(--glass-shadow-enhanced)',
};

const btnBase = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
  padding: '8px 16px', borderRadius: 'var(--radius-md)',
  fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
  border: 'none', fontFamily: 'var(--font-sans)',
  transition: 'all var(--transition-fast)',
};

export default function QuizEditor() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const { quiz, loading, fetchQuiz, setQuiz } = useFetchQuiz();
  const { publishQuiz } = usePublishQuiz();
  const { addQuestion } = useAddQuestion();
  const { updateQuestion } = useUpdateQuestion();
  const { deleteQuestion } = useDeleteQuestion();
  const [questionModal, setQuestionModal] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublish, setConfirmPublish] = useState(false);

  useEffect(() => { fetchQuiz(quizId); }, [quizId]);

  const q = quiz ? normalizeQuiz(quiz) : null;
  const isDraft = q?.status === 'DRAFT';

  const handlePublish = async () => {
    if (!confirmPublish) {
      setConfirmPublish(true);
      return;
    }
    if (!q || q.questions.length === 0) return;
    setPublishing(true);
    try {
      const updated = await publishQuiz(quizId);
      setQuiz(updated);
      setConfirmPublish(false);
    } catch (e) {
      alert(e.message || 'فشل النشر');
    } finally {
      setPublishing(false);
    }
  };

  const handleAddQuestion = async (form) => {
    const updated = await addQuestion(quizId, {
      questionText: form.questionText,
      difficultyWeight: form.difficultyWeight,
      explanation: form.explanation,
      choices: form.choices.map((c) => ({ choiceText: c.choiceText, isCorrect: c.isCorrect })),
    });
    setQuiz(updated);
  };

  const handleUpdateQuestion = async (form) => {
    const updated = await updateQuestion(quizId, questionModal.id, {
      questionText: form.questionText,
      difficultyWeight: form.difficultyWeight,
      explanation: form.explanation,
      choices: form.choices.map((c) => ({ choiceText: c.choiceText, isCorrect: c.isCorrect })),
    });
    setQuiz(updated);
  };

  const handleDelete = async (questionId) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا السؤال؟')) return;
    try {
      await deleteQuestion(quizId, questionId);
      fetchQuiz(quizId);
    } catch (e) {
      alert(e.message || 'فشل الحذف');
    }
  };

  const backUrl = new URLSearchParams(window.location.search);
  const backPath = backUrl.get('courseId')
    ? `/teacher/quiz-manager/${backUrl.get('courseId')}/${backUrl.get('lessonId')}`
    : '/teacher/manage-lessons';

  if (loading) {
    return (
      <PageFrame title="...جاري التحميل">
        <Skeleton height="120px" count={3} />
      </PageFrame>
    );
  }

  if (!q) {
    return (
      <PageFrame title="الكويز غير موجود">
        <div style={{ ...cardGlass, textAlign: 'center', padding: '60px 20px' }}>
          <p style={{ margin: 0, color: 'var(--text-muted)' }}>لم يتم العثور على هذا الكويز</p>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame
      eyebrow="مراجعة الكويز"
      title={q.title}
      actions={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate(backPath)} style={{ ...btnBase, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
            <ArrowRight size={14} /> عودة
          </button>
          {isDraft && (
            <>
              <button onClick={() => setQuestionModal('new')} style={{ ...btnBase, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                <Plus size={14} /> إضافة سؤال
              </button>
              <button
                onClick={handlePublish}
                disabled={publishing || q.questions.length === 0}
                style={{
                  ...btnBase,
                  background: confirmPublish ? 'var(--error)' : 'var(--success)',
                  color: '#fff',
                  opacity: (publishing || q.questions.length === 0) ? 0.6 : 1,
                  cursor: (publishing || q.questions.length === 0) ? 'not-allowed' : 'pointer',
                }}
              >
                {publishing ? '...نشر' : confirmPublish ? 'تأكيد النشر' : 'نشر الكويز'}
              </button>
            </>
          )}
        </div>
      }
    >
      {/* Quiz status bar */}
      <div style={{ ...cardGlass, padding: '16px 20px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '0.78rem', fontWeight: 700, padding: '4px 14px',
          borderRadius: 'var(--radius-full)',
          background: isDraft ? 'var(--warning-soft)' : 'var(--quiz-correct-bg)',
          color: isDraft ? '#92400e' : 'var(--quiz-correct-text)',
          border: '1px solid',
          borderColor: isDraft ? 'var(--warning-border)' : 'var(--quiz-correct-border)',
        }}>
          {isDraft ? <AlertTriangle size={14} /> : <CheckCircle size={14} />}
          {isDraft ? 'مسودة' : 'منشور'}
        </span>
        <span style={{ fontSize: '0.85rem', color: 'var(--quiz-text-secondary)' }}>
          عدد الأسئلة: {q.questions.length}
        </span>
        {isDraft && q.questions.length === 0 && (
          <span style={{ fontSize: '0.82rem', color: 'var(--error)', fontWeight: 600 }}>
            أضف سؤالاً واحداً على الأقل قبل النشر
          </span>
        )}
      </div>

      {questionModal && (
        <QuestionModal
          question={questionModal === 'new' ? null : questionModal}
          onClose={() => setQuestionModal(null)}
          onSave={questionModal === 'new' ? handleAddQuestion : handleUpdateQuestion}
        />
      )}

      {q.questions.length === 0 ? (
        <div style={{ ...cardGlass, textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ margin: 0, color: 'var(--quiz-text-secondary)' }}>
            لا توجد أسئلة في هذا الكويز. استخدم "إضافة سؤال" لإضافة الأسئلة.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {q.questions.map((question, idx) => (
            <div key={question.id} style={{ ...cardGlass, padding: '20px' }}>
              {/* Question header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{
                    width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                    background: 'var(--primary)', color: '#fff', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.85rem', fontWeight: 700,
                  }}>{idx + 1}</span>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>{question.questionText}</h3>
                </div>
                <span style={{
                  fontSize: '0.75rem', fontWeight: 700, padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-raised)',
                  color: 'var(--quiz-text-secondary)',
                  whiteSpace: 'nowrap',
                }}>
                  {question.difficultyWeight} نقطة
                </span>
              </div>

              {/* Choices grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px', marginBottom: '12px' }}>
                {question.choices.map((choice) => (
                  <div key={choice.id} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 12px', borderRadius: 'var(--radius-md)',
                    border: '1px solid',
                    borderColor: choice.isCorrect ? 'var(--quiz-correct-border)' : 'var(--border)',
                    background: choice.isCorrect ? 'var(--quiz-correct-bg)' : 'transparent',
                  }}>
                    {choice.isCorrect
                      ? <CheckCircle size={16} color="var(--quiz-correct-text)" />
                      : <XCircle size={16} color="var(--text-muted)" />
                    }
                    <span style={{ fontSize: '0.88rem', color: choice.isCorrect ? 'var(--quiz-correct-text)' : 'var(--text-main)' }}>
                      {choice.choiceText}
                    </span>
                  </div>
                ))}
              </div>

              {/* Explanation */}
              {question.explanation && (
                <div style={{
                  padding: '10px 14px', borderRadius: 'var(--radius-md)',
                  background: 'var(--primary-soft)', fontSize: '0.85rem',
                  border: '1px solid var(--primary-border)',
                  color: 'var(--quiz-highlight)',
                  marginBottom: '12px',
                }}>
                  <span style={{ fontWeight: 700 }}>تفسير: </span>
                  {question.explanation}
                </div>
              )}

              {/* Actions */}
              {isDraft && (
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-start' }}>
                  <button onClick={() => setQuestionModal(question)} style={{ ...btnBase, background: 'transparent', color: 'var(--text-main)', border: '1px solid var(--border)' }}>
                    <Pencil size={14} /> تعديل
                  </button>
                  <button onClick={() => handleDelete(question.id)} style={{ ...btnBase, background: 'transparent', color: 'var(--error)', border: '1px solid var(--quiz-incorrect-border)' }}>
                    <Trash2 size={14} /> حذف
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </PageFrame>
  );
}
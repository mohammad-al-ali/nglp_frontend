import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Trash2, CheckCircle, XCircle, AlertTriangle, Pencil, Unplug } from 'lucide-react';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import BackLink from '@/components/ui/back-link';
import EmptyState from '@/components/ui/empty-state';
import ConfirmDialog from '@/components/ui/confirm-dialog';
import { cn } from '@/lib/utils';
import { normalizeQuiz } from '../../utils/constants';
import { useFetchQuiz, usePublishQuiz, useAddQuestion, useUpdateQuestion, useDeleteQuestion } from '../../hooks/useQuiz';
import QuestionModal from './components/QuestionModal';
import { notify } from '@/lib/toast';
import { SUCCESS } from '@/lib/messages';

export default function QuizEditor() {
  const { quizId } = useParams();
  const { quiz, loading, fetchQuiz, setQuiz } = useFetchQuiz();
  const { publishQuiz } = usePublishQuiz();
  const { addQuestion } = useAddQuestion();
  const { updateQuestion } = useUpdateQuestion();
  const { deleteQuestion } = useDeleteQuestion();
  const [questionModal, setQuestionModal] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [confirmPublishOpen, setConfirmPublishOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [actionError, setActionError] = useState(null);

  useEffect(() => {
    fetchQuiz(quizId);
  }, [quizId]);

  const q = quiz ? normalizeQuiz(quiz) : null;
  const isDraft = q?.status === 'DRAFT';

  async function handlePublish() {
    setActionError(null);
    setPublishing(true);
    try {
      const updated = await publishQuiz(quizId);
      setQuiz(updated);
      notify.success(SUCCESS.QUIZ_PUBLISHED);
    } catch (e) {
      setActionError(e.message || 'تعذّر نشر الاختبار.');
      notify.error(e.message || 'تعذّر نشر الاختبار.');
    } finally {
      setPublishing(false);
    }
  }

  async function handleAddQuestion(form) {
    const updated = await addQuestion(quizId, {
      questionText: form.questionText,
      difficultyWeight: form.difficultyWeight,
      explanation: form.explanation,
      choices: form.choices.map((c) => ({ choiceText: c.choiceText, isCorrect: c.isCorrect })),
    });
    setQuiz(updated);
    notify.success(SUCCESS.QUESTION_SAVED);
  }

  async function handleUpdateQuestion(form) {
    const updated = await updateQuestion(quizId, questionModal.id, {
      questionText: form.questionText,
      difficultyWeight: form.difficultyWeight,
      explanation: form.explanation,
      choices: form.choices.map((c) => ({ choiceText: c.choiceText, isCorrect: c.isCorrect })),
    });
    setQuiz(updated);
    notify.success(SUCCESS.QUESTION_SAVED);
  }

  async function handleConfirmDeleteQuestion() {
    try {
      await deleteQuestion(quizId, deleteTarget.id);
      await fetchQuiz(quizId);
      setActionError(null);
      notify.success(SUCCESS.QUESTION_DELETED);
    } catch (e) {
      setActionError(e.message || 'تعذّر حذف السؤال.');
      notify.error(e.message || 'تعذّر حذف السؤال.');
      throw e;
    }
  }

  const backParams = new URLSearchParams(window.location.search);
  const backPath = backParams.get('courseId')
    ? `/teacher/quiz-manager/${backParams.get('courseId')}/${backParams.get('lessonId')}`
    : '/teacher/manage-lessons';

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="جاري التحميل..." />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-32 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (!q) {
    return (
      <PageShell>
        <PageHeader title="الكويز غير موجود" />
        <EmptyState icon={Unplug} title="لم يتم العثور على هذا الكويز" description="ربما تم حذفه أو أن الرابط غير صحيح." />
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageHeader
        eyebrow="مراجعة الاختبار"
        title={q.title}
        actions={
          <div className="flex items-center gap-2">
            <BackLink to={backPath}>عودة</BackLink>
            {isDraft && (
              <>
                <Button variant="outline" onClick={() => setQuestionModal('new')}>
                  <Plus className="size-4" />
                  إضافة سؤال
                </Button>
                <Button
                  onClick={() => setConfirmPublishOpen(true)}
                  disabled={publishing || q.questions.length === 0}
                  className="bg-success hover:bg-success/90"
                >
                  نشر الكويز
                </Button>
              </>
            )}
          </div>
        }
      />

      <Card className="mb-6 flex flex-wrap items-center gap-4 p-5">
        <Badge variant={isDraft ? 'warning' : 'success'} className="gap-1.5">
          {isDraft ? <AlertTriangle className="size-3.5" /> : <CheckCircle className="size-3.5" />}
          {isDraft ? 'مسودة' : 'منشور'}
        </Badge>
        <span className="text-sm text-muted-foreground">عدد الأسئلة: {q.questions.length}</span>
        {isDraft && q.questions.length === 0 && (
          <span className="text-sm font-medium text-error">أضف سؤالاً واحداً على الأقل قبل النشر</span>
        )}
      </Card>

      {actionError && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {questionModal && (
        <QuestionModal
          question={questionModal === 'new' ? null : questionModal}
          onClose={() => setQuestionModal(null)}
          onSave={questionModal === 'new' ? handleAddQuestion : handleUpdateQuestion}
        />
      )}

      {q.questions.length === 0 ? (
        <EmptyState icon={AlertTriangle} title="لا توجد أسئلة في هذا الكويز" description={'استخدم "إضافة سؤال" لإضافة الأسئلة.'} />
      ) : (
        <div className="flex flex-col gap-4">
          {q.questions.map((question, idx) => (
            <Card key={question.id} className="p-5">
              <div className="mb-3 flex items-start justify-between gap-4">
                <div className="flex items-center gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                  <h3 className="text-sm font-semibold text-foreground">{question.questionText}</h3>
                </div>
                <span className="shrink-0 whitespace-nowrap rounded-sm bg-surface-raised px-2.5 py-1 text-xs font-bold text-muted-foreground">
                  {question.difficultyWeight} نقطة
                </span>
              </div>

              <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {question.choices.map((choice) => (
                  <div
                    key={choice.id}
                    className={cn(
                      'flex items-center gap-2 rounded-md border px-3 py-2.5',
                      choice.isCorrect ? 'border-success-border bg-success-soft' : 'border-border'
                    )}
                  >
                    {choice.isCorrect ? (
                      <CheckCircle className="size-4 shrink-0 text-success" />
                    ) : (
                      <XCircle className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className={cn('text-sm', choice.isCorrect ? 'text-success' : 'text-foreground')}>
                      {choice.choiceText}
                    </span>
                  </div>
                ))}
              </div>

              {question.explanation && (
                <div className="mb-3 rounded-md border border-primary-border bg-primary-soft px-3.5 py-2.5 text-sm text-primary">
                  <span className="font-semibold">تفسير: </span>
                  {question.explanation}
                </div>
              )}

              {isDraft && (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setQuestionModal(question)}>
                    <Pencil className="size-3.5" />
                    تعديل
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-error-border text-error hover:bg-error-soft"
                    onClick={() => setDeleteTarget({ id: question.id })}
                  >
                    <Trash2 className="size-3.5" />
                    حذف
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={confirmPublishOpen}
        onOpenChange={setConfirmPublishOpen}
        title="نشر الكويز"
        description="بعد النشر، لن تتمكن من تعديل أو حذف أسئلة هذا الكويز. هل تريد المتابعة؟"
        confirmLabel="نشر"
        onConfirm={handlePublish}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="حذف السؤال"
        description="هل أنت متأكد من حذف هذا السؤال؟"
        confirmLabel="حذف"
        destructive
        onConfirm={handleConfirmDeleteQuestion}
      />
    </PageShell>
  );
}

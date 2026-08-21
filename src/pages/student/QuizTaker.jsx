import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft, Send, AlertCircle, FileQuestion } from 'lucide-react';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useFetchQuizStudent, useStartAttempt, useSubmitAttempt } from '../../hooks/useQuiz';

export default function QuizTaker() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { quiz, loading, error, fetchQuiz } = useFetchQuizStudent();
  const { startAttempt } = useStartAttempt();
  const { submitAttempt, loading: submitting } = useSubmitAttempt();
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [localError, setLocalError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchQuiz(quizId);
  }, [quizId]);

  async function handleStart() {
    try {
      setLocalError('');
      const att = await startAttempt(quizId);
      setAttempt(att);
      setAnswers({});
      setCurrentIndex(0);
    } catch (e) {
      setLocalError(e.message || 'فشل بدء المحاولة');
    }
  }

  async function handleSubmit() {
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
  }

  function setAnswer(questionId, choiceId) {
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
  }

  const q = result || quiz;
  const questions = q?.questions || [];
  const totalQuestions = questions.length;
  const showAnswers = result?.showAnswersAfterSubmit ?? quiz?.showAnswersAfterSubmit ?? true;

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="جاري تحميل الكويز..." />
        <div className="flex flex-col gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-40 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader title="خطأ" />
        <EmptyState icon={AlertCircle} title="تعذر تحميل الكويز" description={error} />
      </PageShell>
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
    const tone = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error';

    return (
      <PageShell>
        <PageHeader eyebrow="النتيجة" title={q.title || 'النتيجة'} />

        <Card
          className={cn(
            'mb-6 border-b-4 p-8 text-center',
            tone === 'success' && 'border-b-success',
            tone === 'warning' && 'border-b-warning',
            tone === 'error' && 'border-b-error'
          )}
        >
          <div className="font-display text-5xl font-semibold leading-none text-foreground">
            {totalWeight}
            <span className="text-2xl font-medium text-muted-foreground"> / {maxWeight}</span>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {pct >= 70 ? 'أحسنت! أداء ممتاز' : pct >= 40 ? 'نتيجة مقبولة، حاول مرة أخرى' : 'بحاجة إلى مراجعة، حاول مرة أخرى'}
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          {q.answers?.map((answer, idx) => {
            const qq = questions[idx];
            const selectedChoice = qq?.choices?.find((c) => c.id === answer.selectedChoiceId);

            return (
              <Card key={answer.id} className="p-5">
                <div className="mb-3 flex items-center gap-2.5">
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border-2',
                      answer.isCorrect ? 'border-success-border bg-success-soft text-success' : 'border-error-border bg-error-soft text-error'
                    )}
                  >
                    {answer.isCorrect ? <CheckCircle className="size-4" /> : <XCircle className="size-4" />}
                  </span>
                  <p className="text-sm font-semibold text-foreground">{qq?.questionText || 'سؤال'}</p>
                </div>

                <div className="ps-[42px]">
                  <p className="mb-1.5 text-sm text-foreground">
                    <span className="font-medium text-muted-foreground">إجابتك: </span>
                    {selectedChoice?.choiceText || 'لم يتم الاختيار'}
                    <span className={cn('ms-2 text-xs font-bold', answer.isCorrect ? 'text-success' : 'text-error')}>
                      {answer.isCorrect ? '(صحيح)' : '(خطأ)'}
                    </span>
                  </p>

                  {showAnswers && answer.correctChoiceId && (
                    <>
                      {!answer.isCorrect && (
                        <p className="mb-1.5 text-sm text-success">
                          <span className="font-medium">الإجابة الصحيحة: </span>
                          {answer.correctChoiceText}
                        </p>
                      )}
                      {answer.correctChoiceExplanation && (
                        <p className="mt-2 rounded-md border border-primary-border bg-primary-soft px-3 py-2.5 text-sm text-primary">
                          {answer.correctChoiceExplanation}
                        </p>
                      )}
                    </>
                  )}

                  <div className="mt-2 text-xs text-muted-foreground">
                    <span className="font-medium">النقاط: </span>
                    {answer.pointsAwarded || 0}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
            <ArrowRight className="size-4" />
            عودة
          </Button>
          <Button className="flex-1" onClick={handleStart}>
            إعادة المحاولة
          </Button>
        </div>
      </PageShell>
    );
  }

  // ============================================================
  // PRE-ATTEMPT (Start Screen)
  // ============================================================
  if (!attempt) {
    return (
      <PageShell>
        <PageHeader eyebrow="كويز" title={quiz?.title || 'كويز'} />
        <EmptyState
          icon={FileQuestion}
          title={quiz?.title}
          description={`${totalQuestions} أسئلة`}
          action={
            <Button size="lg" onClick={handleStart} className="mt-1">
              بدء الكويز
            </Button>
          }
        />
      </PageShell>
    );
  }

  // ============================================================
  // IN-PROGRESS (Solving)
  // ============================================================
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <PageShell>
      <PageHeader eyebrow="كويز" title={quiz?.title || 'كويز'} />

      <div className="mb-5">
        <div className="mb-1.5 flex justify-between text-sm text-muted-foreground">
          <span>{answeredCount} من {totalQuestions} تمت الإجابة</span>
          <span>{currentIndex + 1} / {totalQuestions}</span>
        </div>
        <Progress value={progressPct} />
      </div>

      {localError && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}

      {currentQuestion && (
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              {currentIndex + 1}
            </span>
            <h3 className="text-base font-semibold text-foreground">{currentQuestion.questionText}</h3>
          </div>

          <div className="flex flex-col gap-2.5">
            {currentQuestion.choices.map((choice) => {
              const isSelected = answers[currentQuestion.id] === choice.id;
              return (
                <button
                  key={choice.id}
                  type="button"
                  onClick={() => setAnswer(currentQuestion.id, choice.id)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md border px-4 py-3.5 text-start text-sm transition-all duration-200 ease-in-out',
                    isSelected ? 'border-2 border-primary bg-primary-soft text-foreground' : 'border-border text-foreground hover:bg-surface-raised'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-[22px] shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200 ease-in-out',
                      isSelected ? 'border-[6px] border-primary' : 'border-border'
                    )}
                  />
                  {choice.choiceText}
                </button>
              );
            })}
          </div>
        </Card>
      )}

      <div className="mt-5 flex gap-3">
        {currentIndex > 0 && (
          <Button variant="outline" onClick={() => setCurrentIndex((i) => i - 1)}>
            <ArrowRight className="size-4" />
            السابق
          </Button>
        )}
        {currentIndex < totalQuestions - 1 && (
          <Button className="ms-auto" onClick={() => setCurrentIndex((i) => i + 1)}>
            التالي
            <ArrowLeft className="size-4" />
          </Button>
        )}
        {currentIndex === totalQuestions - 1 && (
          <Button className="ms-auto bg-success hover:bg-success/90" disabled={submitting} onClick={handleSubmit}>
            <Send className="size-4" />
            {submitting ? 'جاري التسليم...' : 'تسليم الإجابات'}
          </Button>
        )}
      </div>
    </PageShell>
  );
}

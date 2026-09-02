import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, ArrowRight, ArrowLeft, Send, AlertCircle, FileQuestion, Lightbulb } from 'lucide-react';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { useFetchQuizStudent, useCheckAnswer, useStartAttempt, useSubmitAttempt } from '../../hooks/useQuiz';
import { notify } from '@/lib/toast';
import { SUCCESS } from '@/lib/messages';

const CHOICE_LETTERS = ['أ', 'ب', 'ج', 'د'];

export default function QuizTaker() {
  const navigate = useNavigate();
  const { quizId } = useParams();
  const { quiz, loading, error, fetchQuiz } = useFetchQuizStudent();
  const { startAttempt } = useStartAttempt();
  const { checkAnswer, loading: checking } = useCheckAnswer();
  const { submitAttempt, loading: submitting } = useSubmitAttempt();
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [checkedResults, setCheckedResults] = useState({});
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
      setCheckedResults({});
      setResult(null);
      setCurrentIndex(0);
    } catch (e) {
      setLocalError(e.message || 'فشل بدء المحاولة');
    }
  }

  async function handleSelectChoice(question, choice) {
    if (checkedResults[question.id] || checking) return;

    setAnswers((prev) => ({ ...prev, [question.id]: choice.id }));
    try {
      setLocalError('');
      const res = await checkAnswer(question.id, choice.id);
      setCheckedResults((prev) => ({ ...prev, [question.id]: res }));
    } catch (e) {
      setLocalError(e.message || 'تعذر التحقق من الإجابة');
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[question.id];
        return next;
      });
    }
  }

  async function handleSubmit() {
    const unanswered = questions.filter((qq) => !answers[qq.id]);
    if (unanswered.length > 0) {
      const message = `يرجى الإجابة على جميع الأسئلة قبل التسليم (${unanswered.length} بلا إجابة).`;
      setLocalError(message);
      notify.warning(message);
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
      notify.success(SUCCESS.QUIZ_SUBMITTED(res?.score ?? ''));
    } catch (e) {
      const message = e.message || 'تعذّر تسليم الإجابات.';
      setLocalError(message);
      notify.error(message);
    }
  }

  const questions = quiz?.questions || [];
  const totalQuestions = questions.length;
  const showAnswers = result?.showAnswersAfterSubmit ?? quiz?.showAnswersAfterSubmit ?? true;

  if (loading) {
    return (
      <PageShell>
        <PageHeader title="جاري تحميل الاختبار..." />
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
        <EmptyState icon={AlertCircle} title="تعذر تحميل الاختبار" description={error} />
      </PageShell>
    );
  }

  if (!quiz) return null;

  // ============================================================
  // RESULT VIEW
  // ============================================================
  if (result) {
    const totalWeight = result.answers?.reduce((s, a) => s + (a.pointsAwarded || 0), 0) || 0;
    const maxWeight = questions.reduce((s, qq) => s + (qq.difficultyWeight || 5), 0) || 0;
    const pct = maxWeight > 0 ? Math.round((totalWeight / maxWeight) * 100) : 0;
    const tone = pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error';

    return (
      <PageShell>
        <PageHeader eyebrow="النتيجة" title={quiz.title || 'النتيجة'} />

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
          {result.answers?.map((answer, idx) => {
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
                    {answer.isCorrect ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
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
        <PageHeader eyebrow="اختبار" title={quiz.title || 'اختبار'} />
        <EmptyState
          icon={FileQuestion}
          title={quiz.title}
          description={`${totalQuestions} أسئلة`}
          action={
            <Button size="lg" onClick={handleStart} className="mt-1">
              بدء الاختبار
            </Button>
          }
        />
      </PageShell>
    );
  }

  // ============================================================
  // IN-PROGRESS (Solving, one question at a time with instant feedback)
  // ============================================================
  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(checkedResults).length;
  const progressPct = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  const currentChecked = currentQuestion ? checkedResults[currentQuestion.id] : null;
  const currentSelectedChoiceId = currentQuestion ? answers[currentQuestion.id] : null;
  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <PageShell>
      <PageHeader eyebrow="اختبار" title={quiz.title || 'اختبار'} />

      <div className="mb-6">
        <div className="mb-1.5 flex justify-between text-sm text-muted-foreground">
          <span>{answeredCount} من {totalQuestions} تمت الإجابة</span>
          <span>السؤال {currentIndex + 1} / {totalQuestions}</span>
        </div>
        <Progress value={progressPct} />
      </div>

      {localError && (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{localError}</AlertDescription>
        </Alert>
      )}

      {currentQuestion && (
        <Card className="p-6 sm:p-8">
          <h3 className="mb-6 text-lg font-bold leading-relaxed text-foreground">{currentQuestion.questionText}</h3>

          <div className="flex flex-col gap-3">
            {currentQuestion.choices.map((choice, choiceIdx) => {
              const isSelected = currentSelectedChoiceId === choice.id;
              const isAnswered = Boolean(currentChecked);
              const isCorrectChoice = currentChecked && choice.id === currentChecked.correctChoiceId;
              const revealCorrect = isSelected && currentChecked?.isCorrect;
              const revealWrong = isSelected && currentChecked && !currentChecked.isCorrect;
              const revealMissedCorrect = !isSelected && isCorrectChoice;

              return (
                <button
                  key={choice.id}
                  type="button"
                  disabled={isAnswered || checking}
                  onClick={() => handleSelectChoice(currentQuestion, choice)}
                  className={cn(
                    'flex w-full items-center gap-3.5 rounded-xl border-2 px-4 py-4 text-start text-sm transition-all duration-200 ease-in-out',
                    !isAnswered && 'border-border text-foreground hover:border-primary-border hover:bg-primary-soft/40',
                    isAnswered && !isSelected && !revealMissedCorrect && 'border-border text-muted-foreground opacity-60',
                    revealCorrect && 'border-success bg-success-soft text-success',
                    revealWrong && 'border-error bg-error-soft text-error',
                    revealMissedCorrect && 'border-success bg-success-soft/60 text-success',
                    checking && !isSelected && 'opacity-60'
                  )}
                >
                  <span
                    className={cn(
                      'flex size-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold transition-all duration-200 ease-in-out',
                      !isAnswered && 'border-border text-muted-foreground',
                      isAnswered && !isSelected && !revealMissedCorrect && 'border-border text-muted-foreground',
                      revealCorrect && 'border-success bg-success text-white',
                      revealWrong && 'border-error bg-error text-white',
                      revealMissedCorrect && 'border-success bg-success text-white'
                    )}
                  >
                    {revealCorrect || revealMissedCorrect ? <CheckCircle2 className="size-4" /> : revealWrong ? <XCircle className="size-4" /> : CHOICE_LETTERS[choiceIdx] || choiceIdx + 1}
                  </span>
                  <span className="flex-1">{choice.choiceText}</span>
                </button>
              );
            })}
          </div>

          {currentChecked && (
            <div
              className={cn(
                'mt-5 flex items-start gap-2.5 rounded-lg border px-4 py-3.5 text-sm',
                currentChecked.isCorrect ? 'border-success-border bg-success-soft text-success' : 'border-error-border bg-error-soft text-error'
              )}
            >
              {currentChecked.isCorrect ? <CheckCircle2 className="mt-0.5 size-4 shrink-0" /> : <XCircle className="mt-0.5 size-4 shrink-0" />}
              <div>
                <p className="font-bold">{currentChecked.isCorrect ? 'إجابة صحيحة!' : 'إجابة غير صحيحة'}</p>
                {currentChecked.explanation && (
                  <p className="mt-1.5 flex items-start gap-1.5 font-normal text-foreground">
                    <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                    {currentChecked.explanation}
                  </p>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      <div className="mt-5 flex gap-3">
        {currentIndex > 0 && (
          <Button variant="outline" onClick={() => setCurrentIndex((i) => i - 1)}>
            <ArrowRight className="size-4" />
            السابق
          </Button>
        )}
        {!isLastQuestion && (
          <Button className="ms-auto" disabled={!currentChecked} onClick={() => setCurrentIndex((i) => i + 1)}>
            التالي
            <ArrowLeft className="size-4" />
          </Button>
        )}
        {isLastQuestion && (
          <Button className="ms-auto bg-success hover:bg-success/90" disabled={!currentChecked || submitting} onClick={handleSubmit}>
            <Send className="size-4" />
            {submitting ? 'جاري التسليم...' : 'إنهاء الاختبار'}
          </Button>
        )}
      </div>
    </PageShell>
  );
}

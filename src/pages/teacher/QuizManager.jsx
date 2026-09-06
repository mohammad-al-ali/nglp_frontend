import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Eye, FileQuestion, Unplug, Users, TrendingUp, ChevronDown } from 'lucide-react';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { normalizeQuiz, normalizeQuizStats } from '../../utils/constants';
import { useFetchQuizzes, useFetchQuizStats } from '../../hooks/useQuiz';
import GenerateQuizModal from './components/GenerateQuizModal';
import { getStoredUser } from '../../services/api';

const LTR = 'inline-block [direction:ltr]';

export default function QuizManager() {
  const { courseId, lessonId } = useParams();
  const { quizzes, loading, error, fetchQuizzes } = useFetchQuizzes(lessonId);
  const { statsByQuiz, fetchStats } = useFetchQuizStats();
  const [showGenerate, setShowGenerate] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const user = getStoredUser();

  useEffect(() => {
    fetchQuizzes();
  }, [lessonId]);

  useEffect(() => {
    quizzes.forEach((raw) => fetchStats(normalizeQuiz(raw).id));
  }, [quizzes, fetchStats]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="إدارة الاختبارات"
        title="الاختبارات"
        actions={
          <Button onClick={() => setShowGenerate(true)}>
            <Sparkles className="size-4" />
            توليد اختبار
          </Button>
        }
      />

      {showGenerate && (
        <GenerateQuizModal
          lessonId={lessonId}
          teacherId={user?.id}
          onClose={() => setShowGenerate(false)}
          onGenerated={() => fetchQuizzes()}
        />
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      ) : error ? (
        <EmptyState icon={Unplug} title="تعذر تحميل الاختبارات" description="حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى." />
      ) : quizzes.length === 0 ? (
        <EmptyState
          icon={FileQuestion}
          title="لا توجد اختبارات بعد"
          description={'استخدم "توليد اختبار" لإنشاء أول اختبار لهذا الدرس.'}
        />
      ) : (
        <div className="flex flex-col gap-3">
          {quizzes.map((raw) => {
            const q = normalizeQuiz(raw);
            const isDraft = q.status === 'DRAFT';
            const stats = statsByQuiz[q.id] ? normalizeQuizStats(statsByQuiz[q.id]) : null;
            const expanded = expandedId === q.id;
            return (
              <Card key={q.id} className="flex flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="mb-1.5 flex items-center gap-2.5">
                      <h3 className="font-display text-base font-semibold text-foreground">{q.title}</h3>
                      <Badge variant={isDraft ? 'warning' : 'success'}>{isDraft ? 'مسودة' : 'منشور'}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{q.questions?.length || 0} أسئلة</span>
                      {q.createdAt && <span>{new Date(q.createdAt).toLocaleDateString('en-US')}</span>}
                    </div>
                  </div>
                  <Button
                    as={Link}
                    to={`/teacher/quizzes/${q.id}?courseId=${courseId}&lessonId=${lessonId}`}
                    variant="outline"
                    size="sm"
                  >
                    <Eye className="size-3.5" />
                    معاينة
                  </Button>
                </div>

                {/* ── إحصاء الأداء ── */}
                {stats && (
                  <div className="flex flex-col gap-2 rounded-md border border-border bg-surface-raised p-3">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs font-semibold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <FileQuestion className="size-3.5 text-muted-foreground" />
                        <span className={LTR}>{stats.attemptsCount}</span> محاولة
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="size-3.5 text-muted-foreground" />
                        <span className={LTR}>
                          {stats.distinctStudentsAttempted}/{stats.enrolledStudentsCount}
                        </span>{' '}
                        طالب حاول
                      </span>
                      <span className="flex items-center gap-1.5">
                        <TrendingUp className="size-3.5 text-muted-foreground" />
                        متوسط <span className={cn('text-primary', LTR)}>{stats.avgScorePercent}%</span>
                      </span>
                    </div>

                    {stats.notAttempted.length > 0 && (
                      <div>
                        <button
                          type="button"
                          onClick={() => setExpandedId(expanded ? null : q.id)}
                          className="flex items-center gap-1 text-xs font-bold text-primary"
                        >
                          <ChevronDown className={cn('size-3.5 transition-transform', expanded && 'rotate-180')} />
                          {stats.notAttempted.length} طالب لم يحاول بعد
                        </button>
                        {expanded && (
                          <ul className="mt-2 flex flex-wrap gap-1.5">
                            {stats.notAttempted.map((s) => (
                              <li
                                key={s.studentId}
                                className="rounded-full bg-surface px-2.5 py-1 text-xs text-muted-foreground"
                              >
                                {s.fullName}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

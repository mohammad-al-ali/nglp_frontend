import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Eye, FileQuestion, Unplug } from 'lucide-react';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { normalizeQuiz } from '../../utils/constants';
import { useFetchQuizzes } from '../../hooks/useQuiz';
import GenerateQuizModal from './components/GenerateQuizModal';
import { getStoredUser } from '../../services/api';

export default function QuizManager() {
  const { courseId, lessonId } = useParams();
  const { quizzes, loading, error, fetchQuizzes } = useFetchQuizzes(lessonId);
  const [showGenerate, setShowGenerate] = useState(false);
  const user = getStoredUser();

  useEffect(() => {
    fetchQuizzes();
  }, [lessonId]);

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
            <div key={n} className="h-20 animate-pulse rounded-lg bg-surface-raised" />
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
            return (
              <Card key={q.id} className="flex items-center justify-between gap-4 p-5">
                <div className="flex-1">
                  <div className="mb-1.5 flex items-center gap-2.5">
                    <h3 className="font-display text-base font-semibold text-foreground">{q.title}</h3>
                    <Badge variant={isDraft ? 'warning' : 'success'}>{isDraft ? 'مسودة' : 'منشور'}</Badge>
                  </div>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    <span>{q.questions?.length || 0} أسئلة</span>
                    {q.createdAt && <span>{new Date(q.createdAt).toLocaleDateString('en-US')}</span>}
                  </div>
                </div>
                <Button as={Link} to={`/teacher/quizzes/${q.id}?courseId=${courseId}&lessonId=${lessonId}`} variant="outline" size="sm">
                  <Eye className="size-3.5" />
                  معاينة
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}

import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileQuestion, Play, Unplug } from 'lucide-react';
import PageShell from '@/components/ui/page-shell';
import PageHeader from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import BackLink from '@/components/ui/back-link';
import EmptyState from '@/components/ui/empty-state';
import api from '../../services/api';

export default function StudentQuizList() {
  const { courseId, lessonId } = useParams();
  const [quizzes, setQuizzes] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | error

  useEffect(() => {
    let isMounted = true;
    api.get(`/quizzes?lessonId=${lessonId}`)
      .then((res) => {
        if (isMounted) {
          setQuizzes(res.data);
          setStatus('ready');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch quizzes', err);
        if (isMounted) setStatus('error');
      });
    return () => {
      isMounted = false;
    };
  }, [lessonId]);

  return (
    <PageShell>
      <PageHeader
        eyebrow="الكويزات"
        title="الكويزات المتاحة"
        actions={<BackLink to={`/study/${courseId}/lesson/${lessonId}`}>رجوع</BackLink>}
      />

      {status === 'loading' ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-20 animate-pulse rounded-lg bg-surface-raised" />
          ))}
        </div>
      ) : status === 'error' ? (
        <EmptyState icon={Unplug} title="تعذر تحميل الكويزات" description="حدث خطأ أثناء الاتصال بالخادم. يرجى المحاولة مرة أخرى." />
      ) : quizzes.length === 0 ? (
        <EmptyState icon={FileQuestion} title="لا توجد كويزات متاحة" description="لم يتم نشر أي كويز لهذا الدرس بعد." />
      ) : (
        <div className="flex flex-col gap-3">
          {quizzes.map((q) => (
            <Link key={q.id} to={`/study/${courseId}/lesson/${lessonId}/quiz/${q.id}`}>
              <Card className="flex items-center justify-between gap-4 p-5 transition-all duration-200 ease-in-out hover:border-border-hover hover:shadow-soft-lg">
                <div>
                  <h3 className="font-display text-base font-semibold text-foreground">{q.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{(q.questions || []).length} أسئلة</p>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                  <Play className="size-3.5" />
                  ابدأ
                </span>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}

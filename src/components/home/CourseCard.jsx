import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function CourseCard({ course }) {
  return (
    <article className="flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-surface shadow-soft transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-border-hover hover:shadow-soft-lg">
      {course.imageUrl && (
        <img src={course.imageUrl} alt="" className="h-36 w-full object-cover" />
      )}
      <div className="flex flex-1 flex-col justify-between p-6">
        <div>
          <div className="mb-3 flex items-center justify-between">
            <Badge>{course.category}</Badge>
            <span className="text-xs font-medium text-muted-foreground">{course.level}</span>
          </div>
          <h3 className="font-display text-lg font-semibold leading-snug text-foreground">{course.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between border-t border-border pt-4 font-mono text-xs text-muted-foreground">
            <span>{course.lessonsCount ?? course.lessons?.length ?? 0} دروس</span>
            <span>{course.students?.toLocaleString('en-US') ?? 0} طالب مسجل</span>
          </div>
          <Link
            to={`/catalog/${course.id}`}
            className="group mt-4 flex h-10 items-center justify-center gap-1.5 rounded-md border border-border text-sm font-medium text-foreground outline-none transition-all duration-200 ease-in-out hover:border-primary-border hover:bg-primary-soft hover:text-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            استكشاف الكورس
            <ArrowLeft className="size-4 transition-transform duration-200 ease-in-out group-hover:-translate-x-0.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

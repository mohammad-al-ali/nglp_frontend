import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';

/**
 * Course card following Aduca's anatomy, minus the rows NGLP has no data
 * behind: no star rating, no review count, no price. The backend carries no
 * rating or price concept at all, and Course exposes neither a lesson
 * collection nor an enrolment count — so `lessonsCount` and `students` are
 * always 0 against the live API and are deliberately not rendered here.
 */
export default function CourseCard({ course }) {
  return (
    <Card className="group flex flex-col overflow-hidden border-0 hover:shadow-soft-lg">
      <Link to={`/catalog/${course.id}`} className="relative block aspect-video overflow-hidden bg-surface-raised">
        {course.imageUrl ? (
          <img
            src={course.imageUrl}
            alt=""
            className="size-full object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
          />
        ) : (
          <span className="flex size-full items-center justify-center">
            <BookOpen className="size-9 text-muted-foreground/40" />
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-6">
        <span className="mb-3 inline-flex w-fit rounded-sm bg-info-soft px-2 py-0.5 text-sm font-medium text-info">
          {course.category}
        </span>

        <h3 className="text-xl font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-primary">
          <Link to={`/catalog/${course.id}`}>{course.title}</Link>
        </h3>

        {course.teacherName && (
          <div className="mt-2 flex items-center gap-2">
            {course.teacherAvatarUrl ? (
              <img src={course.teacherAvatarUrl} alt="" className="size-6 shrink-0 rounded-full object-cover" />
            ) : (
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                {course.teacherName.charAt(0)}
              </span>
            )}
            <span className="truncate text-sm text-muted-foreground">{course.teacherName}</span>
          </div>
        )}

        <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{course.description}</p>
      </div>
    </Card>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import CourseCard from '@/components/CourseCard';
import EmptyState from '@/components/ui/empty-state';
import { BookOpen } from 'lucide-react';
import { categoryMatches } from '@/utils/constants';
import { cn } from '@/lib/utils';

/**
 * Aduca's tabbed course grid. The template's tabs are Trending / Most Popular
 * / Most Recent, none of which NGLP can compute — Course carries no view
 * count and no timestamp — so the tabs are the real root categories instead.
 *
 * Hand-rolled rather than Radix Tabs: @radix-ui/react-tabs is not installed,
 * and three buttons do not justify a dependency.
 */
export default function CourseTabs({ courses, categories }) {
  const tabs = [{ id: 'all', name: 'كل الكورسات' }, ...categories.slice(0, 3)];
  const [activeTab, setActiveTab] = useState('all');

  const visible =
    activeTab === 'all'
      ? courses
      : courses.filter((course) => categoryMatches(course, activeTab, categories));

  return (
    <section className="pb-28">
      <div className="bg-background">
        <div className="mx-auto flex w-[min(1200px,calc(100%-48px))] flex-wrap justify-center gap-2 py-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'rounded-lg px-5 py-2.5 text-[15px] font-medium transition-all duration-200 ease-in-out',
                activeTab === tab.id
                  ? 'bg-surface text-primary shadow-tab'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto w-[min(1200px,calc(100%-48px))] pt-12">
        {visible.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="لا توجد كورسات في هذا التصنيف بعد"
            description="جرّب تصنيفاً آخر أو تصفّح كل الكورسات."
          />
        ) : (
          <div className="grid grid-cols-1 gap-[30px] md:grid-cols-2 lg:grid-cols-3">
            {visible.slice(0, 9).map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}

        <div className="pt-10 text-center">
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-[15px] font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover"
          >
            تصفّح كل الكورسات
            <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

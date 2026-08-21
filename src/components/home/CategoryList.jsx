import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { categoryMatches } from '@/utils/constants';

export default function CategoryList({ categories, courses }) {
  return (
    <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface shadow-soft">
      {categories.map((category) => {
        const count = courses.filter((course) => categoryMatches(course, category.id, categories)).length;
        return (
          <Link
            key={category.id}
            to={`/catalog?category=${category.id}`}
            className="group flex items-center justify-between gap-4 px-5 py-4 outline-none transition-all duration-200 ease-in-out hover:bg-surface-raised focus-visible:relative focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          >
            <div>
              <h3 className="text-sm font-medium text-foreground">{category.name}</h3>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">{count} كورس</p>
            </div>
            <ArrowLeft className="size-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-in-out group-hover:-translate-x-0.5 group-hover:text-primary" />
          </Link>
        );
      })}
    </div>
  );
}

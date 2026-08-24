import { Link } from 'react-router-dom';
import { ArrowLeft, Monitor, Briefcase, Palette, Laptop, Camera, Wand2, Music, HeartPulse } from 'lucide-react';
import { categoryMatches } from '@/utils/constants';
import SectionHeading from './SectionHeading';

/**
 * Aduca's category tiles: a white card holding a tinted icon circle that
 * lifts on hover. Icon and tone are picked deterministically by index, so a
 * given category keeps the same look between renders.
 *
 * Capped at 8 (Aduca's own count, matching "View all Categories" below) and
 * laid out as a wrapping flex row rather than a CSS grid — a live category
 * count is not guaranteed to be a multiple of the column count, and an
 * incomplete last row in a grid hugs one edge under RTL rather than
 * centering, which is what read as "unbalanced" here.
 */
const MAX_TILES = 8;
const ICONS = [Monitor, Briefcase, Palette, Laptop, Camera, Wand2, Music, HeartPulse];
const TONES = [
  'text-primary',
  'text-purple',
  'text-warning',
  'text-info',
  'text-success',
  'text-error',
  'text-brand',
  'text-sky',
];

export default function CategoryTiles({ categories, courses }) {
  if (categories.length === 0) return null;

  const visible = categories.slice(0, MAX_TILES);

  return (
    <section className="py-28 text-center">
      <div className="mx-auto w-[min(1200px,calc(100%-48px))]">
        <SectionHeading title="تصفّح التصنيفات" desc="اختر مجالاً وابدأ من أول درس" />

        <div className="flex flex-wrap justify-center gap-[30px] pt-12">
          {visible.map((category, index) => {
            const Icon = ICONS[index % ICONS.length];
            const count = courses.filter((course) => categoryMatches(course, category.id, categories)).length;

            return (
              <Link
                key={category.id}
                to={`/catalog?category=${category.id}`}
                className="group w-full max-w-[220px] flex-1 basis-[220px] rounded-lg bg-surface px-5 py-10 shadow-soft transition-all duration-200 ease-in-out hover:shadow-soft-lg"
              >
                <span
                  className={`mx-auto flex size-[60px] items-center justify-center rounded-full bg-surface shadow-icon transition-transform duration-200 ease-in-out group-hover:-translate-y-1.5 ${TONES[index % TONES.length]}`}
                >
                  <Icon className="size-7" />
                </span>
                <h3 className="pt-4 text-[19px] font-semibold text-foreground" dir="auto">
                  {category.name}
                </h3>
                <p className="pt-1 text-sm text-muted-foreground">{count} كورس</p>
              </Link>
            );
          })}
        </div>

        <div className="pt-10">
          <Link
            to="/catalog"
            className="group inline-flex items-center gap-2 rounded-md bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary-hover"
          >
            عرض كل التصنيفات
            <ArrowLeft className="size-4 transition-transform duration-200 group-hover:-translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  );
}

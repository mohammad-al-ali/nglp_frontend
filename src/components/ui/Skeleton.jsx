/**
 * Loading placeholder. Same {width, height, count} API as before —
 * only the visual recipe changed (the old white-on-white shimmer was
 * invisible against the light surface).
 */
export default function Skeleton({ width = '100%', height = '20px', count = 1 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-sm bg-surface-raised"
          style={{ width, height }}
        />
      ))}
    </div>
  );
}

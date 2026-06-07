/**
 * Loading Skeleton Component
 * Shows placeholder shimmer effect while content is loading
 */

import './Skeleton.css';

export default function Skeleton({ width = '100%', height = '20px', count = 1 }) {
  return (
    <div className="skeleton-wrapper">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{
            width,
            height,
          }}
        />
      ))}
    </div>
  );
}

/**
 * حلقة تقدّم دائرية (SVG). نفس أسلوب الرسم في لوحة المدير (UsersManagement).
 * القيمة نسبة مئوية 0-100. المحتوى في المنتصف يُمرَّر عبر children.
 */
export default function ProgressRing({ value = 0, size = 128, strokeWidth = 10, className = '', children }) {
  const clamped = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--color-surface-raised)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="var(--color-primary)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circumference}`}
          className="transition-[stroke-dasharray] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center" dir="ltr">
        {children}
      </div>
    </div>
  );
}

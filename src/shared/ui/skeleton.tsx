interface SkeletonProps {
  rows?: number
}

export function SkeletonTable({ rows = 6 }: SkeletonProps) {
  return (
    <div className="skeleton-table" aria-label="جدول قيد التحميل">
      {Array.from({ length: rows }).map((_, index) => (
        <div className="skeleton-row" key={index}>
          <span className="skeleton skeleton-wide" />
          <span className="skeleton" />
          <span className="skeleton" />
          <span className="skeleton skeleton-short" />
        </div>
      ))}
    </div>
  )
}

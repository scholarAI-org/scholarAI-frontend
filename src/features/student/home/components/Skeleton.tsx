interface SkeletonProps {
  // Identifies what is loading (and lets tests assert it).
  kind: string;
  className?: string;
}

export function Skeleton({ kind, className = '' }: SkeletonProps) {
  return (
    <span
      aria-hidden
      data-skeleton={kind}
      className={`block animate-pulse rounded-md bg-gray-200 motion-reduce:animate-none ${className}`}
    />
  );
}

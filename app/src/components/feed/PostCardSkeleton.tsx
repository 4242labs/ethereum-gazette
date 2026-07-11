export function PostCardSkeleton() {
  return (
    <article className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-soft">
      {/* Category Badge Skeleton */}
      <div className="mb-3">
        <div className="h-6 w-24 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Title Skeleton */}
      <div className="space-y-2 mb-3">
        <div className="h-6 w-full rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
        <div className="h-6 w-3/4 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
      </div>

      {/* Snippet Skeleton */}
      <div className="space-y-2 mb-4">
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700/70 animate-pulse" />
        <div className="h-4 w-full rounded bg-gray-100 dark:bg-gray-700/70 animate-pulse" />
        <div className="h-4 w-2/3 rounded bg-gray-100 dark:bg-gray-700/70 animate-pulse" />
      </div>

      {/* Metadata Footer Skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-20 rounded bg-gray-200 dark:bg-gray-700 animate-pulse" />
          <div className="h-4 w-1 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-16 rounded bg-gray-100 dark:bg-gray-700/70 animate-pulse" />
        </div>
        <div className="h-4 w-12 rounded bg-gray-100 dark:bg-gray-700/70 animate-pulse" />
      </div>
    </article>
  );
}

export function PostCardSkeletonList({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, index) => (
        <PostCardSkeleton key={index} />
      ))}
    </div>
  );
}

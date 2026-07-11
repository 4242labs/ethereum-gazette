import { useAppStore } from "@/store/useAppStore";
import { useFeed } from "@/hooks/useFeed";
import { PostCard, POST_CARD_HEIGHT } from "@/components/feed/PostCard";

import { PostCardSkeletonList } from "@/components/feed/PostCardSkeleton";
import { Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { useEffect, useRef, useCallback } from "react";

const FEED_LIMIT = 30;

export function FeedColumn() {
  const { selectedCategory, searchQuery } = useAppStore();
  const { posts, loading, error, hasMore, loadMore, refresh } = useFeed(
    selectedCategory,
    searchQuery,
    FEED_LIMIT,
  );
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const handleIntersection = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const target = entries[0];
      if (target.isIntersecting && hasMore && !loading) {
        loadMore();
      }
    },
    [hasMore, loading, loadMore],
  );

  useEffect(() => {
    const observer = new IntersectionObserver(handleIntersection, {
      threshold: 0.1,
      rootMargin: "100px",
    });

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [handleIntersection]);

  const ErrorDisplay = () => (
    <div className="col-span-12 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-800 p-8 md:p-12 text-center transition-colors">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Failed to Load Posts
      </h3>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        {error || "Something went wrong while loading the posts."}
      </p>
      <button
        onClick={refresh}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-accent-600 hover:bg-accent-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors"
      >
        <RefreshCw className="h-4 w-4 mr-2" />
        Try Again
      </button>
    </div>
  );

  const EmptyState = () => (
    <div className="col-span-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 md:p-12 text-center transition-colors">
      <p className="text-gray-500 dark:text-gray-400 mb-4">
        {searchQuery.trim()
          ? `No results for "${searchQuery}"`
          : "No posts found in this category."}
      </p>
      {!searchQuery.trim() && (
        <button
          onClick={refresh}
          className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent-500 transition-colors"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </button>
      )}
    </div>
  );

  return (
    <div>
      <div className="grid grid-cols-12 gap-4">
          {loading && posts.length === 0 && (
            <div className="col-span-12">
              <PostCardSkeletonList count={5} />
            </div>
          )}
          {error && posts.length === 0 && <ErrorDisplay />}
          {!loading && !error && posts.length === 0 && <EmptyState />}

          {posts.map((post) => (
            <div key={post.id} className="col-span-12">
              <PostCard post={post} />
            </div>
          ))}

          {hasMore && posts.length > 0 && (
            <div ref={loadMoreRef} className="col-span-12 flex justify-center py-8">
              {loading && (
                <div className="flex items-center text-gray-500 dark:text-gray-400">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Loading more posts...
                </div>
              )}
            </div>
          )}

          {(!hasMore || posts.length >= FEED_LIMIT) && posts.length > 0 && (
            <div className="col-span-12">
              <div
                className="
                  bg-[hsla(26,77%,50%,0.04)] dark:bg-gray-800 rounded-xl
                  border border-gray-300 dark:border-gray-700
                  shadow-soft
                  w-full flex items-center justify-center
                "
                style={{ height: Math.round(POST_CARD_HEIGHT * 0.7) }}
              >
                <div className="text-center">
                  <p className="text-lg font-heading text-gray-700 dark:text-gray-300 mb-1">
                    That's a wrap!
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Now, go build something.
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

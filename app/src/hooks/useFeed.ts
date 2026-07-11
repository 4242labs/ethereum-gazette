import { useState, useEffect } from "react";
import type { Post, Category } from "@/types";
import { fetchPostsCached, clearPostsCache, searchPosts } from "@/api/posts";

interface UseFeedState {
  posts: Post[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
}

interface UseFeedActions {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export type UseFeedReturn = UseFeedState & UseFeedActions;

const POSTS_PER_PAGE = 20;

function matchesSearchQuery(post: Post, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return (
    (post.title || "").toLowerCase().includes(q) ||
    (post.snippet || "").toLowerCase().includes(q) ||
    (post.author || "").toLowerCase().includes(q) ||
    (post.source || "").toLowerCase().includes(q)
  );
}

export function useFeed(
  category: Category | "all",
  searchQuery: string = "",
  maxPosts: number = Infinity,
): UseFeedReturn {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);

  // Reload whenever any filter changes
  useEffect(() => {
    loadInitialPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, searchQuery]);

  const loadInitialPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      setOffset(0);

      let posts: Post[];

      if (searchQuery.trim()) {
        posts = await searchPosts(searchQuery, category);
      } else {
        posts = await fetchPostsCached(category, POSTS_PER_PAGE, 0);
      }

      setAllPosts(posts);
      setHasMore(!searchQuery.trim() && posts.length === POSTS_PER_PAGE);
      setOffset(POSTS_PER_PAGE);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load posts");
      setAllPosts([]);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (loading || !hasMore || searchQuery.trim() || allPosts.length >= maxPosts) return;

    try {
      setLoading(true);
      setError(null);

      const newPosts = await fetchPostsCached(category, POSTS_PER_PAGE, offset);

      if (newPosts.length === 0) {
        setHasMore(false);
      } else {
        setAllPosts((prev) => {
          const combined = [...prev, ...newPosts];
          if (combined.length >= maxPosts) {
            setHasMore(false);
            return combined.slice(0, maxPosts);
          }
          return combined;
        });
        setHasMore(newPosts.length === POSTS_PER_PAGE);
        setOffset((prev) => prev + POSTS_PER_PAGE);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load more posts",
      );
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    clearPostsCache();
    await loadInitialPosts();
  };

  const posts = allPosts.filter((post) =>
    matchesSearchQuery(post, searchQuery),
  );

  return {
    posts,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}

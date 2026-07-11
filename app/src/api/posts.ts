import type { Post, Category } from "@/types";
import snapshotData from "@/data/snapshots/snapshot-posts.json";

// --- Feature Flag ---

const IS_STATIC = import.meta.env.VITE_DATA_MODE === "static";

// --- API Response Interfaces ---

interface ApiPost {
  id: number;
  title: string;
  snippet: string;
  url: string;
  author: string;
  source: string;
  category: Category;
  pubDate: string; // ISO 8601 string
  imageUrl?: string;
}

interface ApiMeta {
  count: number;
  limit: number;
  offset: number;
  category: Category | "all";
}

export interface PostsApiResponse {
  success: boolean;
  data: ApiPost[];
  meta: ApiMeta;
  timestamp: string;
  error?: string;
  message?: string;
}

export interface PostsStatsResponse {
  success: boolean;
  data: Record<string, number>;
  timestamp: string;
  error?: string;
  message?: string;
}

// --- Constants ---

// Use relative URL for Vercel deployment
const API_BASE_URL = "/api";

// --- Data Conversion ---

/**
 * Converts a post from the API format to the frontend format.
 * @param apiPost The post object from the API.
 * @returns A post object in the frontend's format.
 */
function convertApiPost(apiPost: ApiPost): Post {
  return {
    id: String(apiPost.id),
    title: apiPost.title || "Untitled Post",
    snippet: apiPost.snippet,
    url: apiPost.url,
    author: apiPost.author || "Unknown Author",
    source: apiPost.source,
    category: apiPost.category,
    timestamp: new Date(apiPost.pubDate),
    imageUrl: apiPost.imageUrl || undefined,
  };
}

// --- Static Snapshot (pre-converted once at module scope) ---

interface SnapshotPost {
  id: string;
  title: string;
  snippet: string;
  url: string;
  author: string | null;
  source: string;
  category: string;
  pubDate: string;
  imageUrl: string | null;
  date: string;
}

const staticPosts: Post[] = (snapshotData.data as SnapshotPost[]).map(
  (item) => ({
    id: item.id,
    title: item.title || "Untitled Post",
    snippet: item.snippet,
    url: item.url,
    author: item.author || "Unknown Author",
    source: item.source,
    category: item.category as Category,
    timestamp: new Date(item.pubDate),
    imageUrl: item.imageUrl || undefined,
  }),
);

// --- API Functions ---

/**
 * Fetches posts by category with pagination from the live API.
 */
export async function fetchPosts(
  category: Category | "all" = "all",
  limit: number = 50,
  offset: number = 0,
): Promise<Post[]> {
  if (IS_STATIC) {
    const filtered =
      category === "all"
        ? staticPosts
        : staticPosts.filter((p) => p.category === category);
    return filtered.slice(offset, offset + limit);
  }

  try {
    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
    });
    if (category !== "all") {
      params.set("category", category);
    }

    const url = `${API_BASE_URL}/posts?${params.toString()}`;
    console.log(`[API] Fetching posts: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API] HTTP Error ${response.status} for ${url}:`,
        errorText,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PostsApiResponse = await response.json();

    if (!data.success) {
      console.error("[API] API returned failure:", data);
      throw new Error(data.error || data.message || "API returned an error");
    }

    return data.data.map(convertApiPost);
  } catch (error) {
    console.error("[API] Failed to fetch posts:", error);
    throw error;
  }
}

/**
 * Fetches recent posts (last 7 days) from the live API.
 */
export async function fetchRecentPosts(
  category: Category | "all" = "all",
): Promise<Post[]> {
  if (IS_STATIC) {
    return category === "all"
      ? staticPosts
      : staticPosts.filter((p) => p.category === category);
  }

  try {
    const params = new URLSearchParams({
      recent: "true",
    });
    if (category !== "all") {
      params.set("category", category);
    }

    const url = `${API_BASE_URL}/posts?${params.toString()}`;
    console.log(`[API] Fetching recent posts: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API] HTTP Error ${response.status} for ${url}:`,
        errorText,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PostsApiResponse = await response.json();

    if (!data.success) {
      console.error("[API] API returned failure for recent posts:", data);
      throw new Error(data.error || data.message || "API returned an error");
    }

    return data.data.map(convertApiPost);
  } catch (error) {
    console.error("[API] Failed to fetch recent posts:", error);
    throw error;
  }
}

/**
 * Fetches category statistics from the live API.
 */
export async function fetchPostStats(): Promise<Record<string, number>> {
  if (IS_STATIC) {
    return (snapshotData.data as SnapshotPost[]).reduce(
      (acc: Record<string, number>, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      },
      {},
    );
  }

  try {
    const url = `${API_BASE_URL}/posts/stats`;
    console.log(`[API] Fetching stats: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API] HTTP Error ${response.status} for ${url}:`,
        errorText,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PostsStatsResponse = await response.json();

    if (!data.success) {
      console.error("[API] API returned failure for stats:", data);
      throw new Error(
        data.error || data.message || "API returned an error fetching stats",
      );
    }

    return data.data;
  } catch (error) {
    console.error("[API] Failed to fetch post stats:", error);
    throw error;
  }
}

/**
 * Searches posts via the live API.
 */
export async function searchPosts(
  query: string,
  category: Category | "all" = "all",
): Promise<Post[]> {
  if (IS_STATIC) {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    const filtered =
      category === "all"
        ? staticPosts
        : staticPosts.filter((p) => p.category === category);
    return filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.snippet.toLowerCase().includes(q) ||
        p.author.toLowerCase().includes(q) ||
        p.source.toLowerCase().includes(q),
    );
  }

  try {
    if (!query.trim()) {
      return [];
    }

    const params = new URLSearchParams({
      search: query.trim(),
    });
    if (category !== "all") {
      params.set("category", category);
    }

    const url = `${API_BASE_URL}/posts?${params.toString()}`;
    console.log(`[API] Searching posts: ${url}`);

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[API] HTTP Error ${response.status} for ${url}:`,
        errorText,
      );
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: PostsApiResponse = await response.json();

    if (!data.success) {
      console.error("[API] API returned failure for search:", data);
      throw new Error(
        data.error || data.message || "API returned an error during search",
      );
    }

    return data.data.map(convertApiPost);
  } catch (error) {
    console.error("[API] Failed to search posts:", error);
    throw error;
  }
}

// --- Caching Layer ---

const postsCache = new Map<string, { posts: Post[]; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Cached version of fetchPosts to prevent redundant API calls.
 */
export async function fetchPostsCached(
  category: Category | "all" = "all",
  limit: number = 50,
  offset: number = 0,
): Promise<Post[]> {
  if (IS_STATIC) {
    return fetchPosts(category, limit, offset);
  }

  const cacheKey = `${category}-${limit}-${offset}`;
  const cached = postsCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.posts;
  }

  const posts = await fetchPosts(category, limit, offset);

  postsCache.set(cacheKey, {
    posts,
    timestamp: Date.now(),
  });

  return posts;
}

/**
 * Clears the post cache.
 */
export function clearPostsCache(): void {
  if (IS_STATIC) return;
  postsCache.clear();
}

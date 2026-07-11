// Core category types
export type Category =
  | "all"
  | "people"
  | "projects"
  | "education"
  | "news"
  | "events"
  | "orgs"
  | "jobs"
  | "grants"
  | "communities"
  | "podcasts"
  | "youtube";

// Theme types
export type Theme = "light" | "dark";

// Mobile view types
export type MobileView = "feed" | "featured" | "search";

// Post interface for main feed content
export interface Post {
  id: string;
  category: Category;
  title: string;
  snippet: string;
  author: string;
  source: string;
  timestamp: Date;
  url: string;
  imageUrl?: string;
}

// Featured content interface for right sidebar
export interface FeaturedItem {
  id: string;
  category: Category;
  title: string;
  description: string;
  badge?: string;
  url: string;
  imageUrl?: string;
  featuredLevel?: 1 | 2;
}

// Store state interface
export interface AppState {
  // Category filter (left sidebar nav)
  selectedCategory: Category;
  setSelectedCategory: (category: Category) => void;

  // Global search query
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Theme
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // Mobile view
  mobileView: MobileView;
  setMobileView: (view: MobileView) => void;
}

import { useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { searchPosts } from "@/api/posts";
import { PostCard } from "@/components/feed/PostCard";
import type { Post } from "@/types";

export function MobileSearchView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.trim() === "") {
      setSearchResults([]);
      setHasSearched(false);
      setSearchError(null);
      return;
    }

    try {
      setIsSearching(true);
      setSearchError(null);

      // Search through all posts via API
      const results = await searchPosts(query, "all");

      setSearchResults(results);
      setHasSearched(true);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search failed");
      setSearchResults([]);
      setHasSearched(true);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
    setHasSearched(false);
    setSearchError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-14 pb-20 px-4">
      <div className="py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Search
        </h1>

        {/* Search Input */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search posts, authors, or sources..."
            className="w-full pl-12 pr-12 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent transition-colors"
            autoFocus
            disabled={isSearching}
          />
          {searchQuery && !isSearching && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-gray-500" />
            </button>
          )}
          {isSearching && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 className="w-5 h-5 text-gray-400 dark:text-gray-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Search Results */}
        {hasSearched && !isSearching && (
          <div>
            {searchError ? (
              <div className="text-center py-12">
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 mb-4">
                  <p className="text-red-700 dark:text-red-400 mb-2">
                    Search Error
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-500">
                    {searchError}
                  </p>
                </div>
                <button
                  onClick={() => handleSearch(searchQuery)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : searchResults.length > 0 ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Found {searchResults.length} result
                  {searchResults.length !== 1 ? "s" : ""} for "{searchQuery}"
                </p>
                <div className="space-y-4">
                  {searchResults.map((post) => (
                    <PostCard key={post.id} post={post} />
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-500 dark:text-gray-400 mb-2">
                  No results found for "{searchQuery}"
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500">
                  Try searching with different keywords
                </p>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {isSearching && (
          <div className="text-center py-12">
            <Loader2 className="w-8 h-8 text-gray-400 dark:text-gray-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Searching...</p>
          </div>
        )}

        {/* Initial State */}
        {!hasSearched && !searchQuery && !isSearching && (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">
              Start typing to search
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Search through posts, authors, and sources
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

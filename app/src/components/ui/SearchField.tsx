import React, { useRef, useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { trackEvent } from "@/lib/analytics";

export function SearchField(): React.JSX.Element {
  const { searchQuery, setSearchQuery } = useAppStore();

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearchQuery(localQuery);
      if (localQuery.trim()) {
        trackEvent("Search", "Query", undefined, localQuery.length);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [localQuery, setSearchQuery]);

  const clearSearch = (): void => {
    setLocalQuery("");
    setSearchQuery("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative w-full">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
      <input
        ref={inputRef}
        type="text"
        value={localQuery}
        onChange={(e) => setLocalQuery(e.target.value)}
        placeholder="Search posts..."
        className="w-full pl-9 pr-8 py-1.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent hover:border-gray-300 dark:hover:border-gray-600 transition-all shadow-soft"
      />
      {localQuery && (
        <button
          onClick={clearSearch}
          aria-label="Clear search"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
        </button>
      )}
    </div>
  );
}

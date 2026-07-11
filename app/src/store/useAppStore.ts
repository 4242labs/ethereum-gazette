import { create } from "zustand";
import type { AppState, Category, Theme, MobileView } from "@/types";

export const useAppStore = create<AppState>((set) => ({
  // Category filter
  selectedCategory: "all",
  setSelectedCategory: (category: Category) =>
    set({ selectedCategory: category }),

  // Global search query
  searchQuery: "",
  setSearchQuery: (query: string) => set({ searchQuery: query }),

  // Theme
  theme: "light",
  setTheme: (theme: Theme) => {
    set({ theme });

    const html = document.documentElement;
    const body = document.body;

    if (theme === "dark") {
      html.classList.add("dark");
      body.classList.add("dark");
    } else {
      html.classList.remove("dark");
      body.classList.remove("dark");
    }
  },

  // Mobile view
  mobileView: "feed",
  setMobileView: (view: MobileView) => set({ mobileView: view }),
}));

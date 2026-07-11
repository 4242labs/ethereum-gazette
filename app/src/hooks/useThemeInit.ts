import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";

export function useThemeInit() {
  const { theme } = useAppStore();

  useEffect(() => {
    // Apply theme to document element on mount and when theme changes
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }

  }, [theme]);

  // Initialize theme from system preference on first load only
  useEffect(() => {
    const initializeTheme = () => {
      const { theme: currentTheme, setTheme } = useAppStore.getState();

      // If no theme is set, use system preference
      if (currentTheme === "light") {
        const systemPrefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
        if (systemPrefersDark) {
          setTheme("dark");
        }
      }
    };

    initializeTheme();
  }, []);
}

import { Moon, Sun } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

export function ThemeToggle() {
  const { theme, setTheme } = useAppStore();

  const handleToggle = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center justify-center gap-2 px-4 py-2 w-full bg-accent-600 dark:bg-gray-100 text-white dark:text-gray-900 rounded-lg hover:bg-accent-700 dark:hover:bg-gray-200 transition-colors font-medium"
      type="button"
    >
      {theme === "dark" ? (
        <>
          <Sun className="w-4 h-4" />
          Light
        </>
      ) : (
        <>
          <Moon className="w-4 h-4" />
          Dark
        </>
      )}
    </button>
  );
}

import { Menu, Sun, Moon } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

interface MobileHeaderProps {
  onMenuToggle: () => void;
}

export function MobileHeader({ onMenuToggle }: MobileHeaderProps) {
  const { theme, setTheme } = useAppStore();

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onMenuToggle}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        </button>

        <img
          src="/logo.svg"
          alt="Ethereum Gazette"
          className="h-6 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            const { setSelectedCategory, setMobileView } =
              useAppStore.getState();
            setSelectedCategory("all");
            setMobileView("feed");
          }}
        />

        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "light" ? (
            <Moon className="w-6 h-6 text-gray-700" />
          ) : (
            <Sun className="w-6 h-6 text-gray-300" />
          )}
        </button>
      </div>
    </header>
  );
}

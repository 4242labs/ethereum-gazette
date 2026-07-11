import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import type { Category } from "@/types";
import { OverlayPopup } from "@/components/ui/OverlayPopup";
import { SearchField } from "@/components/ui/SearchField";
import { trackEvent } from "@/lib/analytics";

import {
  Users,
  Briefcase,
  GraduationCap,
  Newspaper,
  Calendar,
  Building,
  LayoutGrid,
  HandCoins,
  Users2,
  Podcast,
  Video,
  Moon,
  Sun,
  FileText,
  Github,
  Info,
  Coffee,
  BarChart3,
} from "lucide-react";

const categories: {
  id: Category;
  label: string;
  icon: typeof LayoutGrid;
  colorClass: string;
}[] = [
  { id: "all", label: "All", icon: LayoutGrid, colorClass: "icon-all" },
  { id: "people", label: "People", icon: Users, colorClass: "icon-people" },
  { id: "orgs", label: "Orgs", icon: Building, colorClass: "icon-orgs" },
  {
    id: "projects",
    label: "Projects",
    icon: Briefcase,
    colorClass: "icon-projects",
  },
  {
    id: "education",
    label: "Education",
    icon: GraduationCap,
    colorClass: "icon-education",
  },
  { id: "news", label: "News", icon: Newspaper, colorClass: "icon-news" },
  { id: "events", label: "Events", icon: Calendar, colorClass: "icon-events" },
  { id: "grants", label: "Grants", icon: HandCoins, colorClass: "icon-grants" },
  { id: "communities", label: "Communities", icon: Users2, colorClass: "icon-communities" },
  { id: "podcasts", label: "Podcasts", icon: Podcast, colorClass: "icon-podcasts" },
  { id: "youtube", label: "YouTube", icon: Video, colorClass: "icon-youtube" },
];

export function Sidebar() {
  const { selectedCategory, setSelectedCategory, theme, setTheme } =
    useAppStore();
  const [showCoffeePopup, setShowCoffeePopup] = useState(false);
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);

  return (
    <aside className="flex flex-col pb-6 space-y-4">
      {/* Logo with BETA badge overlay */}
      <div className="px-3 relative">
        <img
          src="/logo.svg"
          alt="Ethereum Gazette"
          className="w-full cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setSelectedCategory("all")}
        />
        <span className="absolute -bottom-2.5 right-4 font-heading text-[9px] font-semibold tracking-widest text-accent-700 dark:text-accent-300 bg-[hsla(26,77%,50%,0.08)] dark:bg-[hsla(26,77%,50%,0.12)] border border-accent-200/40 dark:border-accent-700/40 rounded-full px-1.5 py-0.5">
          BETA
        </span>
      </div>

      {/* Categories menu/links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-300 dark:border-gray-700 shadow-soft hover:shadow-soft-md transition-all">
        <nav>
          <ul className="space-y-1">
            {categories.map((category) => {
              const Icon = category.icon;
              const isActive = selectedCategory === category.id;

              return (
                <li key={category.id}>
                  <button
                    onClick={() => {
                      setSelectedCategory(category.id);
                      trackEvent("Navigation", "CategorySelect", category.id);
                    }}
                    className={`
                    w-full flex items-center gap-3 px-3 py-2 rounded-full
                    transition-all duration-200 text-left text-sm
                    ${
                      isActive
                        ? "bg-gradient-to-r from-accent-100 to-accent-50 dark:from-accent-900/40 dark:to-accent-800/40 font-semibold shadow-soft"
                        : "hover:bg-gray-100 dark:hover:bg-gray-700"
                    }
                  `}
                  >
                    <Icon
                      className={`w-5 h-5 transition-transform duration-200 ${category.colorClass}`}
                    />
                    <span
                      className={`transition-colors duration-200 ${
                        isActive
                          ? "text-gray-900 dark:text-gray-100"
                          : "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      {category.label}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Links */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 text-sm text-gray-600 dark:text-gray-400 space-y-3 border border-gray-300 dark:border-gray-700 shadow-soft hover:shadow-soft-md hover-lift transition-all">
        <a
          href="/about"
          className="flex items-center gap-2 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          <Info className="w-4 h-4" />
          <span>About the Gazette</span>
        </a>
        <button
          onClick={() => setShowCoffeePopup(true)}
          className="flex items-center gap-2 hover:text-accent-600 dark:hover:text-accent-400 transition-colors w-full text-left"
        >
          <Coffee className="w-4 h-4" />
          <span>Support the Gazette</span>
        </button>
        <a
          href="https://github.com/42piratas/ethereum-gazette"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          <Github className="w-4 h-4" />
          <span>How it Works</span>
        </a>
        <a
          href="/terms"
          className="flex items-center gap-2 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
        >
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </a>
        <button
          onClick={() => setShowAnalyticsPopup(true)}
          className="flex items-center gap-2 hover:text-accent-600 dark:hover:text-accent-400 transition-colors w-full text-left"
        >
          <BarChart3 className="w-4 h-4" />
          <span>Analytics</span>
        </button>
        <button
          onClick={() => {
            const newTheme = theme === "dark" ? "light" : "dark";
            setTheme(newTheme);
            trackEvent("Settings", "ThemeToggle", newTheme);
          }}
          className="flex items-center gap-2 hover:text-accent-600 dark:hover:text-accent-400 transition-colors w-full text-left"
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
          <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>

      {/* Overlay Popups */}
      <OverlayPopup
        title="Support the Gazette"
        isOpen={showCoffeePopup}
        onClose={() => setShowCoffeePopup(false)}
      >
        <p>
          Ethereum Gazette is a free, open-source project. If you find it
          useful, consider supporting its development. More details coming soon.
        </p>
      </OverlayPopup>

      <OverlayPopup
        title="Analytics"
        isOpen={showAnalyticsPopup}
        onClose={() => setShowAnalyticsPopup(false)}
      >
        <p>
          Ethereum Gazette uses Matomo for privacy-focused analytics. No
          cookies, no personal data.
        </p>
      </OverlayPopup>

      {/* Search */}
      <SearchField />

    </aside>
  );
}

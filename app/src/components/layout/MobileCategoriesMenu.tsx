import { useAppStore } from "@/store/useAppStore";
import type { Category } from "@/types";
import { X } from "lucide-react";
import {
  Home,
  Users,
  Briefcase,
  GraduationCap,
  Newspaper,
  Calendar,
  Building,
  HandCoins,
  Users2,
  Podcast,
  Video,
} from "lucide-react";

const categories: { id: Category; label: string; icon: typeof Home }[] = [
  { id: "all", label: "Home", icon: Home },
  { id: "people", label: "People", icon: Users },
  { id: "orgs", label: "Orgs", icon: Building },
  { id: "projects", label: "Projects", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "news", label: "News", icon: Newspaper },
  { id: "events", label: "Events", icon: Calendar },
  { id: "grants", label: "Grants", icon: HandCoins },
  { id: "communities", label: "Communities", icon: Users2 },
  { id: "podcasts", label: "Podcasts", icon: Podcast },
  { id: "youtube", label: "YouTube", icon: Video },
];

interface MobileCategoriesMenuProps {
  onClose: () => void;
}

export function MobileCategoriesMenu({ onClose }: MobileCategoriesMenuProps) {
  const { selectedCategory, setSelectedCategory, setMobileView } =
    useAppStore();

  const handleCategorySelect = (categoryId: Category) => {
    setSelectedCategory(categoryId);
    setMobileView("feed");
    onClose();
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header with close button */}
      <div className="flex items-center justify-end p-4 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Categories list */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {categories.map((category) => {
            const Icon = category.icon;
            const isActive = selectedCategory === category.id;

            return (
              <li key={category.id}>
                <button
                  onClick={() => handleCategorySelect(category.id)}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-lg
                    transition-all duration-200 text-left
                    ${
                      isActive
                        ? "bg-accent-50 dark:bg-accent-950/30 text-accent-700 dark:text-accent-300 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }
                  `}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      isActive
                        ? "text-accent-600 dark:text-accent-400"
                        : "text-gray-400 dark:text-gray-500"
                    }`}
                  />
                  <span className="text-base">{category.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

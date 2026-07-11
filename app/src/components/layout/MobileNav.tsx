import { useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import { OverlayPopup } from "@/components/ui/OverlayPopup";
import {
  Home,
  Star,
  Search,
  Info,
  X,
  Coffee,
  Github,
  BarChart3,
} from "lucide-react";

export function MobileNav() {
  const { selectedCategory, setSelectedCategory, mobileView, setMobileView } =
    useAppStore();
  const [showInfoPopover, setShowInfoPopover] = useState(false);
  const [showCoffeePopup, setShowCoffeePopup] = useState(false);
  const [showAnalyticsPopup, setShowAnalyticsPopup] = useState(false);

  const navItems = [
    {
      id: "home" as const,
      icon: Home,
      action: () => {
        setSelectedCategory("all");
        setMobileView("feed");
        setShowInfoPopover(false);
      },
      isActive: mobileView === "feed" && selectedCategory === "all",
    },
    {
      id: "featured" as const,
      icon: Star,
      action: () => {
        setMobileView("featured");
        setShowInfoPopover(false);
      },
      isActive: mobileView === "featured",
    },
    {
      id: "search" as const,
      icon: Search,
      action: () => {
        setMobileView("search");
        setShowInfoPopover(false);
      },
      isActive: mobileView === "search",
    },
    {
      id: "info" as const,
      icon: Info,
      action: () => setShowInfoPopover(!showInfoPopover),
      isActive: showInfoPopover,
    },
  ];

  return (
    <>
      {/* Info Full-Screen Overlay */}
      {showInfoPopover && (
        <div className="fixed inset-0 z-50 md:hidden bg-white dark:bg-gray-900">
          {/* Close button */}
          <button
            onClick={() => setShowInfoPopover(false)}
            className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Centered content */}
          <div className="h-full flex items-center justify-center p-8">
            <div className="w-full max-w-sm space-y-6">
              <a
                href="#"
                onClick={() => setShowInfoPopover(false)}
                className="flex items-center justify-center gap-3 text-lg text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              >
                <Info className="w-5 h-5" />
                <span>About Ethereum Gazette</span>
              </a>
              <button
                onClick={() => {
                  setShowInfoPopover(false);
                  setShowCoffeePopup(true);
                }}
                className="flex items-center justify-center gap-3 text-lg text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors w-full"
              >
                <Coffee className="w-5 h-5" />
                <span>Buy me a coffee</span>
              </button>
              <a
                href="https://github.com/42piratas/ethereum-gazette"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setShowInfoPopover(false)}
                className="flex items-center justify-center gap-3 text-lg text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
              >
                <Github className="w-5 h-5" />
                <span>How it Works</span>
              </a>
              <button
                onClick={() => {
                  setShowInfoPopover(false);
                  setShowAnalyticsPopup(true);
                }}
                className="flex items-center justify-center gap-3 text-lg text-gray-700 dark:text-gray-300 hover:text-accent-600 dark:hover:text-accent-400 transition-colors w-full"
              >
                <BarChart3 className="w-5 h-5" />
                <span>Analytics</span>
              </button>
              <div className="pt-6 mt-6 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-center gap-4 text-sm">
                  <a
                    href="#"
                    onClick={() => setShowInfoPopover(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                  >
                    Terms of Service
                  </a>
                  <span className="text-gray-400 dark:text-gray-500">|</span>
                  <a
                    href="#"
                    onClick={() => setShowInfoPopover(false)}
                    className="text-gray-500 dark:text-gray-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay Popups */}
      <OverlayPopup
        title="Buy me a coffee"
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

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => {
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={item.action}
                className="flex items-center justify-center py-4 px-4 flex-1"
                aria-label={item.id}
              >
                <Icon
                  className={`w-6 h-6 ${
                    item.isActive
                      ? "text-accent-600 dark:text-accent-400"
                      : "text-gray-400 dark:text-gray-500"
                  }`}
                />
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

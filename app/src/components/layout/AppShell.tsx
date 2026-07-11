import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { FeedColumn } from "./FeedColumn";
import { FeaturedSidebar } from "./FeaturedSidebar";
import { MobileNav } from "./MobileNav";
import { MobileHeader } from "./MobileHeader";
import { MobileCategoriesMenu } from "./MobileCategoriesMenu";
import { MobileFeaturedView } from "./MobileFeaturedView";
import { MobileSearchView } from "./MobileSearchView";
import { useAppStore } from "@/store/useAppStore";

export function AppShell() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { mobileView } = useAppStore();

  const renderMobileContent = () => {
    switch (mobileView) {
      case "featured":
        return <MobileFeaturedView />;
      case "search":
        return <MobileSearchView />;
      default:
        return (
          <div className="w-full md:flex-1 pt-14 pb-20 md:pt-0 md:pb-0">
            <FeedColumn />
          </div>
        );
    }
  };

  return (
    <>
      {/* ── App root ── */}
      <div className="flex flex-col min-h-screen transition-colors">
        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-50">
          <MobileHeader
            onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          />
        </div>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <>
            <div
              className="md:hidden fixed inset-0 z-40 bg-black/50"
              onClick={() => setMobileMenuOpen(false)}
            />
            <div className="md:hidden fixed left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 z-50 overflow-y-auto transform transition-transform duration-300 shadow-lg">
              <MobileCategoriesMenu onClose={() => setMobileMenuOpen(false)} />
            </div>
          </>
        )}

        {/* Main Layout */}
        <div className="flex-1 flex justify-center">
          {/* Mobile */}
          <div className="md:hidden w-full">{renderMobileContent()}</div>

          {/* Desktop */}
          <div className="hidden md:flex w-full max-w-[1440px] items-start px-6 pt-8 gap-4">
            {/* Left Sidebar */}
            <div
              className="hidden md:block w-64 shrink-0 sticky self-start top-8"
            >
              <Sidebar />
            </div>

            {/* Center Feed */}
            <div className="w-full md:flex-1 md:min-w-0">
              <FeedColumn />
            </div>

            {/* Right Featured Sidebar */}
            <div
              className="hidden lg:block w-80 shrink-0 sticky self-start top-8"
            >
              <FeaturedSidebar />
            </div>
          </div>
        </div>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <MobileNav />
        </div>
      </div>
    </>
  );
}

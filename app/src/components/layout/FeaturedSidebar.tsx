import { ProfileCard } from "@/components/ui/ProfileCard";
import { AISummaryCard } from "@/components/feed/AISummaryCard";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

export function FeaturedSidebar() {
  // Check if EC version is enabled via query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const showProfileCard = urlParams.get("ec") === "true";

  return (
    <aside className="flex flex-col pb-6 space-y-4">
      {/* Profile Card - Only shown when ?ec=true */}
      {showProfileCard && <ProfileCard />}

      {/* Daily Podcast — Audio Player */}
      <AudioPlayer />

      {/* AI Summary */}
      <AISummaryCard />
    </aside>
  );
}

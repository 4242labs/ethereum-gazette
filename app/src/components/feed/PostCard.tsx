import type { Post } from "@/types";
import { useState, useCallback } from "react";
import { trackEvent } from "@/lib/analytics";
import {
  Users,
  Briefcase,
  GraduationCap,
  Newspaper,
  Calendar,
  Building,
  BriefcaseIcon,
  HandCoins,
  Users2,
  Podcast,
  Video,
  ArrowUpRight,
  Volume2,
  Square,
} from "lucide-react";

// Map categories to their corresponding icons
const categoryIcons: Record<string, typeof Newspaper> = {
  all: Newspaper,
  people: Users,
  projects: Briefcase,
  education: GraduationCap,
  news: Newspaper,
  events: Calendar,
  orgs: Building,
  jobs: BriefcaseIcon,
  grants: HandCoins,
  communities: Users2,
  podcasts: Podcast,
  youtube: Video,
};

// Map categories to display labels
const categoryLabels: Record<string, string> = {
  all: "All",
  people: "People",
  projects: "Projects",
  education: "Education",
  news: "News",
  events: "Events",
  orgs: "Orgs",
  jobs: "Jobs",
  grants: "Grants",
  communities: "Communities",
  podcasts: "Podcasts",
  youtube: "YouTube",
};

// Map categories to their badge color classes
const categoryBadgeColors: Record<string, string> = {
  all: "badge-all",
  people: "badge-people",
  projects: "badge-projects",
  education: "badge-education",
  news: "badge-news",
  events: "badge-events",
  orgs: "badge-orgs",
  jobs: "badge-jobs",
  grants: "badge-grants",
  communities: "badge-communities",
  podcasts: "badge-podcasts",
  youtube: "badge-youtube",
};

// Category fallback background colors (matches per-category icon colors in index.css)
const categoryFallbackBgs: Record<string, string> = {
  all: "bg-accent-500",
  people: "bg-cyan-500",
  orgs: "bg-indigo-500",
  projects: "bg-amber-500",
  education: "bg-emerald-500",
  news: "bg-red-500",
  events: "bg-pink-500",
  jobs: "bg-blue-500",
  grants: "bg-purple-500",
  communities: "bg-teal-500",
  podcasts: "bg-rose-500",
  youtube: "bg-sky-500",
};

// Fixed card height (px) — with 50-char titles and 150-char snippets, content is predictable.
// Exported so AI Summary card can reference 2x this value.
export const POST_CARD_HEIGHT = 180;

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else if (diffInDays < 30) {
    return `${diffInDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
};

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const Icon = categoryIcons[post.category] ?? Newspaper;
  const categoryLabel = categoryLabels[post.category] ?? post.category;
  const badgeColorClass = categoryBadgeColors[post.category] ?? "badge-news";
  const fallbackBg = categoryFallbackBgs[post.category] ?? "bg-accent-500";
  const isTitleless = !post.title || post.title.trim() === "";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [imgError, setImgError] = useState(false);

  const handleClick = () => {
    trackEvent("Content", "PostClick", post.source);
    window.open(post.url, "_blank", "noopener,noreferrer");
  };

  const handleListen = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
        return;
      }

      const text = [post.title, post.snippet].filter(Boolean).join(". ");
      if (!text) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      setIsSpeaking(true);
    },
    [isSpeaking, post.title, post.snippet],
  );

  return (
    <article
      onClick={handleClick}
      className="
        bg-white dark:bg-gray-800 rounded-xl
        border border-gray-300 dark:border-gray-700
        shadow-soft hover:shadow-soft-md
        hover-lift
        transition-all duration-200 cursor-pointer
        group
        w-full min-w-0 overflow-hidden
      "
      style={{ height: POST_CARD_HEIGHT }}
    >
      <div className="flex flex-row items-stretch">
        {/* Image / Fallback — square, width = card height */}
        <div
          className="relative shrink-0 rounded-l-xl overflow-hidden"
          style={{ width: POST_CARD_HEIGHT }}
        >
          {post.imageUrl && !imgError ? (
            <img
              src={post.imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className={`absolute inset-0 flex items-center justify-center ${fallbackBg}`}>
              <Icon className="w-8 h-8 text-white/60" />
            </div>
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0 p-6">
          {/* Category Badge */}
          <div className="mb-2">
            <span className={`badge-pill ${badgeColorClass}`}>
              <Icon className={`w-3.5 h-3.5`} />
              {categoryLabel}
            </span>
          </div>

          {/* Title */}
          {!isTitleless && (
            <h2 className="text-title text-[18px] text-gray-900 dark:text-gray-100 mb-1.5 line-clamp-2 group-hover:text-accent-700 dark:group-hover:text-accent-300 transition-colors break-words">
              {post.title}
            </h2>
          )}

          {/* Snippet */}
          <p
            className={`text-body mb-3 break-words ${
              isTitleless ? "text-lg leading-relaxed" : "text-sm line-clamp-2"
            }`}
          >
            {post.snippet}
          </p>

          {/* Metadata Footer */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <span className="font-semibold text-gray-700 dark:text-gray-300 truncate">
                {post.author}
              </span>
              <span className="text-gray-400">·</span>
              <span className="text-gray-500 dark:text-gray-400 truncate">
                {post.source}
              </span>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              <span className="whitespace-nowrap">
                {formatRelativeTime(post.timestamp)}
              </span>
              <button
                onClick={handleListen}
                aria-label={isSpeaking ? "Stop listening" : "Listen to post"}
                title={isSpeaking ? "Stop" : "Listen"}
                className="p-1 -m-1 rounded-full text-gray-500 dark:text-gray-300 hover:text-accent-500 dark:hover:text-accent-400 transition-colors"
              >
                {isSpeaking ? (
                  <Square className="w-4.5 h-4.5 fill-current" />
                ) : (
                  <Volume2 className="w-4.5 h-4.5" />
                )}
              </button>
              <ArrowUpRight className="w-4 h-4 text-accent-500 transform translate-x-[-20px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-200" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

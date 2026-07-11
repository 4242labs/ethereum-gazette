import { featuredItems } from "@/data/featured";
import { ExternalLink } from "lucide-react";

export function MobileFeaturedView() {
  const items = featuredItems;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-14 pb-20 px-4">
      <div className="py-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
          Featured Content
        </h1>

        <div className="space-y-4">
          {items.map((item) => (
            <article
              key={item.id}
              onClick={() =>
                window.open(item.url, "_blank", "noopener,noreferrer")
              }
              className={`
                rounded-lg p-6 cursor-pointer transition-all duration-200
                ${
                  item.featuredLevel === 1
                    ? "bg-gradient-to-br from-accent-500 to-accent-600 text-white"
                    : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"
                }
              `}
            >
              {item.badge && (
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3
                  ${
                    item.featuredLevel === 1
                      ? "bg-white/20 text-white"
                      : "bg-accent-100 text-accent-700 dark:bg-accent-900/50 dark:text-accent-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}

              <h3
                className={`text-lg font-semibold mb-2
                ${
                  item.featuredLevel === 1
                    ? "text-white"
                    : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {item.title}
              </h3>

              <p
                className={`text-sm mb-3
                ${
                  item.featuredLevel === 1
                    ? "text-white/90"
                    : "text-gray-600 dark:text-gray-300"
                }`}
              >
                {item.description}
              </p>

              <div className="flex items-center gap-2">
                <span
                  className={`text-xs
                  ${
                    item.featuredLevel === 1
                      ? "text-white/70"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  View Details
                </span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

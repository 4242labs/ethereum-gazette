import { useState } from "react";
import { Headphones, Play, Pause } from "lucide-react";

export function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-300 dark:border-gray-700 shadow-soft hover:shadow-soft-md transition-all duration-200">
      {/* Badge — centered */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase shadow-sm bg-gradient-to-r from-accent-500 to-accent-600 text-white">
          <Headphones className="w-3 h-3" />
          AI Daily Podcast
        </span>
      </div>

      {/* Player controls */}
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          disabled
          className="w-9 h-9 flex items-center justify-center rounded-full bg-accent-500/20 dark:bg-accent-500/30 text-accent-600 dark:text-accent-400 opacity-50 cursor-not-allowed flex-shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Progress bar */}
        <div className="flex-1 min-w-0">
          <div className="h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-accent-500"
              style={{ width: "0%" }}
            />
          </div>
        </div>

        {/* Time */}
        <span className="text-[11px] text-gray-500 dark:text-gray-400 tabular-nums flex-shrink-0">
          0:00
        </span>
      </div>
    </div>
  );
}

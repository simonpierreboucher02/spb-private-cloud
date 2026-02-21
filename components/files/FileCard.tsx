"use client";

import { motion } from "framer-motion";
import {
  FileText,
  Image,
  Video,
  Music,
  FileCode,
  FileSpreadsheet,
  File,
  Archive,
  MoreVertical,
  Star,
} from "lucide-react";
import { formatFileSize, getFileIcon } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import FileActions from "./FileActions";
import type { FileData } from "@/types/files";

interface FileCardProps {
  file: FileData;
  onPreview: (file: FileData) => void;
  onRefresh: () => void;
  viewMode: "grid" | "list";
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  image: Image,
  video: Video,
  audio: Music,
  pdf: FileText,
  code: FileCode,
  spreadsheet: FileSpreadsheet,
  archive: Archive,
  document: FileText,
  file: File,
  presentation: FileText,
};

const iconColorMap: Record<string, string> = {
  image:        "text-emerald-500",
  video:        "text-purple-500",
  audio:        "text-pink-500",
  pdf:          "text-red-500",
  code:         "text-amber-500",
  spreadsheet:  "text-green-600",
  archive:      "text-orange-500",
  document:     "text-blue-500",
  presentation: "text-orange-500",
  file:         "text-gray-400",
};

// Soft tinted bg per file type (light + dark)
const bgTintMap: Record<string, string> = {
  image:        "bg-emerald-50 dark:bg-emerald-950/30",
  video:        "bg-purple-50 dark:bg-purple-950/30",
  audio:        "bg-pink-50 dark:bg-pink-950/30",
  pdf:          "bg-red-50 dark:bg-red-950/30",
  code:         "bg-amber-50 dark:bg-amber-950/30",
  spreadsheet:  "bg-green-50 dark:bg-green-950/30",
  archive:      "bg-orange-50 dark:bg-orange-950/30",
  document:     "bg-blue-50 dark:bg-blue-950/30",
  presentation: "bg-orange-50 dark:bg-orange-950/30",
  file:         "bg-gray-50 dark:bg-white/[0.03]",
};

function formatRelativeDate(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const months = Math.floor(days / 30);
  if (minutes < 1) return "à l'instant";
  if (minutes < 60) return `il y a ${minutes}m`;
  if (hours < 24) return `il y a ${hours}h`;
  if (days < 30) return `il y a ${days}j`;
  if (months < 12) return `il y a ${months} mois`;
  return new Date(dateStr).toLocaleDateString("fr-CA", { year: "numeric", month: "short" });
}

export default function FileCard({ file, onPreview, onRefresh, viewMode }: FileCardProps) {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const iconType = getFileIcon(file.mimeType);
  const Icon = iconMap[iconType] || File;
  const iconColor = iconColorMap[iconType] || "text-gray-400";
  const bgTint = bgTintMap[iconType] || "bg-gray-50 dark:bg-white/[0.03]";
  const isImage = file.mimeType.startsWith("image/");
  const isFavorite = file.metadata?.isFavorite;
  const tags = file.tags ?? [];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Tags as color dots — max 4 visible, then +N
  function TagDots() {
    if (tags.length === 0) return null;
    const visible = tags.slice(0, 4);
    const overflow = tags.length - 4;
    return (
      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
        {visible.map(({ tag }) => (
          <span
            key={tag.id}
            className="w-2.5 h-2.5 rounded-full flex-shrink-0 border border-white/20"
            style={{ backgroundColor: tag.color }}
            title={tag.name}
          />
        ))}
        {overflow > 0 && (
          <span className="text-[10px] text-gray-400 leading-none">+{overflow}</span>
        )}
      </div>
    );
  }

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-3 py-3 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
        onClick={() => onPreview(file)}
      >
        {/* Icon */}
        <div className={`w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 ${bgTint}`}>
          <Icon className={`w-4 h-4 ${iconColor}`} />
        </div>

        {/* Name */}
        <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate min-w-0">{file.name}</span>

        {/* Tags dots (list) */}
        {tags.length > 0 && (
          <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
            {tags.slice(0, 3).map(({ tag }) => (
              <span
                key={tag.id}
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: tag.color }}
                title={tag.name}
              />
            ))}
          </div>
        )}

        {isFavorite && <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 flex-shrink-0 hidden sm:block" />}
        <span className="text-sm text-gray-500 hidden sm:block flex-shrink-0">{formatFileSize(file.size)}</span>
        <span className="text-xs text-gray-400 hidden md:block flex-shrink-0 min-w-[80px] text-right">{formatRelativeDate(file.createdAt)}</span>

        {/* Actions menu */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showActions && (
            <FileActions file={file} onClose={() => setShowActions(false)} onRefresh={onRefresh} />
          )}
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:hover:border-white/20 transition-colors cursor-pointer shadow-sm dark:shadow-none ${showActions ? "z-20" : ""}`}
      onClick={() => onPreview(file)}
    >
      {/* Thumbnail */}
      <div className={`aspect-square flex items-center justify-center rounded-t-xl overflow-hidden ${isImage ? "" : bgTint}`}>
        {isImage ? (
          <img
            src={`/api/files/${file.id}/preview`}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className={`w-14 h-14 ${iconColor}`} />
        )}
      </div>

      {/* Favorite star — top left */}
      {isFavorite && (
        <div className="absolute top-2 left-2 z-10">
          <Star className="w-4 h-4 text-amber-400 fill-amber-400 drop-shadow" />
        </div>
      )}

      {/* Actions button — top right */}
      <div className="absolute top-2 right-2 z-20" ref={menuRef}>
        <button
          onClick={(e) => { e.stopPropagation(); setShowActions(!showActions); }}
          className="p-2 bg-white/80 dark:bg-black/50 rounded-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {showActions && (
          <FileActions file={file} onClose={() => setShowActions(false)} onRefresh={onRefresh} />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-gray-700 dark:text-gray-200 truncate font-medium">{file.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
          <span>{formatFileSize(file.size)}</span>
          <span className="text-gray-300 dark:text-gray-700">·</span>
          <span>{formatRelativeDate(file.createdAt)}</span>
        </p>
        <TagDots />
      </div>
    </motion.div>
  );
}

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
} from "lucide-react";
import { formatFileSize, formatDate, getFileIcon } from "@/lib/utils";
import { useState, useRef, useEffect } from "react";
import FileActions from "./FileActions";

interface FileData {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
  folderId?: string | null;
}

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
  image:        "text-emerald-400 dark:text-emerald-500",
  video:        "text-purple-400 dark:text-purple-500",
  audio:        "text-pink-400 dark:text-pink-500",
  pdf:          "text-red-400 dark:text-red-500",
  code:         "text-amber-400 dark:text-amber-500",
  spreadsheet:  "text-green-500 dark:text-green-400",
  archive:      "text-orange-400 dark:text-orange-500",
  document:     "text-blue-500 dark:text-blue-400",
  presentation: "text-orange-500 dark:text-orange-400",
  file:         "text-gray-400 dark:text-gray-500",
};

export default function FileCard({ file, onPreview, onRefresh, viewMode }: FileCardProps) {
  const [showActions, setShowActions] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const iconType = getFileIcon(file.mimeType);
  const Icon = iconMap[iconType] || File;
  const iconColor = iconColorMap[iconType] || "text-gray-400 dark:text-gray-500";

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowActions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isImage = file.mimeType.startsWith("image/");

  if (viewMode === "list") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-3 py-3.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-pointer group transition-colors"
        onClick={() => onPreview(file)}
      >
        <Icon className={`w-5 h-5 flex-shrink-0 ${iconColor}`} />
        <span className="text-sm text-gray-700 dark:text-gray-200 flex-1 truncate">{file.name}</span>
        <span className="text-sm text-gray-500 hidden sm:block">{formatFileSize(file.size)}</span>
        <span className="text-xs text-gray-500 hidden md:block">{formatDate(file.createdAt)}</span>
        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowActions(!showActions);
            }}
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
          {showActions && (
            <FileActions
              file={file}
              onClose={() => setShowActions(false)}
              onRefresh={onRefresh}
            />
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`group relative bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:border-gray-300 dark:hover:border-white/20 transition-colors cursor-pointer shadow-sm dark:shadow-none ${showActions ? "z-20" : ""}`}
      onClick={() => onPreview(file)}
    >
      {/* Preview thumbnail — overflow-hidden stays here for image crop only */}
      <div className="aspect-square flex items-center justify-center bg-gray-50 dark:bg-white/[0.02] rounded-t-xl overflow-hidden">
        {isImage ? (
          <img
            src={`/api/files/${file.id}/preview`}
            alt={file.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className={`w-12 h-12 ${iconColor}`} />
        )}
      </div>

      {/* Actions button — outside overflow-hidden so dropdown is never clipped */}
      <div className="absolute top-2 right-2 z-20" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowActions(!showActions);
          }}
          className="p-2 bg-white/80 dark:bg-black/50 rounded-lg text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity backdrop-blur-sm min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {showActions && (
          <FileActions
            file={file}
            onClose={() => setShowActions(false)}
            onRefresh={onRefresh}
          />
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <p className="text-sm text-gray-700 dark:text-gray-200 truncate">{file.name}</p>
        <p className="text-sm text-gray-500 mt-1">
          {formatFileSize(file.size)}
        </p>
      </div>
    </motion.div>
  );
}

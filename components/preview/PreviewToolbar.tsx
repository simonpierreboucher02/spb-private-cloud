"use client";

import { X, Download, Maximize2, Minimize2, Edit3, Eye, Star } from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";
import type { FileData } from "@/types/files";

interface PreviewToolbarProps {
  file: FileData;
  fullscreen: boolean;
  isEditing: boolean;
  supportsEdit: boolean;
  onClose: () => void;
  onToggleFullscreen: () => void;
  onToggleEdit: () => void;
  onToggleFavorite?: () => void;
  isFavorite?: boolean;
}

export default function PreviewToolbar({
  file,
  fullscreen,
  isEditing,
  supportsEdit,
  onClose,
  onToggleFullscreen,
  onToggleEdit,
  onToggleFavorite,
  isFavorite,
}: PreviewToolbarProps) {
  return (
    <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b border-gray-200 dark:border-white/10 flex-shrink-0 bg-white dark:bg-[#0a0a0a] transition-colors">
      <div className="flex-1 min-w-0 mr-2">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px] sm:max-w-none">{file.name}</h3>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size)} - {formatDate(file.createdAt)}
        </p>
      </div>
      <div className="flex items-center gap-1.5">
        {onToggleFavorite && (
          <button
            onClick={onToggleFavorite}
            className="p-2.5 transition-colors rounded-lg"
            title={isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <Star
              className={`w-4 h-4 ${isFavorite ? "text-yellow-400 fill-yellow-400" : "text-gray-400 hover:text-yellow-400"}`}
            />
          </button>
        )}
        {supportsEdit && (
          <button
            onClick={onToggleEdit}
            className={`p-2.5 transition-colors rounded-lg ${
              isEditing ? "text-blue-400 bg-blue-400/10" : "text-gray-400 hover:text-gray-900 dark:hover:text-white"
            }`}
            title={isEditing ? "Mode aperçu" : "Mode édition"}
          >
            {isEditing ? <Eye className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
          </button>
        )}
        <button
          onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
          className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg"
          title="Télécharger"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={onToggleFullscreen}
          className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hidden lg:flex items-center justify-center rounded-lg"
          title={fullscreen ? "Réduire" : "Plein écran"}
        >
          {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        <button
          onClick={onClose}
          className="p-2.5 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors rounded-lg"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

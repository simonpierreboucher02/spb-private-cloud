"use client";

import { Download, FileQuestion } from "lucide-react";
import type { PreviewPluginProps } from "./types";
import { formatFileSize } from "@/lib/utils";

export default function FallbackPreview({ file }: PreviewPluginProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
      <FileQuestion className="w-16 h-16 mb-4 text-gray-600" />
      <p className="text-lg mb-1">Aperçu non disponible</p>
      <p className="text-sm text-gray-500 mb-1">{file.name}</p>
      <p className="text-xs text-gray-600 mb-6">{file.mimeType} - {formatFileSize(file.size)}</p>
      <button
        onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
        className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg text-sm text-white hover:bg-white/20 transition-colors"
      >
        <Download className="w-4 h-4" />
        Télécharger
      </button>
    </div>
  );
}

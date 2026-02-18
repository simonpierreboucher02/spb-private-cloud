"use client";

import { useState, useEffect, useCallback } from "react";
import { Star } from "lucide-react";
import AppShell from "@/components/layout/AppShell";
import FileCard from "@/components/files/FileCard";
import PreviewEngine from "@/components/preview/PreviewEngine";
import type { FileData } from "@/types/files";

export default function FavoritesPage() {
  const [files, setFiles] = useState<FileData[]>([]);
  const [previewFile, setPreviewFile] = useState<FileData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/files?favorite=true");
      if (res.ok) setFiles(await res.json());
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  return (
    <AppShell>
      <div className="flex flex-col h-full lg:flex-row">
        <div className="flex-1 flex flex-col min-w-0">
          <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-white/10">
            <h1 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Favoris
            </h1>
            <p className="text-xs text-gray-500 mt-1">{files.length} fichier{files.length !== 1 ? "s" : ""}</p>
          </div>

          <div className="flex-1 overflow-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
              </div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Star className="w-12 h-12 mb-4 text-gray-300 dark:text-gray-600" />
                <p className="text-lg">Aucun favori</p>
                <p className="text-sm mt-1 text-center px-4">Ajoutez des fichiers aux favoris pour les retrouver ici</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3">
                {files.map((file) => (
                  <FileCard
                    key={file.id}
                    file={file}
                    onPreview={setPreviewFile}
                    onRefresh={fetchFavorites}
                    viewMode="grid"
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {previewFile && (
          <div className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:w-[400px] lg:border-l lg:border-gray-200 dark:lg:border-white/10">
            <PreviewEngine
              file={previewFile}
              files={files}
              onClose={() => setPreviewFile(null)}
              onNavigate={setPreviewFile}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}

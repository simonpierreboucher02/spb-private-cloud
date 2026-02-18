"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, ChevronUp } from "lucide-react";
import PreviewToolbar from "./PreviewToolbar";
import PreviewNavigation from "./PreviewNavigation";
import MetadataEditor from "./editors/MetadataEditor";
import VersionHistory from "./VersionHistory";
import { getPlugin } from "./plugins";
import type { FileData } from "@/types/files";
import toast from "react-hot-toast";

interface PreviewEngineProps {
  file: FileData | null;
  files?: FileData[];
  onClose: () => void;
  onNavigate?: (file: FileData) => void;
}

export default function PreviewEngine({
  file,
  files = [],
  onClose,
  onNavigate,
}: PreviewEngineProps) {
  const [fullscreen, setFullscreen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [showMobileInfo, setShowMobileInfo] = useState(false);

  const handleSave = useCallback(
    async (data: Blob | string, asNewVersion?: boolean) => {
      if (!file) return;
      try {
        if (typeof data === "string") {
          const res = await fetch(`/api/files/${file.id}/content`, {
            method: "PUT",
            headers: { "Content-Type": "text/plain" },
            body: data,
          });
          if (!res.ok) throw new Error("Save failed");
          toast.success("Fichier sauvegardé");
        } else {
          const formData = new FormData();
          formData.append("file", data, file.name);
          if (asNewVersion) formData.append("asNewVersion", "true");

          const res = await fetch(`/api/files/${file.id}/save-edit`, {
            method: "POST",
            body: formData,
          });
          if (!res.ok) throw new Error("Save failed");
          toast.success(asNewVersion ? "Nouvelle version créée" : "Fichier sauvegardé");
        }
      } catch {
        toast.error("Erreur lors de la sauvegarde");
      }
    },
    [file]
  );

  const handleToggleFavorite = useCallback(async () => {
    if (!file) return;
    try {
      await fetch(`/api/files/${file.id}/favorite`, { method: "POST" });
      toast.success("Favori mis à jour");
    } catch {
      toast.error("Erreur");
    }
  }, [file]);

  if (!file) return null;

  const plugin = getPlugin(file.mimeType);
  const PluginComponent = plugin.component;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex flex-col bg-white dark:bg-[#0a0a0a] transition-colors ${
          fullscreen ? "" : "lg:relative lg:inset-auto lg:h-full"
        }`}
      >
        <PreviewToolbar
          file={file}
          fullscreen={fullscreen}
          isEditing={isEditing}
          supportsEdit={!!plugin.supportsEdit}
          onClose={onClose}
          onToggleFullscreen={() => setFullscreen(!fullscreen)}
          onToggleEdit={() => setIsEditing(!isEditing)}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={file.metadata?.isFavorite}
        />

        <div className="flex-1 flex overflow-hidden">
          {/* Main preview area */}
          <div className="flex-1 relative overflow-hidden">
            <PluginComponent
              file={file}
              isEditing={isEditing}
              onSave={handleSave}
              fullscreen={fullscreen}
            />

            {files.length > 1 && onNavigate && (
              <PreviewNavigation
                files={files}
                currentFile={file}
                onNavigate={(f) => {
                  setIsEditing(false);
                  onNavigate(f);
                }}
              />
            )}
          </div>

          {/* Info panel toggle - only visible on desktop in fullscreen */}
          {fullscreen && (
            <div className="hidden lg:flex flex-col border-l border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a]">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className={`min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 transition-colors ${showInfo ? "text-gray-900 dark:text-white bg-gray-200 dark:bg-white/10" : "text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white"}`}
                title="Infos & tags"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile info toggle button */}
        <div className="lg:hidden border-t border-gray-200 dark:border-white/10">
          <button
            onClick={() => setShowMobileInfo(!showMobileInfo)}
            className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <Info className="w-4 h-4" />
            <span>{showMobileInfo ? "Masquer les infos" : "Voir les infos"}</span>
            <ChevronUp className={`w-4 h-4 transition-transform ${showMobileInfo ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Mobile info panel (bottom slide-up) */}
        {showMobileInfo && (
          <div className="lg:hidden overflow-auto max-h-64 border-t border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#0a0a0a]">
            <MetadataEditor file={file} />
            <VersionHistory fileId={file.id} />
          </div>
        )}

        {/* Desktop info sidebar (metadata + versions) */}
        {((fullscreen && showInfo) || !fullscreen) && (
          <div className={`hidden lg:block ${fullscreen ? "w-72 border-l border-gray-200 dark:border-white/10 overflow-auto bg-gray-50 dark:bg-[#0a0a0a]" : "border-t border-gray-200 dark:border-white/10 overflow-auto max-h-64 lg:max-h-none"}`}>
            <MetadataEditor file={file} />
            <VersionHistory fileId={file.id} />
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { FileData } from "@/types/files";

interface PreviewNavigationProps {
  files: FileData[];
  currentFile: FileData;
  onNavigate: (file: FileData) => void;
}

export default function PreviewNavigation({
  files,
  currentFile,
  onNavigate,
}: PreviewNavigationProps) {
  const currentIndex = files.findIndex((f) => f.id === currentFile.id);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) onNavigate(files[currentIndex - 1]);
  }, [currentIndex, files, onNavigate]);

  const goNext = useCallback(() => {
    if (currentIndex < files.length - 1) onNavigate(files[currentIndex + 1]);
  }, [currentIndex, files, onNavigate]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // Don't capture if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" && e.altKey) { e.preventDefault(); goPrev(); }
      if (e.key === "ArrowRight" && e.altKey) { e.preventDefault(); goNext(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goPrev, goNext]);

  if (files.length <= 1) return null;

  return (
    <>
      {currentIndex > 0 && (
        <button
          onClick={goPrev}
          className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
          title="Précédent (Alt+←)"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {currentIndex < files.length - 1 && (
        <button
          onClick={goNext}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-sm z-10"
          title="Suivant (Alt+→)"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, FileText } from "lucide-react";
import type { PreviewPluginProps } from "./types";

export default function WordPreview({ file }: PreviewPluginProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const convert = async () => {
      setLoading(true);
      setError(false);
      try {
        // Fetch the raw file bytes
        const res = await fetch(`/api/files/${file.id}/download`);
        if (!res.ok) throw new Error("Download failed");
        const arrayBuffer = await res.arrayBuffer();

        // mammoth converts docx → clean HTML
        const mammoth = await import("mammoth");
        const result = await mammoth.convertToHtml(
          { arrayBuffer },
          {
            styleMap: [
              "p[style-name='Heading 1'] => h1:fresh",
              "p[style-name='Heading 2'] => h2:fresh",
              "p[style-name='Heading 3'] => h3:fresh",
              "p[style-name='Titre 1'] => h1:fresh",
              "p[style-name='Titre 2'] => h2:fresh",
            ],
          }
        );

        if (!cancelled) {
          setHtml(result.value || "<p>Document vide.</p>");
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    convert();
    return () => { cancelled = true; };
  }, [file.id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        <p className="text-sm">Chargement du document Word...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-gray-400 p-8">
        <FileText className="w-16 h-16 text-blue-400 opacity-50" />
        <p className="text-sm text-center">Impossible d&apos;afficher ce document.</p>
        <button
          onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm text-white transition-colors"
        >
          <Download className="w-4 h-4" />
          Télécharger le fichier
        </button>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto bg-gray-50 dark:bg-[#1a1a1a]">
      {/* Page-like container */}
      <div className="max-w-3xl mx-auto my-6 px-4 sm:px-6">
        <div className="bg-white dark:bg-[#242424] shadow-md rounded-sm px-8 py-10 sm:px-14 sm:py-12 min-h-[500px]">
          {/* Download link */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400 truncate max-w-xs">
                {file.name}
              </span>
            </div>
            <button
              onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 border border-gray-200 dark:border-white/10 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger
            </button>
          </div>

          {/* Rendered Word content */}
          <div
            className="word-content prose prose-sm sm:prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: html ?? "" }}
          />
        </div>
      </div>

      {/* Scoped styles for Word content */}
      <style jsx global>{`
        .word-content h1 { font-size: 1.6rem; font-weight: 700; margin-bottom: 0.5rem; margin-top: 1.5rem; }
        .word-content h2 { font-size: 1.3rem; font-weight: 600; margin-bottom: 0.4rem; margin-top: 1.2rem; }
        .word-content h3 { font-size: 1.1rem; font-weight: 600; margin-bottom: 0.3rem; margin-top: 1rem; }
        .word-content p  { margin-bottom: 0.6rem; line-height: 1.7; }
        .word-content ul, .word-content ol { padding-left: 1.5rem; margin-bottom: 0.6rem; }
        .word-content li { margin-bottom: 0.2rem; }
        .word-content table { border-collapse: collapse; width: 100%; margin-bottom: 1rem; }
        .word-content td, .word-content th { border: 1px solid #d1d5db; padding: 0.4rem 0.6rem; text-align: left; }
        .word-content th { background: #f3f4f6; font-weight: 600; }
        .dark .word-content td, .dark .word-content th { border-color: rgba(255,255,255,0.15); }
        .dark .word-content th { background: rgba(255,255,255,0.08); }
        .word-content strong { font-weight: 700; }
        .word-content em { font-style: italic; }
        .word-content a { color: #3b82f6; text-decoration: underline; }
        .word-content img { max-width: 100%; height: auto; margin: 0.5rem 0; }
      `}</style>
    </div>
  );
}

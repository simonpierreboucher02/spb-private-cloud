"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from "lucide-react";
import { isPreviewable, getLanguageFromMime, formatFileSize, formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";

const SyntaxHighlighter = dynamic(
  () => import("react-syntax-highlighter").then((mod) => mod.Light),
  { ssr: false }
);

interface FileData {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  createdAt: string;
}

interface FilePreviewProps {
  file: FileData | null;
  files?: FileData[];
  onClose: () => void;
  onNavigate?: (file: FileData) => void;
}

export default function FilePreview({ file, files = [], onClose, onNavigate }: FilePreviewProps) {
  const [textContent, setTextContent] = useState<string>("");
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentIndex = files.findIndex((f) => f.id === file?.id);

  useEffect(() => {
    if (!file) return;

    const isText =
      file.mimeType.startsWith("text/") ||
      file.mimeType.includes("json") ||
      file.mimeType.includes("xml") ||
      file.mimeType.includes("javascript") ||
      file.mimeType.includes("typescript") ||
      file.mimeType.includes("markdown");

    if (isText) {
      setLoading(true);
      fetch(`/api/files/${file.id}/preview`)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }

    if (file.mimeType === "text/csv") {
      setLoading(true);
      fetch(`/api/files/${file.id}/preview`)
        .then((res) => res.text())
        .then((text) => {
          setTextContent(text);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [file]);

  if (!file) return null;

  const handlePrev = () => {
    if (currentIndex > 0 && onNavigate) onNavigate(files[currentIndex - 1]);
  };

  const handleNext = () => {
    if (currentIndex < files.length - 1 && onNavigate) onNavigate(files[currentIndex + 1]);
  };

  const renderPreview = () => {
    if (!isPreviewable(file.mimeType)) {
      return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400">
          <p className="text-lg mb-2">Aperçu non disponible</p>
          <p className="text-sm text-gray-500">{file.mimeType}</p>
          <button
            onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
            className="mt-4 px-4 py-2 bg-white/10 rounded-lg text-sm hover:bg-white/20 transition-colors"
          >
            Télécharger
          </button>
        </div>
      );
    }

    if (file.mimeType.startsWith("image/")) {
      return (
        <div className="flex items-center justify-center h-full">
          <img
            src={`/api/files/${file.id}/preview`}
            alt={file.name}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (file.mimeType.startsWith("video/")) {
      return (
        <div className="flex items-center justify-center h-full">
          <video
            src={`/api/files/${file.id}/preview`}
            controls
            className="max-w-full max-h-full"
          >
            Your browser does not support video.
          </video>
        </div>
      );
    }

    if (file.mimeType.startsWith("audio/")) {
      return (
        <div className="flex items-center justify-center h-full">
          <audio src={`/api/files/${file.id}/preview`} controls className="w-full max-w-md">
            Your browser does not support audio.
          </audio>
        </div>
      );
    }

    if (file.mimeType === "application/pdf") {
      return (
        <iframe
          src={`/api/files/${file.id}/preview`}
          className="w-full h-full border-0"
          title={file.name}
        />
      );
    }

    if (file.mimeType === "text/csv") {
      if (loading) return <div className="text-gray-400 p-4">Chargement...</div>;
      const rows = textContent.split("\n").map((row) => row.split(","));
      return (
        <div className="overflow-auto h-full p-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {rows[0]?.map((header, i) => (
                  <th key={i} className="border border-white/10 px-3 py-2 text-left text-gray-300 bg-white/5">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(1).map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border border-white/10 px-3 py-2 text-gray-400">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Text / Code / Markdown
    if (loading) return <div className="text-gray-400 p-4">Chargement...</div>;

    const isCode =
      file.mimeType.includes("javascript") ||
      file.mimeType.includes("typescript") ||
      file.mimeType.includes("json") ||
      file.mimeType.includes("xml") ||
      file.mimeType.includes("css") ||
      file.mimeType.includes("html");

    if (isCode) {
      const language = getLanguageFromMime(file.mimeType);
      return (
        <div className="overflow-auto h-full p-4">
          <SyntaxHighlighter
            language={language}
            customStyle={{
              background: "transparent",
              padding: 0,
              margin: 0,
              fontSize: "0.875rem",
            }}
          >
            {textContent}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <div className="overflow-auto h-full p-6">
        <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">
          {textContent}
        </pre>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`fixed inset-0 z-50 flex flex-col bg-[#0a0a0a] ${
          fullscreen ? "" : "lg:relative lg:inset-auto lg:h-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 flex-shrink-0">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{file.name}</h3>
            <p className="text-xs text-gray-500">
              {formatFileSize(file.size)} - {formatDate(file.createdAt)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => window.open(`/api/files/${file.id}/download`, "_blank")}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setFullscreen(!fullscreen)}
              className="p-2 text-gray-400 hover:text-white transition-colors hidden lg:block"
            >
              {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 relative overflow-hidden">
          {renderPreview()}

          {/* Navigation arrows */}
          {files.length > 1 && (
            <>
              {currentIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {currentIndex < files.length - 1 && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

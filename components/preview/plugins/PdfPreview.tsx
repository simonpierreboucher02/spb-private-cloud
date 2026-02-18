"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import type { PreviewPluginProps } from "./types";

export default function PdfPreview({ file }: PreviewPluginProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);
  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const renderPage = useCallback(async (num: number, currentScale: number) => {
    const pdf = pdfDocRef.current;
    if (!pdf || !canvasRef.current) return;

    try {
      // Cancel any in-progress render
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }

      const page = await pdf.getPage(num);
      const viewport = page.getViewport({ scale: currentScale });
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) return;

      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (e: unknown) {
      // Ignore cancelled render errors
      if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "RenderingCancelledException") return;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");

        // Use local worker file copied to /public
        pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjsLib.getDocument({
          url: `/api/files/${file.id}/preview`,
          cMapUrl: "https://cdn.jsdelivr.net/npm/pdfjs-dist@5.4.624/cmaps/",
          cMapPacked: true,
        });

        const pdf = await loadingTask.promise;
        if (cancelled) return;

        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
        setLoading(false);

        // Render first page after state is set
        await renderPage(1, 1.2);
      } catch (err) {
        console.error("PDF load error:", err);
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
      }
    };
  }, [file.id, renderPage]);

  // Re-render when page or scale changes (but not on initial load)
  useEffect(() => {
    if (!loading && pdfDocRef.current) {
      renderPage(pageNum, scale);
    }
  }, [pageNum, scale, renderPage, loading]);

  const goToPage = useCallback((num: number) => {
    setPageNum(Math.max(1, Math.min(num, totalPages)));
  }, [totalPages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goToPage(pageNum - 1); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goToPage(pageNum + 1); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pageNum, goToPage]);

  if (error) {
    // Fallback to browser's built-in PDF viewer via iframe
    return (
      <div className="w-full h-full">
        <iframe
          src={`/api/files/${file.id}/preview`}
          className="w-full h-full border-0"
          title={file.name}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5 flex-shrink-0">
        <button
          onClick={() => goToPage(pageNum - 1)}
          disabled={pageNum <= 1}
          className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors rounded hover:bg-white/10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <input
            type="number"
            value={pageNum}
            onChange={(e) => goToPage(parseInt(e.target.value) || 1)}
            className="w-10 bg-white/10 border border-white/10 rounded px-1.5 py-0.5 text-center text-white text-xs"
            min={1}
            max={totalPages}
          />
          <span>/ {totalPages}</span>
        </div>
        <button
          onClick={() => goToPage(pageNum + 1)}
          disabled={pageNum >= totalPages}
          className="p-1.5 text-gray-400 hover:text-white disabled:opacity-30 transition-colors rounded hover:bg-white/10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/10 mx-1" />

        <button
          onClick={() => setScale((s) => Math.min(s + 0.2, 3))}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={() => setScale(1.2)}
          className="text-[10px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Canvas */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center p-4 bg-gray-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <canvas
            ref={canvasRef}
            className="shadow-2xl max-w-full"
            style={{ background: "white" }}
          />
        )}
      </div>
    </div>
  );
}

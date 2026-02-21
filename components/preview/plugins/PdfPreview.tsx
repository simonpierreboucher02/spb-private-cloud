"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut,
  Highlighter, StickyNote, Pen, Trash2, MousePointer,
} from "lucide-react";
import type { PreviewPluginProps } from "./types";

// ── Annotation types ──────────────────────────────────────────────────────────

type AnnotationTool = "pointer" | "highlight" | "note" | "pen";

interface HighlightAnnotation {
  id: string;
  type: "highlight";
  x: number; y: number; w: number; h: number;
  color: string;
}

interface NoteAnnotation {
  id: string;
  type: "note";
  x: number; y: number;
  text: string;
}

interface PenAnnotation {
  id: string;
  type: "pen";
  path: string;       // SVG path data
  color: string;
}

type Annotation = HighlightAnnotation | NoteAnnotation | PenAnnotation;

interface PageAnnotations {
  [page: number]: Annotation[];
}

// ── Tiny uid ──────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PdfPreview({ file, isEditing }: PreviewPluginProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<{ cancel: () => void } | null>(null);

  const [pageNum, setPageNum] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.2);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Annotation state
  const [tool, setTool] = useState<AnnotationTool>("pointer");
  const [pageAnnotations, setPageAnnotations] = useState<PageAnnotations>({});
  const [editingNote, setEditingNote] = useState<{ id: string; page: number } | null>(null);

  // Drawing state for highlight
  const drawingRef = useRef<{ startX: number; startY: number } | null>(null);
  const [drawRect, setDrawRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  // Drawing state for pen
  const penRef = useRef<string | null>(null);
  const [penPath, setPenPath] = useState<string | null>(null);

  // Canvas dimensions (for overlay sizing)
  const [canvasDims, setCanvasDims] = useState({ w: 0, h: 0 });

  // ── PDF render ─────────────────────────────────────────────────────────────
  const renderPage = useCallback(async (num: number, currentScale: number) => {
    const pdf = pdfDocRef.current;
    if (!pdf || !canvasRef.current) return;
    try {
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
      setCanvasDims({ w: viewport.width, h: viewport.height });
      const renderTask = page.render({ canvasContext: context, viewport });
      renderTaskRef.current = renderTask;
      await renderTask.promise;
      renderTaskRef.current = null;
    } catch (e: unknown) {
      if (e && typeof e === "object" && "name" in e && (e as { name: string }).name === "RenderingCancelledException") return;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const loadPdf = async () => {
      try {
        const pdfjsLib = await import("pdfjs-dist");
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
        await renderPage(1, 1.2);
      } catch (err) {
        console.error("PDF load error:", err);
        if (!cancelled) { setError(true); setLoading(false); }
      }
    };
    loadPdf();
    return () => {
      cancelled = true;
      if (renderTaskRef.current) renderTaskRef.current.cancel();
    };
  }, [file.id, renderPage]);

  useEffect(() => {
    if (!loading && pdfDocRef.current) renderPage(pageNum, scale);
  }, [pageNum, scale, renderPage, loading]);

  // ── Load annotations ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/files/${file.id}/annotations`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.annotations) {
          try {
            const parsed = JSON.parse(data.annotations);
            if (parsed?.pageAnnotations) setPageAnnotations(parsed.pageAnnotations);
          } catch {
            // ignore
          }
        }
      } catch {
        // ignore
      }
    };
    load();
  }, [file.id]);

  // ── Save annotations ───────────────────────────────────────────────────────
  const saveAnnotations = useCallback(async (pa: PageAnnotations) => {
    try {
      await fetch(`/api/files/${file.id}/annotations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ annotations: JSON.stringify({ pageAnnotations: pa }) }),
      });
    } catch {
      // ignore
    }
  }, [file.id]);

  const addAnnotation = useCallback((ann: Annotation) => {
    setPageAnnotations((prev) => {
      const next = { ...prev, [pageNum]: [...(prev[pageNum] ?? []), ann] };
      saveAnnotations(next);
      return next;
    });
  }, [pageNum, saveAnnotations]);

  const deleteAnnotation = useCallback((id: string) => {
    setPageAnnotations((prev) => {
      const next = {
        ...prev,
        [pageNum]: (prev[pageNum] ?? []).filter((a) => a.id !== id),
      };
      saveAnnotations(next);
      return next;
    });
  }, [pageNum, saveAnnotations]);

  const updateNoteText = useCallback((id: string, text: string) => {
    setPageAnnotations((prev) => {
      const next = {
        ...prev,
        [pageNum]: (prev[pageNum] ?? []).map((a) =>
          a.id === id ? { ...a, text } : a
        ),
      };
      saveAnnotations(next);
      return next;
    });
  }, [pageNum, saveAnnotations]);

  // ── Keyboard nav ───────────────────────────────────────────────────────────
  const goToPage = useCallback((num: number) => {
    setPageNum(Math.max(1, Math.min(num, totalPages)));
  }, [totalPages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") { e.preventDefault(); goToPage(pageNum - 1); }
      if (e.key === "ArrowRight" || e.key === "ArrowDown") { e.preventDefault(); goToPage(pageNum + 1); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [pageNum, goToPage]);

  // ── Mouse handlers on overlay ──────────────────────────────────────────────
  const getRelativePos = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width * canvasDims.w,
      y: (e.clientY - rect.top) / rect.height * canvasDims.h,
    };
  };

  const handleMouseDown = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isEditing) return;
    const pos = getRelativePos(e);

    if (tool === "highlight") {
      drawingRef.current = { startX: pos.x, startY: pos.y };
      setDrawRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
      e.preventDefault();
    }

    if (tool === "note") {
      addAnnotation({ id: uid(), type: "note", x: pos.x, y: pos.y, text: "" });
    }

    if (tool === "pen") {
      penRef.current = `M ${pos.x} ${pos.y}`;
      setPenPath(penRef.current);
      e.preventDefault();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, tool, canvasDims, addAnnotation]);

  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    if (!isEditing) return;
    const pos = getRelativePos(e);

    if (tool === "highlight" && drawingRef.current) {
      const dx = pos.x - drawingRef.current.startX;
      const dy = pos.y - drawingRef.current.startY;
      setDrawRect({
        x: dx < 0 ? pos.x : drawingRef.current.startX,
        y: dy < 0 ? pos.y : drawingRef.current.startY,
        w: Math.abs(dx),
        h: Math.abs(dy),
      });
    }

    if (tool === "pen" && penRef.current) {
      penRef.current += ` L ${pos.x} ${pos.y}`;
      setPenPath(penRef.current);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, tool, canvasDims]);

  const handleMouseUp = useCallback(() => {
    if (!isEditing) return;

    if (tool === "highlight" && drawingRef.current && drawRect && drawRect.w > 5 && drawRect.h > 5) {
      addAnnotation({ id: uid(), type: "highlight", ...drawRect, color: "#fef08a" });
    }
    drawingRef.current = null;
    setDrawRect(null);

    if (tool === "pen" && penRef.current) {
      addAnnotation({ id: uid(), type: "pen", path: penRef.current, color: "#ef4444" });
      penRef.current = null;
      setPenPath(null);
    }
  }, [isEditing, tool, drawRect, addAnnotation]);

  // ── Current page annotations ───────────────────────────────────────────────
  const currentAnnotations = pageAnnotations[pageNum] ?? [];

  // ── Error fallback ─────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="w-full h-full">
        <iframe src={`/api/files/${file.id}/preview`} className="w-full h-full border-0" title={file.name} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/10 bg-white/5 flex-shrink-0 flex-wrap">
        {/* Navigation */}
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

        {/* Zoom */}
        <button onClick={() => setScale((s) => Math.min(s + 0.2, 3))} className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10">
          <ZoomIn className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
        <button onClick={() => setScale((s) => Math.max(s - 0.2, 0.4))} className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10">
          <ZoomOut className="w-4 h-4" />
        </button>
        <button onClick={() => setScale(1.2)} className="text-[10px] text-gray-500 hover:text-white px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors">
          Reset
        </button>

        {/* Annotation tools (only in edit mode) */}
        {isEditing && (
          <>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <span className="text-[10px] text-gray-500 mr-1">Annoter :</span>

            {([
              { id: "pointer", Icon: MousePointer, label: "Sélection" },
              { id: "highlight", Icon: Highlighter, label: "Surligner" },
              { id: "note", Icon: StickyNote, label: "Note" },
              { id: "pen", Icon: Pen, label: "Dessin" },
            ] as const).map(({ id, Icon, label }) => (
              <button
                key={id}
                onClick={() => setTool(id)}
                title={label}
                className={`p-1.5 rounded transition-colors text-xs flex items-center gap-1 ${
                  tool === id
                    ? "bg-yellow-500/20 text-yellow-300 ring-1 ring-yellow-400/50"
                    : "text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
              </button>
            ))}

            {currentAnnotations.length > 0 && (
              <span className="text-[10px] text-gray-500 ml-1">
                {currentAnnotations.length} annot.
              </span>
            )}
          </>
        )}
      </div>

      {/* Canvas + Overlay */}
      <div ref={containerRef} className="flex-1 overflow-auto flex justify-center p-4 bg-gray-900/50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          </div>
        ) : (
          <div className="relative inline-block" style={{ lineHeight: 0 }}>
            <canvas
              ref={canvasRef}
              className="shadow-2xl max-w-full block"
              style={{ background: "white" }}
            />

            {/* SVG Annotation Overlay */}
            <svg
              ref={overlayRef}
              className={`absolute inset-0 w-full h-full ${isEditing && tool !== "pointer" ? "cursor-crosshair" : "cursor-default"}`}
              viewBox={`0 0 ${canvasDims.w} ${canvasDims.h}`}
              preserveAspectRatio="none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              {/* Render saved annotations */}
              {currentAnnotations.map((ann) => {
                if (ann.type === "highlight") {
                  return (
                    <g key={ann.id}>
                      <rect
                        x={ann.x} y={ann.y} width={ann.w} height={ann.h}
                        fill={ann.color}
                        fillOpacity={0.35}
                        stroke={ann.color}
                        strokeWidth={1}
                        strokeOpacity={0.6}
                        className="cursor-pointer"
                        onClick={(e) => {
                          if (isEditing && tool === "pointer") {
                            e.stopPropagation();
                            deleteAnnotation(ann.id);
                          }
                        }}
                      />
                      {isEditing && tool === "pointer" && (
                        <foreignObject x={ann.x + ann.w - 12} y={ann.y - 12} width={16} height={16}>
                          <button
                            title="Supprimer"
                            onClick={(e) => { e.stopPropagation(); deleteAnnotation(ann.id); }}
                            className="w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center hover:bg-red-600"
                          >
                            ×
                          </button>
                        </foreignObject>
                      )}
                    </g>
                  );
                }

                if (ann.type === "pen") {
                  return (
                    <g key={ann.id}>
                      <path
                        d={ann.path}
                        fill="none"
                        stroke={ann.color}
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        opacity={0.8}
                      />
                    </g>
                  );
                }

                if (ann.type === "note") {
                  return (
                    <foreignObject key={ann.id} x={ann.x} y={ann.y} width={160} height={90}>
                      <div className="relative">
                        <textarea
                          className="w-full h-full bg-yellow-100 text-gray-800 text-[10px] p-1.5 rounded shadow-md resize-none border border-yellow-300 outline-none"
                          placeholder="Note..."
                          value={ann.text}
                          onChange={(e) => {
                            if (isEditing) updateNoteText(ann.id, e.target.value);
                          }}
                          readOnly={!isEditing}
                          rows={4}
                        />
                        {isEditing && (
                          <button
                            onClick={() => deleteAnnotation(ann.id)}
                            className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] flex items-center justify-center hover:bg-red-600 z-10"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    </foreignObject>
                  );
                }

                return null;
              })}

              {/* Live drawing preview — highlight rect */}
              {drawRect && drawRect.w > 0 && (
                <rect
                  x={drawRect.x} y={drawRect.y} width={drawRect.w} height={drawRect.h}
                  fill="#fef08a" fillOpacity={0.35}
                  stroke="#ca8a04" strokeWidth={1} strokeDasharray="4 2"
                />
              )}

              {/* Live pen path preview */}
              {penPath && (
                <path
                  d={penPath}
                  fill="none" stroke="#ef4444" strokeWidth={2}
                  strokeLinecap="round" strokeLinejoin="round"
                  opacity={0.8}
                />
              )}
            </svg>
          </div>
        )}
      </div>
    </div>
  );
}

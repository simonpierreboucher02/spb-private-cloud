"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ZoomIn, ZoomOut, RotateCw, Maximize, Minimize } from "lucide-react";
import type { PreviewPluginProps } from "./types";

export default function ImagePreview({ file }: PreviewPluginProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFitted, setIsFitted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const resetView = useCallback(() => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
    setIsFitted(true);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.min(Math.max(s * delta, 0.1), 10));
    setIsFitted(false);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [scale, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch handling for pinch-to-zoom
  const lastTouchDist = useRef<number | null>(null);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastTouchDist.current !== null) {
        const delta = dist / lastTouchDist.current;
        setScale((s) => Math.min(Math.max(s * delta, 0.1), 10));
        setIsFitted(false);
      }
      lastTouchDist.current = dist;
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0];
      setPosition((pos) => ({
        x: pos.x + (touch.clientX - (dragStart.x || touch.clientX)),
        y: pos.y + (touch.clientY - (dragStart.y || touch.clientY)),
      }));
      setDragStart({ x: touch.clientX, y: touch.clientY });
    }
  }, [scale, dragStart]);

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1 && scale > 1) {
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  }, [scale]);

  useEffect(() => {
    resetView();
  }, [file.id, resetView]);

  return (
    <div className="flex flex-col h-full">
      {/* Controls */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-white/10 bg-white/5">
        <button
          onClick={() => { setScale((s) => Math.min(s * 1.2, 10)); setIsFitted(false); }}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setScale((s) => Math.max(s * 0.8, 0.1)); setIsFitted(false); }}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-gray-500 min-w-[3rem] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={() => setRotation((r) => (r + 90) % 360)}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
          title="Rotate"
        >
          <RotateCw className="w-4 h-4" />
        </button>
        <button
          onClick={resetView}
          className="p-1.5 text-gray-400 hover:text-white transition-colors rounded hover:bg-white/10"
          title={isFitted ? "Taille réelle" : "Ajuster"}
        >
          {isFitted ? <Maximize className="w-4 h-4" /> : <Minimize className="w-4 h-4" />}
        </button>
      </div>

      {/* Image */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={`/api/files/${file.id}/preview`}
          alt={file.name}
          className="max-w-full max-h-full select-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? "none" : "transform 0.2s ease",
            objectFit: "contain",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

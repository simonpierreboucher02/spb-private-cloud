"use client";

import { X } from "lucide-react";

interface TagBadgeProps {
  name: string;
  color: string;
  onRemove?: () => void;
  size?: "sm" | "md";
}

export default function TagBadge({ name, color, onRemove, size = "sm" }: TagBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border border-white/10 ${
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
      }`}
      style={{ backgroundColor: `${color}20`, color }}
    >
      <span
        className={`rounded-full ${size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2"}`}
        style={{ backgroundColor: color }}
      />
      {name}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:opacity-70 transition-opacity"
        >
          <X className={size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3"} />
        </button>
      )}
    </span>
  );
}

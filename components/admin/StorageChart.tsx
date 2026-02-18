"use client";

import { motion } from "framer-motion";
import { formatFileSize } from "@/lib/utils";

interface TypeBreakdown {
  type: string;
  count: number;
  size: number;
}

interface StorageChartProps {
  data: TypeBreakdown[];
  totalSize: number;
}

const typeColors: Record<string, string> = {
  "image/": "bg-blue-500",
  "video/": "bg-purple-500",
  "audio/": "bg-pink-500",
  "application/pdf": "bg-red-500",
  "text/": "bg-green-500",
  "application/": "bg-yellow-500",
};

function getColor(type: string): string {
  for (const [prefix, color] of Object.entries(typeColors)) {
    if (type.startsWith(prefix)) return color;
  }
  return "bg-gray-500";
}

function getTypeLabel(type: string): string {
  if (type.startsWith("image/")) return "Images";
  if (type.startsWith("video/")) return "Vidéos";
  if (type.startsWith("audio/")) return "Audio";
  if (type === "application/pdf") return "PDF";
  if (type.startsWith("text/")) return "Texte";
  return type.split("/")[1]?.toUpperCase() || "Autre";
}

export default function StorageChart({ data, totalSize }: StorageChartProps) {
  // Group by category
  const grouped = data.reduce<Record<string, { size: number; count: number }>>(
    (acc, item) => {
      const label = getTypeLabel(item.type);
      if (!acc[label]) acc[label] = { size: 0, count: 0 };
      acc[label].size += item.size;
      acc[label].count += item.count;
      return acc;
    },
    {}
  );

  const entries = Object.entries(grouped).sort(([, a], [, b]) => b.size - a.size);

  return (
    <div className="space-y-4">
      {/* Bar */}
      <div className="h-4 rounded-full bg-gray-200 dark:bg-white/5 overflow-hidden flex">
        {entries.map(([label, { size }]) => {
          const pct = totalSize > 0 ? (size / totalSize) * 100 : 0;
          if (pct < 1) return null;
          const matchType = data.find((d) => getTypeLabel(d.type) === label)?.type || "";
          return (
            <motion.div
              key={label}
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className={`h-full ${getColor(matchType)}`}
              title={`${label}: ${formatFileSize(size)}`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {entries.map(([label, { size, count }]) => {
          const matchType = data.find((d) => getTypeLabel(d.type) === label)?.type || "";
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getColor(matchType)}`} />
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-300">{label}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(size)} ({count})
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

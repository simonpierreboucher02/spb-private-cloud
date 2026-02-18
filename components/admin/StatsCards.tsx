"use client";

import { motion } from "framer-motion";
import { HardDrive, FileText, Share2, Folder } from "lucide-react";
import { formatFileSize } from "@/lib/utils";

interface StatsData {
  fileCount: number;
  folderCount: number;
  shareCount: number;
  storageUsed: number;
}

interface StatsCardsProps {
  stats: StatsData;
}

const cards = [
  {
    key: "storageUsed",
    label: "Stockage utilisé",
    icon: HardDrive,
    format: (v: number) => formatFileSize(v),
    color: "text-blue-500 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-500/10",
  },
  {
    key: "fileCount",
    label: "Fichiers",
    icon: FileText,
    format: (v: number) => String(v),
    color: "text-green-500 dark:text-green-400",
    bgColor: "bg-green-100 dark:bg-green-500/10",
  },
  {
    key: "folderCount",
    label: "Dossiers",
    icon: Folder,
    format: (v: number) => String(v),
    color: "text-purple-500 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-500/10",
  },
  {
    key: "shareCount",
    label: "Liens actifs",
    icon: Share2,
    format: (v: number) => String(v),
    color: "text-orange-500 dark:text-orange-400",
    bgColor: "bg-orange-100 dark:bg-orange-500/10",
  },
];

export default function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map((card, i) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3.5 sm:p-4 shadow-sm dark:shadow-none transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 sm:p-2.5 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.color}`} />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white">
                {card.format(stats[card.key as keyof StatsData] as number)}
              </p>
              <p className="text-[11px] sm:text-xs text-gray-500">{card.label}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

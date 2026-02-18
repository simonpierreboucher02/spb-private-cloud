"use client";

import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";
import {
  Upload,
  Download,
  Trash2,
  Pencil,
  FolderInput,
  Share2,
  LogIn,
  LogOut,
  FolderPlus,
  FolderMinus,
  Link2Off,
} from "lucide-react";

interface Activity {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  file: { name: string } | null;
}

interface ActivityLogProps {
  activities: Activity[];
}

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  UPLOAD: Upload,
  DOWNLOAD: Download,
  DELETE: Trash2,
  RENAME: Pencil,
  MOVE: FolderInput,
  SHARE: Share2,
  UNSHARE: Link2Off,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  CREATE_FOLDER: FolderPlus,
  DELETE_FOLDER: FolderMinus,
};

const actionLabels: Record<string, string> = {
  UPLOAD: "Upload",
  DOWNLOAD: "Téléchargement",
  DELETE: "Suppression",
  RENAME: "Renommage",
  MOVE: "Déplacement",
  SHARE: "Partage",
  UNSHARE: "Partage retiré",
  LOGIN: "Connexion",
  LOGOUT: "Déconnexion",
  CREATE_FOLDER: "Dossier créé",
  DELETE_FOLDER: "Dossier supprimé",
};

export default function ActivityLog({ activities }: ActivityLogProps) {
  if (activities.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        Aucune activité récente
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {activities.map((activity, i) => {
        const Icon = actionIcons[activity.action] || Upload;
        return (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-3 px-3 py-3.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors"
          >
            <Icon className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="text-gray-500 dark:text-gray-400">
                  {actionLabels[activity.action] || activity.action}
                </span>
                {activity.details && (
                  <span className="text-gray-400 dark:text-gray-500 ml-1">— {activity.details}</span>
                )}
              </p>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-600 flex-shrink-0 hidden sm:block">
              {formatDate(activity.createdAt)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

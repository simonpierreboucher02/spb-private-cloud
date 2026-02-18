"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { HardDrive, Download, Trash2, RefreshCw, CheckCircle, XCircle, Loader2 } from "lucide-react";
import Button from "../ui/Button";
import { formatFileSize, formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface BackupData {
  id: string;
  status: string;
  type: string;
  size: number;
  path: string | null;
  startedAt: string;
  completedAt: string | null;
}

export default function BackupPanel() {
  const [backups, setBackups] = useState<BackupData[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  const fetchBackups = async () => {
    const res = await fetch("/api/backup");
    if (res.ok) setBackups(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchBackups(); }, []);

  const createBackup = async (type: "full" | "incremental") => {
    setCreating(true);
    try {
      const res = await fetch("/api/backup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      if (res.ok) {
        toast.success("Backup créé avec succès");
        fetchBackups();
      } else {
        toast.error("Échec du backup");
      }
    } catch {
      toast.error("Erreur");
    }
    setCreating(false);
  };

  const deleteBackup = async (id: string) => {
    if (!confirm("Supprimer ce backup ?")) return;
    const res = await fetch("/api/backup", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Backup supprimé");
      fetchBackups();
    }
  };

  const statusIcon = (status: string) => {
    if (status === "completed") return <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />;
    if (status === "failed") return <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />;
    return <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5" /> Backups
        </h2>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button size="sm" variant="secondary" onClick={() => createBackup("incremental")} loading={creating}>
            Incrémental
          </Button>
          <Button size="sm" onClick={() => createBackup("full")} loading={creating}>
            <Download className="w-4 h-4" /> Backup complet
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-gray-300 dark:border-white/20 border-t-gray-600 dark:border-t-white rounded-full animate-spin" />
        </div>
      ) : backups.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <HardDrive className="w-12 h-12 mx-auto mb-3 text-gray-300 dark:text-gray-600" />
          <p>Aucun backup</p>
        </div>
      ) : (
        <div className="space-y-2">
          {backups.map((backup, i) => (
            <motion.div
              key={backup.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl transition-colors"
            >
              <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                {statusIcon(backup.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white break-words">
                    Backup {backup.type} - {formatDate(backup.startedAt)}
                  </p>
                  <p className="text-xs text-gray-500 break-words">
                    {backup.size > 0 ? formatFileSize(backup.size) : "—"}
                    {backup.completedAt && ` • Terminé: ${formatDate(backup.completedAt)}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-1 pl-7 sm:pl-0">
                <button
                  onClick={() => fetchBackups()}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-lg transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteBackup(backup.id)}
                  className="min-w-[44px] min-h-[44px] flex items-center justify-center p-2.5 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

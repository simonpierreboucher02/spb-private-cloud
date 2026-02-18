"use client";

import { useState, useEffect, useCallback } from "react";
import { Clock, Download, RotateCcw, GitBranch } from "lucide-react";
import { formatFileSize, formatDate } from "@/lib/utils";
import type { FileVersionData } from "@/types/files";
import toast from "react-hot-toast";

interface VersionHistoryProps {
  fileId: string;
  onRestore?: () => void;
}

export default function VersionHistory({ fileId, onRestore }: VersionHistoryProps) {
  const [versions, setVersions] = useState<FileVersionData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadVersions = useCallback(async () => {
    try {
      const res = await fetch(`/api/files/${fileId}/versions`);
      if (res.ok) setVersions(await res.json());
    } catch {}
    setLoading(false);
  }, [fileId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const createSnapshot = async () => {
    try {
      const res = await fetch(`/api/files/${fileId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changeNote: "Manual snapshot" }),
      });
      if (res.ok) {
        toast.success("Snapshot créé");
        loadVersions();
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const restoreVersion = async (versionId: string, versionNum: number) => {
    if (!confirm(`Restaurer la version ${versionNum} ? La version actuelle sera sauvegardée.`)) return;
    try {
      const res = await fetch(`/api/files/${fileId}/versions/${versionId}/restore`, {
        method: "POST",
      });
      if (res.ok) {
        toast.success(`Version ${versionNum} restaurée`);
        loadVersions();
        onRestore?.();
      }
    } catch {
      toast.error("Erreur de restauration");
    }
  };

  if (loading) {
    return (
      <div className="p-4 flex justify-center">
        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-white/10">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
          <GitBranch className="w-3.5 h-3.5" />
          Versions ({versions.length})
        </h4>
        <button
          onClick={createSnapshot}
          className="text-[10px] px-2 py-1 bg-white/10 hover:bg-white/20 text-gray-300 rounded transition-colors"
        >
          Snapshot
        </button>
      </div>

      {versions.length === 0 ? (
        <p className="text-xs text-gray-600">Aucune version précédente</p>
      ) : (
        <div className="space-y-1.5 max-h-60 overflow-auto">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center gap-2 p-2 bg-white/5 rounded-lg group hover:bg-white/10 transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-300">v{v.versionNum}</p>
                <p className="text-[10px] text-gray-500 truncate">
                  {v.changeNote || "—"} · {formatFileSize(v.size)}
                </p>
                <p className="text-[10px] text-gray-600">{formatDate(v.createdAt)}</p>
              </div>
              <div className="hidden group-hover:flex items-center gap-1">
                <button
                  onClick={() => window.open(`/api/files/${fileId}/versions/${v.id}`, "_blank")}
                  className="p-1 text-gray-500 hover:text-white transition-colors"
                  title="Télécharger cette version"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  onClick={() => restoreVersion(v.id, v.versionNum)}
                  className="p-1 text-gray-500 hover:text-orange-400 transition-colors"
                  title="Restaurer cette version"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
